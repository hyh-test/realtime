import { configDotenv } from 'dotenv';
import { createClient } from 'redis';

configDotenv();

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('connect', () => {
  console.log('정상적으로 Redis 서버에 연결되었습니다.');

  // 테스트: 키-값 저장 및 확인
  redisClient.set('testKey', 'testValue', (err, reply) => {
    if (err) {
      console.error('키 저장 실패:', err);
      return;
    }
    console.log('키 저장 성공:', reply);

    // 저장한 값 확인
    redisClient.get('testKey', (err, value) => {
      if (err) {
        console.error('키 조회 실패:', err);
        return;
      }
      console.log('저장된 값:', value);
    });
  });
});

redisClient.on('error', (error) => {
  console.error('Redis 서버 연결에 실패했습니다.', error);
});

export const connectRedis = async () => {
  await redisClient.connect();
};

export default redisClient;
