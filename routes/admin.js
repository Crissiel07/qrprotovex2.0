const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { isAdmin } = require('../middleware/auth');

// Middleware para asegurar que solo los administradores puedan acceder
router.use(isAdmin);

// Ruta para la gestión de usuarios
router.get('/', async (req, res) => {
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
router.post('/create', async (req, res) => {
  const { name, username, email, password, password2, role } = req.body;
  let errors = [];

  // Validación
  if (!name || !username || !email || !password || !password2 || !role) {
    errors.push({ msg: 'Por favor complete todos los campos' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Las contraseñas no coinciden' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (errors.length > 0) {
    // Usar flash para los errores
    errors.forEach(error => req.flash('errors', error));
    
    try {
      const users = await User.find().sort({ date: -1 });
      return res.render('admin/users/index', {
        user: req.session.user,
        users
      });
    } catch (err) {
      // Error manejado con flash message
      req.flash('error_msg', 'Error al cargar los usuarios');
      return res.redirect('/admin-panel');
    }
  } else {
    try {
      // Verificar si el usuario ya existe por email o nombre de usuario
      const emailExists = await User.findOne({ email });
      const usernameExists = await User.findOne({ username });
      
      if (emailExists) {
        req.flash('errors', { msg: 'El email ya está registrado' });
        const users = await User.find().sort({ date: -1 });
        return res.render('admin/users/index', {
          user: req.session.user,
          users
        });
      } else if (usernameExists) {
        req.flash('errors', { msg: 'El nombre de usuario ya está registrado' });
        const users = await User.find().sort({ date: -1 });
        return res.render('admin/users/index', {
          user: req.session.user,
          users
        });
      } else {
        // Crear nuevo usuario
        const newUser = new User({
          name,
          username,
          email,
          password,
          role
        });
        
        // Guardar usuario
        await newUser.save();
        req.flash('success_msg', 'Usuario creado exitosamente');
        res.redirect('/admin-users');
      }
    } catch (err) {
      // Error manejado con flash message
      req.flash('errors', { msg: 'Error en el servidor' });
      res.redirect('/admin-users');
    }
  }
});

// Ruta para mostrar el formulario de edición de usuario
router.get('/edit/:id', async (req, res) => {
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
router.post('/update/:id', async (req, res) => {
  const { name, username, email, role, password, password2 } = req.body;
  
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
router.get('/delete/:id', async (req, res) => {
  try {
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

module.exports = router;
