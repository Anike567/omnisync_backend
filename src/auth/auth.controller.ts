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
    async login(@Body() body: LoginDto) {
        return await this.authService.login(body);
    }

    @Post('/refresh') 
    async refresh(@Body() body:RefreshDto){
        return await this.authService.refresh(body);
    }


    @Post('/signup')
    async signup(@Body() body: SignupDto) {
        return await this.authService.signup(body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/profile')
    async getProfile(@Req() req) {
        const userId = req.user.userId
        
        return await this.authService.getProfile(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/logout')
    async logout(@Req() req){
        const userId = req.user.userId

        return await this.authService.logout(userId)
    }


    @UseGuards(JwtAuthGuard)
    @Post("/changepassword")
    async changePassword(@Req() req, @Body() body: changePasswordDto) { // 2. Fixed missing parentheses on @Body()
        const userId = req.user.id || req.user.userId;
        return await this.authService.changePassword(userId, body);
    }
}