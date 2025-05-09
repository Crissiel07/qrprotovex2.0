const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { isAuthenticated, isAdmin, isRecursosHumanos, isCaja, isControlEstudio } = require('../middleware/auth');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const User = require('../models/User');
const FormData = require('../models/FormData');
const QRValidation = require('../models/QRValidation');

// Ruta para la página de inicio
router.get('/', (req, res) => {
  res.render('welcome');
});

// Ruta para el dashboard (protegida)
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', {
    user: req.session.user
  });
});

// Ruta para el panel de administración
router.get('/admin-panel', isAdmin, (req, res) => {
  res.render('admin/index', {
    user: req.session.user
  });
});

// Ruta para la gestión de usuarios
router.get('/admin-users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ date: -1 });
    res.render('admin/users/index', {
      user: req.session.user,
      users
    });
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al cargar los usuarios');
    res.redirect('/admin-panel');
  }
});

// Ruta para crear un nuevo usuario
router.post('/admin-users/create', isAdmin, async (req, res) => {
  const { name, username, email, password, password2, role } = req.body;
  let errors = [];

  // Validación
  if (!name || !username || !email || !password || !password2 || !role) {
    errors.push({ msg: 'Por favor complete todos los campos obligatorios' });
    
    // Identificar campos específicos que faltan para mensajes más detallados
    if (!name) errors.push({ msg: 'El nombre es obligatorio' });
    if (!username) errors.push({ msg: 'El nombre de usuario es obligatorio' });
    if (!email) errors.push({ msg: 'El correo electrónico es obligatorio' });
    if (!password) errors.push({ msg: 'La contraseña es obligatoria' });
    if (!password2) errors.push({ msg: 'Debe confirmar la contraseña' });
    if (!role) errors.push({ msg: 'Debe seleccionar un rol para el usuario' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Las contraseñas no coinciden' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (errors.length > 0) {
    // Usar flash para los errores
    errors.forEach(error => req.flash('error_msg', error.msg));
    
    try {
      const users = await User.find().sort({ date: -1 });
      return res.render('admin/users/index', {
        user: req.session.user,
        users
      });
    } catch (err) {
      req.flash('error_msg', 'Error al cargar los usuarios. Por favor, inténtelo de nuevo.');
      return res.redirect('/admin-panel');
    }
  } else {
    try {
      // Verificar si el usuario ya existe por email o nombre de usuario
      const emailExists = await User.findOne({ email });
      const usernameExists = await User.findOne({ username });
      
      if (emailExists) {
        req.flash('error_msg', 'El email ya está registrado');
        const users = await User.find().sort({ date: -1 });
        return res.render('admin/users/index', {
          user: req.session.user,
          users
        });
      } else if (usernameExists) {
        req.flash('error_msg', 'El nombre de usuario ya está registrado');
        const users = await User.find().sort({ date: -1 });
        return res.render('admin/users/index', {
          user: req.session.user,
          users
        });
      } else {
        try {
          // Crear nuevo usuario directamente sin usar el modelo
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          
          const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword,
            role,
            date: Date.now()
          });
          
          // Guardar usuario
          const savedUser = await newUser.save();
          req.flash('success_msg', 'Usuario creado exitosamente. El usuario ' + username + ' ha sido agregado al sistema.');
          return res.redirect('/admin-users');
        } catch (saveErr) {
          req.flash('error_msg', 'Error al guardar el usuario: ' + saveErr.message);
          return res.redirect('/admin-users');
        }
      }
    } catch (err) {
      req.flash('error_msg', 'Error en el servidor: ' + err.message);
      return res.redirect('/admin-users');
    }
  }
});

// Ruta para mostrar el formulario de edición de usuario
router.get('/admin-users/edit/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/admin-users');
    }
    
    res.render('admin/users/edit', {
      user: req.session.user,
      editUser: user
    });
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al cargar el usuario');
    res.redirect('/admin-users');
  }
});

// Ruta para actualizar un usuario
router.post('/admin-users/update/:id', isAdmin, async (req, res) => {
  const { name, username, email, role, password, password2 } = req.body;
  const User = require('../models/User');
  
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/admin-users');
    }
    
    // Actualizar campos básicos
    user.name = name;
    user.username = username;
    user.email = email;
    user.role = role;
    
    // Actualizar contraseña solo si se proporciona una nueva
    if (password && password.length > 0) {
      if (password !== password2) {
        req.flash('error_msg', 'Las contraseñas no coinciden');
        return res.redirect(`/admin-users/edit/${req.params.id}`);
      }
      
      if (password.length < 6) {
        req.flash('error_msg', 'La contraseña debe tener al menos 6 caracteres');
        return res.redirect(`/admin-users/edit/${req.params.id}`);
      }
      
      user.password = password;
    }
    
    await user.save();
    req.flash('success_msg', 'Usuario actualizado exitosamente');
    res.redirect('/admin-users');
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al actualizar el usuario');
    res.redirect('/admin-users');
  }
});

// Ruta para eliminar un usuario
router.get('/admin-users/delete/:id', isAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    
    // No permitir eliminar al propio usuario administrador que está logueado
    if (user._id.toString() === req.session.user.id) {
      req.flash('error_msg', 'No puedes eliminar tu propio usuario');
      return res.redirect('/admin-users');
    }
    
    await User.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Usuario eliminado exitosamente');
    res.redirect('/admin-users');
  } catch (err) {
    // Error manejado con flash message
    req.flash('error_msg', 'Error al eliminar el usuario');
    res.redirect('/admin-users');
  }
});

// Rutas para recursos humanos
router.get('/recursos-humanos', isRecursosHumanos, (req, res) => {
  res.render('recursos-humanos/index', {
    user: req.session.user
  });
});

// Rutas para control de estudio
router.get('/control-estudio', isControlEstudio, (req, res) => {
  res.render('control-estudio/index', {
    user: req.session.user
  });
});

// Ruta para el escáner de QR (acceso público sin login)
router.get('/qr-scanner', (req, res) => {
  res.render('qr-scanner', { layout: false });
});

// Ruta para verificar un código QR (acceso público sin login)
router.get('/verificar-qr', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'No se proporcionó un código QR' });
    }
    
    // Parsing más eficiente del código QR
    let cedula = null;
    let qrCode = code;
    let parsedData = null;
    
    // Intentar decodificar como JSON solo si parece ser JSON
    if (code.startsWith('{') && code.endsWith('}')) {
      try {
        parsedData = JSON.parse(code);
        
        // Extraer los campos relevantes
        if (parsedData.cedula) {
          cedula = parsedData.cedula;
        }
        if (parsedData.id && parsedData.id !== 'sin-id') {
          qrCode = parsedData.id;
        }
      } catch (parseError) {
        // Ignorar errores de parsing silenciosamente
      }
    } else if (/^\d+$/.test(code)) {
      // Si es solo un número, asumir que es cédula
      cedula = code;
    }
    
    // Buscar estudiante de manera optimizada - iniciar con la búsqueda más rápida
    let student = null;
    let searchMethods = [];
    
    // Si tenemos una cédula, buscar primero por cédula (índice más rápido)
    if (cedula) {
      student = await Student.findOne({ cedula }).lean();
      if (student) searchMethods.push('cedula');
    }
    
    // Si no se encontró y tenemos un qrCode específico que parece un ObjectId, buscar por ID
    if (!student && mongoose.Types.ObjectId.isValid(qrCode)) {
      student = await Student.findById(qrCode).lean();
      if (student) searchMethods.push('_id');
    }
    
    // Si aún no se encuentra, buscar por campo qrCode
    if (!student && qrCode) {
      student = await Student.findOne({ qrCode }).lean();
      if (student) searchMethods.push('qrCode');
    }
    
    // Si todavía no se encuentra y code es un ObjectId válido, intentar por ID
    if (!student && mongoose.Types.ObjectId.isValid(code)) {
      student = await Student.findById(code).lean();
      if (student) searchMethods.push('ObjectId');
    }
    
    // Si no se encontró el estudiante
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    // Log simplificado
    console.log(`Estudiante encontrado por: ${searchMethods.join(', ')}. ID: ${student._id}`);
    
    // Obtener las validaciones QR - usar caché si es posible
    const validaciones = await QRValidation.findOne().lean();
    const validacionesActivas = validaciones || {
      inscripcion: true,
      primeraCuota: true,
      segundaCuota: true,
      terceraCuota: true
    };
    
    // Valores por defecto para los campos de pago
    student.inscripcion = student.inscripcion || false;
    student.primeraCuota = student.primeraCuota || false;
    student.segundaCuota = student.segundaCuota || false;
    student.terceraCuota = student.terceraCuota || false;
    
    // Validación rápida
    let estadoValidacion = true;
    let mensajeValidacion = [];
    
    // Verificar si el estudiante es becado
    const esBecado = student.tipoEstudiante === 'Becado';
    
    // Si el estudiante es becado, siempre dar acceso sin importar el estado de pagos
    if (esBecado) {
      console.log(`Estudiante ${student.nombres} ${student.apellidos} es becado. Acceso automático concedido.`);
      // Forzar acceso aprobado para estudiantes becados
      estadoValidacion = true;
      mensajeValidacion = [];
    } else {
      // Solo validar los campos activos para estudiantes particulados
      if (validacionesActivas.inscripcion && !student.inscripcion) {
        estadoValidacion = false;
        mensajeValidacion.push('Inscripción pendiente');
      }
      
      if (validacionesActivas.primeraCuota && !student.primeraCuota) {
        estadoValidacion = false;
        mensajeValidacion.push('Primera cuota pendiente');
      }
      
      if (validacionesActivas.segundaCuota && !student.segundaCuota) {
        estadoValidacion = false;
        mensajeValidacion.push('Segunda cuota pendiente');
      }
      
      if (validacionesActivas.terceraCuota && !student.terceraCuota) {
        estadoValidacion = false;
        mensajeValidacion.push('Tercera cuota pendiente');
      }
    }
    
    // Construir respuesta simplificada
    return res.json({
      nombres: student.nombres,
      apellidos: student.apellidos,
      cedula: student.cedula,
      carrera: student.carrera,
      tipoEstudiante: student.tipoEstudiante,
      tipoBeca: student.tipoBeca,
      inscripcion: student.inscripcion,
      primeraCuota: student.primeraCuota,
      segundaCuota: student.segundaCuota,
      terceraCuota: student.terceraCuota,
      validacionAprobada: estadoValidacion,
      mensajeValidacion: esBecado ? 'Estudiante becado. Acceso permitido.' : 
                        (mensajeValidacion.length > 0 ? mensajeValidacion.join('. ') + '.' : 'Todos los pagos validados correctamente'),
      configuracionValidacion: {
        inscripcion: validacionesActivas.inscripcion,
        primeraCuota: validacionesActivas.primeraCuota,
        segundaCuota: validacionesActivas.segundaCuota,
        terceraCuota: validacionesActivas.terceraCuota
      },
      esBecado: esBecado
    });
  } catch (err) {
    console.error('Error al verificar QR:', err);
    return res.status(500).json({ error: 'Error al verificar el código QR' });
  }
});

module.exports = router;
