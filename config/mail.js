const nodemailer = require('nodemailer');

// Configuración del transporte de correo con los datos SMTP proporcionados
const transporter = nodemailer.createTransport({
  host: 'mail.maxempleos.com',
  port: 465,
  secure: true, // true para puerto 465, false para otros puertos
  auth: {
    user: 'web@maxempleos.com',
    pass: 'Mx.89c4f0'
  }
});

// Función para enviar correo con QR
const sendQREmail = async (to, studentName, qrCodeImage) => {
  console.log(`Intentando enviar correo a: ${to} para el estudiante: ${studentName}`);
  
  // Validar que el correo electrónico sea válido
  if (!to || !to.includes('@')) {
    console.error('Correo electrónico inválido:', to);
    return false;
  }
  
  // Validar que tengamos una imagen QR válida
  if (!qrCodeImage || !qrCodeImage.includes('base64')) {
    console.error('Imagen QR inválida');
    return false;
  }
  
  try {
    // Extraer la parte base64 de la imagen
    const base64Data = qrCodeImage.split('base64,')[1];
    
    if (!base64Data) {
      console.error('No se pudo extraer los datos base64 de la imagen QR');
      return false;
    }
    
    const mailOptions = {
      from: 'web@maxempleos.com',
      to: to,
      subject: 'Tu código QR de acceso - Universidad',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #3498db; text-align: center;">Universidad - Sistema de Control de Estudio</h2>
          <p>Estimado/a <strong>${studentName}</strong>,</p>
          <p>Te damos la bienvenida a nuestra institución. A continuación, encontrarás tu código QR personal que te servirá para acceder a nuestras instalaciones y servicios.</p>
          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:qrCode" alt="Código QR" style="max-width: 250px; border: 1px solid #eee; padding: 10px;" />
          </div>
          <p>Instrucciones:</p>
          <ul>
            <li>Guarda este código QR en tu dispositivo móvil o imprímelo</li>
            <li>Preséntalo al ingresar a las instalaciones universitarias</li>
            <li>Utilízalo para acceder a la biblioteca, laboratorios y otros servicios</li>
          </ul>
          <p>Si tienes alguna pregunta, no dudes en contactar a la oficina de Control de Estudio.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrCode'
        }
      ]
    };

    console.log('Enviando correo con las siguientes opciones:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      attachments: mailOptions.attachments ? 'Adjuntos incluidos' : 'Sin adjuntos'
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente. ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error detallado al enviar correo:', error);
    if (error.code) {
      console.error('Código de error:', error.code);
    }
    if (error.response) {
      console.error('Respuesta del servidor:', error.response);
    }
    return false;
  }
};

module.exports = {
  sendQREmail
};
