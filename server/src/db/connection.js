const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(
      "Database connection failed, continuing with in-memory storage only:",
      error.message,
    );
    return null;
  }
};

module.exports = connectDB;
