import express from 'express';
import path from 'path';
import cors from 'cors';
import { Initiative, Status } from '../shared/initiative';
import { ADMIN_PASSWORD } from '../shared/consts';
import { randomUUID, UUID } from 'crypto';
import {
    getIndexById, createInitiative, getInitiatives, initiativesExist, initiativeCount, deleteAllInitiatives, deleteInitiativeById, getInitiativeById,
    saveInitiative
} from './initiativeService';
import { InitiativeEntity } from './entity/initiative.entity';
import { User } from './entity/user.entity';

const fs = require('fs');
const app = express();
const port = 3000;


/*
 * Initiative tracker stuff --- :
 * //TODO: Add a way of retreiving user data.
 * //TODO: Add custom statuses that can be added and removed from the initiative tracker.
 * //TODO: Add back button on the public pages.
 * //TODO: Add end turn button on the initiative tracker.
 * //TODO: Change conditions to be a pop out menu that lets you add or remove them.
 * //TODO: Add AC
 * //TODO: Add Movement speed
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

    res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));

});

app.use(express.static(path.join(process.cwd(), 'public'), {
    extensions: ['html', 'js']
}));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    console.log(`loading the directory for ${req.ip}`);

    const publicDir = path.join(process.cwd(), 'public');
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

    res.status(200).json(initiativeEntity);
});

app.get('/initiative', async (req, res) => {
    const initiatives = await getInitiatives();
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
    const id = req.params.id as UUID;
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
    const id = req.params.id as UUID;
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
    const id = req.params.id as UUID;
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
    const id = req.params.id as UUID;
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


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});