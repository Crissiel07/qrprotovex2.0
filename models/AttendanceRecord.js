const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
  // Referencia al empleado
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // Fecha y hora de entrada
  entryTime: {
    type: Date,
    required: true
  },
  
  // Fecha y hora de salida (null si aún no ha salido)
  exitTime: {
    type: Date,
    default: null
  },
  
  // Estado del registro (entrada, salida, incompleto)
  status: {
    type: String,
    enum: ['entrada', 'salida', 'incompleto'],
    default: 'entrada'
  },
  
  // Horas trabajadas (calculado automáticamente al marcar salida)
  hoursWorked: {
    type: Number,
    default: 0
  },
  
  // Clasificación temporal
  week: Number,  // Número de semana del año
  month: Number, // Número de mes (1-12)
  year: Number,  // Año
  
  // Metadatos
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar la fecha de modificación
AttendanceRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Si se está marcando la salida, calcular las horas trabajadas
  if (this.exitTime && this.status === 'salida') {
    const entry = new Date(this.entryTime);
    const exit = new Date(this.exitTime);
    const diffMs = exit - entry;
    const diffHrs = diffMs / (1000 * 60 * 60);
    this.hoursWorked = parseFloat(diffHrs.toFixed(2));
  }
  
  next();
});

// Método estático para obtener registros por período
AttendanceRecordSchema.statics.getByPeriod = async function(employeeId, period, value) {
  const query = { employee: employeeId };
  
  if (period === 'week') {
    query.week = value;
    query.year = new Date().getFullYear();
  } else if (period === 'month') {
    query.month = value;
    query.year = new Date().getFullYear();
  } else if (period === 'year') {
    query.year = value;
  }
  
  return this.find(query).sort({ entryTime: -1 });
};

// Método estático para obtener estadísticas por período
AttendanceRecordSchema.statics.getStatsByPeriod = async function(employeeId, period, value) {
  const records = await this.getByPeriod(employeeId, period, value);
  
  let totalHours = 0;
  let completedDays = 0;
  let incompleteDays = 0;
  
  records.forEach(record => {
    if (record.status === 'salida') {
      totalHours += record.hoursWorked;
      completedDays++;
    } else {
      incompleteDays++;
    }
  });
  
  return {
    totalHours,
    completedDays,
    incompleteDays,
    totalDays: completedDays + incompleteDays
  };
};

const AttendanceRecord = mongoose.model('AttendanceRecord', AttendanceRecordSchema);

module.exports = AttendanceRecord;
