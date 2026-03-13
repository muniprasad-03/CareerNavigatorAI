const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log('URI:', process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('SUCCESS: Connected to MongoDB Atlas');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Could not connect to MongoDB Atlas');
    console.error('Error:', err.message);
    process.exit(1);
  }
};

testConnection();
