const multer = require('multer');

// En Vercel (serverless) no hay sistema de archivos persistente.
// Usamos memoryStorage: la foto queda en req.file.buffer
// y la guardamos como base64 directamente en MongoDB.
const memoryStorage = multer.memoryStorage();

// Filtro para asegurar que solo se suban imágenes
const imageFilter = function(req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

// Configuración para subida de fotos de estudiantes
const uploadStudentPhoto = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  }
});

module.exports = {
  uploadStudentPhoto
};
