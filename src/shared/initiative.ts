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

interface HeaderRegistry extends Record<string, () => string> { }

// Initialize the header registry object
let headerRegistry: HeaderRegistry;

// Decorator to register header functions
function RegisterHeader(name: string) {
    return function (target: any, context: ClassMethodDecoratorContext) {
        if (!headerRegistry) {
            headerRegistry = {} as any;
        }
        headerRegistry[name] = target;
    };
}

class HeaderFunctions {
    @RegisterHeader('name')
    static nameHeader(): string {
        return '<th>Name</th>';
    }

    @RegisterHeader('initiative')
    static initiative(): string {
        return '<th>Initiative</th>';
    }

    @RegisterHeader('health')
    static health(): string {
        return '<th style="width: 120px;">Health</th>';
    }

    @RegisterHeader('status')
    static status(): string {
        return '<th>Status</th>';
    }

    @RegisterHeader('delete')
    static delete(): string {
        return '<th>Delete</th>';
    }
    @RegisterHeader('highlightCurrent')
    static highlightCurrent(): string {
        return '';
    }
}

interface RowHandlerRegistry extends Record<string, (tableRow: HTMLTableRowElement, init: Initiative, ...Extras: any[]) => void> { }

// Initialize the row handler registry object
let rowHandlerRegistry: RowHandlerRegistry;
// Decorator to register row handler functions
function RegisterRowHandler(name: string) {
    return function (target: any, context: ClassMethodDecoratorContext) {
        if (!rowHandlerRegistry) {
            rowHandlerRegistry = {} as any;
        }
        rowHandlerRegistry[name] = target;
    };
}

class RowHandlers {
    @RegisterRowHandler('health')
    static addHealthRow(tableRow: HTMLTableRowElement, init: Initiative): void {
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
        const healthPercent = init.maxHealth ? ((init.health ?? 0) / init.maxHealth) * 100 : 0;
        healthFill.style.width = `${healthPercent}%`;
        healthFill.style.height = '100%';
        healthFill.style.backgroundColor = healthPercent > 50 ? '#4CAF50' : healthPercent > 25 ? '#FFA500' : '#FF0000';
        healthFill.style.transition = 'width 0.3s ease';
        healthBar.appendChild(healthFill);
        healthCell.appendChild(healthBar);
    }

    @RegisterRowHandler('status')
    static addStatusRow(tableRow: HTMLTableElement, init: Initiative, indexesCreated: number[], index: number): void {
        const statusCell = document.createElement('td');

        if (indexesCreated.includes(index)) {
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

    }

    @RegisterRowHandler('delete')
    static addDeleteRow(tableRow: HTMLTableElement, init: Initiative, indexesCreated: number[], index: number): void {
        if (!indexesCreated.includes(index)) {
            const emptyCell = document.createElement('td');
            tableRow.appendChild(emptyCell);
            return;
        }

        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
            await deleteInitiative(index);
        });
        deleteCell.appendChild(deleteButton);
        tableRow.appendChild(deleteCell);
    }

    @RegisterRowHandler('adminDelete')
    static addAdminDeleteRow(tableRow: HTMLTableElement, init: Initiative, index: number): void {
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
            await deleteInitiative(index);
        });
        deleteCell.appendChild(deleteButton);
        tableRow.appendChild(deleteCell);
    }

    @RegisterRowHandler('highlightCurrent')
    static highlightCurrentRow(tableRow: HTMLTableElement, init: Initiative, index: number, currentTurnIndex: number): void {
        if (index !== currentTurnIndex) {
            return;
        }
        tableRow.style.color = 'black';
        tableRow.style.backgroundColor = 'white';
    }
}


function createRows(table: HTMLTableElement, initiatives: Initiative[], currentTurnIndex: number, indexesCreated: number[], options?: Option[]): void {


    initiatives.forEach((init, index) => {
        const tableRow = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = init.name;

        const initCell = document.createElement('td');
        initCell.textContent = String(init.initiative);

        tableRow.appendChild(nameCell);
        tableRow.appendChild(initCell);

        if (!options) { return }

        for (const option of options) {
            if (option === undefined) {
                continue;
            }
            if (option in rowHandlerRegistry) {
                rowHandlerRegistry[option](tableRow, init, indexesCreated, index);
            }
        }

        if (init.health == 0) {
            tableRow.style.backgroundColor = 'red';
            tableRow.style.textDecoration = 'line-through';
        }
        table.appendChild(tableRow);
    });

}

export async function renderInitiatives(initiatives: Initiative[], currentTurnIndex: number, indexesCreated: number[], ...options: Option[]): Promise<void> {

    //Identify the div to attach the table to
    const initiativeDiv = document.getElementById('initiatives');
    if (!initiativeDiv) return;

    //Create a new table
    initiativeDiv.innerHTML = '';
    const table = document.createElement('table');

    //Insert the headers
    const tableHeaders = document.createElement('tr');

    let headerHTML = headerRegistry.name() + headerRegistry.initiative();
    for (const option of options) {
        if (option === undefined) {
            continue;
        }
        headerHTML += headerRegistry[option]();
    }

    tableHeaders.innerHTML = headerHTML;
    table.appendChild(tableHeaders);

    //Create a row for each initiative
    createRows(table, initiatives, currentTurnIndex, indexesCreated, options);

    //Attach the table to the div
    initiativeDiv!.appendChild(table);
};