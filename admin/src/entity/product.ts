import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    image: string;

    @Column()
    price: number;

    @Column()
    description: string;

    @Column({default: 0})
    likes: number;

    @Column()
    date_created: string;

    @Column()
    date_updated: string;
}
