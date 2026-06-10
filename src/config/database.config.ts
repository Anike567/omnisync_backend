// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/user/user.entity';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'omni_sync_user',
  password: 'your_password', 
  database: 'omni_sync_db',
  entities: [User, RefreshToken],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: true,
  poolSize : 10,
  extra : {
    queueLimit: 0,
    
    // The milliseconds before a timeout occurs when trying to acquire a connection from the pool
    waitForConnections: true,
    acquireTimeout: 10000,
  }
});