import { IsEmail, IsOptional, IsString } from "class-validator";

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

export class EditUser {
  @IsString()
  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  name: string;

}
export const editSchema = {
  email: { type: "string", required: false, example: "avileslopez.javier@gmail.com" },
  password: { type: "string", required: false, example: "avileslopez" },
  name: { type: "string", required: false, example: "avileslopez" }
};

export class ForgetPassword {
  @IsString()
  @IsEmail()
  email: string;
}
export const forgetpasswordSchema = {
  email: { type: "string", required: true, example: "avileslopez.javier@gmail.com" }
};
export class Token {
  @IsString()
  token: string;
}
export const tokenSchema = {
  token: { type: "string", required: true, example: "avileslopez.javier@gmail.com" }
};

export class PasswordAndToken {
  @IsString()
  token: string;

  @IsString()
  password: string;
}
export const passwordTokenSchema = {
  token: { type: "string", required: true, example: "avileslopez.javier@gmail.com" },
  password: { type: "string", required: true, example: "sddj34edcom" }
};