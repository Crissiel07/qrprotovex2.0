const { sendQREmail } = require('../config/mail');

/**
 * Envía un código QR por correo electrónico
 * @param {string} to - Correo electrónico del destinatario
 * @param {string} name - Nombre completo del destinatario
 * @param {string} qrCodePath - Ruta del archivo QR
 * @param {string} type - Tipo de destinatario ('estudiante' o 'empleado')
 * @returns {Promise<boolean>} - True si el correo se envió correctamente, false en caso contrario
 */
const sendQRByEmail = async (to, name, qrCodePath, type = 'estudiante') => {
  try {
    // Convertir la imagen QR a base64
    const fs = require('fs');
    const path = require('path');
    
    // Ruta absoluta al archivo QR
    const absolutePath = path.join(__dirname, '..', 'public', qrCodePath.replace(/^\//, ''));
    
    // Verificar que el archivo existe
    if (!fs.existsSync(absolutePath)) {
      console.error(`El archivo QR no existe en la ruta: ${absolutePath}`);
      return false;
    }
    
    // Leer el archivo y convertirlo a base64
    const qrImage = fs.readFileSync(absolutePath);
    const qrBase64 = `data:image/png;base64,${qrImage.toString('base64')}`;
    
    // Determinar el asunto y contenido del correo según el tipo
    let subject, content;
    
    if (type === 'empleado') {
      subject = 'Tu código QR de acceso - Control de Asistencia';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px 5px 0 0; border-bottom: 3px solid #ffc107; margin-bottom: 20px;">
            <h2 style="color: #343a40; text-align: center; margin: 0;">Sistema de Control de Asistencia</h2>
          </div>
          
          <p style="color: #495057; line-height: 1.6;">Estimado/a <strong>${name}</strong>,</p>
          
          <p style="color: #495057; line-height: 1.6;">Te damos la bienvenida a nuestro sistema de control de asistencia. A continuación, encontrarás tu código QR personal que deberás utilizar para registrar tus entradas y salidas.</p>
          
          <div style="text-align: center; margin: 30px 0; background-color: #ffffff; padding: 20px; border-radius: 5px; border: 1px solid #e9ecef;">
            <img src="cid:qrCode" alt="Código QR" style="max-width: 250px; border: 1px solid #eee; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
            <p style="margin-top: 15px; font-weight: bold; color: #495057;">Tu código QR personal</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin-top: 0; color: #495057;"><strong>Instrucciones:</strong></p>
            <ul style="color: #495057; padding-left: 20px;">
              <li>Guarda este código QR en tu dispositivo móvil o imprímelo</li>
              <li>Muestra tu QR al lector al llegar y al salir de la institución</li>
              <li>El sistema registrará automáticamente tu hora de entrada y salida</li>
              <li>Puedes consultar tu historial de asistencia en el sistema</li>
            </ul>
          </div>
          
          <p style="color: #495057; line-height: 1.6;">Si tienes alguna pregunta o problema con tu código QR, por favor contacta al departamento de Recursos Humanos.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="font-size: 12px; color: #6c757d;">
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      `;
    } else {
      subject = 'Tu código QR de acceso - Universidad';
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px 5px 0 0; border-bottom: 3px solid #007bff; margin-bottom: 20px;">
            <h2 style="color: #343a40; text-align: center; margin: 0;">Sistema de Control de Estudio</h2>
          </div>
          
          <p style="color: #495057; line-height: 1.6;">Estimado/a <strong>${name}</strong>,</p>
          
          <p style="color: #495057; line-height: 1.6;">Te damos la bienvenida a nuestra institución. A continuación, encontrarás tu código QR personal que te servirá para acceder a nuestras instalaciones y servicios.</p>
          
          <div style="text-align: center; margin: 30px 0; background-color: #ffffff; padding: 20px; border-radius: 5px; border: 1px solid #e9ecef;">
            <img src="cid:qrCode" alt="Código QR" style="max-width: 250px; border: 1px solid #eee; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
            <p style="margin-top: 15px; font-weight: bold; color: #495057;">Tu código QR personal</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin-top: 0; color: #495057;"><strong>Instrucciones:</strong></p>
            <ul style="color: #495057; padding-left: 20px;">
              <li>Guarda este código QR en tu dispositivo móvil o imprímelo</li>
              <li>Preséntalo al ingresar a las instalaciones universitarias</li>
              <li>Utilízalo para acceder a la biblioteca, laboratorios y otros servicios</li>
            </ul>
          </div>
          
          <p style="color: #495057; line-height: 1.6;">Si tienes alguna pregunta, no dudes en contactar a la oficina de Control de Estudio.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="font-size: 12px; color: #6c757d;">
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      `;
    }
    
    // Enviar el correo
    const mailOptions = {
      from: 'web@maxempleos.com',
      to: to,
      subject: subject,
      html: content,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrBase64.split('base64,')[1],
          encoding: 'base64',
          cid: 'qrCode'
        }
      ]
    };
    
    // Usar la función de envío de correo existente
    return await sendQREmail(to, name, qrBase64);
    
  } catch (error) {
    console.error('Error al enviar el código QR por correo:', error);
    return false;
  }
};

module.exports = {
  sendQRByEmail
};
