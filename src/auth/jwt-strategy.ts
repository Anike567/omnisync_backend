// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/user/user.entity'; 
import { RedisService } from 'src/core/redis/redis.service'; // Use our wrapper service

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly redisService: RedisService // Clean, global wrapper injection
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'secretKey', // Replace with configService.get('JWT_SECRET') if using env variables
    });
  }

  async validate(payload: any) {
    const userId = payload.id;
    
    // 1. Pull token version from high-speed cache
    let tokenVersion = await this.redisService.get<number>(`user:auth:${userId}`);

    // 2. Fallback to Database if cache missing (and re-populate cache)
    if (tokenVersion === null) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: { id: true, tokenVersion: true }
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists.');
      }

      tokenVersion = user.tokenVersion;
      
      // Sync cache state back up for the next request
      await this.redisService.set(`user:auth:${userId}`, tokenVersion, 900); // 15 mins matching access token
    }

    // 3. String/Number type mismatch safely avoided via Number coercion or generic parsing
    if (Number(tokenVersion) !== Number(payload.tokenVersion)) {
      throw new UnauthorizedException('Session invalidated. Please log in again.');
    }

    return payload;
  }
}