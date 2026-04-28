import { fetchInitiatives, Initiative, makeSignature, postInitiative, renderInitiatives } from '../shared/initiative';
import { user } from "./login"
import { API_URL } from '../shared/consts';
let previousSignature: string = '';

export async function submitInitiative(e: SubmitEvent) {
    e.preventDefault();

    const name = (document.getElementById('name') as HTMLInputElement)?.value;
    const initiativeValue = parseInt((document.getElementById('initiative') as HTMLInputElement)?.value);
    const healthValue = parseInt((document.getElementById('health') as HTMLInputElement)?.value);
    const hideHealthValue = (document.getElementById('hideHealthValue') as HTMLInputElement)?.checked;
    const hideHealthBar = (document.getElementById('hideHealthBar') as HTMLInputElement)?.checked;
    const maxHealthValue = parseInt((document.getElementById('maxHealth') as HTMLInputElement)?.value);
    let initiative: Initiative = { name, initiative: initiativeValue, health: healthValue, hideHealthValue: hideHealthValue, hideHealthBar: hideHealthBar, maxHealth: maxHealthValue };
    const hideHealthBarEl = document.getElementById('hideHealthBar') as HTMLInputElement | null;
    const hideHealthValueEl = document.getElementById('hideHealthValue') as HTMLInputElement | null;
    if (hideHealthBarEl) hideHealthBarEl.checked = false;
    if (hideHealthValueEl) hideHealthValueEl.checked = false;

    try {
        const result = await postInitiative(user, initiative);
        if (result === null) {
            console.error('Failed to post initiative');
            return;
        }
        initiative = result;

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

document.getElementById('endTurnButton')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch(`${API_URL}/initiative/next`);
    } catch (error) {
        console.error('Error advancing turn:', error);
    }
});

// Refresh initiatives every second
setInterval(async () => {
    const [initiatives, currentTurnIndex, combatStarted] = await fetchInitiatives();

    let isUsersTurn: boolean = false;
    try {
        const currentUserId = user?.id;
        const currentInitiative = initiatives[currentTurnIndex];

        if (currentInitiative && currentUserId) {
            const response = await fetch(`${API_URL}/initiative/${currentInitiative.id}/owner/${currentUserId}`);
            const data = await response.json();
            isUsersTurn = data.isOwner;
        }
        if (isUsersTurn) {
            console.log("It's the user's turn!");
        } else {
            console.log("It's not the user's turn.");
        }
    } catch (error) {
        console.error('Error checking initiative ownership:', error);
    }

    if (isUsersTurn) {
        document.body.style.backgroundColor = '#686868'; // Grey background for user's turn
        const endTurnButton = document.getElementById('endTurnButton') as HTMLButtonElement;
        endTurnButton.style.display = 'block'; // Show end turn button
    } else {
        document.body.style.backgroundColor = ''; // Reset background color
        const endTurnButton = document.getElementById('endTurnButton') as HTMLButtonElement;
        endTurnButton.style.display = 'none'; // Hide end turn button
    }

    const currentSignature = makeSignature(initiatives, currentTurnIndex, combatStarted);
    if (previousSignature === currentSignature) {
        //No changes, skip rendering
        console.log('No changes in initiatives, skipping render');
        return;
    }
    previousSignature = currentSignature;

    console.log('Changes in initiatives, rendering');

    renderInitiatives(initiatives, currentTurnIndex, 'name', 'initiative', 'health', 'status', 'delete', combatStarted ? 'highlightCurrent' : undefined);

}, 1000);