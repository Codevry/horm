import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number | undefined

    @Column()
    name!: string

    @Column()
    uniqueId!: string

    @Column({default: true})
    isActive!: boolean
}