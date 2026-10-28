import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from "typeorm"
import { UserEntity } from "./user.entity"
import { InitiativeEntity } from "./initiative.entity"
import { Room } from "../../shared/room"

@Entity()
export class RoomEntity implements Room {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @ManyToOne(() => UserEntity, user => user.adminRooms)
    @JoinColumn({ name: "adminId" })
    admin!: UserEntity

    @Column("varchar")
    name!: string

    @ManyToMany(() => UserEntity)
    @JoinTable()
    players!: UserEntity[]

    @OneToMany(() => InitiativeEntity, (initiative) => initiative.room, { cascade: true, eager: true })
    initiatives!: InitiativeEntity[]

    @Column("boolean", { default: false })
    combatStarted!: boolean

    @Column("integer", { default: 0 })
    turnIndex!: number

}