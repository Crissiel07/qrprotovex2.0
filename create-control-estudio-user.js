const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

// Función para crear un usuario de control de estudio
const createControlEstudioUser = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('Conectado a la base de datos');

    // Definir el esquema de usuario directamente aquí para evitar problemas con el modelo existente
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
        enum: ['admin', 'recursos_humanos', 'caja', 'supervisor', 'control-estudio'],
        default: 'caja'
      },
      date: {
        type: Date,
        default: Date.now
      }
    });

    // Eliminar el modelo si ya existe
    if (mongoose.models.User) {
      delete mongoose.models.User;
    }

    // Crear el modelo
    const User = mongoose.model('User', UserSchema);
    
    // Datos del usuario
    const userData = {
      name: 'Control Estudio',
      username: 'controlestudio',
      email: 'controlestudio@example.com',
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
    console.error('Error al crear usuario de control de estudio:', error);
    
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
createControlEstudioUser()
  .then(() => {
    console.log('Script completado con éxito');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error en el script:', err);
    process.exit(1);
  });
