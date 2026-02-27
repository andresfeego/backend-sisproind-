const pool = require('./connection.js');

let csmDB = {};



csmDB.estudiantes = () => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT est.* 
                        FROM estudiante AS est
                        
                        `, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
};


csmDB.estudianteActivo = (idEstudiante) => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT est.* 
                        FROM estudiante AS est
                        WHERE est.id = ? 
                        
                        `, idEstudiante, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
};

    csmDB.estudiantesParaBusqueda = () => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT est.id, est.nombres, est.apellidos 
                            FROM estudiante AS est
                            
                            `, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

    csmDB.estudianteXid = (id) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT est.* 
                            FROM estudiante AS est
                            WHERE est.id = ?
                            
                            `, id, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

        
    csmDB.validarEstParaMatricula = (idEstudiante, idCurso) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT est.* 
                            FROM estudiante AS est

                            JOIN curso_has_estudiante AS che
                            ON che.idEstudiante = est.id

                            WHERE che.idCurso = ? AND est.id = ?
                            
                            `, [idCurso, idEstudiante] , (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

        csmDB.estudianteXcurso = (id) => {
        
            return new Promise((resolve, reject)=> {
            
                pool.query(`SELECT est.*, che.graduado
                                FROM estudiante AS est

                                JOIN curso_has_estudiante AS che
                                ON che.idEstudiante = est.id

                                WHERE che.idCurso = ?
                                
                                `, id, (err, results) => {
            
                    if(err){
                        return reject(err);
                    }else{
                        return resolve(results);
                    }
                });
            
            })
            
            };



        csmDB.telEstXid = (id) => {
        
            return new Promise((resolve, reject)=> {
            
                pool.query(`SELECT tel.* 
                                FROM telefono AS tel

                                JOIN estudiante_has_telefono AS eht
                                ON eht.idTelefono = tel.id

                                WHERE eht.idEstudiante = ?
                                
                                `, id, (err, results) => {
            
                    if(err){
                        return reject(err);
                    }else{
                        return resolve(results);
                    }
                });
            
            })
            
            };

            
csmDB.actDesEstu = (accion, id) => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`UPDATE estudiante SET activo = ? WHERE id = ?`,[ accion , id ] , (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };
    

csmDB.estudianteExiste = (id) => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT est.* 
                        FROM estudiante AS est
                        WHERE est.id = ?
                        
                        `, id, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    csmDB.crearEstudiante = (id, tipoDoc, nombres, apellidos, email, telefonos) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`INSERT INTO estudiante (id, tipoDoc, nombres, apellidos, email, pass, passTemp, activo) VALUES (?,?,?,?,?,?,?,?)`, [id, tipoDoc, nombres, apellidos, email, id, "",1], (err, results) => {
    
                if(err){
                    return reject(err);
                }else{

                    return Promise.all(

                        telefonos.map((item) => {
                                
                                pool.query(`INSERT INTO telefono ( numero ) VALUES (?)`, [item.numero], (err, results) => {
        
                                    if(err){
                                        return reject(err);
                                    }else{

                                        let idTelefono = results.insertId
                                        console.log(idTelefono)
                                        pool.query(`INSERT INTO estudiante_has_telefono (idEstudiante, idTelefono) VALUES (?, ?)`, [id, idTelefono], (err, results) => {
                    
                                            if(err){
                                                return reject(err);
                                            }else{
                                                resolve(results)
                                            }

                                        });

                                    }
                                });

                            })

                    )
                           


                }
            });
        
        })
        
        };


    csmDB.agregarTelEstudiante = (idEstudiante, telefono) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`INSERT INTO telefono ( numero ) VALUES (?)`, [telefono], (err, results) => {
        
                if(err){
                    return reject(err);
                }else{

                    let idTelefono = results.insertId
                    console.log(idTelefono)
                    pool.query(`INSERT INTO estudiante_has_telefono (idEstudiante, idTelefono) VALUES (?, ?)`, [idEstudiante, idTelefono], (err, results) => {

                        if(err){
                            return reject(err);
                        }else{
                            resolve(results)
                        }

                    });

                }
            });
        
        })
        
        };

        csmDB.eliminarTelEstudiante = (idTelefono) => {
        
            return new Promise((resolve, reject)=> {
            
                pool.query(`DELETE FROM estudiante_has_telefono WHERE estudiante_has_telefono.idTelefono = ?`, [idTelefono], (err, results) => {
            
                    if(err){
                        return reject(err);
                    }else{
    
                        pool.query(`DELETE FROM telefono WHERE telefono.id = ?`, [idTelefono], (err, results) => {
    
                            if(err){
                                return reject(err);
                            }else{
                                resolve(results)
                            }
    
                        });
    
                    }
                });
            
            })
            
            };


              
csmDB.editarEstudiante = (idEstudiante, tipoDoc, nombres, apellidos, email) => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`UPDATE estudiante SET tipoDoc = ?, nombres = ?, apellidos = ?, email = ? WHERE id = ?`,[ tipoDoc, nombres, apellidos, email, idEstudiante ] , (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };


    csmDB.AgregarAlumnoAcurso = (idCurso, idEstudiante) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`INSERT INTO curso_has_estudiante (idCurso, idEstudiante) VALUES (?, ?)`,[ idCurso , idEstudiante ] , (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

csmDB.eliminarAlumnoDecurso = (idCurso, idEstudiante) => {

    return new Promise((resolve, reject)=> {
    
        pool.query(`DELETE FROM curso_has_estudiante WHERE curso_has_estudiante.idCurso = ? AND  curso_has_estudiante.idEstudiante = ?`,[ idCurso , idEstudiante ] , (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    
csmDB.cambiarEstadoGraduado = (idCurso, idEstudiante, graduado) => {

    return new Promise((resolve, reject)=> {
    
        pool.query(`UPDATE curso_has_estudiante SET graduado = ?  WHERE curso_has_estudiante.idCurso = ? AND  curso_has_estudiante.idEstudiante = ?`,[graduado, idCurso , idEstudiante ] , (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };
    
    
        

csmDB.certificadosCursos = (id) => {
    
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT est.*, td.documento , est.id AS idEstudiante, concat(ins.nombres , ' ', ins.apellidos ) AS nombreInstructor, ins.cargo AS cargoInstructor, ins.licencia AS licenciaInstructor, ins.urlFirmaInstructor AS urlFirmaInstructor, che.graduado, cur.*, cur.id AS idCurso, cur.empresa AS empresa, cur.nit AS nit, cur.rl AS rl, cur.arl AS arl, tem.nombre AS nombreTema, tem.id AS idTema, tem.sigla AS sigla, tem.resolucion AS resolucion, tem.urlFondoDiploma AS urlFondoDiploma, lic.*, cur.id AS idCurso, tec.estado AS nombreEstado
                        FROM estudiante AS est

                        JOIN curso_has_estudiante AS che
                        ON che.idEstudiante = est.id

                        JOIN curso AS cur
                        ON cur.id = che.idCurso

                        JOIN lineaCurso AS lic
                        ON lic.id = cur.linea

                        JOIN tema_has_linea AS thl
                        ON thl.idLinea = lic.id

                        JOIN tema AS tem 
                        ON tem.id = thl.idTema

                        JOIN tipoEstadoCurso tec
                        ON tec.id = cur.estado

                        JOIN instructor AS ins
                        ON ins.id = cur.idInstructor

                        JOIN tipoDocumento AS td
                        ON td.id = est.tipoDoc

                        WHERE est.id = ?
                        
                        `, id, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

csmDB.validarDiploma = (idEstudiante, idCurso) => {
    
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT est.*, td.documento , est.id AS idEstudiante, concat(ins.nombres , ' ', ins.apellidos ) AS nombreInstructor, ins.cargo AS cargoInstructor, ins.licencia AS licenciaInstructor, ins.urlFirmaInstructor AS urlFirmaInstructor, che.graduado, cur.*, cur.id AS idCurso, cur.empresa AS empresa, cur.nit AS nit, cur.rl AS rl, cur.arl AS arl, tem.nombre AS nombreTema, tem.id AS idTema, tem.sigla AS sigla, tem.resolucion AS resolucion, lic.*, cur.id AS idCurso, tec.estado AS nombreEstado
                        FROM estudiante AS est

                        JOIN curso_has_estudiante AS che
                        ON che.idEstudiante = est.id

                        JOIN curso AS cur
                        ON cur.id = che.idCurso

                        JOIN lineaCurso AS lic
                        ON lic.id = cur.linea

                        JOIN tema_has_linea AS thl
                        ON thl.idLinea = lic.id

                        JOIN tema AS tem 
                        ON tem.id = thl.idTema

                        JOIN tipoEstadoCurso tec
                        ON tec.id = cur.estado

                        JOIN instructor AS ins
                        ON ins.id = cur.idInstructor

                        JOIN tipoDocumento AS td
                        ON td.id = est.tipoDoc

                        WHERE est.id = ? AND cur.id = ?
                        
                        `, [idEstudiante, idCurso], (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

csmDB.diplomasGraduadosCurso = (idCurso) => {
    
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT est.*, td.documento , est.id AS idEstudiante, concat(ins.nombres , ' ', ins.apellidos ) AS nombreInstructor, ins.cargo AS cargoInstructor, ins.licencia AS licenciaInstructor, ins.urlFirmaInstructor AS urlFirmaInstructor, che.graduado, cur.*, cur.id AS idCurso, cur.empresa AS empresa, cur.nit AS nit, cur.rl AS rl, cur.arl AS arl, tem.nombre AS nombreTema, tem.id AS idTema, tem.sigla AS sigla, tem.resolucion AS resolucion, tem.urlFondoDiploma AS urlFondoDiploma, lic.*, cur.id AS idCurso, tec.estado AS nombreEstado
                        FROM estudiante AS est

                        JOIN curso_has_estudiante AS che
                        ON che.idEstudiante = est.id

                        JOIN curso AS cur
                        ON cur.id = che.idCurso

                        JOIN lineaCurso AS lic
                        ON lic.id = cur.linea

                        JOIN tema_has_linea AS thl
                        ON thl.idLinea = lic.id

                        JOIN tema AS tem 
                        ON tem.id = thl.idTema

                        JOIN tipoEstadoCurso tec
                        ON tec.id = cur.estado

                        JOIN instructor AS ins
                        ON ins.id = cur.idInstructor

                        JOIN tipoDocumento AS td
                        ON td.id = est.tipoDoc

                        WHERE cur.id = ? AND che.graduado = 1
                        
                        `, [idCurso], (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

module.exports = csmDB;
