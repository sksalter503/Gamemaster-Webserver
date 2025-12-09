import express from 'express';
import path from 'path';
import cors from 'cors';
import { Initiative } from '../shared/initiative';

const fs = require('fs');
const app = express();
const port = 80;


/*
 * TODO:
 *
 * - Initiative tracker stuff --- :
 * - Add a health tracking system
 * - Add status tracking system
 * - Add initiative sending to the admin panel
 * - Add editable fields on admin panel
 * - Add back button on the public pages
 * - Add the ability to delete your own initiative entries.
 * - Add end turn button on the initiative tracker.
 * - Add AC
 * - Add Movement speed
 * 
 * - DND Beyond Replacement Shit:
 * - Character sheet
 * - Searchable systems that use 5E.tools to do stuff.
 * - Better custom items.
 */

app.use(express.static(path.join(process.cwd(), 'public'), {
    extensions: ['html']
}));
app.use(express.json());
app.use(cors());


app.get('/', (req, res) => {
    console.log(`loading the directory for ${req.ip}`);

    const publicDir = path.join(process.cwd(), 'public');
    const files = fs.readdirSync(publicDir);
    const htmlFiles = files.filter((file: string) => file.endsWith('.html'));
    const links = htmlFiles.map((file: string) => `<a href="./${file.replace('.html', '')}">${file.replace('.html', '')}</a>`).join('<br>');
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
    console.log(`POST: ${JSON.stringify(req.body)}`);

    const initiative: Initiative = req.body;
    initiatives.push(initiative);
    initiatives.sort((a, b) => b.initiative - a.initiative);
    res.status(200).send();
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

app.delete('/initiative/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    console.log(`DELETE initiative at index ${index} from ${req.ip}`);

    if (isNaN(index) || index < 0 || index >= initiatives.length) {
        console.error(`ERROR: Invalid index`);
        return res.status(400).send('Invalid index');
    }
    initiatives.splice(index, 1);
    if (currentTurnIndex >= initiatives.length) {
        currentTurnIndex = 0;
    }
    if (initiatives.length === 0) {
        combatStarted = false;
    }
    res.status(200).send();
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});