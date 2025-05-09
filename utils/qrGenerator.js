const QRCode = require('qrcode');

/**
 * Genera un código QR a partir de los datos del estudiante
 * @param {Object} student - Objeto con los datos del estudiante
 * @returns {Promise<string>} - Retorna una promesa con la imagen del QR en formato base64
 */
const generateStudentQR = async (student) => {
  try {
    console.log('Datos del estudiante para QR:', JSON.stringify(student));
    
    // Creamos un objeto con la información relevante del estudiante
    const studentData = {
      id: student._id ? (typeof student._id === 'object' ? student._id.toString() : student._id) : 'sin-id',
      cedula: student.cedula || 'sin-cedula',
      nombres: student.nombres || 'sin-nombre',
      apellidos: student.apellidos || 'sin-apellido',
      carrera: student.carrera || 'sin-carrera',
      tipoEstudiante: student.tipoEstudiante || 'Particulado',
      tipoBeca: student.tipoBeca || 'No Aplica',
      timestamp: new Date().toISOString()
    };

    // Convertimos el objeto a JSON string
    const dataString = JSON.stringify(studentData);
    
    // Generamos el código QR como una imagen en base64
    const qrImage = await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return qrImage;
  } catch (error) {
    console.error('Error al generar el código QR:', error);
    throw error;
  }
};

module.exports = {
  generateStudentQR
};
