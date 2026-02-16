import { DataSource } from "typeorm"
import { InitiativeEntity } from "./entity/initiative.entity"
import { User } from "./entity/user.entity"

export const myDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "shane",
    password: "newa5535",
    database: "dnd",
    entities: [InitiativeEntity, User],
    logging: true,
    synchronize: true,
    driver: require('mysql2')
})
