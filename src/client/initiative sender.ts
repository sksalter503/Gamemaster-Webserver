import { UUID } from 'crypto';
import { fetchInitiatives, Initiative, makeSignature, postInitiative, renderInitiatives } from '../shared/initiative';
//TODO: Add cookies for user identification to retrieve their initiatives
const idsCreated: UUID[] = [];
let previousSignature: string = '';

export async function submitInitiative(e: SubmitEvent) {
    e.preventDefault();

    const name = (document.getElementById('name') as HTMLInputElement)?.value;
    const initiativeValue = parseInt((document.getElementById('initiative') as HTMLInputElement)?.value);
    const healthValue = parseInt((document.getElementById('health') as HTMLInputElement)?.value);
    const maxHealthValue = parseInt((document.getElementById('maxHealth') as HTMLInputElement)?.value);
    let initiative: Initiative = { name, initiative: initiativeValue, health: healthValue, maxHealth: maxHealthValue };

    try {
        const result = await postInitiative(initiative);
        if (result === null) {
            console.error('Failed to post initiative');
            return;
        }
        initiative = result;
        idsCreated.push(initiative.id!);

        // Clear fields after successful send
        (document.getElementById('name') as HTMLInputElement).value = '';
        (document.getElementById('initiative') as HTMLInputElement).value = '';
        (document.getElementById('health') as HTMLInputElement).value = '';
        (document.getElementById('maxHealth') as HTMLInputElement).value = '';

    } catch (error) {
        console.error('Error sending initiative:', error);
    }
}

document.getElementById('initiativeForm')?.addEventListener('submit', submitInitiative);

// Refresh initiatives every second
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

    renderInitiatives(initiatives, currentTurnIndex, idsCreated, 'name', 'initiative', 'health', 'status', 'delete', combatStarted ? 'highlightCurrent' : undefined);

}, 1000);