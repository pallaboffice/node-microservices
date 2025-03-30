import {Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn} from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    image: string;

    @Column({type: "decimal", precision: 10, scale: 2, default: 0})
    price: number;

    @Column()
    description: string;

    @Column({default: 0})
    likes: number;

    @Column({type: 'timestamp'})
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
