// Middleware para verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Por favor inicia sesión para acceder a esta página');
  res.redirect('/users/login');
};

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error_msg', 'No tienes permisos para acceder a esta página');
  res.redirect('/dashboard');
};

// Middleware para verificar si el usuario es de recursos humanos
const isRecursosHumanos = (req, res, next) => {
  if (req.session.user && (req.session.user.role === 'recursos_humanos' || req.session.user.role === 'admin')) {
    return next();
  }
  req.flash('error_msg', 'No tienes permisos para acceder a esta página');
  res.redirect('/dashboard');
};

// Middleware para verificar si el usuario es de caja
const isCaja = (req, res, next) => {
  if (req.session.user && (req.session.user.role === 'caja' || req.session.user.role === 'admin')) {
    return next();
  }
  req.flash('error_msg', 'No tienes permisos para acceder a esta página');
  res.redirect('/dashboard');
};

// Middleware para verificar si el usuario es de control de estudio
const isControlEstudio = (req, res, next) => {
  if (req.session.user && (req.session.user.role === 'control_estudio' || req.session.user.role === 'admin')) {
    return next();
  }
  req.flash('error_msg', 'No tienes permisos para acceder a esta página');
  res.redirect('/dashboard');
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isRecursosHumanos,
  isCaja,
  isControlEstudio
};
