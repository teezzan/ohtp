import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Length } from "class-validator";

@Entity()
export class Project extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 80
    })
    @Length(10, 80)
    name: string;




}

export const projectSchema = {
    id: { type: "number", required: true, example: 1 },
    name: { type: "string", required: true, example: "Cdenv" }
};