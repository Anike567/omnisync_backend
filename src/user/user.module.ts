import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntityModule } from 'src/modules/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    UserEntityModule,
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}