import { fetchCombatStarted, fetchCurrentTurnIndex, fetchInitiatives, postInitiative, renderInitiatives } from '../shared/initiative';
import { submitInitiative } from './initiative sender';
import { API_URL } from '../shared/consts';

const initiativesCreated: string[] = []; //This won't actually do anything, it's just used to make sure submitInitiative() works
let indexesCreated: number[] = [];

document.getElementById('clearInitiativesBtn')!.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch(`${API_URL}/initiative`, {
            method: 'DELETE',
        });
        fetchInitiatives();
    } catch (error) {
        console.error('Error clearing initiatives:', error);
    }
});
document.getElementById('startCombat')!.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch(`${API_URL}/initiative/start`);
    } catch (error) {
        console.error('Error starting combat:', error);
    }
});
document.getElementById('nextTurn')!.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch(`${API_URL}/initiative/next`);
    } catch (error) {
        console.error('Error advancing turn:', error);
    }
});
document.getElementById('endCombat')!.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch(`${API_URL}/initiative/end`);
    } catch (error) {
        console.error('Error ending combat:', error);
    }
});

document.getElementById('initiativeForm')!.addEventListener('submit', submitInitiative);

setInterval(async () => {
    const initiatives = await fetchInitiatives();

    initiativesCreated.length = 0;
    indexesCreated.length = 0;
    initiatives.map((init, index) => { indexesCreated.push(index); });

    const combatStarted = await fetchCombatStarted();
    renderInitiatives(initiatives, await fetchCurrentTurnIndex(), indexesCreated, 'health', 'status', 'delete', combatStarted ? 'highlightCurrent' : undefined);
}, 1000);
