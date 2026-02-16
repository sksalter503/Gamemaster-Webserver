import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm"
import { UUID } from "crypto"
import { InitiativeEntity } from "./initiative.entity"

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: UUID

    @Column()
    username?: string

    @Column()
    password?: string

    @OneToMany(() => InitiativeEntity, initiative => initiative.user, { cascade: true, eager: true })
    initiatives: InitiativeEntity[]

    constructor(id: UUID, initiatives: InitiativeEntity[], username?: string, password?: string) {
        this.id = id
        this.initiatives = initiatives
        this.username = username
        this.password = password
    }
}