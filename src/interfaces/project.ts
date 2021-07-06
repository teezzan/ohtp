import { IsEmail, IsOptional, IsString, Length } from "class-validator";

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
