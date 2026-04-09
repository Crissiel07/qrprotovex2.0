const express = require('express');
const router = express.Router();
const { isAuthenticated, isRecursosHumanos } = require('../middleware/auth');
const Employee = require('../models/Employee');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { generateQRCode } = require('../utils/qrGenerator');
const { sendQREmail } = require('../config/mail');

// Ruta para listar empleados
router.get('/', isAuthenticated, isRecursosHumanos, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ fechaRegistro: -1 });
    res.render('recursos-humanos/empleados/index', {
      user: req.session.user,
      employees
    });
  } catch (err) {
    req.flash('error_msg', 'Error al cargar los empleados');
    res.redirect('/recursos-humanos');
  }
});

// Ruta para mostrar formulario de creación de profesor
router.get('/create-profesor', isAuthenticated, isRecursosHumanos, (req, res) => {
  res.render('recursos-humanos/empleados/create-profesor', {
    user: req.session.user
  });
});

// Ruta para procesar el formulario de creación de profesor
router.post('/create-profesor', isAuthenticated, isRecursosHumanos, async (req, res) => {
  try {
    const { cedula, email, nombres, apellidos, especialidad, departamento, tipoEmpleado } = req.body;
    
    // Validar datos
    if (!cedula || !email || !nombres || !apellidos || !especialidad || !departamento) {
      req.flash('error_msg', 'Todos los campos son obligatorios');
      return res.redirect('/recursos-humanos/empleados/create-profesor');
    }

    // Verificar si ya existe un empleado con la misma cédula
    const empleadoExistente = await Employee.findOne({ cedula });
    if (empleadoExistente) {
      req.flash('error_msg', 'Ya existe un empleado registrado con esta cédula');
      return res.redirect('/recursos-humanos/empleados/create-profesor');
    }

    // Crear nuevo profesor
    const nuevoProfesor = new Employee({
      cedula,
      email,
      nombres,
      apellidos,
      especialidad,
      departamento,
      tipoEmpleado: 'Profesor'
    });

    // Generar código QR único
    const qrCode = await generateQRCode(nuevoProfesor._id.toString());
    nuevoProfesor.qrCode = qrCode;

    // Guardar profesor en la base de datos
    await nuevoProfesor.save();

    // Enviar correo con código QR
    try {
      const nombreCompleto = `${nombres} ${apellidos}`;
      const enviado = await sendQREmail(email, nombreCompleto, qrCode);
      if (enviado) {
        console.log(`Código QR enviado exitosamente a ${email}`);
      } else {
        console.error(`Error al enviar código QR a ${email}`);
      }
    } catch (emailError) {
      console.error('Error al enviar el correo:', emailError);
    }

    req.flash('success_msg', 'Profesor registrado exitosamente');
    res.redirect('/recursos-humanos/empleados');
  } catch (error) {
    console.error('Error al crear profesor:', error);
    req.flash('error_msg', 'Error al registrar el profesor');
    res.redirect('/recursos-humanos/empleados/create-profesor');
  }
});

// Ruta para mostrar formulario de creación de personal
router.get('/create-personal', isAuthenticated, isRecursosHumanos, (req, res) => {
  res.render('recursos-humanos/empleados/create-personal', {
    user: req.session.user
  });
});

// Ruta para procesar el formulario de creación de personal
router.post('/create-personal', isAuthenticated, isRecursosHumanos, async (req, res) => {
  try {
    const { cedula, email, nombres, apellidos, cargo, departamento, tipoEmpleado } = req.body;
    
    // Validar datos
    if (!cedula || !email || !nombres || !apellidos || !cargo || !departamento) {
      req.flash('error_msg', 'Todos los campos son obligatorios');
      return res.redirect('/recursos-humanos/empleados/create-personal');
    }

    // Verificar si ya existe un empleado con la misma cédula
    const empleadoExistente = await Employee.findOne({ cedula });
    if (empleadoExistente) {
      req.flash('error_msg', 'Ya existe un empleado registrado con esta cédula');
      return res.redirect('/recursos-humanos/empleados/create-personal');
    }

    // Crear nuevo empleado
    const nuevoEmpleado = new Employee({
      cedula,
      email,
      nombres,
      apellidos,
      cargo,
      departamento,
      tipoEmpleado
    });

    // Generar código QR único
    const qrCode = await generateQRCode(nuevoEmpleado._id.toString());
    nuevoEmpleado.qrCode = qrCode;

    // Guardar empleado en la base de datos
    await nuevoEmpleado.save();

    // Enviar correo con código QR
    try {
      const nombreCompleto = `${nombres} ${apellidos}`;
      const enviado = await sendQREmail(email, nombreCompleto, qrCode);
      if (enviado) {
        console.log(`Código QR enviado exitosamente a ${email}`);
      } else {
        console.error(`Error al enviar código QR a ${email}`);
      }
    } catch (emailError) {
      console.error('Error al enviar el correo:', emailError);
    }

    req.flash('success_msg', 'Personal registrado exitosamente');
    res.redirect('/recursos-humanos/empleados');
  } catch (error) {
    console.error('Error al crear personal:', error);
    req.flash('error_msg', 'Error al registrar el personal');
    res.redirect('/recursos-humanos/empleados/create-personal');
  }
});

// Ruta para mostrar formulario general (mantener por compatibilidad)
router.get('/create', isAuthenticated, isRecursosHumanos, (req, res) => {
  res.render('recursos-humanos/empleados/create', {
    user: req.session.user
  });
});

// Ruta para procesar la creación de empleado
router.post('/create', isAuthenticated, isRecursosHumanos, async (req, res) => {
  const { cedula, nombres, apellidos, email, tipoEmpleado, cargo } = req.body;
  let errors = [];

  // Validaciu00f3n bu00e1sica
  if (!cedula || !nombres || !apellidos || !email) {
    errors.push({ msg: 'Por favor complete todos los campos obligatorios' });
  }

  if (errors.length > 0) {
    errors.forEach(error => req.flash('error_msg', error.msg));
    return res.render('recursos-humanos/empleados/create', {
      user: req.session.user,
      cedula,
      nombres,
      apellidos,
      email
    });
  }

  try {
    // Verificar si ya existe un empleado con la misma cu00e9dula o email
    const existingEmployee = await Employee.findOne({ $or: [{ cedula }, { email }] });
    
    if (existingEmployee) {
      if (existingEmployee.cedula === cedula) {
        req.flash('error_msg', 'Ya existe un empleado con esta cu00e9dula');
      } else {
        req.flash('error_msg', 'Ya existe un empleado con este email');
      }
      return res.render('recursos-humanos/empleados/create', {
        user: req.session.user,
        cedula,
        nombres,
        apellidos,
        email
      });
    }

    // Crear nuevo empleado
    const newEmployee = new Employee({
      cedula,
      nombres,
      apellidos,
      email,
      tipoEmpleado: tipoEmpleado || 'Profesor',
      cargo: cargo || (tipoEmpleado === 'Personal' ? 'Administrativo' : 'Profesor'),
      departamento: tipoEmpleado === 'Personal' ? 'Administrativo' : 'Académico'
    });

    // Generar cu00f3digo QR
    const qrData = JSON.stringify({
      id: newEmployee._id,
      cedula: newEmployee.cedula,
      tipo: 'empleado'
    });

    // Directorio para guardar los cu00f3digos QR
    const qrDir = path.join(__dirname, '../public/qr/empleados');
    
    // Crear directorio si no existe
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // Nombre del archivo QR
    const qrFilename = `empleado_${newEmployee._id}.png`;
    const qrPath = path.join(qrDir, qrFilename);

    // Generar imagen QR
    await qrcode.toFile(qrPath, qrData);

    // Guardar ruta relativa del QR en el empleado
    newEmployee.qrCode = `/qr/empleados/${qrFilename}`;

    // Guardar empleado
    await newEmployee.save();

    // Enviar código QR por correo electrónico
    try {
      const { sendQRByEmail } = require('../utils/mailSender');
      const nombreCompleto = `${nombres} ${apellidos}`;
      const enviado = await sendQRByEmail(email, nombreCompleto, newEmployee.qrCode, 'empleado');
      
      if (enviado) {
        newEmployee.qrSent = true;
        await newEmployee.save();
        req.flash('success_msg', 'Empleado registrado exitosamente. Se ha enviado el código QR al correo electrónico.');
      } else {
        req.flash('success_msg', 'Empleado registrado exitosamente, pero hubo un problema al enviar el código QR por correo.');
      }
    } catch (emailError) {
      console.error('Error al enviar el correo:', emailError);
      req.flash('success_msg', 'Empleado registrado exitosamente, pero hubo un problema al enviar el código QR por correo.');
    }
    
    res.redirect('/recursos-humanos/empleados');
  } catch (err) {
    console.error('Error al crear empleado:', err);
    req.flash('error_msg', 'Error al registrar el empleado');
    res.render('recursos-humanos/empleados/create', {
      user: req.session.user,
      cedula,
      nombres,
      apellidos,
      email
    });
  }
});

// Ruta para ver detalles de un empleado
router.get('/view/:id', isAuthenticated, isRecursosHumanos, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      req.flash('error_msg', 'Empleado no encontrado');
      return res.redirect('/recursos-humanos/empleados');
    }
    
    res.render('recursos-humanos/empleados/view', {
      user: req.session.user,
      employee
    });
  } catch (err) {
    req.flash('error_msg', 'Error al cargar los datos del empleado');
    res.redirect('/recursos-humanos/empleados');
  }
});

// Ruta para mostrar formulario de ediciu00f3n
router.get('/edit/:id', isAuthenticated, isRecursosHumanos, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      req.flash('error_msg', 'Empleado no encontrado');
      return res.redirect('/recursos-humanos/empleados');
    }
    
    res.render('recursos-humanos/empleados/edit', {
      user: req.session.user,
      employee
    });
  } catch (err) {
    req.flash('error_msg', 'Error al cargar los datos del empleado');
    res.redirect('/recursos-humanos/empleados');
  }
});

// Ruta para procesar la ediciu00f3n de empleado
router.post('/edit/:id', isAuthenticated, isRecursosHumanos, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      req.flash('error_msg', 'Empleado no encontrado');
      return res.redirect('/recursos-humanos/empleados');
    }
    
    // Actualizar campos
    const { cedula, nombres, apellidos, email } = req.body;
    
    // Validaciu00f3n bu00e1sica
    if (!cedula || !nombres || !apellidos || !email) {
      req.flash('error_msg', 'Por favor complete todos los campos obligatorios');
      return res.redirect(`/recursos-humanos/empleados/edit/${req.params.id}`);
    }
    
    // Verificar si la cu00e9dula o email ya existen en otro empleado
    if (cedula !== employee.cedula || email !== employee.email) {
      const existingEmployee = await Employee.findOne({
        $and: [
          { _id: { $ne: req.params.id } },
          { $or: [{ cedula }, { email }] }
        ]
      });
      
      if (existingEmployee) {
        if (existingEmployee.cedula === cedula) {
          req.flash('error_msg', 'Ya existe otro empleado con esta cu00e9dula');
        } else {
          req.flash('error_msg', 'Ya existe otro empleado con este email');
        }
        return res.redirect(`/recursos-humanos/empleados/edit/${req.params.id}`);
      }
    }
    
    // Actualizar campos
    employee.cedula = cedula;
    employee.nombres = nombres;
    employee.apellidos = apellidos;
    employee.email = email;
    
    // Guardar cambios
    await employee.save();
    
    req.flash('success_msg', 'Datos del empleado actualizados exitosamente');
    res.redirect('/recursos-humanos/empleados');
  } catch (err) {
    req.flash('error_msg', 'Error al actualizar los datos del empleado');
    res.redirect(`/recursos-humanos/empleados/edit/${req.params.id}`);
  }
});

// Ruta para eliminar empleado
router.get('/delete/:id', isAuthenticated, isRecursosHumanos, async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Empleado eliminado exitosamente');
    res.redirect('/recursos-humanos/empleados');
  } catch (err) {
    req.flash('error_msg', 'Error al eliminar el empleado');
    res.redirect('/recursos-humanos/empleados');
  }
});

module.exports = router;
