const mongoose = require('mongoose');
require('dotenv').config();

// Patrón de conexión cacheada para Vercel serverless
// Reutiliza la conexión entre invocaciones en lugar de crear una nueva cada vez
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB Connected:', mongoose.connection.host);
  } catch (err) {
    cached.promise = null;
    console.error('Error al conectar MongoDB:', err.message);
  }

  return cached.conn;
};

module.exports = connectDB;
