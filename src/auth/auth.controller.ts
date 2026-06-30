import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Body, Post } from '@nestjs/common/decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { RefreshDto } from './dto/refresh.dto';
import { changePasswordDto } from './dto/changePassword.dto';



@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }
    @Post('/login')
    login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }

    @Post('/refresh') 
    refresh(@Body() body:RefreshDto){
        return this.authService.refresh(body);
    }


    @Post('/signup')
    signup(@Body() body: SignupDto) {
        return this.authService.signup(body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/logout')
    logout(@Req() req){
        const userId = req.user.id
        return this.authService.logout(userId)
    }


    @UseGuards(JwtAuthGuard)
    @Post("/changepassword")
    changePassword(@Req() req, @Body() body: changePasswordDto) { 
        const userId = req.user.id || req.user.userId;
        return this.authService.changePassword(userId, body);
    }
}