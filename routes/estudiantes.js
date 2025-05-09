const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAuthenticated, isControlEstudio } = require('../middleware/auth');
const Student = require('../models/Student');
const FormData = require('../models/FormData');
const { generateStudentQR } = require('../utils/qrGenerator');
const { sendQREmail } = require('../config/mail');

// Ruta para mostrar la página de gestión de estudiantes
router.get('/', isAuthenticated, isControlEstudio, async (req, res) => {
  try {
    const students = await Student.find().sort({ apellidos: 1, nombres: 1 });
    res.render('control-estudio/estudiantes/index', {
      user: req.session.user,
      students
    });
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al cargar los estudiantes. Por favor, inténtelo de nuevo.');
    res.redirect('/control-estudio');
  }
});

// Ruta para crear un nuevo estudiante
router.post('/create', isAuthenticated, isControlEstudio, async (req, res) => {
  try {
    // Log para depuración - ver todo el body del request
    console.log('BODY COMPLETO:', req.body);
    
    // Extraer todos los campos del formulario
    const {
      cedula,
      nombres,
      apellidos,
      email,
      carrera,
      estado,
      tipoEstudiante,
      tipoBeca,
      inscripcion,
      primeraCuota,
      segundaCuota,
      terceraCuota
    } = req.body;
    
    // Log para depuración - ver los valores de los campos de pago
    console.log('VALORES DE PAGO:', { 
      inscripcion, 
      primeraCuota, 
      segundaCuota, 
      terceraCuota,
      tipoEstudiante
    });

    // Verificar si ya existe un estudiante con la misma cédula
    const existingStudent = await Student.findOne({ cedula });
    if (existingStudent) {
      req.flash('error_msg', 'Ya existe un estudiante registrado con esta cédula');
      return res.redirect('/control-estudio/estudiantes');
    }

    // Crear un objeto básico con solo los campos necesarios
    const studentData = {
      cedula,
      nombres,
      apellidos,
      email,
      carrera,
      estado: estado || 'Activo',
      tipoEstudiante: tipoEstudiante || 'Particulado',
      tipoBeca: tipoEstudiante === 'Becado' ? tipoBeca : 'No Aplica',
      fechaRegistro: new Date()
    };
    
    // Añadir estados de pago para estudiantes particulados
    if (tipoEstudiante === 'Particulado') {
      // Procesar los campos de estados de pago del formulario directamente
      studentData.inscripcion = req.body.inscripcion === 'true';
      studentData.primeraCuota = req.body.primeraCuota === 'true';
      studentData.segundaCuota = req.body.segundaCuota === 'true';
      studentData.terceraCuota = req.body.terceraCuota === 'true';
      
      // Log para depuración
      console.log('ESTADOS DE PAGO DEL FORMULARIO:', req.body.inscripcion, req.body.primeraCuota);
      console.log('ESTADOS DE PAGO A GUARDAR:', {
        inscripcion: studentData.inscripcion,
        primeraCuota: studentData.primeraCuota,
        segundaCuota: studentData.segundaCuota,
        terceraCuota: studentData.terceraCuota
      });
    }

    // Log para depuración - ver el objeto studentData antes de guardarlo
    console.log('STUDENT DATA ANTES DE GUARDAR:', studentData);
    
    // Crear y guardar el estudiante usando el modelo de Mongoose
    const newStudent = new Student(studentData);
    await newStudent.save();
    
    // Log para depuración - ver el objeto guardado
    console.log('ESTUDIANTE GUARDADO:', newStudent);
    
    const result = { insertedId: newStudent._id };
    
    // Obtener el ID del estudiante insertado
    const studentId = result.insertedId;
    
    // Guardar los datos del formulario en la colección FormData
    const formDataObj = {
      formType: 'estudiante',
      estudiante: studentId,
      formData: req.body, // Guardamos todos los datos del formulario
      status: 'completado',
      notes: `Formulario de registro de estudiante ${nombres} ${apellidos}`
    };
    
    // Agregar createdBy solo si existe el usuario en la sesión
    if (req.session && req.session.user && req.session.user._id) {
      formDataObj.createdBy = req.session.user._id;
    }
    
    const formData = new FormData(formDataObj);
    await formData.save();
    
    try {
      // Generar código QR
      const qrCodeImage = await generateStudentQR(studentData);
      
      // Actualizar el estudiante con la URL del código QR
      await mongoose.connection.collection('students').updateOne(
        { _id: studentId },
        { $set: { qrCode: qrCodeImage } }
      );
      
      // Enviar correo electrónico con el código QR
      const emailSent = await sendQREmail(
        email, 
        `${nombres} ${apellidos}`, 
        qrCodeImage
      );
      
      if (emailSent) {
        await mongoose.connection.collection('students').updateOne(
          { _id: studentId },
          { $set: { qrSent: true } }
        );
        req.flash('success_msg', `Estudiante ${nombres} ${apellidos} registrado exitosamente y código QR enviado por correo`);
      } else {
        req.flash('success_msg', `Estudiante ${nombres} ${apellidos} registrado exitosamente, pero hubo un problema al enviar el código QR`);
      }
    } catch (error) {
      console.error('Error al generar o enviar el QR:', error);
      req.flash('success_msg', `Estudiante ${nombres} ${apellidos} registrado exitosamente, pero hubo un problema con el código QR`);
    }
    
    res.redirect('/control-estudio/estudiantes');
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al registrar el estudiante: ' + err.message);
    res.redirect('/control-estudio/estudiantes');
  }
});

// Ruta para ver detalles de un estudiante
router.get('/view/:id', isAuthenticated, isControlEstudio, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      req.flash('error_msg', 'Estudiante no encontrado');
      return res.redirect('/control-estudio/estudiantes');
    }
    
    res.render('control-estudio/estudiantes/view', {
      user: req.session.user,
      student
    });
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al cargar los datos del estudiante');
    res.redirect('/control-estudio/estudiantes');
  }
});

// Ruta para mostrar el formulario de edición de un estudiante
router.get('/edit/:id', isAuthenticated, isControlEstudio, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      req.flash('error_msg', 'Estudiante no encontrado');
      return res.redirect('/control-estudio/estudiantes');
    }
    
    res.render('control-estudio/estudiantes/edit', {
      user: req.session.user,
      student
    });
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al cargar los datos del estudiante');
    res.redirect('/control-estudio/estudiantes');
  }
});

// Ruta para actualizar un estudiante
router.post('/update/:id', isAuthenticated, isControlEstudio, async (req, res) => {
  try {
    const {
      cedula,
      nombres,
      apellidos,
      email,
      carrera,
      estado,
      tipoEstudiante,
      tipoBeca,
      inscripcion,
      primeraCuota,
      segundaCuota,
      terceraCuota
    } = req.body;

    // Verificar si ya existe otro estudiante con la misma cédula
    const existingStudent = await Student.findOne({ 
      cedula, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingStudent) {
      req.flash('error_msg', 'Ya existe otro estudiante registrado con esta cédula');
      return res.redirect(`/control-estudio/estudiantes/edit/${req.params.id}`);
    }

    // Crear un objeto con los datos actualizados
    const studentData = {
      cedula,
      nombres,
      apellidos,
      email,
      carrera,
      estado: estado || 'Activo',
      tipoEstudiante: tipoEstudiante || 'Particulado',
      tipoBeca: tipoEstudiante === 'Becado' ? tipoBeca : 'No Aplica',
      updatedAt: new Date()
    };
    
    // Obtener el estudiante actual para verificar si se cambió el tipo de estudiante
    const currentStudent = await Student.findById(req.params.id);
    
    // Si el estudiante es o se convierte en particulado, asegurarse de que tenga los estados de pago
    if (tipoEstudiante === 'Particulado') {
      // Procesar los campos de estados de pago del formulario directamente
      studentData.inscripcion = req.body.inscripcion === 'true';
      studentData.primeraCuota = req.body.primeraCuota === 'true';
      studentData.segundaCuota = req.body.segundaCuota === 'true';
      studentData.terceraCuota = req.body.terceraCuota === 'true';
      
      // Log para depuración
      console.log('ESTADOS DE PAGO DEL FORMULARIO EN UPDATE:', req.body.inscripcion, req.body.primeraCuota);
      console.log('ESTADOS DE PAGO A GUARDAR EN UPDATE:', {
        inscripcion: studentData.inscripcion,
        primeraCuota: studentData.primeraCuota,
        segundaCuota: studentData.segundaCuota,
        terceraCuota: studentData.terceraCuota
      });
    }

    // Actualizar el estudiante usando el modelo de Mongoose
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: studentData },
      { new: true, runValidators: true }
    );

    // Guardar los datos del formulario de actualización en la colección FormData
    const formDataObj = {
      formType: 'estudiante',
      estudiante: updatedStudent._id,
      formData: req.body, // Guardamos todos los datos del formulario
      status: 'completado',
      notes: `Actualización de datos del estudiante ${nombres} ${apellidos}`
    };
    
    // Agregar createdBy solo si existe el usuario en la sesión
    if (req.session && req.session.user && req.session.user._id) {
      formDataObj.createdBy = req.session.user._id;
    }
    
    const formData = new FormData(formDataObj);
    await formData.save();

    try {
      // Generar código QR
      const qrCodeImage = await generateStudentQR(updatedStudent);
      
      // Actualizar el estudiante con la URL del código QR
      await mongoose.connection.collection('students').updateOne(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { $set: { qrCode: qrCodeImage } }
      );
      
      // Enviar correo electrónico con el código QR
      const emailSent = await sendQREmail(
        email, 
        `${nombres} ${apellidos}`, 
        qrCodeImage
      );
      
      if (emailSent) {
        await mongoose.connection.collection('students').updateOne(
          { _id: new mongoose.Types.ObjectId(req.params.id) },
          { $set: { qrSent: true } }
        );
        req.flash('success_msg', `Estudiante ${nombres} ${apellidos} actualizado exitosamente y código QR enviado por correo`);
      } else {
        req.flash('success_msg', `Estudiante ${nombres} ${apellidos} actualizado exitosamente, pero hubo un problema al enviar el código QR`);
      }
    } catch (error) {
      console.error('Error al generar o enviar el QR:', error);
      req.flash('success_msg', `Estudiante ${nombres} ${apellidos} actualizado exitosamente, pero hubo un problema con el código QR`);
    }

    res.redirect('/control-estudio/estudiantes');
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al actualizar el estudiante: ' + err.message);
    res.redirect('/control-estudio/estudiantes');
  }
});

// Ruta para eliminar un estudiante
router.get('/delete/:id', isAuthenticated, isControlEstudio, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      req.flash('error_msg', 'Estudiante no encontrado');
      return res.redirect('/control-estudio/estudiantes');
    }
    
    await Student.findByIdAndDelete(req.params.id);
    req.flash('success_msg', `Estudiante ${student.nombres} ${student.apellidos} eliminado exitosamente`);
    res.redirect('/control-estudio/estudiantes');
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al eliminar el estudiante');
    res.redirect('/control-estudio/estudiantes');
  }
});

// Ruta para reenviar el código QR por correo electrónico
router.get('/resend-qr/:id', isAuthenticated, isControlEstudio, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      req.flash('error_msg', 'Estudiante no encontrado');
      return res.redirect('/control-estudio/estudiantes');
    }
    
    // Si el estudiante ya tiene un código QR, lo reenviamos
    if (student.qrCode) {
      const emailSent = await sendQREmail(
        student.email, 
        `${student.nombres} ${student.apellidos}`, 
        student.qrCode
      );
      
      if (emailSent) {
        student.qrSent = true;
        await student.save();
        req.flash('success_msg', `Código QR reenviado exitosamente a ${student.email}`);
      } else {
        req.flash('error_msg', `Error al reenviar el código QR a ${student.email}`);
      }
    } else {
      // Si el estudiante no tiene un código QR, lo generamos y enviamos
      try {
        const qrCodeImage = await generateStudentQR(student);
        
        // Actualizar el estudiante con la URL del código QR
        student.qrCode = qrCodeImage;
        await student.save();
        
        // Enviar correo electrónico con el código QR
        const emailSent = await sendQREmail(
          student.email, 
          `${student.nombres} ${student.apellidos}`, 
          qrCodeImage
        );
        
        if (emailSent) {
          student.qrSent = true;
          await student.save();
          req.flash('success_msg', `Código QR generado y enviado exitosamente a ${student.email}`);
        } else {
          req.flash('error_msg', `Error al enviar el código QR a ${student.email}`);
        }
      } catch (error) {
        console.error('Error al generar o enviar el QR:', error);
        req.flash('error_msg', `Error al generar el código QR para ${student.nombres} ${student.apellidos}`);
      }
    }
    
    // Redirigir a la página de detalles del estudiante
    res.redirect(`/control-estudio/estudiantes/view/${student._id}`);
  } catch (err) {
    console.error('Error al reenviar el QR:', err);
    req.flash('error_msg', 'Error al procesar la solicitud');
    res.redirect('/control-estudio/estudiantes');
  }
});

module.exports = router;
