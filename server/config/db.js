const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_campus_quickfix';
    console.log(`Connecting to MongoDB... (${mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'})`);
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.log('📌 Tip: Set MONGO_URI in server/.env with your MongoDB Atlas connection string.');
    console.log('📌 The server will stay online so frontend requests can be processed.');
    return null;
  }
};

module.exports = connectDB;
