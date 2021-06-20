import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne } from "typeorm";
import { IsBoolean, IsDate, IsEmail, IsEnum, IsOptional, Length } from "class-validator";
import { Project } from "./project";

export enum Medium {
    SMS = "sms",
    EMAIL = "email",
    WHATSAPP = "whatsapp",
    TELEGRAM = "telegram"
}
export enum Type {
    NUMBER = "number",
    URL = "url",
}

@Entity()
export class Otp extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 200 })
    @Length(4, 200)
    value: string;

    @Column({ length: 800 })
    @Length(0, 800)
    meta: string;

    @Column({
        type: "enum",
        enum: Medium
    })
    @IsEnum(Medium)
    medium: Medium;

    @Column({
        type: "enum",
        enum: Type
    })
    @IsEnum(Type)
    type: Type;

    @Column({ length: 30, nullable: true })
    @IsOptional()
    @Length(4, 30)
    recipientPhone: string;

    @Column({ length: 100, nullable: true })
    @IsOptional()
    @Length(4, 100)
    @IsEmail()
    recipientEmail: string;

    @Column({ type: "timestamptz" })
    @IsDate()
    expiry: Date;

    @Column()
    @IsBoolean()
    isActive: boolean;

    @ManyToOne(type => Project, project => project.otps)
    project: Project;

}

export const otpSchema = {
    id: { type: "string", required: true, example: "aed3-hfw" },
    value: { type: "string", required: true, example: "1023423" },
    meta: { type: "string", required: true, example: "{'name':'teezzan'}" },
    medium: { type: "string", required: true, example: "email" },
    type: { type: "string", required: true, example: "url" },
    recipientPhone: { type: "string", required: false, example: "2348112233445" },
    recipientEmail: { type: "string", required: false, example: "teegge@gmail.com" },
    expiry: { type: "Date", required: true, example: "2021-06-20T11:48:27.777Z" },
    isActive: { type: "boolean", required: true, example: true },
    project: { type: "string", required: true, example: "aed3-hfw" },
};