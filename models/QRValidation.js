const mongoose = require('mongoose');

const QRValidationSchema = new mongoose.Schema({
  // Campos de validación
  inscripcion: {
    type: Boolean,
    default: true
  },
  primeraCuota: {
    type: Boolean,
    default: true
  },
  segundaCuota: {
    type: Boolean,
    default: true
  },
  terceraCuota: {
    type: Boolean,
    default: true
  },
  // Metadatos
  ultimaActualizacion: {
    type: Date,
    default: Date.now
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const QRValidation = mongoose.model('QRValidation', QRValidationSchema);

module.exports = QRValidation; 