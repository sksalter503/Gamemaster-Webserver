import express from 'express';
import path from 'path';
import cors from 'cors';
import { Initiative, Status } from '../shared/initiative';
require('dotenv').config();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
import {
    getIndexById, createInitiative, getInitiatives, deleteInitiativeById, getInitiativeById,
    saveInitiative,
    dataSource,
    getInitiativeByIdWithUser
} from './initiativeService';
import { InitiativeEntity } from './entity/initiative.entity';
import { createUser, getInitiativesByUserId, getUserById, loginUser } from './userService';
import { UserEntity } from './entity/user.entity';
import { get } from 'http';
import { addInitiativeToRoom, deleteAllInitiativesInRoom, getCombatStatus, getInitiativesInRoom, incrementTurnIndex, initiativesExist, removeInitiativeFromRoom, setCombatStatus, updateTurnIndex } from './roomService';

const fs = require('fs');
const app = express();
const port = 3000;

try {
    dataSource.initialize();
    console.log("Data Source has been initialized!");
} catch (err) {
    console.error("Error during Data Source initialization:", err);
}


/*
 * Initiative tracker stuff --- :
 * //TODO: Add a page at '/' where you can login and see all the rooms you are in, as well as join or create a room.
 * //TODO: Add custom turn 'your turn' colors for the initiative tracker.
 * //TODO: Add AC
 * //TODO: Add Movement speed
 * //TODO: Add Oauth to logins
 * 
 * DND Beyond Replacement Shit:
 * //TODO: Character sheet
 * //TODO: Searchable systems that use 5E.tools to do stuff.
 * //TODO: Better custom items.
 */

app.use(express.static("dist/client", {
    extensions: ['html', 'css', 'js']
}));
app.use(express.json());
app.use(cors());


//TODO: CHANGE THIS
app.get('/', (req, res) => {
    //Serve the index.html file from the dist/client directory
    res.sendFile(path.join(__dirname, '../../dist/client/index.html'));
});

// Posting a new initiative to the server, which will be added to the database and returned to the client.
app.post('/initiative', express.json(), async (req, res) => {
    console.log(`POST from ${req.ip}: ${JSON.stringify(req.body)}`);

    const initiative: Initiative = req.body.initiative;
    const user: any = req.body.user;
    const roomId: string = req.body.roomId;

    if (!initiative || !user || !roomId) {
        console.error(`ERROR: Invalid request body: ${JSON.stringify(req.body)}`);
        return res.status(400).send('Invalid request body');
    }

    const { combatStarted, turnIndex } = await getCombatStatus(roomId);
    const initiativesInRoom = await getInitiativesInRoom(roomId);

    if (combatStarted && initiativesInRoom.length > 0) {
        //Get the current initiative of whose turn it's supposed to be.
        const currentInitiative = initiativesInRoom[turnIndex];
        //See if the created initiative is before the current turn, and if so, increment the currentTurnIndex so that the current turn is still the same initiative.
        if (currentInitiative.initiative < initiative.initiative) {
            updateTurnIndex(roomId, turnIndex + 1);
        }
    }

    const initiativeEntity = await createInitiative(user, initiative);
    await addInitiativeToRoom(roomId, initiativeEntity.id);
    console.log(`Adding initiative: ${JSON.stringify(initiativeEntity)}`);

    res.status(201).json(initiativeEntity);
});

//Gets all the initiatives for a specific room, along with the current turn index and whether combat has started or not.
app.get('/room/:id', async (req, res) => {
    const roomId: string = req.params.id;
    const initiatives: Initiative[] = await getInitiativesInRoom(roomId);
    const { combatStarted, turnIndex } = await getCombatStatus(roomId);
    res.json({ initiatives, currentTurnIndex: turnIndex, combatStarted });
});

app.get('/room/:id/start', async (req, res) => {
    const roomId: string = req.params.id;
    console.log(`START combat for room ${roomId} from ${req.ip}`);

    await setCombatStatus(roomId, true, 0).catch(err => {
        console.error(`ERROR: ${err}`);
        return res.status(500).send('Error starting combat: ' + err.message);
    });
    res.status(200).send();
});

app.get('/room/:id/next', async (req, res) => {
    const roomId: string = req.params.id;
    console.log(`NEXT turn for room ${roomId} from ${req.ip}`);

    if (!await initiativesExist(roomId)) {
        return res.status(400).send('No initiatives available, cannot go to next turn');
    }

    // Get the current initiative based on the currentTurnIndex and decrement the duration of any statuses that have a duration, removing them if their duration reaches 0
    const initiatives = await getInitiativesInRoom(roomId);
    const { turnIndex } = await getCombatStatus(roomId);
    const currentInitiative = initiatives[turnIndex];
    if (currentInitiative) {
        let newStatuses: Status[] = [];
        currentInitiative.status?.forEach(status => {
            if (status.duration) {
                if (status.duration === 1) {
                    // If the status is expiring this turn, we want to remove it but not add it to the list of new statuses
                    // Statuses that have a value of 0 already are infinite, so we don't want to remove those
                    return;
                }
                const newDuration = status.duration - 1;
                newStatuses.push({ name: status.name, duration: newDuration });
            } else {
                newStatuses.push(status);
            }
        });
        currentInitiative.status = newStatuses;
        await saveInitiative(currentInitiative);
    }

    await incrementTurnIndex(roomId);
    res.status(200).send();
});

app.get('/room/:id/end', (req, res) => {
    const roomId: string = req.params.id;
    console.log(`END combat for room ${roomId} from ${req.ip}`);

    setCombatStatus(roomId, false, 0).catch(err => {
        console.error(`ERROR: ${err}`);
        return res.status(500).send('Error ending combat: ' + err.message);
    });
    res.status(200).send();
});

app.delete('/room/:id/initiative', async (req, res) => {
    const roomId: string = req.params.id;
    console.log(`DELETE all initiatives from room ${roomId} from ${req.ip}`);

    await deleteAllInitiativesInRoom(roomId).catch(err => {
        console.error(`ERROR: ${err}`);
        return res.status(500).send('Error deleting all initiatives: ' + err.message);
    });
    res.status(200).send();
});

app.delete('/room/:roomId/initiative/:initiativeId', async (req, res) => {
    const roomId = req.params.roomId as string;
    const initiativeId = req.params.initiativeId as string;
    if (initiativeId === null) {
        console.error(`ERROR: Invalid id: ${initiativeId}`);
        return res.status(400).send('Invalid id');
    }
    console.log(`DELETE initiative id: ${initiativeId} from ${req.ip}`);

    await removeInitiativeFromRoom(roomId, initiativeId).catch(err => {
        console.error(`ERROR: ${err}`);
        return res.status(500).send('Error deleting initiative: ' + err.message);
    });

    res.status(200).send();
});

app.patch('/initiative/:id/name', express.json(), async (req, res) => {
    const id = req.params.id as string;
    const initiative: InitiativeEntity | null = await getInitiativeById(id);
    if (initiative === null) {
        console.error(`ERROR: Invalid id: ${id}`);
        return res.status(400).send('Invalid id');
    }

    console.log(`PATCH name for initiative id: ${id} from ${req.ip}`);
    const name = req.body.name as string;
    initiative.name = name;
    await saveInitiative(initiative);
    res.status(200).send();
});

app.patch('/initiative/:id/status', express.json(), async (req, res) => {
    const id = req.params.id as string;
    const initiative: InitiativeEntity | null = await getInitiativeById(id);
    if (initiative === null) {
        console.error(`ERROR: Invalid id: ${id}`);
        return res.status(400).send('Invalid id');
    }

    console.log(`PATCH status for initiative id: ${id} from ${req.ip}`);
    const status = req.body.status as Status[];

    initiative.status = status;
    await saveInitiative(initiative);
    res.status(200).send();
});

app.patch('/initiative/:id/health', express.json(), async (req, res) => {
    const id = req.params.id as string;
    const initiative: InitiativeEntity | null = await getInitiativeById(id);
    if (initiative === null) {
        console.error(`ERROR: Invalid id: ${id}`);
        return res.status(400).send('Invalid id');
    }

    console.log(`PATCH health for initiative id: ${id} from ${req.ip}`);
    const health = req.body.health as number;

    initiative.health = health;
    await saveInitiative(initiative);
    res.status(200).send();
});

app.get('/user/:id', express.json(), async (req, res) => {
    const id = req.params.id as string;
    console.log(`GET user id: ${id} from ${req.ip}`);

    const user = await getUserById(id);
    if (!user) {
        return res.status(404).send('User not found');
    }
    res.status(200).json(user);

});

app.get('/initiative/:id/owner/:userId', express.json(), async (req, res) => {
    const initiativeId = req.params.id as string;
    const userId = req.params.userId as string;
    const initiativeUserId = await getInitiativeByIdWithUser(initiativeId).then(initiative => initiative?.user.id);
    const isOwner = initiativeUserId && initiativeUserId === userId;

    res.status(200).json({ isOwner });
});

app.post('/login', express.json(), async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username} from ${req.ip}`);

    const user = await loginUser(username, password);
    if (!user) {
        console.log(`Login failed for username: ${username} from ${req.ip}, creating a new login with those credentials`);
        createUser(username, password).then((newUser: UserEntity) => {
            res.status(201).json(newUser);
        }).catch(error => {
            console.error('Error creating user:', error);
            res.status(500).send('Error creating user');
        });
    } else {
        console.log(`Login successful for username: ${username} from ${req.ip}`);
        return res.status(200).json(user);
    }

});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});