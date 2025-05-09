const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

// Modelo de usuario simplificado para pruebas
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'recursos_humanos', 'caja'],
    default: 'caja'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Función para crear un usuario de prueba
const createTestUser = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('Conectado a la base de datos');

    // Crear modelo
    const User = mongoose.model('User', UserSchema);
    
    // Datos del usuario de prueba
    const userData = {
      name: 'Usuario Prueba',
      username: 'test_user_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password: 'password123',
      role: 'admin'
    };

    console.log('Datos del usuario a crear:', userData);
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Crear usuario con contraseña encriptada
    const newUser = new User({
      ...userData,
      password: hashedPassword
    });
    
    // Guardar usuario
    const savedUser = await newUser.save();
    console.log('Usuario creado exitosamente:', savedUser);
    
    // Verificar si el usuario fue guardado correctamente
    const foundUser = await User.findOne({ username: userData.username });
    console.log('Usuario encontrado en la base de datos:', foundUser);
    
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('Conexión a la base de datos cerrada');
    
    return savedUser;
  } catch (error) {
    console.error('Error al crear usuario de prueba:', error);
    
    // Intentar cerrar la conexión en caso de error
    try {
      await mongoose.connection.close();
      console.log('Conexión a la base de datos cerrada después de error');
    } catch (closeError) {
      console.error('Error al cerrar la conexión:', closeError);
    }
    
    throw error;
  }
};

// Ejecutar la función
createTestUser()
  .then(() => {
    console.log('Script completado con éxito');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error en el script:', err);
    process.exit(1);
  });
