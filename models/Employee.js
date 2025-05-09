const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  // Datos básicos
  cedula: {
    type: String,
    required: true,
    unique: true
  },
  nombres: {
    type: String,
    required: true
  },
  apellidos: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  cargo: {
    type: String,
    default: 'Profesor'
  },
  departamento: {
    type: String,
    default: 'Académico'
  },
  
  // Estado del empleado
  estado: {
    type: String,
    enum: ['Activo', 'Inactivo', 'Suspendido', 'Retirado'],
    default: 'Activo'
  },
  
  // Tipo de contrato
  tipoContrato: {
    type: String,
    enum: ['Tiempo Completo', 'Medio Tiempo', 'Por Horas', 'Temporal'],
    default: 'Por Horas'
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
  fechaContratacion: Date,
  
  // Campos adicionales (todos opcionales)
  fechaNacimiento: Date,
  genero: String,
  direccion: String,
  telefono: String,
  
  // Información bancaria (opcional)
  banco: String,
  tipoCuenta: String,
  numeroCuenta: String,
  
  // Contacto de emergencia (opcional)
  contactoEmergencia: {
    nombre: String,
    telefono: String,
    parentesco: String
  }
});

const Employee = mongoose.model('Employee', EmployeeSchema);

module.exports = Employee;
