import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { Length } from "class-validator";
import { Otp } from "./otp";
import { Subscription } from "./subscription";
import { User } from "./user";

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

    @OneToOne(() => Subscription)
    @JoinColumn()
    subscription: Subscription;

    @ManyToOne(() => User)
    @JoinColumn()
    user: User
}

export const projectSchema = {
    id: { type: "number", required: true, example: "qe3e4-43d21" },
    name: { type: "string", required: true, example: "Cdenv" },
    otps: { type: "array", required: false, example: ["yy78"] },
    private_key: { type: "string", required: false, example: "pk-yyhgyyu7y6654ed4" },
    public_key: { type: "string", required: false, example: "sk-ui9ii0oi0iiiuy777" },
    subscription: { type: "string", required: false, example: "qe3e4-43d21" },
};