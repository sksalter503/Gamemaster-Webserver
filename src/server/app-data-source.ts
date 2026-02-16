import { DataSource } from "typeorm"

export const myDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "shane",
    password: "newa5535",
    database: "dnd",
    entities: ["src/server/entity/*.entity.js"],
    logging: true,
    synchronize: true,
    driver: require('mysql2')
})
