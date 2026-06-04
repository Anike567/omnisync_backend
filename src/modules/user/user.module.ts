import { Module } from "@nestjs/common";
import { User } from "./user.entity";
import { TypeOrmModule } from "@nestjs/typeorm/dist/typeorm.module";
import {AuthController} from "../../auth/auth.controller";
import {AuthService} from "../../auth/auth.service";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [AuthController],
    providers: [AuthService]
})
export class UserModule {}