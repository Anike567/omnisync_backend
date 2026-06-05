import { Module } from '@nestjs/common';


import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../modules/user/user.module';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { JwtStrategy } from './jwt-strategy';
import { RefreshTokenModule } from 'src/modules/refresh-token/refresh-token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';

@Module({
  imports: [
    UserModule,
    RefreshTokenModule,
    
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1h' },
    })
  ], // Auth needs UserModule to talk to the DB

  // ✅ Everything related to Auth lives here
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy]
})
export class AuthModule { }