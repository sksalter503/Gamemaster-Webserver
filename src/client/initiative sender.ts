import { fetchCombatStarted, fetchCurrentTurnIndex, fetchInitiatives, postInitiative, renderInitiatives } from '../shared/initiative';

const initiativesCreated: string[] = [];
let indexesCreated: number[] = [];

document.getElementById('initiativeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = (document.getElementById('name') as HTMLInputElement)?.value;
    const initiativeValue = parseInt((document.getElementById('initiative') as HTMLInputElement)?.value);
    const healthValue = parseInt((document.getElementById('health') as HTMLInputElement)?.value);
    const maxHealthValue = parseInt((document.getElementById('maxHealth') as HTMLInputElement)?.value);
    const initiative = { name, initiative: initiativeValue, health: healthValue, maxHealth: maxHealthValue };

    try {
        await postInitiative(initiative);
        initiativesCreated.push(name);

        // Clear fields after successful send
        (document.getElementById('name') as HTMLInputElement).value = '';
        (document.getElementById('initiative') as HTMLInputElement).value = '';
        (document.getElementById('health') as HTMLInputElement).value = '';
        (document.getElementById('maxHealth') as HTMLInputElement).value = '';

    } catch (error) {
        console.error('Error sending initiative:', error);
    }
});

// Refresh initiatives every second
setInterval(async () => {
    const initiatives = await fetchInitiatives();

    const initiativesCreatedCopy = [...initiativesCreated];
    initiativesCreated.length = 0;
    indexesCreated.length = 0;
    initiatives.forEach((init, index) => {
        if (initiativesCreatedCopy.includes(init.name)) {
            initiativesCreated.push(init.name);
            indexesCreated.push(index);
        }
    });

    const combatStarted = await fetchCombatStarted();
    renderInitiatives(initiatives, await fetchCurrentTurnIndex(), indexesCreated, 'health', 'status', combatStarted ? 'highlightCurrent' : undefined);

}, 1000);