import mongoose from 'mongoose';
import dns from 'dns';
import logger from '../utils/logger.js';

// Ensure DNS SRV lookups for MongoDB Atlas succeed across network environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  // Ignore if custom DNS fails to set
}

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

export const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });

    logger.info(`MongoDB Connected successfully: Host: ${conn.connection.host}, Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Attempting to reconnect...');
    });

  } catch (error) {
    logger.error(`MongoDB Connection Attempt ${retryCount + 1} Failed: ${error.message}`);
    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      return connectDB(retryCount + 1);
    } else {
      logger.error('Exhausted MongoDB retry attempts. Continuing server launch (verify DB availability).');
    }
  }
};

export default connectDB;
