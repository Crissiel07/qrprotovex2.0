const express = require('express');
const router = express.Router();
const { isAuthenticated, isControlEstudio } = require('../middleware/auth');
const Student = require('../models/Student');

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
    const {
      cedula,
      nombres,
      apellidos,
      email,
      carrera,
      estado
    } = req.body;

    // Verificar si ya existe un estudiante con la misma cédula
    const existingStudent = await Student.findOne({ cedula });
    if (existingStudent) {
      req.flash('error_msg', 'Ya existe un estudiante registrado con esta cédula');
      return res.redirect('/control-estudio/estudiantes');
    }

    // Crear nuevo estudiante
    const newStudent = new Student({
      cedula,
      nombres,
      apellidos,
      email,
      carrera,
      estado
    });

    await newStudent.save();
    req.flash('success_msg', `Estudiante ${nombres} ${apellidos} registrado exitosamente`);
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
      estado
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

    // Actualizar estudiante
    await Student.findByIdAndUpdate(req.params.id, {
      cedula,
      nombres,
      apellidos,
      email,
      carrera,
      estado
    });

    req.flash('success_msg', `Estudiante ${nombres} ${apellidos} actualizado exitosamente`);
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

module.exports = router;
