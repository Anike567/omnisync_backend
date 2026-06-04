import { Module } from '@nestjs/common';


import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../modules/user/user.module';

@Module({
  imports: [UserModule], // Auth needs UserModule to talk to the DB
  
  // ✅ Everything related to Auth lives here
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}