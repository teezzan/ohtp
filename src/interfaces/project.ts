import { IsEmail, IsInt, IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";

export class CreateProject {
    @IsString()
    @Length(0, 50)
    name: string;
}
export const createProjectSchema = {
    name: { type: "string", required: true, example: "circa" }
};

export class EditProject {
    @IsString()
    @Length(0, 50)
    name: string;

    @IsString()
    @Length(0, 50)
    webhook_url: string;

    @IsString()
    @Length(0, 50)
    callback_url: string;
}

export const editProjectSchema = {
    name: { type: "string", required: false, example: "circa" },
    webhook_url: { type: "string", required: false, example: "https://webhook.site/ac8f5129-8ca4-46a8-b8a2-4927780b3205" },
    callback_url: { type: "string", required: false, example: "https://webhook.site/ac8f5129-8ca4-46a8-b8a2-4927780b3205" }
};

export class GenerateEmailOTP {
    @IsString()
    @Length(0, 100)
    @IsEmail()
    email: string;

    @IsInt()
    @IsOptional()
    expiry: number;

    @IsString()
    @Length(0, 10)
    type: string;

    @IsString()
    @Length(0, 800)
    @IsOptional()
    meta: string;
}
export const generateEmailOTPSchema = {
    email: { type: "string", required: true, example: "tee@gee.mail" },
    type: { type: "string", required: true, example: "url" },
    meta: { type: "object", required: false, example: { tee: 1 } },
    expiry: { type: "number", required: false, example: 8 },
};


export class GenerateSMSOTP {
    @IsString()
    @Length(0, 100)
    @IsPhoneNumber()
    phone: string;

    @IsInt()
    @IsOptional()
    expiry: number;

    @IsString()
    @Length(0, 800)
    @IsOptional()
    meta: string;
}
export const generateSMSOTPSchema = {
    phone: { type: "string", required: true, example: "+2349061696207" },
    meta: { type: "object", required: false, example: { transactionHAsh: "baishqui389q8sqb98eh9", time: new Date() } },
    expiry: { type: "number", required: false, example: 8 },
};

export interface WebHookPayload {

    secret_key: string,
    webhook_url: string,
    meta: string,
    medium: string,
    type: string
}

export interface SMSPayload {
    message: string,
    from: string,
    to: string
}