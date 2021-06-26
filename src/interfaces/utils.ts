import { IsEmail, IsString } from "class-validator";

export class Login {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    password: string;

  }
  export const loginSchema = {
    email: { type: "string", required: true, example: "avileslopez.javier@gmail.com" },
    password: { type: "string", required: true, example: "avileslopez" }
};