// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/user/user.entity'; // Adjust this path to your actual User entity

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>, // 1. Inject the repository
  ) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: 'secretKey', // Replace with configService.get('JWT_SECRET') if using env variables
    });
  }

  async validate(payload: any) {
    // Note: If you changed your payload key to 'sub' in AuthService, use payload.sub instead of payload.id
    const userId = payload.id; 

    // 2. Fetch the current token version from the database
    const user = await this.userRepository.findOne({
        where: { id: userId },
        select: { id: true, email: true, username: true, phoneNumber: true , tokenVersion : true}
    });

    // 3. If user doesn't exist OR the token's version doesn't match the DB, reject them
    if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Session invalidated. Please log in again.');
    }

    // 4. This object gets attached to your Request context as 'req.user'
    return { userId: user.id, email: user.email, username: user.username };
  }
}