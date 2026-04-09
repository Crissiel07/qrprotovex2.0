const mongoose = require('mongoose');

const PersonalAttendanceRecordSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  entryTime: {
    type: Date,
    required: true
  },
  exitTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['entrada', 'salida'],
    default: 'entrada'
  },
  hoursWorked: {
    type: Number,
    default: function() {
      if (this.exitTime && this.entryTime) {
        const diff = this.exitTime - this.entryTime;
        return parseFloat((diff / (1000 * 60 * 60)).toFixed(2)); // Convertir a horas con 2 decimales
      }
      return 0;
    }
  },
  week: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  comments: String
});

// Middleware para calcular las horas trabajadas antes de guardar
PersonalAttendanceRecordSchema.pre('save', function(next) {
  if (this.exitTime && this.entryTime) {
    const diff = this.exitTime - this.entryTime;
    this.hoursWorked = parseFloat((diff / (1000 * 60 * 60)).toFixed(2)); // Convertir a horas con 2 decimales
  }
  next();
});

const PersonalAttendanceRecord = mongoose.model('PersonalAttendanceRecord', PersonalAttendanceRecordSchema);

module.exports = PersonalAttendanceRecord;
