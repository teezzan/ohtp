import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class CreateProject {
    @IsString()
    @Length(0, 50)
    name: string;
}
export const createProjectSchema = {
    name: { type: "string", required: true, example: "circa" }
};
