import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './auth/auth.module';
import { getDatabaseConfig } from './config/database.config';
import { RefreshTokenModule } from './modules/refresh-token/refresh-token.module';
import { ImagesModule } from './images/images.module';
import { ProductsModule } from './products/products.module';

@Module({
  
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    UserModule,
    AuthModule,
    RefreshTokenModule,
    ImagesModule,
    ProductsModule
  ],
})
export class AppModule {}