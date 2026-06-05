// src/modules/user/dto/signup.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsMobilePhone,
  MinLength,
  Matches
} from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  // Optional: Add regex to ensure a strong password (requires 1 number/letter)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. Include upper, lower, and numbers.'
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsMobilePhone('en-IN', {}, { message: 'Invalid Indian phone number' })
  @IsNotEmpty()
  phoneNumber!: string;
}