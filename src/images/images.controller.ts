import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@Controller('images')
export class ImagesController {

    @UseGuards(JwtAuthGuard)
    @Get('/')
    async getAllImageInBatch(){
        
    }

}
