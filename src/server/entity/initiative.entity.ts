import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm"
import { UUID } from "crypto"
import { User } from "./user.entity"
import { Initiative, Status } from "../../shared/initiative";

@Entity()
export class InitiativeEntity implements Initiative {
    @PrimaryGeneratedColumn('uuid')
    id: UUID

    @ManyToOne(() => User, user => user.initiatives, { eager: true })
    user: User

    @Column()
    name: string

    @Column()
    initiative: number

    @Column()
    health?: number

    @Column()
    maxHealth?: number

    @Column()
    hideHealthValue?: boolean

    @Column()
    hideHealthBar?: boolean

    @Column("varchar", { array: true })
    status?: Status[]

    constructor(id: UUID, user: User, name: string, initiative: number, health?: number, maxHealth?: number, hideHealthValue?: boolean, hideHealthBar?: boolean, status?: Status[]) {
        this.id = id
        this.user = user
        this.name = name
        this.initiative = initiative
        this.health = health
        this.maxHealth = maxHealth
        this.hideHealthValue = hideHealthValue
        this.hideHealthBar = hideHealthBar
        this.status = status
    }
}