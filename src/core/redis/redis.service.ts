import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constant';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redisClient: Redis
    ) {}

    onModuleDestroy() {
        this.redisClient.disconnect();
    }

    /**
     * Set a key with any value type (string, number, array, or object)
     */
    async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
        // If the value is an object or an array, automatically convert it to a JSON string
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;

        if (ttlInSeconds) {
            await this.redisClient.set(key, serializedValue, 'EX', ttlInSeconds);
        } else {
            await this.redisClient.set(key, serializedValue);
        }
    }

    /**
     * Get a key and automatically parse it back to its original structure if it's JSON
     */
    async get<T = any>(key: string): Promise<T | null> {
        const data = await this.redisClient.get(key);
        if (!data) return null;

        try {
            // Attempt to parse it back into an Object/Array
            return JSON.parse(data) as T;
        } catch {
            // If parsing fails, it's a primitive string/number, return it directly
            return data as unknown as T;
        }
    }

    async del(key: string): Promise<void> {
        await this.redisClient.del(key);
    }
}