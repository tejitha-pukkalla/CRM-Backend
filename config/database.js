const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) {
    // Reuse existing connection (Vercel keeps this in warm lambda)
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect("mongodb+srv://demodb007_db_user:task-manager@cluster0.jwnosgq.mongodb.net/task-manager?appName=Cluster0",{
           useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000, // Wait up to 20s for MongoDB to respond
    });
    console.log("✅ MongoDB connected");
    cachedConnection = conn;
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}


module.exports = connectDB;
