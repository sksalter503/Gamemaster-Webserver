import { UserEntity } from "./entity/user.entity";
import { myDataSource } from "./app-data-source";
import { InitiativeEntity } from "./entity/initiative.entity";

export function getUserById(id: string): Promise<UserEntity | null> {
    return myDataSource.getRepository(UserEntity).findOne({
        where: { id },
        relations: ["initiatives"]
    });
}

export function createUser(username: string, password: string): Promise<UserEntity> {
    const user = myDataSource.manager.create(UserEntity, {
        username,
        password
    });
    return myDataSource.manager.save(user);
}

export function getInitiativesByUserId(userId: string): Promise<InitiativeEntity[] | null> {
    return myDataSource.getRepository(UserEntity).findOne({
        where: { id: userId },
        relations: ["initiatives"]
    }).then(user => user ? user.initiatives : null);
}

export function loginUser(username: string, password: string): Promise<UserEntity | null> {
    return myDataSource.getRepository(UserEntity).findOne({
        where: { username, password }
    });
}