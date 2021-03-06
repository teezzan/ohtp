import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { IsOptional, IsUrl, Length } from "class-validator";
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
    @Length(0, 80)
    name: string;

    @OneToMany(type => Otp, otp => otp.project)
    otps: Otp[];

    @Column({ length: 80, nullable: true, default: null, select: false })
    @Length(1, 80)
    @IsOptional()
    secret_key: string;

    @Column({ length: 80, nullable: true, default: null, select: false })
    @IsOptional()
    @Length(1, 80)
    public_key: string;

    @Column({ length: 200, nullable: true, default: null, select: false })
    @IsOptional()
    @IsUrl()
    @Length(1, 200)
    webhook_url: string;

    @Column({ length: 200, nullable: true, default: null, select: false })
    @IsOptional()
    @IsUrl()
    @Length(1, 200)
    callback_url: string;

    @OneToOne(() => Subscription)
    @IsOptional()
    @JoinColumn()
    subscription: Subscription;

    @ManyToOne(() => User)
    @JoinColumn()
    user: User

    // @Column()
    // @IsOptional()
    // subscription: number;
}

export const projectSchema = {
    id: { type: "number", required: true, example: "qe3e4-43d21" },
    name: { type: "string", required: true, example: "Cdenv" },
    otps: { type: "array", required: false, example: ["yy78"] },
    private_key: { type: "string", required: false, example: "pk-yyhgyyu7y6654ed4" },
    public_key: { type: "string", required: false, example: "sk-ui9ii0oi0iiiuy777" },
    subscription: { type: "string", required: false, example: "qe3e4-43d21" },
};