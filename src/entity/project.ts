import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany } from "typeorm";
import { Length } from "class-validator";
import { Otp } from "./otp";

@Entity()
export class Project extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        length: 80
    })
    @Length(10, 80)
    name: string;

    @OneToMany(type => Otp, otp => otp.project)
    otps: Otp[];

    @Column({
        length: 80
    })
    @Length(10, 80)
    private_key: string;

    @Column({
        length: 80
    })
    @Length(10, 80)
    public_key: string;
    
}

export const projectSchema = {
    id: { type: "number", required: true, example: "qe3e4-43d21" },
    name: { type: "string", required: true, example: "Cdenv" }
};