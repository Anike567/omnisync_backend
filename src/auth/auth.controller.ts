import { Controller, Get, Req, Res } from '@nestjs/common';
import { Body, Post } from '@nestjs/common/decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';


@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}
    @Post('/login')
    login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }

    @Post('/signup')
    signup(@Body() body: SignupDto) {
        return body;
    }
}
