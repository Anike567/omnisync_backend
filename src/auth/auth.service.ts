import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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

    async login(body: LoginDto) {
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

    async refresh(body: RefreshDto) {
        const { id, token } = body;

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

    async signup(body: SignupDto) {
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
}