import "reflect-metadata";
import { DataSource } from "typeorm";
import { InitiativeEntity } from "./entity/initiative.entity";
import { UserEntity } from "./entity/user.entity";
import { RoomEntity } from "./entity/room.entity";

export const myDataSource = (process.env.NODE_ENV === 'test') ? //If the environment is currently in test mode, use the in-memory SQLite database

    new DataSource({
        type: 'sqlite',
        database: ':memory:',
        dropSchema: true,
        synchronize: true,
        logging: false,
        entities: [InitiativeEntity, UserEntity, RoomEntity],
    }) :

    new DataSource({
        type: "mysql",
        host: "localhost",
        port: parseInt(process.env.DB_PORT as string) || 3306,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [InitiativeEntity, UserEntity, RoomEntity],
        synchronize: true,
        connectorPackage: "mysql2"
    });