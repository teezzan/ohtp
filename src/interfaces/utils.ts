import { Length, IsEmail, IsDate, IsBoolean, IsOptional, IsString } from "class-validator";

export class Login {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    password: string;

  }