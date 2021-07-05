import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Length, IsEmail, IsDate, IsBoolean, IsOptional } from "class-validator";

@Entity()
export class User  extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 80
    })
    @Length(1, 80)
    name: string;

    @Column({
        length: 100,
        unique: true
    })
    @Length(1, 100)
    @IsEmail()
    email: string;

    @Column({
        length: 300,
        nullable: true,
        select: false
    })
    @Length(8, 300)
    password: string;

    @Column({
        length: 20,
        nullable: true,
        default: null
    })
    @Length(0, 20)
    @IsOptional()
    otp: string;

    @Column({ type: "timestamptz",nullable: true, default: null})
    @IsDate()
    @IsOptional()
    otp_expiry: Date;

    @Column({default: false})
    @IsBoolean()
    @IsOptional()
    isVerified: boolean;


}

export const userSchema = {
    id: { type: "number", required: false, example: 1 },
    name: { type: "string", required: true, example: "Javier" },
    email: { type: "string", required: true, example: "avileslopez.javier@gmail.com" },
    password: { type: "string", required: true, example: "avileslopez" },
    otp: { type: "string", required: false, example: "128127" },
    otp_expiry: { type: "string", required: false, example: "2021-06-20T11:48:27.777Z"},
    isVerified: { type: "boolean", required: false, example: false },
};