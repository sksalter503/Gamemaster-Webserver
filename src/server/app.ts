import express from 'express';
import path from 'path';
import cors from 'cors';
import { Initiative, Status } from '../shared/initiative';
require('dotenv').config();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
import {
    getIndexById, createInitiative, getInitiatives, initiativesExist, initiativeCount, deleteAllInitiatives, deleteInitiativeById, getInitiativeById,
    saveInitiative,
    dataSource,
    getInitiativeByIdWithUser
} from './initiativeService';
import { InitiativeEntity } from './entity/initiative.entity';
import { createUser, getInitiativesByUserId, getUserById, loginUser } from './userService';
import { UserEntity } from './entity/user.entity';

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
 * //TODO: Add custom turn 'your turn' colors for the initiative tracker.
 * //TODO: Add "rooms"
 * //TODO: Add custom statuses that can be added and removed from the initiative tracker.
 * //TODO: Change conditions to be a pop out menu that lets you add or remove them.
 * //TODO: Add AC
 * //TODO: Add Movement speed
 * //TODO: Add Oauth to logins
 * 
 * DND Beyond Replacement Shit:
 * //TODO: Character sheet
 * //TODO: Searchable systems that use 5E.tools to do stuff.
 * //TODO: Better custom items.
 */

app.get('/admin', (req, res) => {
    if (!req.query.password) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Login</title>
                <link rel="stylesheet" href="./style/styles.css">
            </head>
            <body>
                <h3>Admin Login</h3>
                <form method="GET" action="/admin">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
                <button type="submit">Login</button>
                </form>
            </body>
            </html>
            `);
    }
    else if (req.query.password !== ADMIN_PASSWORD) {
        return res.send('Incorrect password. Access denied.');
    }

    res.sendFile(path.join(process.cwd(), 'dist/client', 'admin.html'));

});

app.use(express.static("dist/client", {
    extensions: ['html', 'css', 'js']
}));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    console.log(`loading the directory for ${req.ip}`);

    const publicDir = path.join(process.cwd(), 'dist/client');
    const files = fs.readdirSync(publicDir);
    const htmlFiles = files.filter((file: string) => file.endsWith('.html'));
    const links = htmlFiles
        .filter((file: string) => file !== 'admin.html')
        .map((file: string) => `<a href="./${file.replace('.html', '')}">${file.replace('.html', '')}</a>`)
        .join('<br>');
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Directory</title>
            <link rel="stylesheet" href="./style/styles.css">
        </head>
        <body>
            <h3>Available Pages:</h3>
            ${links}
        </body>
        </html>
    `);
});

let currentTurnIndex = 0;
let combatStarted = false;

app.post('/initiative', express.json(), async (req, res) => {
    console.log(`POST from ${req.ip}: ${JSON.stringify(req.body)}`);

    const initiative: Initiative = req.body.initiative;
    const user: any = req.body.user;
    const initiativeEntity = await createInitiative(user, initiative);
    console.log(`Adding initiative: ${JSON.stringify(initiativeEntity)}`);

    res.status(201).json(initiativeEntity);
});

app.get('/initiative', async (req, res) => {
    const initiatives: Initiative[] = await getInitiatives();
    res.json({ initiatives, currentTurnIndex, combatStarted });
});

app.get('/initiative/start', (req, res) => {
    console.log(`START combat from ${req.ip}`);

    currentTurnIndex = 0;
    combatStarted = true;
    res.status(200).send();
});

app.get('/initiative/next', async (req, res) => {
    console.log(`NEXT turn from ${req.ip}`);

    if (!await initiativesExist()) {
        return res.status(400).send('No initiatives available');
    }

    // Get the current initiative based on the currentTurnIndex and decrement the duration of any statuses that have a duration, removing them if their duration reaches 0
    const initiatives = await getInitiatives();
    const currentInitiative = initiatives[currentTurnIndex];
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

    currentTurnIndex = (currentTurnIndex + 1) % (await initiativeCount());
    res.status(200).send();
});

app.get('/initiative/end', (req, res) => {
    console.log(`END combat from ${req.ip}`);

    currentTurnIndex = 0;
    combatStarted = false;
    res.status(200).send();
});

app.delete('/initiative', async (req, res) => {
    console.log(`DELETE all initiatives from ${req.ip}`);

    await deleteAllInitiatives();
    currentTurnIndex = 0;
    combatStarted = false;
    res.status(200).send();
});

app.delete('/initiative/:id', async (req, res) => {
    const id = req.params.id as string;
    if (id === null) {
        console.error(`ERROR: Invalid id: ${id}`);
        return res.status(400).send('Invalid id');
    }

    console.log(`DELETE initiative id: ${id} from ${req.ip}`);
    await deleteInitiativeById(id);
    if (currentTurnIndex >= await initiativeCount()) {
        currentTurnIndex = 0;
    }
    if (await initiativeCount() === 0) {
        combatStarted = false;
    }
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