// src/modules/user/user.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/user/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findOneById(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
        select: { id: true, email: true, username: true, phoneNumber: true }
      });
      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }
      return {
        status: 200,
        message: "Profile retrieved successfully",
        data: user,
        error_message: null
      };
    }
    catch (err) {
      console.log(err);
      throw new InternalServerErrorException("Something went wrong please try again later");
    }
  }

  async findOneByEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email: email },
        select: { id: true, email: true, username: true, phoneNumber: true }
      });
      if (!user) {
        throw new NotFoundException(`User with email "${email}" not found`);
      }
      return {
        status: 200,
        message: "Profile retrieved successfully",
        data: user,
        error_message: null
      };;
    }
    catch (err) {
      console.log(err);
      throw new InternalServerErrorException("Something went wrong please try again later")
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOneById(id); // Reuses validation logic to throw 404 if missing
    await this.userRepository.update(id, updateUserDto);
    return { message: 'User updated successfully' };
  }

  async remove(id: string) {
    const user = await this.findOneById(id); // Reuses validation logic to throw 404 if missing
    // await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }
}