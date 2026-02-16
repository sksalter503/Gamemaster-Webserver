/**
 * Initializes the admin interface for managing combat initiatives.
 * 
 * Sets up event listeners for combat control buttons (clear, start, next turn, end combat)
 * and the initiative submission form. Establishes a polling mechanism that checks for
 * initiative changes every second and re-renders the initiative list when changes are detected.
 * 
 * The polling system compares stringified initiative data to avoid unnecessary renders,
 * tracking previously created initiative IDs and updating the UI with current turn highlighting
 * when combat is active.
 */
import { fetchInitiatives, postInitiative, renderInitiatives } from '../shared/initiative';
import { submitInitiative } from './initiative sender';
import { API_URL } from '../shared/consts';
import { makeSignature } from '../shared/initiative';

let previousSignature: string = '';

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
    const [initiatives, currentTurnIndex, combatStarted] = await fetchInitiatives();

    const currentSignature = makeSignature(initiatives, currentTurnIndex, combatStarted);
    if (previousSignature === currentSignature) {
        //No changes, skip rendering
        console.log('No changes in initiatives, skipping render');
        return;
    }
    previousSignature = currentSignature;

    console.log('Changes in initiatives, rendering');

    renderInitiatives(initiatives, currentTurnIndex, [], 'name', 'initiative', 'health', 'status', 'delete', combatStarted ? 'highlightCurrent' : undefined);
}, 1000);
