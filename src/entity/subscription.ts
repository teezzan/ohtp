import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import {  IsDate, Length, IsNumber } from "class-validator";
import { Project } from "./project";


@Entity()
export class Subscription{
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 200 })
    @Length(4, 200)
    value: string;

    @Column()
    @IsNumber()
    total: number

    @Column()
    @IsNumber()
    current: number

    @Column({ type: "timestamptz" })
    @IsDate()
    expiry: Date;


    @ManyToOne(() => Project)
    @JoinColumn()
    project: Project

}

export const subscriptionSchema = {
    id: { type: "string", required: true, example: "aed3-hfw" },
    value: { type: "string", required: true, example: "1023423" },
    total: { type: "number", required: true, example: 1023423 },
    current: { type: "number", required: true, example: 102 },
    expiry: { type: "Date", required: true, example: "2021-06-20T11:48:27.777Z" },
    project: { type: "string", required: true, example: "aed3-hfw" },
};