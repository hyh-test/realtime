import { configDotenv } from 'dotenv';
import { createClient } from 'redis';

configDotenv();

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('connect', () => {
  console.log('정상적으로 Redis 서버에 연결되었습니다.');
});

redisClient.on('error', (error) => {
  console.error('Redis 서버 연결에 실패했습니다.', error);
});

export const connectRedis = async () => {
  await redisClient.connect();
};

export default redisClient;
