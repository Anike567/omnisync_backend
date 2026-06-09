import { IsNotEmpty, IsString } from "class-validator";

export class changePasswordDto{
    @IsNotEmpty()
    @IsString()
    oldPassword !:string

    @IsNotEmpty()
    @IsString()
    newPassword !:string
}