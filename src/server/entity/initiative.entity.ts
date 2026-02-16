import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm"
import { UUID } from "crypto"
import { User } from "./user.entity"
import { Initiative, Status } from "../../shared/initiative";

@Entity()
export class InitiativeEntity implements Initiative {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @ManyToOne(() => User, user => user.initiatives)
    user!: User

    @Column()
    name!: string

    @Column()
    initiative!: number

    @Column({ nullable: true })
    health?: number

    @Column({ nullable: true })
    maxHealth?: number

    @Column({ nullable: true })
    hideHealthValue?: boolean

    @Column({ nullable: true })
    hideHealthBar?: boolean

    @Column("json", { nullable: true })
    status?: Status[]
}