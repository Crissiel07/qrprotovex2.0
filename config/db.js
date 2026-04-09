const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error al conectar MongoDB: ${err.message}`);
    // En Vercel no hacemos process.exit para no crashear el serverless
    if (require.main === module) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
