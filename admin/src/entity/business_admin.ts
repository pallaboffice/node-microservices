import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class BusinessAdmin{
    @PrimaryGeneratedColumn()
    bid: number;

    @Column()
    email_address: string;

    @Column()
    password: string;
}