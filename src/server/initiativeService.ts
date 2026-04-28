import { InitiativeEntity } from './entity/initiative.entity';
import { myDataSource } from './app-data-source';
import { Initiative } from '../shared/initiative';
import { getUserById } from './userService';

export const dataSource = myDataSource;

export function getIndexById(id: string, initiatives: InitiativeEntity[]): number | null {
    const index = initiatives.findIndex(init => init.id === id);
    return index == -1 ? null : index;
}

export async function createInitiative(user: { id: string }, initiative: Initiative): Promise<InitiativeEntity> {

    //Check to see if user exists and exit if it does not
    const userEntity = await getUserById(user.id);
    if (!userEntity) {
        throw new Error(`User with id ${user.id} not found`);
    }
    //Create the instance of the initiative
    let initiativeEntity = myDataSource.manager.create(InitiativeEntity, {
        user: userEntity,
        name: initiative.name,
        initiative: initiative.initiative,
        health: initiative.health,
        maxHealth: initiative.maxHealth,
        hideHealthValue: initiative.hideHealthValue,
        hideHealthBar: initiative.hideHealthBar,
        status: initiative.status
    });

    return await myDataSource.manager.save(initiativeEntity); //Should contain the generated id after save
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

export function deleteInitiativeById(id: string): Promise<void> {
    return myDataSource.getRepository(InitiativeEntity).delete(id).then(() => { });
}

export function getInitiativeById(id: string): Promise<InitiativeEntity | null> {
    return myDataSource.getRepository(InitiativeEntity).findOneBy({ id });
}

export function getInitiativeByIdWithUser(id: string): Promise<InitiativeEntity | null> {
    return myDataSource.getRepository(InitiativeEntity).findOne({
        where: { id },
        relations: ['user']
    });
}

export function saveInitiative(initiative: InitiativeEntity): Promise<InitiativeEntity> {
    return myDataSource.manager.save(initiative);
}