const pool = require('./connection.js');

let csmDB = {};



csmDB.instructores = () => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT inst.* 
                        FROM instructor AS inst
                        `, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    
    csmDB.crearInstructor = (id, tipoDoc, nombres, apellidos, email, profesion, cargo, licencia, telefonos, urlFirmaInstructor) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`INSERT INTO instructor (id, tipoDoc, nombres, apellidos, profesion, email, cargo, licencia, pass, passTemp, activo, urlFirmaInstructor) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [id, tipoDoc, nombres, apellidos, profesion, email, cargo, licencia, id, "",1, urlFirmaInstructor], (err, results) => {
    
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
                                        pool.query(`INSERT INTO instructor_has_telefono (idInstructor, idTelefono) VALUES (?, ?)`, [id, idTelefono], (err, results) => {
                    
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

    csmDB.instructorExiste = (id) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT inst.* 
                            FROM instructor AS inst
                            WHERE inst.id = ?
                            
                            `, id, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

        csmDB.actDesInst = (accion, id) => {
        
            return new Promise((resolve, reject)=> {
            
                pool.query(`UPDATE instructor SET activo = ? WHERE id = ?`,[ accion , id ] , (err, results) => {
            
                    if(err){
                        return reject(err);
                    }else{
                        return resolve(results);
                    }
                });
            
            })
            
            };


    csmDB.instructorXid = (id) => {

        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT inst.* 
                            FROM instructor AS inst
                            WHERE inst.id = ?
                            
                            `, id, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };


        
    csmDB.telInstXid = (id) => {
    
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT tel.* 
                            FROM telefono AS tel

                            JOIN instructor_has_telefono AS iht
                            ON iht.idTelefono = tel.id

                            WHERE iht.idInstructor = ?
                            
                            `, id, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };

        
    csmDB.agregarTelInstructor = (idInstructor, telefono) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`INSERT INTO telefono ( numero ) VALUES (?)`, [telefono], (err, results) => {
        
                if(err){
                    return reject(err);
                }else{

                    let idTelefono = results.insertId
                    console.log(idTelefono)
                    pool.query(`INSERT INTO instructor_has_telefono (idInstructor, idTelefono) VALUES (?, ?)`, [idInstructor, idTelefono], (err, results) => {

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

        csmDB.eliminarTelInstructor = (idTelefono) => {
        
            return new Promise((resolve, reject)=> {
            
                pool.query(`DELETE FROM instructor_has_telefono WHERE instructor_has_telefono.idTelefono = ?`, [idTelefono], (err, results) => {
            
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

    csmDB.editarInstructor = (idInstructor, tipoDoc, nombres, apellidos, email, profesion, cargo, licencia) => {
        
        return new Promise((resolve, reject)=> {
        
        pool.query(`UPDATE instructor SET tipoDoc = ?, nombres = ?, apellidos = ?, email = ?, profesion = ?, cargo = ?, licencia = ? WHERE id = ?`,[ tipoDoc, nombres, apellidos, email, profesion, cargo, licencia, idInstructor ] , (err, results) => {

            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    csmDB.actualizarFirmaInstructor = (idInstructor, urlFirmaInstructor) => {
        
        return new Promise((resolve, reject)=> {
        
        pool.query(`UPDATE instructor SET urlFirmaInstructor = ? WHERE id = ?`,[ urlFirmaInstructor, idInstructor ] , (err, results) => {

            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };
            

module.exports = csmDB;
