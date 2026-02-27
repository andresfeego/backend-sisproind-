const React = require('react');
const { Document, Page, Text, View, StyleSheet, Image } = require('@react-pdf/renderer');

const testMode = false;

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 12, position: 'relative' },
  fondo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  headerInfoWrapper: { position: 'absolute', top: 24, right: 40, width: 240 },
  headerInfo: { fontSize: 10, textAlign: 'center' },
  lineaWrapper: { position: 'absolute', left: 60, right: 60 },
  lineaTexto: { textAlign: 'center' },
  tituloPrincipal: { textAlign: 'center', fontSize: 21, fontFamily: 'Helvetica-Bold', letterSpacing: 0.2 },
  subtitulo: { textAlign: 'center', fontSize: 12, fontFamily: 'Helvetica-Oblique' },
  lineaCedula: { textAlign: 'center', fontSize: 12, fontFamily: 'Helvetica-Oblique' },
  lineaCurso: { textAlign: 'center', fontSize: 12, fontFamily: 'Helvetica-Oblique' },
  lineaNivel: { textAlign: 'center', fontSize: 16, fontFamily: 'Helvetica-Bold' },
  lineaDuracion: { textAlign: 'center', fontSize: 12, fontFamily: 'Helvetica-Oblique' },
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontFamily: 'Helvetica-Oblique' },
  firmas: {
    position: 'absolute',
    left: 60,
    right: 60,
    bottom: 70,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9
  },
  firmaCol: {
    width: '30%',
    textAlign: 'center',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  firmaTexto: { position: 'relative', zIndex: 2 },
  firmaBg: {
    position: 'absolute',
    bottom: 15,
    left: '10%',
    width: '80%',
    maxHeight: 70,
    objectFit: 'contain',
    zIndex: 1,
    opacity: 0.7
  },
  footer: { position: 'absolute', left: 60, right: 60, bottom: 30, textAlign: 'center', fontSize: 8 },
  debugFechas: { position: 'absolute', left: 40, top: 20, fontSize: 8, textAlign: 'left' },
  textoDinamico: { color: testMode ? '#d32f2f' : '#000' },
  textoQuemado: { color: testMode ? '#2e7d32' : '#000' },
  marker: { position: 'absolute', top: -8, right: 0, fontSize: 7, color: '#111' },
  qrDiploma: { position: 'absolute', right: 16, bottom: 66, width: 58, height: 58 },
  qrLabel: { position: 'absolute', right: 16, bottom: 128, fontSize: 7, color: '#111' }
});

const MESES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

const parseFecha = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatoDiasCurso = (fechaInicio, fechaCierre) => {
  const inicio = parseFecha(fechaInicio);
  const cierre = parseFecha(fechaCierre);
  if (!inicio || !cierre) return 'SIN_DATO';

  const start = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const end = new Date(cierre.getFullYear(), cierre.getMonth(), cierre.getDate());
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;

  const d1 = start.getDate();
  const d2 = end.getDate();
  const mes = MESES[start.getMonth()];
  const anio = start.getFullYear();

  if (!sameMonth) {
    const mes2 = MESES[end.getMonth()];
    const anio2 = end.getFullYear();
    return `los dias entre el ${d1} de ${mes} de ${anio} y el ${d2} de ${mes2} de ${anio2}`;
  }

  if (diffDays <= 1) return `el dia ${d1} de ${mes} de ${anio}`;
  if (diffDays === 2) return `los dias ${d1} y ${d2} de ${mes} de ${anio}`;
  if (diffDays <= 4) {
    const dias = [];
    for (let i = 0; i < diffDays; i += 1) dias.push(d1 + i);
    return `los dias ${dias.slice(0, -1).join(', ')} y ${dias[dias.length - 1]} de ${mes} de ${anio}`;
  }
  return `los dias habiles entre el ${d1} y ${d2} de ${mes} de ${anio}`;
};

const formatoFechaLarga = (fecha) => {
  const d = parseFecha(fecha);
  if (!d) return 'SIN_DATO';
  const dia = d.getDate();
  const mes = MESES[d.getMonth()];
  const anio = d.getFullYear();
  return `${dia} dias de ${mes} de ${anio}`;
};

const safeUrl = (path, fn) => {
  if (!path) return '';
  if (fn && typeof fn === 'function') return fn(path);
  return path;
};

const getVerifyUrl = (curso, baseUrl) => {
  if (!curso) return '';
  if (!baseUrl) return '';
  return `${baseUrl}/verificar_certificados?idCurso=${curso.idCurso}&idEstudiante=${curso.idEstudiante}`;
};

const getQrUrl = (curso, baseUrl) => {
  const verifyUrl = getVerifyUrl(curso, baseUrl);
  if (!verifyUrl) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
};

const DiplomaDoc = ({ curso, helpers = {}, verifyBaseUrl = '', disableImages = false, disableQr = false }) => {
  const fondoSrc = disableImages
    ? ''
    : (curso && curso.urlFondoDiploma
      ? safeUrl(curso.urlFondoDiploma, helpers.buildFondoDiplomaUrl)
      : safeUrl('default_image_diploma.jpeg', helpers.buildDiplomaUrl));

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', orientation: 'landscape', style: styles.page },
      fondoSrc && !disableImages
        ? React.createElement(Image, { style: styles.fondo, src: fondoSrc })
        : null,

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 150 }] },
        React.createElement(
          Text,
          { style: [styles.tituloPrincipal, styles.textoQuemado] },
          'CERTIFICADO DE CAPACITACION Y ENTRENAMIENTO\nPARA ',
          React.createElement(Text, { style: styles.textoDinamico }, curso.nombreTema || 'SIN_DATO')
        ),
        testMode ? React.createElement(Text, { style: styles.marker }, '02') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 210 }] },
        React.createElement(Text, { style: [styles.subtitulo, styles.textoQuemado] }, 'HACE CONSTAR QUE :'),
        testMode ? React.createElement(Text, { style: styles.marker }, '03') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 255 }] },
        React.createElement(
          Text,
          { style: [styles.lineaCedula, styles.textoQuemado] },
          'Con Cedula de Ciudadania N.º ',
          React.createElement(Text, { style: [styles.bold, styles.textoDinamico] }, curso.idEstudiante || 'SIN_DATO')
        ),
        testMode ? React.createElement(Text, { style: styles.marker }, '04') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 285 }] },
        React.createElement(
          Text,
          { style: [styles.lineaCurso, styles.textoQuemado] },
          React.createElement(Text, { style: styles.textoDinamico }, curso.nombreEstudiante || 'SIN_DATO')
        ),
        testMode ? React.createElement(Text, { style: styles.marker }, '04.1') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 305 }] },
        React.createElement(
          Text,
          { style: [styles.lineaCurso, styles.textoQuemado] },
          'CURSO Y APROBO LA CAPACITACION Y ENTRENAMIENTO DE ',
          React.createElement(Text, { style: styles.textoDinamico }, curso.nombreTema || 'SIN_DATO')
        ),
        testMode ? React.createElement(Text, { style: styles.marker }, '05') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 335 }] },
        React.createElement(Text, { style: [styles.lineaNivel, styles.textoDinamico] }, curso.nombre || 'SIN_DATO'),
        testMode ? React.createElement(Text, { style: styles.marker }, '06') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 360 }] },
        React.createElement(
          Text,
          { style: [styles.lineaDuracion, styles.textoQuemado] },
          'Con una duracion de (',
          React.createElement(Text, { style: styles.textoDinamico }, curso.horas || curso.numeroHoras || 'SIN_DATO'),
          ') horas.'
        ),
        testMode ? React.createElement(Text, { style: styles.marker }, '07') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 395 }] },
        React.createElement(
          Text,
          { style: [styles.lineaTexto, styles.textoQuemado, { fontSize: 10 }] },
          'Realizado en la ciudad de ',
          React.createElement(Text, { style: styles.textoQuemado }, 'Sogamoso Boyaca'),
          ' ',
          React.createElement(Text, { style: styles.textoDinamico }, formatoDiasCurso(curso.fechaInicio, curso.fechaCierre)),
          '.'
        ),
        testMode ? React.createElement(Text, { style: styles.marker }, '08') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 415 }] },
        React.createElement(
          Text,
          { style: [styles.lineaTexto, styles.textoQuemado, { fontSize: 10 }] },
          'Dando cumplimiento a los requisitos exigidos por la Resolucion ',
          React.createElement(Text, { style: styles.textoDinamico }, curso.resolucion || 'SIN_DATO'),
          '.'
        ),
        testMode ? React.createElement(Text, { style: styles.marker }, '09') : null
      ),

      React.createElement(
        View,
        { style: [styles.lineaWrapper, { top: 435 }] },
        React.createElement(
          Text,
          { style: [styles.lineaTexto, styles.textoQuemado, { fontSize: 10 }] },
          'En testimonio de lo anterior se expide en ',
          React.createElement(Text, { style: styles.textoQuemado }, 'Sogamoso Boyaca'),
          ' a los ',
          React.createElement(Text, { style: styles.textoDinamico }, formatoFechaLarga(curso.fechaCierre)),
          '.'
        ),
        testMode ? React.createElement(Text, { style: styles.marker }, '10') : null
      ),

      React.createElement(
        View,
        { style: styles.firmas },
        React.createElement(
          View,
          { style: styles.firmaCol },
          curso.urlFirmaInstructor && !disableImages
            ? React.createElement(Image, { style: styles.firmaBg, src: safeUrl(curso.urlFirmaInstructor, helpers.buildFirmaUrl) })
            : null,
          React.createElement(
            View,
            { style: styles.firmaTexto },
            React.createElement(Text, { style: styles.textoDinamico }, curso.nombreInstructor || 'SIN_DATO'),
            React.createElement(Text, { style: styles.textoDinamico }, `C.C: ${curso.idInstructor || 'SIN_DATO'}`),
            React.createElement(Text, { style: styles.textoDinamico }, curso.cargoInstructor || 'SIN_DATO'),
            React.createElement(Text, { style: styles.textoDinamico }, curso.licenciaInstructor || 'SIN_DATO')
          )
        ),
        React.createElement(
          View,
          { style: styles.firmaCol },
          React.createElement(
            View,
            { style: { display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'flex-start' } },
            React.createElement(
              View,
              { style: { flexGrow: 1 } },
              React.createElement(Text, null, React.createElement(Text, { style: styles.textoQuemado }, 'EMPRESA: '), React.createElement(Text, { style: styles.textoDinamico }, curso.empresa || '--')),
              React.createElement(Text, null, React.createElement(Text, { style: styles.textoQuemado }, 'NIT: '), React.createElement(Text, { style: styles.textoDinamico }, curso.nit || '--')),
              React.createElement(Text, null, React.createElement(Text, { style: styles.textoQuemado }, 'R.L: '), React.createElement(Text, { style: styles.textoDinamico }, curso.rl || '--')),
              React.createElement(Text, null, React.createElement(Text, { style: styles.textoQuemado }, 'ARL: '), React.createElement(Text, { style: styles.textoDinamico }, curso.arl || '--'))
            )
          ),
          testMode ? React.createElement(Text, { style: styles.marker }, '13') : null
        )
      ),

      !disableQr && getQrUrl(curso, verifyBaseUrl)
        ? React.createElement(React.Fragment, null,
          React.createElement(Text, { style: styles.qrLabel }, 'Verificar autenticidad'),
          React.createElement(Image, { style: styles.qrDiploma, src: getQrUrl(curso, verifyBaseUrl) })
        )
        : null,

      testMode ? React.createElement(
        Text,
        { style: styles.debugFechas },
        `fechaInicio: ${curso.fechaInicio || 'SIN_DATO'}\nfechaCierre: ${curso.fechaCierre || 'SIN_DATO'}`
      ) : null
    )
  );
};

module.exports = DiplomaDoc;
