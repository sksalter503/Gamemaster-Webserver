import { InitiativeEntity } from './entity/initiative.entity';
import { UUID } from 'crypto';
import { myDataSource } from './app-data-source';

const dataSource = myDataSource;

try {
    dataSource.initialize();
    console.log("Data Source has been initialized!");
} catch (err) {
    console.error("Error during Data Source initialization:", err);
}

export function getIndexById(id: UUID, initiatives: InitiativeEntity[]): number | null {
    const index = initiatives.findIndex(init => init.id === id);
    return index == -1 ? null : index;
}

export function createInitiative(initiative: InitiativeEntity): Promise<InitiativeEntity> {
    return myDataSource.manager.save(initiative);
}

export function getInitiatives(): Promise<InitiativeEntity[]> {
    return myDataSource.getRepository(InitiativeEntity).
        find({
            order: {
                initiative: "DESC"
            }
        });
}

export function initiativesExist(): Promise<boolean> {
    return myDataSource.getRepository(InitiativeEntity).count().then(count => count > 0);
}

export function initiativeCount(): Promise<number> {
    return myDataSource.getRepository(InitiativeEntity).count();
}

export function deleteAllInitiatives(): Promise<void> {
    return myDataSource.getRepository(InitiativeEntity).clear();
}

export function deleteInitiativeById(id: UUID): Promise<void> {
    return myDataSource.getRepository(InitiativeEntity).delete(id).then(() => { });
}

export function getInitiativeById(id: UUID): Promise<InitiativeEntity | null> {
    return myDataSource.getRepository(InitiativeEntity).findOneBy({ id });
}

export function saveInitiative(initiative: InitiativeEntity): Promise<InitiativeEntity> {
    return myDataSource.manager.save(initiative);
}