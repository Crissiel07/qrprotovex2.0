const mongoose = require('mongoose');

// Esquema para almacenar los datos de los formularios
const FormDataSchema = new mongoose.Schema({
  // Información básica del formulario
  formType: {
    type: String,
    required: true,
    enum: ['estudiante', 'pago', 'inscripcion', 'otro']
  },
  
  // Datos del estudiante relacionado (si aplica)
  estudiante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false
  },
  
  // Datos del formulario (estructura flexible para diferentes tipos de formularios)
  formData: {
    type: Object,
    required: true
  },
  
  // Metadatos
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Información de estado
  status: {
    type: String,
    enum: ['pendiente', 'procesado', 'rechazado', 'completado'],
    default: 'pendiente'
  },
  
  // Campos de auditoría
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Comentarios o notas adicionales
  notes: {
    type: String,
    required: false
  }
});

// Middleware para actualizar el campo updatedAt antes de cada actualización
FormDataSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const FormData = mongoose.model('FormData', FormDataSchema);

module.exports = FormData;
