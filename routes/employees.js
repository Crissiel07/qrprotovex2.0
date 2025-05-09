const express = require('express');
const router = express.Router();
const { isAuthenticated, isRecursosHumanos } = require('../middleware/auth');
const Employee = require('../models/Employee');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

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

// Ruta para mostrar formulario de creaciu00f3n
router.get('/create', isAuthenticated, isRecursosHumanos, (req, res) => {
  res.render('recursos-humanos/empleados/create', {
    user: req.session.user
  });
});

// Ruta para procesar la creaciu00f3n de empleado
router.post('/create', isAuthenticated, isRecursosHumanos, async (req, res) => {
  const { cedula, nombres, apellidos, email } = req.body;
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
      cargo: 'Profesor',
      departamento: 'Acadu00e9mico'
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
