import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    login(body: LoginDto): Object {
        return {
            "status": 200,
            "message": "Login successful",
            "data": { "token": "dummy-token" },
            "error_message": null
        }
    }
}
