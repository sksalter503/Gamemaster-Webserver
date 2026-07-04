import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm"
import { UserEntity } from "./user.entity"
import { Initiative, Status } from "../../shared/initiative";
import { RoomEntity } from "./room.entity";

@Entity()
export class InitiativeEntity implements Initiative {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @ManyToOne(() => UserEntity, user => user.initiatives)
    user!: UserEntity

    @ManyToOne(() => RoomEntity, room => room.initiatives)
    room!: RoomEntity

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