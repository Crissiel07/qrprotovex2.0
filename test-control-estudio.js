const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

// Función para crear un usuario de prueba con rol de control-estudio
const createTestUser = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('Conectado a la base de datos');

    // Importar el modelo de usuario
    const User = require('./models/User');
    
    // Verificar los valores permitidos en el enum
    console.log('Valores permitidos para el rol:', User.schema.path('role').enumValues);
    
    // Datos del usuario de prueba
    const userData = {
      name: 'Usuario Control Estudio',
      username: 'control_estudio_' + Date.now(),
      email: 'control_' + Date.now() + '@example.com',
      password: 'password123',
      role: 'control-estudio'
    };

    console.log('Intentando crear usuario con datos:', userData);
    
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
