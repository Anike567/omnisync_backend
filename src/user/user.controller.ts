// src/modules/user/user.controller.ts
import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Matches: GET /user/:id
  @Get('/')
  findOneById(@Req() req) {
    const userId = req.user.id
    return this.userService.findOneById(userId);
  }

  // Matches: GET /user/email/:email
  // Notice the sub-route prefix 'email/' to prevent conflicts with the ':id' path
  @Get('/email')
  findOneByEmail(@Req() req) {
    const email = req.user.email;
    return this.userService.findOneByEmail(email);
  }

  // Matches: PATCH /user/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  // Matches: DELETE /user/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}