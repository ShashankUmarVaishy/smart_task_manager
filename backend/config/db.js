// =============================================
// config/db.js — MongoDB Connection Setup
// =============================================
// This file connects our Express app to MongoDB
// using Mongoose (an ODM — Object Document Mapper).
// It reads the connection string from the .env file.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB using the URI from .env
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log and stop the server
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Exit the Node process with failure code
  }
};

module.exports = connectDB;
