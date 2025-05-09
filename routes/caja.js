const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAuthenticated, isCaja } = require('../middleware/auth');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const QRValidation = require('../models/QRValidation');

// Ruta principal para el panel de caja
router.get('/', isAuthenticated, isCaja, async (req, res) => {
  try {
    // Obtener solo los estudiantes particulados y activos
    const students = await Student.find({ 
      estado: 'Activo',
      tipoEstudiante: 'Particulado' // Filtrar solo estudiantes particulados
    }).sort({ apellidos: 1, nombres: 1 });
    
    // Para cada estudiante, verificar su estado de pago
    const studentsWithPaymentStatus = await Promise.all(students.map(async (student) => {
      // Buscar el último pago del estudiante
      const lastPayment = await Payment.findOne(
        { estudiante: student._id },
        {},
        { sort: { fechaPago: -1 } }
      );
      
      let paymentStatus = 'pendiente';
      let ultimoPago = null;
      let proximoPago = null;
      
      if (lastPayment) {
        ultimoPago = lastPayment.fechaPago;
        proximoPago = lastPayment.fechaProximoPago;
        
        // Verificar si la fecha del próximo pago ya pasó
        const fechaActual = new Date();
        if (fechaActual > lastPayment.fechaProximoPago) {
          paymentStatus = 'vencido';
        } else {
          paymentStatus = 'al_dia';
        }
      }
      
      return {
        _id: student._id,
        cedula: student.cedula,
        nombres: student.nombres,
        apellidos: student.apellidos,
        email: student.email,
        carrera: student.carrera,
        tipoEstudiante: student.tipoEstudiante,
        tipoBeca: student.tipoBeca,
        inscripcion: student.inscripcion || false,
        primeraCuota: student.primeraCuota || false,
        segundaCuota: student.segundaCuota || false,
        terceraCuota: student.terceraCuota || false,
        ultimoPago: ultimoPago,
        proximoPago: proximoPago,
        estadoPago: paymentStatus
      };
    }));
    
    // Contar estudiantes por estado de pago
    const estadisticas = {
      total: studentsWithPaymentStatus.length,
      alDia: studentsWithPaymentStatus.filter(s => s.estadoPago === 'al_dia').length,
      pendientes: studentsWithPaymentStatus.filter(s => s.estadoPago === 'pendiente').length,
      vencidos: studentsWithPaymentStatus.filter(s => s.estadoPago === 'vencido').length
    };
    
    res.render('caja/index', {
      user: req.session.user,
      students: studentsWithPaymentStatus,
      estadisticas
    });
  } catch (err) {
    console.error('Error al cargar los datos:', err);
    req.flash('error_msg', 'Error al cargar los datos de estudiantes');
    res.redirect('/dashboard');
  }
});

// Ruta para registrar un nuevo pago
router.post('/registrar-pago', isAuthenticated, isCaja, async (req, res) => {
  try {
    const {
      estudiante,
      monto,
      fechaPago,
      fechaProximoPago,
      concepto,
      metodoPago,
      referencia,
      notas
    } = req.body;
    
    // Crear el nuevo pago
    const newPayment = new Payment({
      estudiante,
      monto,
      fechaPago: new Date(fechaPago),
      fechaProximoPago: new Date(fechaProximoPago),
      concepto,
      metodoPago,
      referencia,
      notas,
      registradoPor: req.session.user._id
    });
    
    await newPayment.save();
    
    req.flash('success_msg', 'Pago registrado exitosamente');
    res.redirect('/caja');
  } catch (err) {
    console.error('Error al registrar el pago:', err);
    req.flash('error_msg', 'Error al registrar el pago: ' + err.message);
    res.redirect('/caja');
  }
});

// Ruta para ver el historial de pagos de un estudiante
router.get('/historial/:id', isAuthenticated, isCaja, async (req, res) => {
  try {
    const estudiante = await Student.findById(req.params.id);
    if (!estudiante) {
      req.flash('error_msg', 'Estudiante no encontrado');
      return res.redirect('/caja');
    }
    
    // Obtener todos los pagos del estudiante
    const pagos = await Payment.find({ estudiante: req.params.id }).sort({ fechaPago: -1 });
    
    res.render('caja/historial', {
      user: req.session.user,
      estudiante,
      pagos
    });
  } catch (err) {
    console.error('Error al cargar el historial:', err);
    req.flash('error_msg', 'Error al cargar el historial de pagos');
    res.redirect('/caja');
  }
});

// Ruta para buscar estudiantes
router.get('/buscar', isAuthenticated, isCaja, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.json({ students: [] });
    }
    
    // Buscar estudiantes particulados por cédula, nombres o apellidos
    const students = await Student.find({
      tipoEstudiante: 'Particulado', // Solo estudiantes particulados
      $or: [
        { cedula: { $regex: query, $options: 'i' } },
        { nombres: { $regex: query, $options: 'i' } },
        { apellidos: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    
    // Para cada estudiante, verificar su estado de pago
    const studentsWithPaymentStatus = await Promise.all(students.map(async (student) => {
      const lastPayment = await Payment.findOne(
        { estudiante: student._id },
        {},
        { sort: { fechaPago: -1 } }
      );
      
      let paymentStatus = 'pendiente';
      let ultimoPago = null;
      let proximoPago = null;
      
      if (lastPayment) {
        ultimoPago = lastPayment.fechaPago;
        proximoPago = lastPayment.fechaProximoPago;
        
        const fechaActual = new Date();
        if (fechaActual > lastPayment.fechaProximoPago) {
          paymentStatus = 'vencido';
        } else {
          paymentStatus = 'al_dia';
        }
      }
      
      return {
        _id: student._id,
        cedula: student.cedula,
        nombres: student.nombres,
        apellidos: student.apellidos,
        inscripcion: student.inscripcion || false,
        primeraCuota: student.primeraCuota || false,
        segundaCuota: student.segundaCuota || false,
        terceraCuota: student.terceraCuota || false,
        ultimoPago: ultimoPago,
        proximoPago: proximoPago,
        estadoPago: paymentStatus
      };
    }));
    
    res.json({ students: studentsWithPaymentStatus });
  } catch (err) {
    console.error('Error en la búsqueda:', err);
    res.status(500).json({ error: 'Error al buscar estudiantes' });
  }
});

// Ruta para filtrar estudiantes por estado de pago
router.get('/filtrar', isAuthenticated, isCaja, async (req, res) => {
  try {
    const { estado } = req.query;
    
    // Obtener todos los estudiantes particulados activos
    const students = await Student.find({ 
      estado: 'Activo',
      tipoEstudiante: 'Particulado' // Solo estudiantes particulados
    }).sort({ apellidos: 1, nombres: 1 });
    
    // Para cada estudiante, verificar su estado de pago
    const studentsWithPaymentStatus = await Promise.all(students.map(async (student) => {
      const lastPayment = await Payment.findOne(
        { estudiante: student._id },
        {},
        { sort: { fechaPago: -1 } }
      );
      
      let paymentStatus = 'pendiente';
      let ultimoPago = null;
      let proximoPago = null;
      
      if (lastPayment) {
        ultimoPago = lastPayment.fechaPago;
        proximoPago = lastPayment.fechaProximoPago;
        
        const fechaActual = new Date();
        if (fechaActual > lastPayment.fechaProximoPago) {
          paymentStatus = 'vencido';
        } else {
          paymentStatus = 'al_dia';
        }
      }
      
      return {
        _id: student._id,
        cedula: student.cedula,
        nombres: student.nombres,
        apellidos: student.apellidos,
        inscripcion: student.inscripcion || false,
        primeraCuota: student.primeraCuota || false,
        segundaCuota: student.segundaCuota || false,
        terceraCuota: student.terceraCuota || false,
        ultimoPago: ultimoPago,
        proximoPago: proximoPago,
        estadoPago: paymentStatus
      };
    }));
    
    // Filtrar por estado si se especifica
    let filteredStudents = studentsWithPaymentStatus;
    if (estado && estado !== 'all') {
      filteredStudents = studentsWithPaymentStatus.filter(s => s.estadoPago === estado);
    }
    
    res.json({ students: filteredStudents });
  } catch (err) {
    console.error('Error al filtrar:', err);
    res.status(500).json({ error: 'Error al filtrar estudiantes' });
  }
});

// Ruta para actualizar estados de pago
router.post('/actualizar-estados', isAuthenticated, isCaja, async (req, res) => {
  try {
    const estudiante = req.body.estudiante;
    
    // Valores predeterminados para los estados (si no se marcan, son false)
    const updateData = {
      inscripcion: req.body.inscripcion === 'on',
      primeraCuota: req.body.primeraCuota === 'on',
      segundaCuota: req.body.segundaCuota === 'on', 
      terceraCuota: req.body.terceraCuota === 'on'
    };
    
    // Actualizar el estudiante
    const studentUpdated = await Student.findByIdAndUpdate(
      estudiante, 
      updateData, 
      { new: true }
    );
    
    if (!studentUpdated) {
      req.flash('error_msg', 'No se encontró el estudiante');
      return res.redirect('/caja');
    }
    
    req.flash('success_msg', 'Estados de pago actualizados correctamente');
    return res.redirect('/caja');
  } catch (err) {
    console.error('Error al actualizar estados:', err);
    req.flash('error_msg', 'Error al actualizar los estados de pago: ' + err.message);
    return res.redirect('/caja');
  }
});

// Ruta para obtener estados actuales de un estudiante
router.get('/obtener-estados/:id', isAuthenticated, isCaja, async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de estudiante inválido' });
    }
    
    const estudiante = await Student.findById(id);
    
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    // Devolver solo los estados de pago
    return res.json({
      inscripcion: estudiante.inscripcion || false,
      primeraCuota: estudiante.primeraCuota || false,
      segundaCuota: estudiante.segundaCuota || false,
      terceraCuota: estudiante.terceraCuota || false
    });
  } catch (err) {
    console.error('Error al obtener estados:', err);
    return res.status(500).json({ error: 'Error al obtener los estados de pago' });
  }
});

// Ruta para la página de validaciones QR
router.get('/validaciones-qr', isAuthenticated, isCaja, (req, res) => {
  QRValidation.findOne()
    .then(validaciones => {
      if (!validaciones) {
        validaciones = new QRValidation({
          inscripcion: true,
          primeraCuota: true,
          segundaCuota: true,
          terceraCuota: true,
          ultimaActualizacion: new Date(),
          actualizadoPor: req.session.user._id
        });
        return validaciones.save();
      }
      return validaciones;
    })
    .then(validaciones => {
      res.render('caja/validaciones-qr', {
        user: req.session.user,
        validaciones
      });
    })
    .catch(err => {
      console.error('Error al cargar validaciones QR:', err);
      req.flash('error_msg', 'Error al cargar la configuración de validaciones QR');
      res.redirect('/dashboard');
    });
});

// Ruta para actualizar validaciones QR
router.post('/actualizar-validaciones-qr', isAuthenticated, isCaja, (req, res) => {
  const inscripcion = req.body.validarInscripcion === 'on';
  const primeraCuota = req.body.validarPrimeraCuota === 'on';
  const segundaCuota = req.body.validarSegundaCuota === 'on';
  const terceraCuota = req.body.validarTerceraCuota === 'on';
  
  QRValidation.findOne()
    .then(validaciones => {
      if (validaciones) {
        validaciones.inscripcion = inscripcion;
        validaciones.primeraCuota = primeraCuota;
        validaciones.segundaCuota = segundaCuota;
        validaciones.terceraCuota = terceraCuota;
        validaciones.ultimaActualizacion = new Date();
        validaciones.actualizadoPor = req.session.user._id;
      } else {
        validaciones = new QRValidation({
          inscripcion,
          primeraCuota,
          segundaCuota,
          terceraCuota,
          ultimaActualizacion: new Date(),
          actualizadoPor: req.session.user._id
        });
      }
      return validaciones.save();
    })
    .then(() => {
      req.flash('success_msg', 'Configuración de validaciones QR actualizada correctamente');
      res.redirect('/caja/validaciones-qr');
    })
    .catch(err => {
      console.error('Error al actualizar validaciones QR:', err);
      req.flash('error_msg', 'Error al actualizar la configuración de validaciones QR');
      res.redirect('/caja/validaciones-qr');
    });
});

// Ruta para reiniciar todos los estados de pago a false
router.post('/reiniciar-estados', async (req, res) => {
  try {
    // Actualizar todos los estudiantes particulados para establecer los estados de pago a false
    const resultado = await Student.updateMany(
      { tipoEstudiante: 'Particulado' }, // Solo estudiantes particulados
      {
        $set: {
          inscripcion: false,
          primeraCuota: false,
          segundaCuota: false,
          terceraCuota: false
        }
      }
    );
    
    console.log(`Reinicio de estados completado. ${resultado.modifiedCount} estudiantes particulados actualizados.`);
    req.flash('success_msg', `Estados de pago reiniciados correctamente. ${resultado.modifiedCount} estudiantes particulados actualizados.`);
    res.redirect('/caja');
  } catch (err) {
    console.error('Error al reiniciar estados de pago:', err);
    req.flash('error_msg', 'Error al reiniciar los estados de pago');
    res.redirect('/caja');
  }
});

module.exports = router;
