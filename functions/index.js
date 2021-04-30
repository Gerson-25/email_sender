const functions = require('firebase-functions');
const nodemailer = require('nodemailer'); //this is a node library that needs to be installed
const admin = require("firebase-admin"); 
const { google } = require('googleapis'); 
const OAuth2 = google.auth.OAuth2;
const ics = require('ics'); //this is a node library that needs to be installed
admin.initializeApp()

const pdf  = require('html-pdf'); //this is a node library that needs to be installed
const { object } = require('firebase-functions/lib/providers/storage');
const { error } = require('firebase-functions/lib/logger');

const oauth2Client = new OAuth2(
    "962809646511-s8uh84cvfuohc7ec94hha3v03mcli75g.apps.googleusercontent.com",
    "We2gj_KSmuooXPciA9XY_PzW",
    "https://developers.google.com/oauthplayground"
)

oauth2Client.setCredentials({
    refresh_token: "1//04e36Vr0m3ORsCgYIARAAGAQSNwF-L9IrlxplUDi_uUtXj9cYjigpk95j5aEY3WbrdJkCRaMKnD0Cv4JllViCAx4JxL_piP45ZWc"
})

const accessToken = oauth2Client.getAccessToken()

var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
         type: "OAuth2",
         user: "solicitudes.credicomer@gmail.com", 
         clientId: "962809646511-s8uh84cvfuohc7ec94hha3v03mcli75g.apps.googleusercontent.com",
         clientSecret:  "We2gj_KSmuooXPciA9XY_PzW",
         refreshToken: "1//04gs1gDJp0eOZCgYIARAAGAQSNwF-L9IrNXczPEGCkcRDHwKqW380EIX9b9uOsbvhw7yvlBewyQS6TegKWpFvOprlhYb8QJb3Aa4",
         accessToken: accessToken
    },
    tls: {
        rejectUnauthorized: false
      }
  });


  let date;
  let organizer;
  let title;
  let location;

 exports.updateInfo = functions.firestore
    .document('rooms/{roomId}/reservations/{reservationId}')
    .onCreate((snap, context) => {
        const _date = snap.data().date.split("-");
        const reservationId = context.params.reservationId

            return snap.ref.update({ 
                id: reservationId
            });
        
    });


  exports.sendEmail = functions.firestore
    .document('rooms/{roomId}/reservations/{reservationId}')
    .onUpdate((snap, context) => {
        const _date = snap.after.data().date.split("-");
        const _start = snap.after.data().start;
        const _end = snap.after.data().end;
        const organizer = snap.after.data().organizer;
        const title = snap.after.data().title;
        const location = snap.after.data().room;
        const attendees =  snap.after.data().attendees.push(organizer)

        var end = _end.split(":")
        var start = _start.split(":")

        var start1 = parseInt(start[0])
        var addStart = start1+6

        let finalStart;
        if(addStart<10){
            finalStart = "0"+addStart.toString()
        }
        else{
            finalStart = addStart.toString()
        }

        var end1 = parseInt(end[0])
        var addEnd = end1+6

        let finalEnd;
        if(addEnd<10){
            finalEnd = "0"+addEnd.toString()
        }
        else{
            finalEnd = addEnd.toString()
        }

        var day = parseInt(_date[0]) 
        var month = parseInt(_date[1])

        var today = new Date()
        today = today.toISOString().replace("-","").replace("-","").replace(":","").replace(":","").replace(".","")
        console.log(today)
        var eventStart = new Date(_date[2]+"-"+_date[1]+"-"+_date[0]+"T"+finalStart+":"+start[1]+"")
        eventStart = eventStart.toISOString().replace("-","").replace("-","").replace(":","").replace(":","").replace(".","")
        console.log(start)
        var eventEnd = new Date(_date[2]+"-"+_date[1]+"-"+_date[0]+"T"+finalEnd+":"+end[1]+"")
        eventEnd = eventEnd.toISOString().replace("-","").replace("-","").replace(":","").replace(":","").replace(".","")

        let content = 'BEGIN:VCALENDAR\n' +
        'VERSION:2.0\n' +
        'BEGIN:VEVENT\n' +
        'SUMMARY:'+title+'\n' +
        'DTSTART:'+eventStart+'\n' +
        'DTEND:'+eventEnd+'\n' +
        'LOCATION:'+location+'\n' +
        'DESCRIPTION:Description123\n' +
        'STATUS:CONFIRMED\n' +
        'SEQUENCE:3\n' +
        'BEGIN:VALARM\n' +
        'TRIGGER:-PT10M\n' +
        'DESCRIPTION:Description123\n' +
        'ACTION:DISPLAY\n' +
        'END:VALARM\n' +
        'END:VEVENT\n' +
        'END:VCALENDAR';
    

        const event = {
            title: title,
            location: location,
            start: _start,
            end: _end,
            //start: [date[2],date[1], date[0], start[0], start[1]],
            //end: [date[2],date[1], date[0],end[0], end[1]],
            organizer: { name: organizer , email: organizer 
            }
        }

          ics.createEvent(event, (error, value) => {
        
        });

        const mailOptions = {
            from: 'reservacionescredicomer@gmail.com',
            to:snap.after.data().attendees,
            subject: 'contact form message',
            html: `<h1>Nueva Reservacion de Sala</h1>
             <p> Tienes una nueva reservacion</p>`,
             icalEvent: {
                filename: "invitation.ics",
                method: 'request',
                content: content
                }
        };

        transporter.sendMail(mailOptions, (error, data) => {
            if (error) {
                console.log(error)
                error
            }
            
        });
        
}); 



exports.cancelReservation = functions.firestore
.document('rooms/{roomId}/reservations/{reservationId}').onDelete((event) => {
    const deletedData = event.data();

    const _date = deletedData.date.split("-");
        const _start = deletedData.start;
        const _end = deletedData.end;
        const organizer = deletedData.organizer;
        const title = deletedData.title;
        const location = deletedData.room;
        const attendees = deletedData.attendees.push(organizer)

        var end = _end.split(":")
        var start = _start.split(":")

        var start1 = parseInt(start[0])
        var addStart = start1+6

        let finalStart;
        if(addStart<10){
            finalStart = "0"+addStart.toString()
        }
        else{
            finalStart = addStart.toString()
        }

        var end1 = parseInt(end[0])
        var addEnd = end1+6

        let finalEnd;
        if(addEnd<10){
            finalEnd = "0"+addEnd.toString()
        }
        else{
            finalEnd = addEnd.toString()
        }

        var today = new Date()
        today = today.toISOString().replace("-","").replace("-","").replace(":","").replace(":","").replace(".","")
        console.log(today)
        var eventStart = new Date(_date[2]+"-"+_date[1]+"-"+_date[0]+"T"+finalStart+":"+start[1]+"")
        eventStart = eventStart.toISOString().replace("-","").replace("-","").replace(":","").replace(":","").replace(".","")
        console.log(start)
        var eventEnd = new Date(_date[2]+"-"+_date[1]+"-"+_date[0]+"T"+finalEnd+":"+end[1]+"")
        eventEnd = eventEnd.toISOString().replace("-","").replace("-","").replace(":","").replace(":","").replace(".","")

        let content = 'BEGIN:VCALENDAR\n' +
        'VERSION:2.0\n' +
        'BEGIN:VEVENT\n' +
        'SUMMARY:'+title+'\n' +
        'DTSTART:'+eventStart+'\n' +
        'DTEND:'+eventEnd+'\n' +
        'LOCATION:'+location+'\n' +
        'DESCRIPTION:Description123\n' +
        'STATUS:CANCELLED\n' +
        'METHOD:CANCEL\n' +
        'SEQUENCE:3\n' +
        'BEGIN:VALARM\n' +
        'TRIGGER:-PT10M\n' +
        'DESCRIPTION:Description123\n' +
        'ACTION:DISPLAY\n' +
        'END:VALARM\n' +
        'END:VEVENT\n' +
        'END:VCALENDAR';
    

        const mailOptions = {
            from: 'reservacionescredicomer@gmail.com',
            to: deletedData.attendees,
            subject: 'contact form message',
            html: `<h1>Reservacion Cancelada</h1>
             <p> Esta reservacion ha sido cancelada</p>`,
             icalEvent: {
                filename: "invitation.ics",
                method: 'request',
                content: content
                }
        };

        transporter.sendMail(mailOptions, (error, data) => {
            if (error) {
                console.log(error)
                error
            }
            
        });

});




       exports.updateRequestWithId = functions.firestore
       .document('credit_request/{requestId}')
       .onCreate(async (snap, context) => {
        const id = context.params.requestId;
        return snap.ref.update({ id: id });
       })

        


exports.sendRequest = functions.firestore
       .document('credit_request/{requestId}')
       .onCreate(async (snap, context) => {
            const _object = snap.data();

            let pdfhtmlContent = 
            `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="preconnect" href="https://fonts.gstatic.com">
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200&display=swap" rel="stylesheet"> 
                <title>Document</title>
                <style>
            
                body{
                    padding: 20px;
                    font-size: 12px;
                    font-family: 'Poppins', sans-serif;
                }
                .header{
                    display: inline-flex;
                    width: 100%;
                    border-bottom: #000 1px solid;
                    font-family: Helvetica;
                    font-weight: normal;
                }
        
                .image-header{
                    margin: 10px;
                    width: 100px;
                }
        
                .text-header{
                    font-size: 10px;
                    position: absolute;
                    right: 0px;
                    text-align: center;
                    width: 250px;
                
                }
                th{
                    border-bottom: #000 0.5px solid;
                    text-align: left;
                    font-weight: bolder;
                }

                table{
                    margin-top: 20px;
                }
                .first-section{
                    width: 35%;
                }
                .second-section{
                    width: 65%;
                }
            
                </style>
            </head>
            <body>
                <div class="header"> 
                    <img class="image-header" src="data:image/png;base64,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" alt=""> 
                    <div class="text-header">
                        
                    </div>
                </div>
                <table style="width:100%">
                    <tr>
                        <th colspan="2">Informacion Personal</th>
                    </tr>
                    <tr>
                        <td class="first-section">Nombre</td>
                        <td class="second-section">${_object.nombre}</td>
                    </tr>
                    <tr>
                      <td class="first-section">Telefono</td>
                      <td class="second-section">${_object.telefono}</td>
                    </tr>
                
                    <tr>
                        <th colspan="2">Informacion de vivienda</th>
                    <tr>
                    <tr>
                        <td class="first-section">Departamento</td>
                        <td class="second-section">${_object.departamento}</td>
                    </tr>
                    <tr>
                      <td class="first-section">Municipio</td>
                      <td class="second-section">${_object.municipio}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Ubicacion</td>
                        <td class="second-section">${_object.ubicacion}</td>
                    </tr>
                    <tr>
                      <td class="first-section">Detalles de ubicacion:</td>
                      <td class="second-section">${_object.domicilio}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Tipo de vivienda</td>
                        <td class="second-section">${_object.type}</td>
                    </tr>
                    <tr>
                        <th colspan="2">Detalles de ingresos</th>
                    <tr>
                    <tr>
                        <td class="first-section">Fecha de contratacion</td>
                        <td class="second-section">${_object.fecha_ingreso}</td>
                    </tr>
                    <tr>
                      <td class="first-section">Ingresos variables</td>
                      <td class="second-section">${_object.ingresos_variables}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Garantias</td>
                        <td class="second-section">${_object.garantia}</td>
                    </tr>
                    <tr>
                        <th colspan="2">Referencias familiares</th>
                    <tr>
                    <tr>
                        <td class="first-section">Nombre (1er Referencia)</td>
                        <td class="second-section">${_object.nombre_rf_uno}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Telefono (1er Referencia)</td>
                        <td class="second-section">${_object.telefono_rf_uno}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Parentesco (1er Referencia)</td>
                        <td class="second-section">${_object.parentesco_rf_uno}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Nombre (2da Referencia)</td>
                        <td class="second-section">${_object.nombre_rf_dos}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Telefono (2da Referencia)</td>
                        <td class="second-section">${_object.telefono_rf_dos}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Parentesco (2da Referencia)</td>
                        <td class="second-section">${_object.parentesco_rf_dos}</td>
                    </tr>
                    <tr>
                        <th colspan="2">Referencias Personales</th>
                    <tr>
                    <tr>
                        <td class="first-section">Nombre (1er Referencia)</td>
                        <td class="second-section">${_object.nombre_rp_uno}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Telefono (1er Referencia)</td>
                        <td class="second-section">${_object.telefono_rp_uno}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Nombre (1er Referencia)</td>
                        <td class="second-section">${_object.nombre_rp_dos}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Telefono (1er Referencia)</td>
                        <td class="second-section">${_object.telefono_rp_dos}</td>
                    </tr>
                    <tr>
                        <th colspan="2">Consolidacion Deudas</th>
                    <tr>
                    <tr>
                        <td class="first-section">Monto a consolidar</td>
                        <td class="second-section">${_object.monto_deuda}</td>
                    </tr>
                    <tr>
                        <td class="first-section">Comentarios</td>
                        <td class="second-section">${_object.comentarios}</td>
                    </tr>
                  </table> 
            
            </body>
            </html>`

    pdf.create(pdfhtmlContent, {timeout:560000}).toBuffer(function(error, pdfBuffer) {
        
        console.log("is buffer: ", Buffer.isBuffer(pdfBuffer))
        const mailOptions = {
            from: 'solicitudes.credicomer@gmail.com',
            to: 'gmisaelbeltran@gmail.com',
            subject: 'Nueva Solicitud de Credito - Crediagenda',
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                
                <meta http–equiv=“Content-Type” content=“text/html; charset=UTF-8” />
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="preconnect" href="https://fonts.gstatic.com">
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200&display=swap" rel="stylesheet"> 
                <title>Document</title>
                <style>
            
                </style>
            </head>
            <body>
                <div class="email-header">
                    <h3>Nueva solicitud</h3>
                    <div class="header-text">El colaborador <span>${_object.nombre}</span> creo una nueva solicitud</div>

                </div>
            
            </body>
            </html>`,
             attachments:[{
                filename: 'request.pdf',
                content:pdfBuffer,
                contentType: 'application/pdf'
             }/*,
            {
                filename: 'recibo_agua.jpg',
                path: _object.recibo_agua,
                contentType: 'image/jpeg'
            },
            {
                filename: 'recibo_energia.jpg',
                path: _object.recibo_energia,
                contentType: 'image/jpeg'
            },
            {
                filename: 'carta_recomendacion.pdf',
                path: _object.recomendacion,
                contentType: 'application/pdf'
            }
            /*{
                filename: 'seguro_deuda.jpg',
                path: _object.seguro_deuda,
                contentType: 'image/jpeg'
            }*/]
            };
           transporter.sendMail(mailOptions, (error, data) => {
               if (error) {
                   console.log(error)
                   return
               }
               else{
                   console.log("el mensaje fue enviado")
                   return
               }
               
           }); 
        return pdfBuffer
    })

        return
    })



/*

let options = { format: 'A4' };

let file = { content: `<h1>Ejemplo de solicitud de Credito</h1>
<h3>Informacion Personal</h3>
<p>Nombre del solicitante: Miguel Hernandez</p>
<p>Telefono: 78765643</p>
<p>Departamento: Sonsonate</p>
<p>Municicpio: Acajutala</p>
<p>Domicilio: Calle el limon, casa #34</p>
<p>Fecha de Ingreso: 25/03/19</p>
<p>Ingresos variables: 0.00</p>
<p>Garantia: no garantia</p>
<h3></h3>
<p>Referencias Familiar</p>
<p>Nombre: Jose Hernandez</p>
<p>Telefono: 78980909</p>
<p>parentesco: hemrnano</p>
<p>Nombre: Andrea Hernandez</p>
<p>telefono: 76569809</p>
<p>Parentesco: Hermana</p>
<p>Referencias Personales</p>
<p>Nombre: Ernesto Aqguilar</p>
<p>Telefono: 74589898</p>
<p>Nombre: Julian Gonzales</p>
<p>Telefono: 78455433</p>` };

const pdfContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>

        .header{
            display: inline-flex;
            width: 100%;
            border: #000 1px solid;
            font-family: Helvetica;
            font-weight: normal;
        }

        .image-header{

            margin: 10px;
            width: 200px;
        }

        .text-header{
            top: 0px;
            position: absolute;
            right: 0px;
            text-align: center;
            width: 350px;
            margin: 10px;
        }

        th{
            border: black solid 1px;
        }

        td{
            border: black solid 1px;
        }

    </style>
</head>
<body>
    <div class="header"> 
        <img class="image-header" src="data:image/png;base64,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" alt=""> 
        <div class="text-header">
            <p>Solicitud de credito personal</p>
            <p>12/08/2020</p>
        </div>
    </div>
    <table style="width:100%">
        <tr>
            <th colspan="2">Informacion Personal</th>
        <tr>
            <td>Nombre</td>
            <td>Gerson Misael Aquino Beltran</td>
        </tr>
        <tr>
          <td>Telefono</td>
          <td>76210807</td>
        </tr>
        <tr>
          <td>Fecha de contratacion</td>
          <td>J25/02/2019</td>
        </tr>
      </table> 

</body>
</html>
`

pdf.create(pdfContent).toBuffer(function(error, buffer) {
        const mailOptions = {
            from: 'reservacionescredicomer@gmail.com',
            to: 'gmisaelbeltran@gmail.com',
            subject: 'contact form message',
            html: `<h1>Nueva solicitud</h1>
             <p> usuario ha creado una nueva solicitud</p>`,
             attachments:[{
                filename: 'request.pdf',
                content:buffer,
                contentType: 'application/pdf'
             }]
            };

           transporter.sendMail(mailOptions, (error, data) => {
               if (error) {
                   console.log(error)
                   return
               }
               else{
                   console.log("el mensaje fue enviado")
                   retunr
               }
               
           }); 
       }) 

*/