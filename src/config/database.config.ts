// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/user/user.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'omni_sync_user',
  password: 'your_password', // Replace with the actual password you set in MySQL
  database: 'omni_sync_db',
  entities: [User],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: true,
});