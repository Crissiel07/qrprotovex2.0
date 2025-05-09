const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

// Simular los datos que vendrían del formulario
const formData = {
  name: 'Usuario Formulario',
  username: 'usuario_form_' + Date.now(),
  email: 'form_' + Date.now() + '@example.com',
  password: 'password123',
  password2: 'password123',
  role: 'admin'
};

// Función para simular el procesamiento del formulario
const processFormSubmission = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('Conectado a la base de datos');
    console.log('Simulando envío de formulario con datos:', formData);

    // Validación (como en la ruta)
    let errors = [];
    const { name, username, email, password, password2, role } = formData;

    if (!name || !username || !email || !password || !password2 || !role) {
      errors.push('Por favor complete todos los campos');
    }

    if (password !== password2) {
      errors.push('Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }

    if (errors.length > 0) {
      console.error('Errores de validación:', errors);
      return;
    }

    // Verificar si el usuario ya existe
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      console.error('El email ya está registrado');
      return;
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      console.error('El nombre de usuario ya está registrado');
      return;
    }

    // Crear nuevo usuario (sin usar el middleware de pre-save)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword, // Usar la contraseña ya hasheada
      role,
      date: Date.now()
    });

    console.log('Intentando guardar usuario con datos:', {
      ...newUser.toObject(),
      password: '[OCULTO]' // No mostrar la contraseña en los logs
    });

    // Guardar usuario
    const savedUser = await newUser.save();
    console.log('Usuario guardado exitosamente con ID:', savedUser._id);

    // Verificar que el usuario fue guardado
    const foundUser = await User.findById(savedUser._id);
    console.log('Usuario encontrado en la base de datos:', {
      ...foundUser.toObject(),
      password: '[OCULTO]' // No mostrar la contraseña en los logs
    });

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('Conexión a la base de datos cerrada');
  } catch (error) {
    console.error('Error al procesar el formulario:', error);
    
    // Intentar cerrar la conexión en caso de error
    try {
      await mongoose.connection.close();
      console.log('Conexión a la base de datos cerrada después de error');
    } catch (closeError) {
      console.error('Error al cerrar la conexión:', closeError);
    }
  }
};

// Ejecutar la simulación
processFormSubmission()
  .then(() => {
    console.log('Simulación completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error en la simulación:', err);
    process.exit(1);
  });
