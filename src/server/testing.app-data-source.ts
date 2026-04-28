import { DataSource } from 'typeorm';
import { InitiativeEntity } from './entity/initiative.entity';
import { UserEntity } from './entity/user.entity';

export const myDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    synchronize: true,
    logging: false,
    entities: [InitiativeEntity, UserEntity],
})