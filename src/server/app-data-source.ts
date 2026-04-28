import "reflect-metadata";
import { DataSource } from "typeorm";
import { InitiativeEntity } from "./entity/initiative.entity";
import { UserEntity } from "./entity/user.entity";

export const myDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: parseInt(process.env.DB_PORT as string) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [InitiativeEntity, UserEntity],
    synchronize: true,
    connectorPackage: "mysql2"
});