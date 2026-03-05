import Redis from "ioredis";
require("dotenv").config();


// Make sure REDIS_URL exists
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined in .env');
}

// Now TS knows it's definitely a string
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('error', (err) => console.error('Redis error', err));

export default redisClient;
