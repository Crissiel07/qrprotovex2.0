const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  estudiante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  fechaPago: {
    type: Date,
    default: Date.now
  },
  fechaProximoPago: {
    type: Date,
    required: true
  },
  concepto: {
    type: String,
    required: true
  },
  metodoPago: {
    type: String,
    enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'],
    default: 'Efectivo'
  },
  estado: {
    type: String,
    enum: ['Pagado', 'Pendiente', 'Vencido'],
    default: 'Pagado'
  },
  referencia: String,
  notas: String,
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Método para verificar si un estudiante está al día con sus pagos
PaymentSchema.statics.verificarEstadoPago = async function(estudianteId) {
  const fechaActual = new Date();
  
  // Buscar el último pago del estudiante
  const ultimoPago = await this.findOne(
    { estudiante: estudianteId },
    {},
    { sort: { fechaPago: -1 } }
  );
  
  if (!ultimoPago) {
    return {
      estado: 'Pendiente',
      ultimoPago: null,
      proximoPago: null
    };
  }
  
  // Verificar si la fecha del próximo pago ya pasó
  const estado = fechaActual > ultimoPago.fechaProximoPago ? 'Vencido' : 'Al día';
  
  return {
    estado,
    ultimoPago: ultimoPago.fechaPago,
    proximoPago: ultimoPago.fechaProximoPago
  };
};

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
