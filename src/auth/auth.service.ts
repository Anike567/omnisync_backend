import { Body, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';

import { User } from 'src/modules/user/user.entity';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { changePasswordDto } from './dto/changePassword.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
    ) { }

    async getProfile(userId: string) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                select: { id: true, email: true, username: true, phoneNumber: true }
            });

            if (!user) throw new UnauthorizedException('User not found');

            return {
                status: 200,
                message: "Profile retrieved successfully",
                data: user,
                error_message: null
            };
        }
        catch {
            throw new InternalServerErrorException();
        }
    }

    async login(body: LoginDto) {
        try {
            // 1. Find user and validate password
            const user = await this.userRepository.findOne({ where: { email: body.email } });
            if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
                throw new UnauthorizedException('Invalid email or password');
            }

            // 2. Generate Tokens
            const payload = { id: user.id, username: user.username, email: user.email };
            const accessToken = this.jwtService.sign(payload);
            const rawRefreshToken = randomUUID();
            const hashedToken = await bcrypt.hash(rawRefreshToken, 10);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // 3. Manage Refresh Token session
            const existingSession = await this.refreshTokenRepository.findOne({ where: { userId: user.id } });

            if (existingSession) {
                await this.refreshTokenRepository.update(existingSession.id, {
                    hashedToken,
                    expiresAt
                });
            } else {
                const newToken = this.refreshTokenRepository.create({
                    userId: user.id,
                    hashedToken,
                    expiresAt
                });
                await this.refreshTokenRepository.save(newToken);
            }

            return {
                status: 200,
                message: "Login successful",
                data: { accessToken, refreshToken: rawRefreshToken },
                error_message: null
            };
        }
        catch (err) {
            throw new InternalServerErrorException()
        }
    }

    async refresh(body: RefreshDto) {
        try {
            const { id, token } = body;
            console.log(id)

            // 1. Find session
            const session = await this.refreshTokenRepository.findOne({ where: { userId: id } });
            if (!session) throw new UnauthorizedException("Session not found");

            // 2. Validate token
            const isTokenValid = await bcrypt.compare(token, session.hashedToken);
            if (!isTokenValid || session.expiresAt <= new Date()) {
                await this.refreshTokenRepository.delete(session.id);
                throw new UnauthorizedException("Session Expired, please login again");
            }

            // 3. Fetch user
            const user = await this.userRepository.findOne({ where: { id: session.userId } });
            if (!user) throw new UnauthorizedException("User no longer exists");

            // 4. ROTATE: Generate new pair
            const newRawRefreshToken = randomUUID();
            const newHashedToken = await bcrypt.hash(newRawRefreshToken, 10);

            await this.refreshTokenRepository.update(session.id, {
                hashedToken: newHashedToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            return {
                status: 200,
                message: "Session refreshed",
                data: {
                    accessToken: this.jwtService.sign({ id: user.id, username: user.username, email: user.email }),
                    refreshToken: newRawRefreshToken
                },
                error_message: null
            };
        }
        catch (err) {
            console.log(err);
            throw new InternalServerErrorException();
        }
    }

    async signup(body: SignupDto) {
        try {
            const userExists = await this.userRepository.findOne({ where: { email: body.email } });
            if (userExists) throw new ConflictException('Email already in use');

            const isUsernameTaken = await this.userRepository.findOne({ where: { username: body.username } });
            if (isUsernameTaken) throw new ConflictException('Username already in use');

            const hashedPassword = await bcrypt.hash(body.password, 10);

            const { password, ...userData } = body;
            const newUser = this.userRepository.create({
                ...userData,
                passwordHash: hashedPassword,
            });

            const savedUser = await this.userRepository.save(newUser);

            return {
                status: 201,
                message: "Signup successful",
                data: { userId: savedUser.id },
                error_message: null
            };
        }
        catch (err) {
            throw new InternalServerErrorException("Internal Server error ")
        }
    }

    async logout(userId: string) {
        try {
            // FIX: Query by matching the foreign key field 'userId' instead of primary key 'id'
            const result = await this.refreshTokenRepository.delete({ userId: userId });

            // FIX: TypeORM delete returns a DeleteResult object. Check if 'affected' rows count is 0.
            // FIX: Throw the exception instead of returning it.
            if (result.affected === 0) {
                throw new UnauthorizedException("Session not found");
            }

            return {
                status: 200,
                message: "Logout Successful",
                data: null,
                error_message: null
            };
        } catch (err) {
            // Rethrow the specific HTTP exception if it originated from within our try block
            if (err instanceof UnauthorizedException) {
                throw err;
            }
            throw new InternalServerErrorException("Internal server error occurred please try again later");
        }
    }

    async changePassword(userId: string, body: changePasswordDto) {
        try {
            const { oldPassword, newPassword } = body;

            // 1. Fetch the user
            const user = await this.userRepository.findOne({ where: { id: userId } });

            // 2. Verify old password
            if (!user || !(await bcrypt.compare(oldPassword, user.passwordHash))) {
                // Changed message slightly to make sense for a password change screen
                throw new UnauthorizedException('Incorrect old password');
            }

            // 3. Hash the new password
            const newPasswordHash = await bcrypt.hash(newPassword, 10);

            // 4. Update the password in the database
            await this.userRepository.update(userId, {
                passwordHash: newPasswordHash
            });

            await this.refreshTokenRepository.delete({ userId: userId });
            return {
                status: 200,
                message: "Password changed successfully",
                data: null,
                error_message: null
            };

        } catch (err) {
            // CRITICAL: Prevent NestJS from overriding your UnauthorizedException
            if (err instanceof UnauthorizedException) throw err;

            throw new InternalServerErrorException("An error occurred while changing your password");
        }
    }
}