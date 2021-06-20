import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { IsDate, IsEmail, IsOptional, Length } from "class-validator";

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




}

export const otpSchema = {
    id: { type: "string", required: true, example: "aed3-hfw" },
    name: { type: "string", required: true, example: "Cdenv" }
};