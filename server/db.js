const mongoose = require('mongoose');
const config = require('./config/config');

async function connectToDB() {
  try {
    // Log the environment and connection string (mask sensitive data)
    const maskedURI = config.mongoURI.replace(
      /(mongodb(\+srv)?:\/\/)([^:]+):([^@]+)@/,
      '$1***:***@'
    );
    console.log('Attempting MongoDB connection with URI:', maskedURI);
    console.log('Current NODE_ENV:', process.env.NODE_ENV);

    await mongoose.connect(config.mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ssl: true,
      retryWrites: true
    });

    // Add connection status monitoring
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB Connection Error Details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      // Log additional connection details if available
      topology: error.topology && {
        type: error.topology.type,
        servers: Array.from(error.topology.servers.keys())
      }
    });
    
    process.exit(1);
  }
}

module.exports = connectToDB;