const pool = require('./connection.js');

let csmDB = {};



csmDB.bitacora = () => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT bit.*, bit.id AS idEve, teb.*, concat(us.nombre , ' ' , us.apellido) AS nombreUsuario
                        FROM bitacora AS bit

                        JOIN tipoEventoBitacora AS teb
                        ON teb.id = bit.idTipoEvento

                        JOIN usuarioSistema AS us
                        ON us.id = bit.idUsuarioSistema

                        ORDER BY bit.id DESC

                        
                        `,  (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

    
csmDB.tiposEventosBitacora = () => {
        
    return new Promise((resolve, reject)=> {
    
        pool.query(`SELECT teb.*
                        FROM tipoEventoBitacora AS teb
                        ORDER BY teb.tipo ASC

                        
                        `,  (err, results) => {
    
            if(err){
                return reject(err);
            }else{
                return resolve(results);
            }
        });
    
    })
    
    };

 


module.exports = csmDB;