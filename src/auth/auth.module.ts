import { Module } from '@nestjs/common';


import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntityModule } from '../modules/user/user.module';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { JwtStrategy } from './jwt-strategy';
import { RefreshTokenModule } from 'src/modules/refresh-token/refresh-token.module';

@Module({
  imports: [
    UserEntityModule,
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