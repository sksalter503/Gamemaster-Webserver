import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm"
import { InitiativeEntity } from "./initiative.entity"
import { User } from "../../shared/user"

@Entity()
export class UserEntity implements User {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ nullable: true })
    username?: string

    @Column({ nullable: true })
    password?: string

    @OneToMany(() => InitiativeEntity, initiative => initiative.user, { cascade: true, eager: true })
    initiatives!: InitiativeEntity[]

}