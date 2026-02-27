const nodemailer = require("nodemailer");

let csmDB = {};

createAcount = () =>{
    return new Promise ((resolve, reject) => {
        try {
            let testAccount = nodemailer.createTestAccount();
            resolve(testAccount)
        } catch (error) {
            reject(error)
        }
    })
} 

getTransporter = async () =>{
    return new Promise ((resolve, reject) => {

        createAcount().then((testAccount) => {
            let transporter = nodemailer.createTransport({
                host: "mail.sisproind.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                  user: "informacion@sisproind.com", // generated ethereal user
                  pass: "sisproindInfo", // generated ethereal password
                },
              });
              resolve(transporter)
              
        }).catch((error) => {
            reject(error)
        })
        
    })
}

csmDB.enviar = (variable) => {
    return new Promise ((resolve, reject) => {
       
        getTransporter().then((transporter) =>{
            // send mail with defined transport object
                transporter.sendMail({
                from: '"Fred Foo 👻" <informacion@sisproind.com>', // sender address
                to: "andres.feego@gmail.com", // list of receivers
                subject: "Hello ✔", // Subject line
                text: "Hello world?", // plain text body
                html: "<b>Hello world? " + variable + "</b>", // html body
            });

            
            resolve()

        }).catch((error) => {
            reject(error)
        })
            
    })
}

module.exports = csmDB;
