import { RoomEntity } from "./entity/room.entity";
import { myDataSource } from "./app-data-source";
import { UserEntity } from "./entity/user.entity";
import { getUserById } from "./userService";
import { InitiativeEntity } from "./entity/initiative.entity";

export function getRoomById(id: string): Promise<RoomEntity | null> {
    return myDataSource.getRepository(RoomEntity).findOne({
        where: { id },
        relations: ["admin", "players", "initiatives"]
    });
}

export function getAllJoinedRoomsByUserId(userId: string): Promise<RoomEntity[]> {
    return myDataSource.getRepository(RoomEntity).createQueryBuilder("room")
        .leftJoinAndSelect("room.players", "player")
        .where("player.id = :userId", { userId })
        .getMany();
}

export function createRoom(adminId: string, name: string): Promise<RoomEntity> {
    return getUserById(adminId).then(admin => {
        if (!admin) {
            throw new Error("Admin's user is not found");
        }
        const room = new RoomEntity();
        room.admin = admin;
        room.name = name;
        return myDataSource.getRepository(RoomEntity).save(room);
    });
}

export function addPlayerToRoom(roomId: string, playerId: string): Promise<RoomEntity> {
    return Promise.all([
        getRoomById(roomId),
        getUserById(playerId)
    ]).then(([room, player]) => {
        if (!room) {
            throw new Error("Room not found");
        }
        if (!player) {
            throw new Error("Player not found");
        }
        if (!room.players) {
            room.players = [];
        }
        if (!room.players.some(p => p.id === player.id)) {
            room.players.push(player);
        } else {
            throw new Error("Player is already in the room");
        }
        return myDataSource.getRepository(RoomEntity).save(room);
    });
}

export function removePlayerFromRoom(roomId: string, playerId: string): Promise<RoomEntity> {
    return getRoomById(roomId).then(room => {
        if (!room) {
            throw new Error("Room not found");
        }
        room.players = room.players.filter(player => player.id !== playerId);
        return myDataSource.getRepository(RoomEntity).save(room);
    });
}

export function deleteRoom(roomId: string): Promise<void> {
    return myDataSource.getRepository(RoomEntity).delete(roomId).then(() => { });
}

export function addInitiativeToRoom(roomId: string, initiativeId: string): Promise<RoomEntity> {
    return Promise.all([
        getRoomById(roomId),
        myDataSource.getRepository(InitiativeEntity).findOne({
            where: { id: initiativeId }
        })
    ]).then(([room, initiative]) => {
        if (!room) {
            throw new Error("Room not found");
        }
        if (!initiative) {
            throw new Error("Initiative not found");
        }
        if (!room.initiatives) {
            room.initiatives = [];
        }
        if (!room.initiatives.some(init => init.id === initiative.id)) {
            room.initiatives.push(initiative);
        } else {
            throw new Error("Initiative is already in the room");
        }
        return myDataSource.getRepository(RoomEntity).save(room);
    });
}

export function removeInitiativeFromRoom(roomId: string, initiativeId: string): Promise<RoomEntity> {
    return getRoomById(roomId).then(room => {
        if (!room) {
            throw new Error("Room not found");
        }
        room.initiatives = room.initiatives.filter(init => init.id !== initiativeId);
        myDataSource.getRepository(InitiativeEntity).delete(initiativeId);
        return myDataSource.getRepository(RoomEntity).save(room);
    });
}

export function getCombatStatus(roomId: string): Promise<{ combatStarted: boolean, turnIndex: number }> {
    return getRoomById(roomId).then(room => {
        if (!room) {
            throw new Error("Room not found");
        }
        return { combatStarted: room.combatStarted, turnIndex: room.turnIndex };
    });
}

export function setCombatStatus(roomId: string, combatStarted: boolean, turnIndex: number): Promise<RoomEntity> {
    return getRoomById(roomId).then(room => {
        if (!room) {
            throw new Error("Room not found");
        }
        room.combatStarted = combatStarted;
        room.turnIndex = turnIndex;
        return myDataSource.getRepository(RoomEntity).save(room);
    });
}

export function getInitiativesInRoom(roomId: string): Promise<InitiativeEntity[]> {
    return getRoomById(roomId).then(room => {
        if (!room) {
            throw new Error("Room not found");
        }
        if (!room.initiatives) {
            return [];
        }
        return room.initiatives;
    });
}

export function incrementTurnIndex(roomId: string): Promise<RoomEntity> {
    return getRoomById(roomId).then(room => {
        if (!room) {
            throw new Error("Room not found");
        }
        room.turnIndex++;
        if (room.turnIndex >= room.initiatives.length) {
            room.turnIndex = 0; // Wrap around to the beginning if it exceeds the number of initiatives
        }
        return myDataSource.getRepository(RoomEntity).save(room);
    });
}

export function updateTurnIndex(roomId: string, newTurnIndex: number): Promise<RoomEntity> {
    return getRoomById(roomId).then(room => {
        if (!room) {
            throw new Error("Room not found");
        }
        if (newTurnIndex < 0) { // I am allowing for the new turn index to be equal to the number of initiatives, because this will indicate a new one is going to be added before the current turn and the turn index will be incremented to account for it.  This is a special case that will be handled in the app.ts file.
            throw new Error("Invalid turn index");
        }
        room.turnIndex = newTurnIndex;
        return myDataSource.getRepository(RoomEntity).save(room);
    });
}