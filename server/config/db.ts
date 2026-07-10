import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!mongoURI) {
    console.log('Database status: No connection string provided. Safe fallback state is active.');
    return false;
  }

  try {
    // Set up mongoose connection
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30 seconds to fail fast
    });
    isConnected = true;
    console.log('Database status: Connected successfully.');
    return true;
  } catch (error: any) {
    console.log('Database status: Offline. Fallback state is active.');
    return false;
  }
};

export const isUsingRealMongoDB = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};
