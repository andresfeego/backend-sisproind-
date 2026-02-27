const pool = require('./connection.js');

let csmDB = {};



csmDB.usuarios = () => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT usu.*, concat(usu.nombre , ' ', usu.apellido) AS nombreUsuario
                        FROM usuarioSistema AS usu
                        
                        `, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    

csmDB.usuarioXemail = (id) => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT usu.* 
                        FROM usuarioSistema AS usu
                        WHERE usu.email = ?
                        
                        `, id, (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    csmDB.usuarioXid = (id) => {
        
        return new Promise((resolve, reject)=> {
        
            pool.query(`SELECT usu.* 
                            FROM usuarioSistema AS usu
                            WHERE usu.id = ?
                            
                            `, id, (err, results) => {
        
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
        
        })
        
        };


    csmDB.cambiarContrasena = (pass, id) => {

        return new Promise((resolve, reject)=> {
    
            pool.query(`UPDATE usuarioSistema SET pass = ? WHERE id = ?`, [pass, id], (err, results) => {
    
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
    
        })
    
    };


    csmDB.editarUsuario = (id, nombre, apellido, email) => {

        return new Promise((resolve, reject)=> {
    
            pool.query(`UPDATE usuarioSistema SET nombre = ?, apellido = ?, email = ? WHERE id = ?`, [nombre, apellido, email, id], (err, results) => {
    
                if(err){
                    return reject(err);
                }else{
                    return resolve(results);
                }
            });
    
        })
    
    };


module.exports = csmDB;