const mongoose = require('mongoose');

// Esquema simplificado para estudiantes sin validaciones estrictas
const StudentSchema = new mongoose.Schema({
  // Campos básicos
  cedula: String,
  nombres: String,
  apellidos: String,
  email: String,
  carrera: String,
  tipoEstudiante: {
    type: String,
    enum: ['Particulado', 'Becado'],
    default: 'Particulado'
  },

  // Tipo de beca
  tipoBeca: {
    type: String,
    enum: ['Beca Gel', 'Simon Rodriguez', 'No Aplica'],
    default: 'No Aplica'
  },

  // Estado del estudiante
  estado: {
    type: String,
    enum: ['Activo', 'Inactivo', 'Egresado', 'Retirado'],
    default: 'Activo'
  },
  
  // Estados de pago como campos individuales
  inscripcion: {
    type: Boolean,
    default: false
  },
  primeraCuota: {
    type: Boolean,
    default: false
  },
  segundaCuota: {
    type: Boolean,
    default: false
  },
  terceraCuota: {
    type: Boolean,
    default: false
  },
  
  // Campos para el código QR
  qrCode: String,
  qrSent: {
    type: Boolean,
    default: false
  },
  
  // Metadatos
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  
  // Campos adicionales (todos opcionales)
  fechaNacimiento: Date,
  genero: String,
  direccion: String,
  telefono: String,
  semestre: String,
  
  // Información del representante (opcional)
  representante: {
    nombre: String,
    cedula: String,
    telefono: String,
    parentesco: String
  }
});

const Student = mongoose.model('Student', StudentSchema);

module.exports = Student;
