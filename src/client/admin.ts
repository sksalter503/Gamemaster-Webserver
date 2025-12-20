import { fetchCombatStarted, fetchCurrentTurnIndex, fetchInitiatives, postInitiative, renderInitiatives } from '../shared/initiative';
import { submitInitiative } from './initiative sender';
import { API_URL } from '../shared/consts';

let previousInitiativesData: string = '';
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
    const combatStarted = await fetchCombatStarted();
    const currentTurnIndex = await fetchCurrentTurnIndex();

    const currentInitiativesData = JSON.stringify({ initiatives, combatStarted, currentTurnIndex });
    if (previousInitiativesData === currentInitiativesData) {
        //No changes, skip rendering
        console.log('No changes in initiatives, skipping render');
        return;
    }
    previousInitiativesData = currentInitiativesData;
    console.log('Changes in initiatives, rendering');

    indexesCreated = initiatives.map((_, index) => index);
    renderInitiatives(initiatives, currentTurnIndex, indexesCreated, 'name', 'initiative', 'health', 'status', 'delete', combatStarted ? 'highlightCurrent' : undefined);
}, 1000);
