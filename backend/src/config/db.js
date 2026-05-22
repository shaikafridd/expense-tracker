import mongoose from 'mongoose';

const connectDB = async () => {
  const localUri = 'mongodb://127.0.0.1:27017/expense-tracker';
  const uri = process.env.MONGODB_URI || localUri;

  try {
    console.log(`Connecting to MongoDB at: ${uri.replace(/:[^@/]+@/, ':****@')}`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    
    if (uri !== localUri) {
      console.log(`Attempting fallback to local MongoDB: ${localUri}`);
      try {
        const conn = await mongoose.connect(localUri, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`MongoDB Connected (Fallback to Local): ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`Fallback database connection error: ${fallbackError.message}`);
      }
    }
    
    // Do NOT call process.exit(1), let the Express server stay alive
    console.warn('WARNING: Express server is running without a database connection. Database operations will time out or fail.');
  }
};

export default connectDB;
