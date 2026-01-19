import express from 'express';
import path from 'path';
import cors from 'cors';
import { Initiative, Status } from '../shared/initiative';
import { ADMIN_PASSWORD } from '../shared/consts';
import { randomUUID, UUID } from 'crypto';
import { getIndexById } from './initiativeService';

const fs = require('fs');
const app = express();
const port = 80;


/*
 * Initiative tracker stuff --- :
 * //TODO: Create Database persistence.
 * //TODO: Add a way of retreiving user data.
 * //TODO: Add a way to optionally hide health values from players.
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



const initiatives: Initiative[] = [];
let currentTurnIndex = 0;
let combatStarted = false;

app.post('/initiative', express.json(), (req, res) => {
    console.log(`POST from ${req.ip}: ${JSON.stringify(req.body)}`);

    const initiative: Initiative = req.body;
    initiative.id = randomUUID() as UUID;
    console.log(`Adding initiative: ${JSON.stringify(initiative)}`);

    initiatives.push(initiative);
    initiatives.sort((a, b) => b.initiative - a.initiative);
    res.status(200).json(initiative);
});

app.get('/initiative', (req, res) => {
    res.json({ initiatives, currentTurnIndex, combatStarted });
});

app.get('/initiative/start', (req, res) => {
    console.log(`START combat from ${req.ip}`);

    currentTurnIndex = 0;
    combatStarted = true;
    res.status(200).send();
});

app.get('/initiative/next', (req, res) => {
    console.log(`NEXT turn from ${req.ip}`);

    if (initiatives.length === 0) {
        return res.status(400).send('No initiatives available');
    }
    currentTurnIndex = (currentTurnIndex + 1) % initiatives.length;
    res.status(200).send();
});

app.get('/initiative/end', (req, res) => {
    console.log(`END combat from ${req.ip}`);

    currentTurnIndex = 0;
    combatStarted = false;
    res.status(200).send();
});

app.delete('/initiative', (req, res) => {
    console.log(`DELETE all initiatives from ${req.ip}`);

    initiatives.length = 0;
    currentTurnIndex = 0;
    combatStarted = false;
    res.status(200).send();
});

app.delete('/initiative/:id', (req, res) => {
    const id = req.params.id as UUID;
    const index = getIndexById(id, initiatives);
    if (index === null) {
        console.error(`ERROR: Invalid id: ${id}`);
        return res.status(400).send('Invalid id');
    }

    console.log(`DELETE initiative id: ${id} from ${req.ip}`);
    initiatives.splice(index, 1);
    if (currentTurnIndex >= initiatives.length) {
        currentTurnIndex = 0;
    }
    if (initiatives.length === 0) {
        combatStarted = false;
    }
    res.status(200).send();
});

app.patch('/initiative/:id/name', express.json(), (req, res) => {
    const id = req.params.id as UUID;
    const index = getIndexById(id, initiatives);
    if (index === null) {
        console.error(`ERROR: Invalid id: ${id}`);
        return res.status(400).send('Invalid id');
    }

    console.log(`PATCH name for initiative id: ${id} from ${req.ip}`);
    const name = req.body.name as string;
    initiatives[index].name = name;
    res.status(200).send();
});

app.patch('/initiative/:id/status', express.json(), (req, res) => {
    const id = req.params.id as UUID;
    const index = getIndexById(id, initiatives);
    if (index === null) {
        console.error(`ERROR: Invalid id: ${id}`);
        return res.status(400).send('Invalid id');
    }

    console.log(`PATCH status for initiative id: ${id} from ${req.ip}`);
    const status = req.body.status as Status[];

    initiatives[index].status = status;
    res.status(200).send();
});

app.patch('/initiative/:id/health', express.json(), (req, res) => {
    const id = req.params.id as UUID;
    const index = getIndexById(id, initiatives);
    if (index === null) {
        console.error(`ERROR: Invalid id: ${id}`);
        return res.status(400).send('Invalid id');
    }

    console.log(`PATCH health for initiative id: ${id} from ${req.ip}`);
    const health = req.body.health as number;

    initiatives[index].health = health;
    res.status(200).send();
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});