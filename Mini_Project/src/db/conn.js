require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

require('dotenv').config();

// console.log("MongoDB URI from .env:", process.env.MONGO_URI);

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
