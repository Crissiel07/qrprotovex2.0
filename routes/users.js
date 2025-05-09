const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Ruta para la página de registro
router.get('/register', (req, res) => {
  res.render('register');
});

// Ruta para procesar el registro
router.post('/register', async (req, res) => {
  const { name, email, password, password2, role } = req.body;
  let errors = [];

  // Validación
  if (!name || !email || !password || !password2) {
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
    res.render('register', {
      name,
      email,
      password,
      password2,
      role
    });
  } else {
    try {
      // Verificar si el usuario ya existe
      const userExists = await User.findOne({ email });
      
      if (userExists) {
        req.flash('errors', { msg: 'El email ya está registrado' });
        res.render('register', {
          name,
          email,
          password,
          password2,
          role
        });
      } else {
        // Crear nuevo usuario
        const newUser = new User({
          name,
          email,
          password,
          role
        });
        
        // Guardar usuario
        await newUser.save();
        req.flash('success_msg', 'Ahora estás registrado y puedes iniciar sesión');
        res.redirect('/users/login');
      }
    } catch (err) {
      // Error manejado con flash message
      req.flash('errors', { msg: 'Error en el servidor' });
      res.render('register', {
        name,
        email,
        password,
        password2,
        role
      });
    }
  }
});

// Ruta para la página de login
router.get('/login', (req, res) => {
  res.render('login');
});

// Ruta para procesar el login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Buscar usuario por nombre de usuario
    const user = await User.findOne({ username });
    
    if (!user) {
      req.flash('errors', { msg: 'Nombre de usuario no registrado' });
      return res.render('login', {
        username,
        password
      });
    }
    
    // Verificar contraseña
    let isMatch = false;
    
    // Verificación especial para el usuario admin (temporal)
    if (user.username === 'admin' && password === 'admin123') {
      isMatch = true;
    } else {
      // Verificación normal para otros usuarios
      isMatch = await user.matchPassword(password);
    }
    
    if (!isMatch) {
      req.flash('errors', { msg: 'Contraseña incorrecta' });
      return res.render('login', {
        username,
        password
      });
    }
    
    // Crear sesión
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    // Redireccionar según el rol del usuario
    switch(user.role) {
      case 'admin':
        res.redirect('/admin-panel');
        break;
      case 'recursos_humanos':
        res.redirect('/recursos-humanos');
        break;
      case 'caja':
        res.redirect('/caja');
        break;
      case 'control_estudio':
        res.redirect('/control-estudio');
        break;
      default:
        res.redirect('/dashboard');
    }
  } catch (err) {
    // Error manejado con flash message
    req.flash('errors', { msg: 'Error en el servidor' });
    res.render('login', {
      username,
      password
    });
  }
});

// Ruta para logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      // Error manejado con flash message
      return res.redirect('/dashboard');
    }
    res.redirect('/users/login');
  });
});

module.exports = router;
