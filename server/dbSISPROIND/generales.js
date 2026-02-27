const pool = require('./connection.js');
var moment = require('moment');

let csmDB = {};



csmDB.tipoDocumento = () => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT td.* 
                        FROM tipoDocumento AS td
                        ORDER BY td.id ASC
                        
                        `, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    csmDB.tipoTemas = () => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT tt.* 
                            FROM tema AS tt
                            ORDER BY tt.id ASC
                            
                            `, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

csmDB.tipoLineas = (idTema) => {

    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT tl.* 
                        FROM lineaCurso AS tl

                        JOIN tema_has_linea AS thl
                        ON thl.idLinea = tl.id

                        WHERE thl.idTema = ?

                        ORDER BY tl.id ASC
                        
                        `, idTema, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    
csmDB.tipoEstadosCurso = () => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT te.* 
                        FROM tipoEstadoCurso AS te
                        ORDER BY te.id ASC
                        
                        `, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    csmDB.temas = () => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT t.* 
                            FROM tema AS t
                            ORDER BY t.id ASC
                            `, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

    csmDB.crearTema = (sigla, nombre, descripcion, resolucion, urlFondoDiploma) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`INSERT INTO tema (sigla, nombre, descripcion, resolucion, urlFondoDiploma) VALUES (?,?,?,?,?)`,[ sigla, nombre, descripcion, resolucion, urlFondoDiploma ] , (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

    csmDB.editarTema = (id, sigla, nombre, descripcion, resolucion, urlFondoDiploma) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`UPDATE tema SET sigla = ?, nombre = ?, descripcion = ?, resolucion = ?, urlFondoDiploma = ? WHERE id = ?`,[ sigla, nombre, descripcion, resolucion, urlFondoDiploma, id ] , (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

    csmDB.eliminarTema = (id) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`DELETE FROM tema_has_linea WHERE idTema = ?`,[ id ] , (err) => {
        
                if(err){
                    return reject(err);
                }
                pool.query(`DELETE FROM tema WHERE id = ?`,[ id ] , (err2, results) => {
                    if(err2){
                        return reject(err2);
                    }else{
                        return resolve(results);
                    }
                });
            });
        
        })
        
        };

    csmDB.actualizarFondoDiplomaTema = (idTema, urlFondoDiploma) => {
        
        return new Promise((resolve, reject)=> {
        
        pool.query(`UPDATE tema SET urlFondoDiploma = ? WHERE id = ?`,[ urlFondoDiploma, idTema ] , (err, results) => {

            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    csmDB.lineas = () => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT l.* 
                            FROM lineaCurso AS l
                            ORDER BY l.id ASC
                            `, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

    csmDB.crearLinea = (nombre, descripcion, horas, idTema) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`INSERT INTO lineaCurso (nombre, descripcion, horas) VALUES (?,?,?)`,[ nombre, descripcion, horas ] , (err, results) => {
        
                if(err){
                    return reject(err);
                }

                const idLinea = results.insertId;
                pool.query(`INSERT INTO tema_has_linea (idTema, idLinea) VALUES (?,?)`,[ idTema, idLinea ] , (err2, results2) => {
                    if(err2){
                        return reject(err2);
                    }else{
                        return resolve(results2);
                    }
                });
            });
        
        })
        
        };

    csmDB.editarLinea = (id, nombre, descripcion, horas, idTema) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`UPDATE lineaCurso SET nombre = ?, descripcion = ?, horas = ? WHERE id = ?`,[ nombre, descripcion, horas, id ] , (err, results) => {
        
                if(err){
                    return reject(err);
                }
                pool.query(`UPDATE tema_has_linea SET idTema = ? WHERE idLinea = ?`,[ idTema, id ] , (err2, results2) => {
                    if(err2){
                        return reject(err2);
                    }else{
                        return resolve(results2);
                    }
                });
            });
        
        })
        
        };

    csmDB.eliminarLinea = (id) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`DELETE FROM tema_has_linea WHERE idLinea = ?`,[ id ] , (err) => {
        
                if(err){
                    return reject(err);
                }
                pool.query(`DELETE FROM lineaCurso WHERE id = ?`,[ id ] , (err2, results) => {
                    if(err2){
                        return reject(err2);
                    }else{
                        return resolve(results);
                    }
                });
            });
        
        })
        
        };

  
    
    csmDB.agregarEventoBitacora = (idTipoEvento, descripcion, idUsuarioSistema) => {
        var fecha = new Date();

        fecha = moment(fecha).format();
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`INSERT INTO bitacora (idTipoEvento, descripcion, idUsuarioSistema, fechaYhora) VALUES (?,?,?,?)`,[ idTipoEvento, descripcion, idUsuarioSistema, fecha ] , (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };


module.exports = csmDB;
