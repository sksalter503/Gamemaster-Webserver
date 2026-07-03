import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm"
import { InitiativeEntity } from "./initiative.entity"
import { User } from "../../shared/user"
import { RoomEntity } from "./room.entity"

@Entity()
export class UserEntity implements User {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ nullable: true })
    username?: string

    @Column({ nullable: true })
    password?: string

    @OneToMany(() => RoomEntity, room => room.admin)
    adminRooms!: RoomEntity[]

    @OneToMany(() => InitiativeEntity, initiative => initiative.user, { cascade: true, eager: true })
    initiatives!: InitiativeEntity[]

}