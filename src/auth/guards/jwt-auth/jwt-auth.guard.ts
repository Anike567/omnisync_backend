// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // This guard automatically validates the JWT in the 'Authorization: Bearer <token>' header
  
  canActivate(context: ExecutionContext) {
    // You can add custom logging or logic here
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // If JWT is invalid or missing, throw a custom error
    if (err || !user) {
      throw err || new UnauthorizedException('You must be logged in to access this resource');
    }
    return user;
  }
}