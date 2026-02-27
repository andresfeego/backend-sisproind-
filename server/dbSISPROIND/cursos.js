const pool = require('./connection.js');

let csmDB = {};

generaCodigo = (length) => {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
   console.log(result)
    
    return result;
}

csmDB.cursos = () => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT cur.*, te.nombre AS nombreTema, inst.nombres AS nombreIns, inst.profesion, inst.apellidos AS apellidosIns, inst.urlFirmaInstructor AS urlFirmaInstructor,  te.sigla AS siglaTema, te.id AS idTema, li.nombre AS nombreLinea, li.horas, tec.estado AS nombreEstado

                    FROM curso AS cur

                    JOIN tema_has_linea AS thl
                    ON thl.idLinea = cur.linea
                    
                    JOIN lineaCurso AS li
                    ON cur.linea = li.id

                    JOIN tema AS te
                    ON te.id = thl.idTema

                    JOIN tipoEstadoCurso AS tec
                    ON cur.estado = tec.id

                    JOIN instructor AS inst
                    ON cur.idInstructor = inst.id 

                        
                        `, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };


    
csmDB.consultarMatriculaCurso = (codTemp) => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT cur.*, te.nombre AS nombreTema, li.nombre AS nombreLinea

                    FROM curso AS cur

                    JOIN tema_has_linea AS thl
                    ON thl.idLinea = cur.linea
                    
                    JOIN lineaCurso AS li
                    ON cur.linea = li.id

                    JOIN tema AS te
                    ON te.id = thl.idTema

                    JOIN tipoEstadoCurso AS tec
                    ON cur.estado = tec.id

                    JOIN instructor AS inst
                    ON cur.idInstructor = inst.id 

                    WHERE cur.codTempMatricula = ?

                        
                        `, codTemp, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

csmDB.crearCurso = (linea, idInstructor, fechaCreacion, fechaInicio, fechaCierre, horasTeoria, horasPractica, empresa, nit, rl, arl) => {

    return new Promise((resolve, reject)=> {
    
        pool.query(`INSERT INTO curso (linea, idInstructor, fechaCreacion, fechaInicio, fechaCierre, horasTeoria, horasPractica, empresa, nit, rl, arl) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [linea, idInstructor, fechaCreacion, fechaInicio, fechaCierre, horasTeoria, horasPractica, empresa, nit, rl, arl], (err, results) => {

            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
};

    
csmDB.matricula = (idCurso, idEstudiante) => {
    
    return new Promise((resolve, reject)=> {
    
        pool.query(`INSERT INTO curso_has_estudiante (idCurso, idEstudiante) VALUES (?,?)`, [idCurso, idEstudiante], (err, results) => {

            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
};

        csmDB.editarEstadoCurso = (idCurso, estado) => {
            var codTemp = generaCodigo(8).toUpperCase() 

            return new Promise((resolve, reject)=> {
            
                pool.query(`UPDATE curso SET estado = ?, codTempMatricula = ? WHERE id = ?`,[ estado, codTemp, idCurso ] , (err, results) => {
            
                    if(err){
                        return reject(err);
                    }else{
                        return resolve(results);
                    }
                });
            
            })
            
            };

        csmDB.editarCurso = (id, linea, idInstructor, estado, fechaCreacion, fechaInicio, fechaCierre, horasTeoria, horasPractica, empresa, nit, rl, arl) => {
    
            return new Promise((resolve, reject)=> {
            
                pool.query(`UPDATE curso SET linea = ?, idInstructor = ?, estado = ?, fechaCreacion = ?, fechaInicio = ?, fechaCierre = ?, horasTeoria = ?, horasPractica = ?, empresa = ?, nit = ?, rl = ?, arl = ? WHERE id = ?`,[ linea, idInstructor, estado, fechaCreacion, fechaInicio, fechaCierre, horasTeoria, horasPractica, empresa, nit, rl, arl, id ] , (err, results) => {
            
                    if(err){
                        return reject(err);
                    }else{
                        return resolve(results);
                    }
                });
            
            })
            
            };
        


 

module.exports = csmDB;
