const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const React = require('react');
const { pdf, renderToStream } = require('@react-pdf/renderer');
const archiver = require('archiver');
const { pathToFileURL } = require('url');
const DiplomaDoc = require('../pdf/DiplomaDoc');
const usuarioSistema = require ('../dbSISPROIND/usuarioSistema.js');
const estudiantes = require('../dbSISPROIND/estudiantes');
const instructores = require('../dbSISPROIND/instructores');
const generales = require('../dbSISPROIND/generales');
const cursos = require('../dbSISPROIND/cursos');
const mails = require('../dbSISPROIND/mails');
const bitacora = require('../dbSISPROIND/bitacora');
const cookieSession = require('cookie-session');


const router = express.Router();

// Body parsing is handled at app level (server/index.js)

router.use(cookieSession({
    secret: 'sisproind',
    maxAge: 15 * 24 * 60 * 60 * 1000
}))

const isLocal = process.env.NODE_ENV !== 'production';

// Storage layout
// - VPS/prod: set SISPROIND_DATA_ROOT=/srv/feego-data/sisproind (recommended)
// - Local/dev: defaults to <repo>/data/sisproind
const DATA_ROOT = process.env.SISPROIND_DATA_ROOT
  || path.resolve(__dirname, '../../data/sisproind');

const BASE_FIRMAS_DIR = process.env.SISPROIND_FIRMAS_DIR
  || path.join(DATA_ROOT, 'firmas/instructores');

const BASE_FONDOS_TEMA_DIR = process.env.SISPROIND_DIPLOMAS_DIR
  || path.join(DATA_ROOT, 'diplomas');

const logDir = process.env.LOG_DIR
  || (isLocal ? path.join(__dirname, '../logs') : path.join(DATA_ROOT, 'logs'));
const logFile = path.join(logDir, isLocal ? 'dev.log' : 'backend.log');

const logDiploma = (message) => {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] [diplomas] ${message}\n`);
  } catch (err) {
    console.log('[diplomas][log-fail]', err);
  }
};

const buildFileUrl = (baseDir, relativePath, prefix, label) => {
  if (!relativePath) return '';
  const trimmed = relativePath.startsWith(prefix)
    ? relativePath.slice(prefix.length)
    : relativePath.replace(/^\//, '');
  const filePath = path.join(baseDir, trimmed);
  if (!fs.existsSync(filePath)) {
    if (label) {
      logDiploma(`Archivo no encontrado (${label}): ${filePath}`);
    }
    return '';
  }
  return pathToFileURL(filePath).href;
};

const buildPublicBaseUrl = (req) => {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return `${proto}://${req.get('host')}`;
};

const firmaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(BASE_FIRMAS_DIR, { recursive: true }, (err) => cb(err, BASE_FIRMAS_DIR));
  },
  filename: (req, file, cb) => {
    const id = req.body.idInstructor;
    if (!id) return cb(new Error('Falta idInstructor'));
    const token = buildCacheToken();
    req._firmaToken = token;
    cb(null, `${id}_${token}.png`);
  }
});

const uploadFirma = multer({
  storage: firmaStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/png') return cb(new Error('Solo PNG'));
    cb(null, true);
  }
});

const uploadFondoTema = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'));
    cb(null, true);
  }
});

generaCodigo = (length) => {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
   console.log(result)
    
    return result;
}

const buildCacheToken = () => {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${time}${rand}`;
};


//__________________________ Usuarios de sistema ______________________________________

router.post('/instructorFirma', (req, res) => {
  uploadFirma.single('firma')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No se envió ninguna firma' });
    }
    const nombreArchivo = req.file.filename;
    const rutaRelativa = `/firmas/instructores/${nombreArchivo}`;
    instructores.actualizarFirmaInstructor(req.body.idInstructor, rutaRelativa)
      .then(() => {
        return res.json({ ok: true, filename: nombreArchivo, ruta: rutaRelativa });
      })
      .catch((dbErr) => {
        console.error('[instructorFirma] ❌', dbErr);
        return res.status(500).json({ ok: false, error: 'Error al guardar firma en BD' });
      });
  });
});

router.post('/temaFondoDiploma', (req, res) => {
  uploadFondoTema.single('fondo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No se envió ninguna imagen' });
    }
    const idTema = req.body.idTema;
    const token = buildCacheToken();
    const nombreArchivo = `tema_${idTema}_${token}.jpg`;
    const rutaRelativa = `/diplomas/${nombreArchivo}`;
    const rutaFinal = path.join(BASE_FONDOS_TEMA_DIR, nombreArchivo);

    fs.mkdir(BASE_FONDOS_TEMA_DIR, { recursive: true }, async (mkErr) => {
      if (mkErr) {
        console.error('[temaFondoDiploma] ❌', mkErr);
        return res.status(500).json({ ok: false, error: 'Error al preparar carpeta' });
      }

      try{
        const sharp = require('sharp');
        await sharp(req.file.buffer)
          .resize({ width: 2200, height: 1700, fit: 'contain', background: '#ffffff' })
          .jpeg({ quality: 80, mozjpeg: true })
          .toFile(rutaFinal);

        await generales.actualizarFondoDiplomaTema(idTema, rutaRelativa);
        return res.json({ ok: true, filename: nombreArchivo, ruta: rutaRelativa });
      }catch(procErr){
        console.error('[temaFondoDiploma] ❌', procErr);
        return res.status(500).json({ ok: false, error: 'Error al procesar imagen' });
      }
    });
  });
});

router.get('/getSession', async (req, res, next) => {

    try{
       
        if (req.session.id) {

            let results = await usuarioSistema.usuarioXid(req.session.id);
            if(results[0].pass == req.session.pass){
                res.json(results);
            }else{
                res.end("Credenciales incorrectas inicia sesion de nuevo en este equipo");            
            }

        } else {
            res.end("sin usuario");            
        }

        
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/guardarSesion', async (req, res, next) => {

    try{
        req.session.id = req.body.id 
        req.session.pass = req.body.pass
        res.end(req.session.id + " - " + req.session.pass);  
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/cerrarSesion', async (req, res, next) => {

    try{
        req.session= null
        res.end("ok");  
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


router.get('/usuariosSistema/:id', async (req, res, next) => {

    try{
        let results = await usuarioSistema.usuarioXemail(req.params.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});



router.get('/usuariosSistema', async (req, res, next) => {

    try{
        let results = await usuarioSistema.usuarios();
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


router.post('/usuarioSistema/cambiarContrasena', async (req, res, next) => {

    try{
        let results = await usuarioSistema.cambiarContrasena(req.body.pass, req.body.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


router.post('/usuarioSistema/editarUsuario', async (req, res, next) => {

    try{
        let results = await usuarioSistema.editarUsuario(req.body.id, req.body.nombre, req.body.apellido, req.body.email);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


//__________________________ Estudiantes ______________________________________


router.get('/estudiantes', async (req, res, next) => {

    try{
        let results = await estudiantes.estudiantes();
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/estudianteActivo/:idEstudiante', async (req, res, next) => {

    try{
        let results = await estudiantes.estudianteActivo(req.params.idEstudiante);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


router.get('/estudiantesParaBusqueda', async (req, res, next) => {

    try{
        let results = await estudiantes.estudiantesParaBusqueda();
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/estudianteXid/:id', async (req, res, next) => {

    try{
        let results = await estudiantes.estudianteXid(req.params.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/validarEstParaMatricula', async (req, res, next) => {

    try{
        let results = await estudiantes.validarEstParaMatricula(req.body.idEstudiante, req.body.idCurso);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/estudianteXcurso/:idCurso', async (req, res, next) => {

    try{
        let results = await estudiantes.estudianteXcurso(req.params.idCurso);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/telEstXid/:id', async (req, res, next) => {

    try{
        let results = await estudiantes.telEstXid(req.params.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/actDesEstu', async (req, res, next) => {

    try{
        let results = await estudiantes.actDesEstu(req.body.accion, req.body.id)
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});



router.get('/estudianteExiste/:id', async (req, res, next) => {

    try{
        let results = await estudiantes.estudianteExiste(req.params.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


router.post('/crearEstudiante', async (req, res, next) => {

    try{
        let results = await estudiantes.crearEstudiante(req.body.id, req.body.tipoDoc, req.body.nombres, req.body.apellidos, req.body.email, req.body.telefonos);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


router.post('/agregarTelEstudiante', async (req, res, next) => {

    try{
        let results = await estudiantes.agregarTelEstudiante(req.body.idEstudiante, req.body.telefono);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/eliminarTelEstudiante', async (req, res, next) => {

    try{
        let results = await estudiantes.eliminarTelEstudiante(req.body.idTelefono);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/editarEstudiante', async (req, res, next) => {

    try{
        let results = await estudiantes.editarEstudiante(req.body.idEstudiante, req.body.tipoDoc, req.body.nombres, req.body.apellidos, req.body.email)
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/agregarAlumnoAcurso', async (req, res, next) => {

    try{
        let results = await estudiantes.AgregarAlumnoAcurso(req.body.idCurso, req.body.idEstudiante)
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/eliminarAlumnoDecurso', async (req, res, next) => {

    try{
        let results = await estudiantes.eliminarAlumnoDecurso(req.body.idCurso, req.body.idEstudiante)
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/cambiarEstadoGraduado', async (req, res, next) => {

    try{
        let results = await estudiantes.cambiarEstadoGraduado(req.body.idCurso, req.body.idEstudiante, req.body.graduado)
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/certificadosCursos/:idEstudiante', async (req, res, next) => {

    try{
        let results = await estudiantes.certificadosCursos(req.params.idEstudiante);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/validarDiploma/:idEstudiante/:idCurso', async (req, res, next) => {

    try{
        let results = await estudiantes.validarDiploma(req.params.idEstudiante, req.params.idCurso);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/descargarDiplomasCurso/:idCurso', async (req, res, next) => {

    try{
        const idCurso = req.params.idCurso;
        logDiploma(`Inicio descarga diplomas curso=${idCurso} ip=${req.ip}`);
        const rows = await estudiantes.diplomasGraduadosCurso(idCurso);

        if (!rows || rows.length === 0) {
            logDiploma(`Sin graduados curso=${idCurso}`);
            return res.status(404).json({ ok: false, message: 'No hay alumnos graduados para este curso' });
        }
        logDiploma(`Graduados encontrados curso=${idCurso} total=${rows.length}`);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="diplomas_curso_${idCurso}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('[descargarDiplomasCurso] ❌', err);
            if (!res.headersSent) {
                res.sendStatus(500);
            } else {
                res.end();
            }
        });
        archive.pipe(res);

        const disableQr = String(req.query.noQr || '').toLowerCase() === '1' || String(req.query.lite || '').toLowerCase() === '1';
        const disableImages = String(req.query.noImages || '').toLowerCase() === '1' || String(req.query.lite || '').toLowerCase() === '1';
        const verifyBaseUrl = disableQr ? '' : buildPublicBaseUrl(req);
        const helpers = {
            buildFondoDiplomaUrl: (p) => buildFileUrl(BASE_FONDOS_TEMA_DIR, p, '/diplomas/', 'fondo'),
            buildDiplomaUrl: (p) => buildFileUrl(BASE_FONDOS_TEMA_DIR, p, '/diplomas/', 'fondo_default'),
            buildFirmaUrl: (p) => buildFileUrl(BASE_FIRMAS_DIR, p, '/firmas/instructores/', 'firma')
        };

        for (const row of rows) {
            const horasTeoria = Number(row.horasTeoria || 0);
            const horasPractica = Number(row.horasPractica || 0);
            const totalHoras = horasTeoria + horasPractica;
            logDiploma(`Render diploma curso=${idCurso} estudiante=${row.idEstudiante}`);

            const curso = {
                idCurso: row.idCurso,
                idEstudiante: row.idEstudiante,
                nombreEstudiante: `${row.nombres || ''} ${row.apellidos || ''}`.trim(),
                nombreTema: row.nombreTema,
                resolucion: row.resolucion,
                fechaInicio: row.fechaInicio,
                fechaCierre: row.fechaCierre,
                urlFondoDiploma: row.urlFondoDiploma,
                urlFirmaInstructor: row.urlFirmaInstructor,
                nombreInstructor: row.nombreInstructor,
                idInstructor: row.idInstructor,
                cargoInstructor: row.cargoInstructor,
                licenciaInstructor: row.licenciaInstructor,
                empresa: row.empresa,
                nit: row.nit,
                rl: row.rl,
                arl: row.arl,
                nombre: row.nombre,
                horas: row.horas || totalHoras || row.numeroHoras
            };

            const doc = React.createElement(DiplomaDoc, { curso, helpers, verifyBaseUrl, disableImages, disableQr });
            const stream = await renderToStream(doc);
            const fileName = `diploma_${idCurso}_${row.idEstudiante}.pdf`;
            archive.append(stream, { name: fileName });
            await new Promise((resolve, reject) => {
                stream.on('error', reject);
                stream.on('end', resolve);
                stream.on('finish', resolve);
            });
            logDiploma(`PDF generado curso=${idCurso} estudiante=${row.idEstudiante} archivo=${fileName}`);
        }

        archive.finalize();
        logDiploma(`ZIP finalizado curso=${idCurso}`);
    }catch(e){
        console.log(e);
        logDiploma(`Error descarga curso=${req.params.idCurso} err=${e && e.message ? e.message : e}`);
        if (!res.headersSent) {
            res.sendStatus(500);
        } else {
            res.end();
        }
    }

});


//__________________________ Instructores ______________________________________


router.get('/instructores', async (req, res, next) => {

    try{
        let results = await instructores.instructores();
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/instructorExiste/:id', async (req, res, next) => {

    try{
        let results = await instructores.instructorExiste(req.params.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/actDesInst', async (req, res, next) => {

    try{
        let results = await instructores.actDesInst(req.body.accion, req.body.id)
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/instructorXid/:id', async (req, res, next) => {

    try{
        let results = await instructores.instructorXid(req.params.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/telInstXid/:id', async (req, res, next) => {

    try{
        let results = await instructores.telInstXid(req.params.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/crearInstructor', async (req, res, next) => {

    try{
        const rutaRelativa = `/firmas/instructores/${req.body.id}.png`;
        let results = await instructores.crearInstructor(req.body.id, req.body.tipoDoc, req.body.nombres, req.body.apellidos, req.body.email, req.body.profesion, req.body.cargo, req.body.licencia, req.body.telefonos, rutaRelativa);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/agregarTelInstructor', async (req, res, next) => {

    try{
        let results = await instructores.agregarTelInstructor(req.body.idInstructor, req.body.telefono);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/eliminarTelInstructor', async (req, res, next) => {

    try{
        let results = await instructores.eliminarTelInstructor(req.body.idTelefono);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/editarInstructor', async (req, res, next) => {

    try{
        let results = await instructores.editarInstructor(req.body.id, req.body.tipoDoc, req.body.nombres, req.body.apellidos, req.body.email, req.body.profesion, req.body.cargo, req.body.licencia)
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


//__________________________ Generales ______________________________________


router.get('/tipoDocumento', async (req, res, next) => {

    try{
        let results = await generales.tipoDocumento();
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/TipoTemas', async (req, res, next) => {

    try{
        let results = await generales.tipoTemas();
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/crearTema', async (req, res, next) => {

    try{
        let results = await generales.crearTema(req.body.sigla, req.body.nombre, req.body.descripcion, req.body.resolucion, req.body.urlFondoDiploma);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/editarTema', async (req, res, next) => {

    try{
        let results = await generales.editarTema(req.body.id, req.body.sigla, req.body.nombre, req.body.descripcion, req.body.resolucion, req.body.urlFondoDiploma);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/eliminarTema', async (req, res, next) => {

    try{
        let results = await generales.eliminarTema(req.body.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/crearLinea', async (req, res, next) => {

    try{
        let results = await generales.crearLinea(req.body.nombre, req.body.descripcion, req.body.horas, req.body.idTema);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/editarLinea', async (req, res, next) => {

    try{
        let results = await generales.editarLinea(req.body.id, req.body.nombre, req.body.descripcion, req.body.horas, req.body.idTema);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/eliminarLinea', async (req, res, next) => {

    try{
        let results = await generales.eliminarLinea(req.body.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


router.get('/tipoLineas/:id', async (req, res, next) => {

    try{
        let results = await generales.tipoLineas(req.params.id);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/tipoEstadosCurso', async (req, res, next) => {

    try{
        let results = await generales.tipoEstadosCurso();
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/agregarEventoBitacora', async (req, res, next) => {

    try{
        let results = await generales.agregarEventoBitacora(req.body.idTipoEvento, req.body.descripcion, req.body.idUsuarioSistema);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

//__________________________ cursos ______________________________________


router.get('/cursos', async (req, res, next) => {

    try{
        let results = await cursos.cursos();
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.get('/consultarMatriculaCurso/:codTemp', async (req, res, next) => {

    try{
        let results = await cursos.consultarMatriculaCurso(req.params.codTemp);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/crearCurso', async (req, res, next) => {

    try{
        let results = await cursos.crearCurso(req.body.linea, req.body.instructor, req.body.fechaCreacion, req.body.fechaInicio, req.body.fechaCierre, req.body.horasTeoria, req.body.horasPractica, req.body.empresa, req.body.nit, req.body.rl, req.body.arl);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/matricula', async (req, res, next) => {

    try{
        let results = await cursos.matricula(req.body.idCurso, req.body.idEstudiante);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/editarCurso', async (req, res, next) => {

    try{
        let results = await cursos.editarCurso(req.body.id, req.body.linea, req.body.instructor, req.body.estado, req.body.fechaCreacion, req.body.fechaInicio, req.body.fechaCierre, req.body.horasTeoria, req.body.horasPractica, req.body.empresa, req.body.nit, req.body.rl, req.body.arl);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/editarEstadoCurso', async (req, res, next) => {

    try{
        let results = await cursos.editarEstadoCurso(req.body.id, req.body.estado);
        res.json(results);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

//__________________________ BITACORA ______________________________________

router.get('/bitacora', async (req, res, next) => {

    try{
        let results = await bitacora.bitacora();
        res.json(results);
        console.log(results);

    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


router.get('/tiposEventosBitacora', async (req, res, next) => {

    try{
        let results = await bitacora.tiposEventosBitacora();
        res.json(results);
        console.log(results);

    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});


//__________________________ MAILS ______________________________________

router.get('/enviarMail/:variable', async (req, res, next) => {

    try{
        let results = await mails.enviar(req.params.variable);
        res.json(results);
        console.log(results);

    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }

});

//__________________________ EXPORT ______________________________________


module.exports = router;
