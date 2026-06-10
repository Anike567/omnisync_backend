// src/core/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constant';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const redisClient = new Redis({
          host: '127.0.0.1',
          port: 6379,
        });

        redisClient.on('connect', () => console.log('⚡ [Redis] Connected successfully'));
        redisClient.on('error', (err) => console.error('❌ [Redis] Error:', err));
        
        return redisClient;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}