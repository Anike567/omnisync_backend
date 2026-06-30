// src/auth/auth.service.ts
import { Body, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';

import { User } from 'src/modules/user/user.entity';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SignupDto } from './dto/signup.dto';
import { changePasswordDto } from './dto/changePassword.dto';
import { createHash } from 'node:crypto';
import { RedisService } from 'src/core/redis/redis.service'; // Switched to wrapper

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
        private readonly redisService: RedisService // Managed wrapper instance
    ) { }

  
    async login(body: LoginDto) {
        const user = await this.userRepository.findOne({ where: { email: body.email } });
        const isPasswordCorrect = await bcrypt.compare(body.password, user?.passwordHash);
        if (!user || !isPasswordCorrect) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = { id: user.id, username: user.username, email: user.email, tokenVersion: user.tokenVersion };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const rawRefreshToken = randomUUID();
        const hashedToken = createHash('sha256').update(rawRefreshToken).digest('hex');

        const tokenValiditySeconds = 7 * 24 * 60 * 60; // 7 days in seconds
        const expiresAt = new Date(Date.now() + tokenValiditySeconds * 1000);

        try {
            const existingSession = await this.refreshTokenRepository.findOne({ where: { userId: user.id } });

            if (existingSession) {
                await this.refreshTokenRepository.update(existingSession.id, { hashedToken, expiresAt });
            } else {
                const newToken = this.refreshTokenRepository.create({ userId: user.id, hashedToken, expiresAt });
                await this.refreshTokenRepository.save(newToken);
            }

            // 1. Sync Access Token Version Tracking
            await this.redisService.set(`user:auth:${user.id}`, user.tokenVersion, 900);

            // FIX 1: Include 'expiresAt' in Redis and apply a matching 7-day TTL expiration window
            await this.redisService.set(
                `refresh-token:${user.id}`,
                { hashedToken, expiresAt: expiresAt.toISOString() },
                tokenValiditySeconds
            );

            return {
                status: 200,
                message: "Login successful",
                data: { accessToken, refreshToken: rawRefreshToken },
                error_message: null
            };
        } catch (err) {
            throw new InternalServerErrorException("Failed to process login session");
        }
    }

    async refresh(body: RefreshDto) {
        const { id, token } = body;

        let session = await this.redisService.get(`refresh-token:${id}`);
        if (!session) {
            session = await this.refreshTokenRepository.findOne({ where: { userId: id } });
        }

        if (!session) throw new UnauthorizedException("Session not found");

        // 2. Validate token
        const hasherRefreshToken = createHash('sha256').update(token).digest('hex');
        const isTokenValid = hasherRefreshToken === session.hashedToken;

        // FIX 2: Correctly parse the dynamic Redis ISO string or native DB date object
        const sessionExpiry = typeof session.expiresAt === 'string' ? new Date(session.expiresAt) : session.expiresAt;

        if (!isTokenValid || sessionExpiry <= new Date()) {
            await this.refreshTokenRepository.delete({ userId: id });
            await this.redisService.del(`refresh-token:${id}`);
            throw new UnauthorizedException("Session Expired, please login again");
        }

        const user = await this.userRepository.findOne({ where: { id: id } });
        if (!user) throw new UnauthorizedException("User no longer exists");

        const newRawRefreshToken = randomUUID();
        const newHashedToken = createHash('sha256').update(newRawRefreshToken).digest('hex');

        const tokenValiditySeconds = 7 * 24 * 60 * 60;
        const newExpiresAt = new Date(Date.now() + tokenValiditySeconds * 1000);

        try {
            // Update DB session structure
            await this.refreshTokenRepository.update({ userId: id }, {
                hashedToken: newHashedToken,
                expiresAt: newExpiresAt
            });

            // FIX 3: Remember to update the Redis session storage with the new token rotation properties!
            await this.redisService.set(
                `refresh-token:${user.id}`,
                { hashedToken: newHashedToken, expiresAt: newExpiresAt.toISOString() },
                tokenValiditySeconds
            );

            // Re-sync Redis version cache upon token refresh operation
            await this.redisService.set(`user:auth:${user.id}`, user.tokenVersion, 900);

            return {
                status: 200,
                message: "Session refreshed",
                data: {
                    accessToken: this.jwtService.sign({ id: user.id, username: user.username, email: user.email, tokenVersion: user.tokenVersion }, { expiresIn: '15m' }),
                    refreshToken: newRawRefreshToken
                },
                error_message: null
            };
        } catch (err) {
            throw new InternalServerErrorException("Failed to refresh session");
        }
    }

    async signup(body: SignupDto) {
        const userExists = await this.userRepository.findOne({ where: { email: body.email } });
        if (userExists) throw new ConflictException('Email already in use');

        const isUsernameTaken = await this.userRepository.findOne({ where: { username: body.username } });
        if (isUsernameTaken) throw new ConflictException('Username already in use');

        try {
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
        } catch (err) {
            throw new InternalServerErrorException("An error occurred during signup");
        }
    }

    async logout(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException("User not found");

        try {
            // Clean out data stores smoothly without crashing if rows were pre-deleted
            await this.refreshTokenRepository.delete({ userId });
            await this.redisService.del(`refresh-token:${userId}`);

            // Bump version to guarantee outstanding access tokens stop working instantly
            await this.userRepository.update(userId, {
                tokenVersion: user.tokenVersion + 1
            });
            await this.redisService.del(`user:auth:${userId}`);

            return {
                status: 200,
                message: "Logout successful",
                data: null,
                error_message: null
            };
        } catch (err) {
            throw new InternalServerErrorException("An error occurred during logout");
        }
    }

    async changePassword(userId: string, body: changePasswordDto) {
        const { oldPassword, newPassword } = body;
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user || !(await bcrypt.compare(oldPassword, user.passwordHash))) {
            throw new UnauthorizedException('Incorrect old password');
        }

        try {
            const newPasswordHash = await bcrypt.hash(newPassword, 10);

            await this.userRepository.update(userId, {
                passwordHash: newPasswordHash,
                tokenVersion: user.tokenVersion + 1
            });

            await this.refreshTokenRepository.delete({ userId: userId });

            // Clean up the Redis token version record immediately
            await this.redisService.del(`user:auth:${userId}`);

            return {
                status: 200,
                message: "Password changed successfully. Please log in again.",
                data: null,
                error_message: null
            };
        } catch (err) {
            throw new InternalServerErrorException("An error occurred while changing your password");
        }
    }
}