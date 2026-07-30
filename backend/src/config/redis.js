import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis retry limit reached. Operating without cache.');
        return null;
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    logger.info('Redis Client connected successfully');
  }).catch((err) => {
    isRedisConnected = false;
    logger.warn(`Redis optional connection failed: ${err.message}. App running with direct DB mode.`);
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    logger.debug(`Redis Client Error: ${err.message}`);
  });
} catch (error) {
  logger.warn(`Redis setup skipped: ${error.message}`);
}

export const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Redis Get Error: ${err.message}`);
    return null;
  }
};

export const setCache = async (key, data, ttlSeconds = 300) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    return true;
  } catch (err) {
    logger.error(`Redis Set Error: ${err.message}`);
    return false;
  }
};

export const deleteCache = async (pattern) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (err) {
    logger.error(`Redis Delete Error: ${err.message}`);
    return false;
  }
};

export { redisClient, isRedisConnected };
export default redisClient;
