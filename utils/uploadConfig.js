const multer = require('multer');
<<<<<<< HEAD

// En Vercel (serverless) no hay sistema de archivos persistente.
// Usamos memoryStorage: la foto queda en req.file.buffer
// y la guardamos como base64 directamente en MongoDB.
const memoryStorage = multer.memoryStorage();

// Filtro para asegurar que solo se suban imágenes
const imageFilter = function(req, file, cb) {
=======
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuración para almacenamiento de fotos de estudiantes
const studentPhotoStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/estudiantes'));
  },
  filename: function(req, file, cb) {
    // Generar un nombre único para el archivo usando UUID y mantener la extensión original
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Filtro para asegurar que solo se suban imágenes
const imageFilter = function(req, file, cb) {
  // Aceptar solo imágenes
>>>>>>> 2a1ae6edcb98c01606fabda841d9aaf98efad93b
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

// Configuración para subida de fotos de estudiantes
const uploadStudentPhoto = multer({
<<<<<<< HEAD
  storage: memoryStorage,
=======
  storage: studentPhotoStorage,
>>>>>>> 2a1ae6edcb98c01606fabda841d9aaf98efad93b
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  }
});

module.exports = {
  uploadStudentPhoto
};
