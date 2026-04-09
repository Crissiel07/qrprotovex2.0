const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
require('dotenv').config();
const connectDB = require('./config/db');

// Inicializar la aplicación
const app = express();

// Conectar a la base de datos
connectDB();

// Configurar el store para las sesiones
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

// Evitar que errores del store crasheen la función serverless
store.on('error', function(error) {
  console.error('Session store error:', error);
});

// Configurar EJS con rutas absolutas (necesario para Vercel)
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Middleware para procesar datos del formulario
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Configurar archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));

// Configurar flash messages
app.use(flash());

// Variables globales para mensajes flash
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.errors = req.flash('errors');
  res.locals.user = req.session.user || null;
  next();
});

// Rutas
const indexRoutes = require('./routes/index');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const estudiantesRoutes = require('./routes/estudiantes');
const formDataRoutes = require('./routes/formData');
const cajaRoutes = require('./routes/caja');
const employeesRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');

app.use('/', indexRoutes);
app.use('/users', usersRoutes);
app.use('/admin-users', adminRoutes);
app.use('/control-estudio/estudiantes', estudiantesRoutes);
app.use('/form-data', formDataRoutes);
app.use('/caja', cajaRoutes);
app.use('/recursos-humanos/empleados', employeesRoutes);
app.use('/recursos-humanos/attendance', attendanceRoutes);

// Middleware global de manejo de errores (evita crashes en Vercel)
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).send('Error interno del servidor: ' + err.message);
});

// Puerto para el servidor
const PORT = process.env.PORT || 3000;

// Solo escuchar en un puerto si se ejecuta directamente (no en Vercel)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
}

// Exportar la app para Vercel
module.exports = app;
