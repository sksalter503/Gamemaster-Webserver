import { fetchInitiatives, Initiative, isUserAdmin, makeSignature, postInitiative, renderInitiatives } from '../shared/initiative';
import { userPromise } from "./login"
import { API_URL } from '../shared/consts';
let previousSignature: string = '';
export const roomId = new URLSearchParams(window.location.search).get('roomId');
const roomIdSpan = document.getElementById('roomId') as HTMLSpanElement;
if (roomIdSpan) {
    roomIdSpan.innerText = roomId!;
}

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
        const user = await userPromise;
        const result = await postInitiative(user, initiative, roomId!);
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

(async () => {
    try {
        const user = await userPromise;

        if (user) {
            //Show the initiativeContainer
            const initiativeContainer = document.getElementById('initiativeForm') as HTMLFormElement;
            console.log(`initiativeContainer: ${initiativeContainer}`);
            initiativeContainer.style.display = 'block';
            const loginForm = document.getElementById('loginForm') as HTMLFormElement;
            loginForm.style.display = 'none';

            //If the user is admin, show the admin controls
            if (await isUserAdmin()) {
                const clearInitiativesBtn = document.getElementById('clearInitiativesBtn') as HTMLButtonElement;
                clearInitiativesBtn.style.display = 'block';
                const combatControls = document.getElementById('combatControls') as HTMLDivElement;
                combatControls.style.display = 'grid';
                const hideHealthBarContainer = document.getElementById('hideHealthBarContainer') as HTMLDivElement;
                hideHealthBarContainer.style.display = 'block';
                const hideHealthValueContainer = document.getElementById('hideHealthValueContainer') as HTMLDivElement;
                hideHealthValueContainer.style.display = 'block';

                // Add event listeners for admin controls

                document.getElementById('clearInitiativesBtn')!.addEventListener('click', async (e) => {
                    e.preventDefault();
                    document.getElementById('clearInitiativesBtn')!.setAttribute('disabled', 'true');
                    try {
                        await fetch(`${API_URL}/room/${roomId}/initiative`, {
                            method: 'DELETE',
                        });
                        fetchInitiatives(roomId!);
                    } catch (error) {
                        console.error('Error clearing initiatives:', error);
                    } finally {
                        document.getElementById('clearInitiativesBtn')!.removeAttribute('disabled');
                    }
                });
                document.getElementById('startCombat')!.addEventListener('click', async (e) => {
                    e.preventDefault();
                    document.getElementById('startCombat')!.setAttribute('disabled', 'true');
                    try {
                        await fetch(`${API_URL}/room/${roomId}/start`);
                    } catch (error) {
                        console.error('Error starting combat:', error);
                    } finally {
                        document.getElementById('startCombat')!.removeAttribute('disabled');
                    }
                });
                document.getElementById('nextTurn')!.addEventListener('click', async (e) => {
                    e.preventDefault();
                    document.getElementById('nextTurn')!.setAttribute('disabled', 'true');
                    try {
                        await fetch(`${API_URL}/room/${roomId}/next`);
                    } catch (error) {
                        console.error('Error advancing turn:', error);
                    } finally {
                        document.getElementById('nextTurn')!.removeAttribute('disabled');
                    }
                });
                document.getElementById('endCombat')!.addEventListener('click', async (e) => {
                    e.preventDefault();
                    document.getElementById('endCombat')!.setAttribute('disabled', 'true');
                    try {
                        await fetch(`${API_URL}/room/${roomId}/end`);
                    } catch (error) {
                        console.error('Error ending combat:', error);
                    } finally {
                        document.getElementById('endCombat')!.removeAttribute('disabled');
                    }
                });

            }

        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
})();

document.getElementById('initiativeForm')?.addEventListener('submit', submitInitiative);

document.getElementById('endTurnButton')?.addEventListener('click', async (e) => {
    e.preventDefault();
    document.getElementById('endTurnButton')!.setAttribute('disabled', 'true');
    try {
        await fetch(`${API_URL}/room/${roomId}/next`);
    } catch (error) {
        console.error('Error advancing turn:', error);
    } finally {
        document.getElementById('endTurnButton')!.removeAttribute('disabled');
    }
});

// Refresh initiatives every second
setInterval(async () => {
    const [initiatives, currentTurnIndex, combatStarted] = await fetchInitiatives(roomId!);

    let isUsersTurn: boolean = false;
    try {
        const user = await userPromise;
        const currentUserId = user?.id;
        const currentInitiative = initiatives[currentTurnIndex];

        if (currentInitiative && currentUserId && combatStarted) {
            const response = await fetch(`${API_URL}/initiative/${currentInitiative.id}/owner/${currentUserId}`);
            isUsersTurn = response.ok && (await response.json()).isOwner;
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

    await renderInitiatives(initiatives, currentTurnIndex, 'name', 'initiative', 'health', 'status', 'delete', combatStarted ? 'highlightCurrent' : undefined);

}, 1000);