import { API_URL } from './consts';

export type Status = 'Blinded' | 'Charmed' | 'Deafened' | 'Frightened' | 'Grappled' | 'Incapacitated' | 'Invisible' | 'Paralyzed' | 'Petrified' | 'Poisoned' | 'Prone' | 'Restrained' | 'Stunned' | 'Unconscious';

export const ALL_STATUSES: Status[] = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];

export type Initiative = {
    name: string;
    initiative: number;
    health?: number;
    maxHealth?: number;
    status?: Status[];
}

type Option = 'health' | 'status' | 'delete' | 'highlightCurrent' | undefined;

export async function fetchInitiatives(): Promise<Initiative[]> {
    try {
        const response = await fetch(`${API_URL}/initiative`);
        const JSON = await response.json();
        const initiatives = JSON.initiatives as Initiative[];
        return initiatives;

    } catch (error) {
        console.error('Error fetching initiatives:', error);
        return [];
    }
}

export async function fetchCurrentTurnIndex(): Promise<number> {
    try {
        const response = await fetch(`${API_URL}/initiative`);
        const JSON = await response.json();
        const currentTurnIndex = JSON.currentTurnIndex as number;
        return currentTurnIndex;

    } catch (error) {
        console.error('Error fetching current turn index:', error);
        return 0;
    }
}

export async function fetchCombatStarted(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/initiative`);
        const JSON = await response.json();
        const combatStarted = JSON.combatStarted as boolean;
        return combatStarted;

    } catch (error) {
        console.error('Error fetching combat started status:', error);
        return false;
    }
}

export async function postInitiative(initiative: Initiative): Promise<void> {
    try {
        await fetch(`${API_URL}/initiative`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: initiative.name, initiative: initiative.initiative, health: initiative.health, maxHealth: initiative.maxHealth })
        });

    } catch (error) {
        console.error('Error sending initiative:', error);
    }
}

export async function deleteInitiative(index: number): Promise<void> {
    try {
        await fetch(`${API_URL}/initiative/${index}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Error deleting initiative:', error);
    }
}

export async function updateStatus(index: number, status: Status[]): Promise<void> {
    try {
        await fetch(`${API_URL}/initiative/${index}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

export async function renderInitiatives(initiatives: Initiative[], currentTurnIndex: number, indexesCreated?: number[], ...options: Option[]): Promise<void> {

    //Identify the div to attach the table to
    const initiativeDiv = document.getElementById('initiatives');

    //Create a new table
    initiativeDiv!.innerHTML = '';
    const table = document.createElement('table');

    //Insert the headers
    const tableHeaders = document.createElement('tr');
    tableHeaders.innerHTML = `<th>Name</th><th>Initiative</th>`;
    if (options.includes('health')) {
        tableHeaders.innerHTML += `<th style="width: 120px;">Health</th>`;
    } if (options.includes('status')) {
        tableHeaders.innerHTML += `<th>Status</th>`;
    } if (options.includes('delete') || indexesCreated) {
        //Also create the delete column if the user has created entries
        tableHeaders.innerHTML += `<th>Delete</th>`;
    }
    table.appendChild(tableHeaders);

    //Create a row for each initiative
    initiatives.forEach((init, index) => {
        const tableRow = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = init.name;

        const initCell = document.createElement('td');
        initCell.textContent = String(init.initiative);

        tableRow.appendChild(nameCell);
        tableRow.appendChild(initCell);
        if (options.includes('health')) {
            const healthCell = document.createElement('td');
            healthCell.textContent = String(init.health) ?? '' + String(init.maxHealth ? `/${init.maxHealth}` : '');
            tableRow.appendChild(healthCell);
            // Create health bar
            const healthBar = document.createElement('div');
            healthBar.style.width = '100%';
            healthBar.style.height = '20px';
            healthBar.style.backgroundColor = '#ddd';
            healthBar.style.borderRadius = '4px';
            healthBar.style.overflow = 'hidden';

            const healthFill = document.createElement('div');
            healthFill.style.width = `${init.health ?? 0}%`;
            healthFill.style.height = '100%';
            healthFill.style.backgroundColor = init.health && init.health > 50 ? '#4CAF50' : init.health && init.health > 25 ? '#FFA500' : '#FF0000';
            healthFill.style.transition = 'width 0.3s ease';
            healthBar.appendChild(healthFill);
            healthCell.appendChild(healthBar);

        } if (options.includes('status')) {
            const statusCell = document.createElement('td');

            if (indexesCreated?.includes(index)) {
                // Create status dropdown
                const statusSelect = document.createElement('select');
                statusSelect.multiple = true;
                statusSelect.style.width = '100%';
                statusSelect.size = 14;
                ALL_STATUSES.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status;
                    option.text = status;
                    option.selected = init.status?.includes(status) ?? false;
                    statusSelect.appendChild(option);
                });
                statusSelect.addEventListener('change', async () => {
                    const selectedStatuses = Array.from(statusSelect.selectedOptions).map(opt => opt.value as Status);
                    await fetch(`${API_URL}/initiative/${index}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: selectedStatuses })
                    });
                });
                statusCell.appendChild(statusSelect);
            } else {
                statusCell.textContent = init.status?.join(', ') ?? '';
            }
            tableRow.appendChild(statusCell);
        } if (options.includes('delete') || indexesCreated?.includes(index)) {
            const deleteCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', async () => {
                await deleteInitiative(index);
            });
            deleteCell.appendChild(deleteButton);
            tableRow.appendChild(deleteCell);
        }
        if (options.includes('highlightCurrent') && index === currentTurnIndex) {
            tableRow.style.color = 'black';
            tableRow.style.backgroundColor = 'white';
        }
        if (init.health == 0) {
            tableRow.style.backgroundColor = 'red';
            tableRow.style.textDecoration = 'line-through';
        }
        table.appendChild(tableRow);
    });

    //Attach the table to the div
    initiativeDiv!.appendChild(table);
};