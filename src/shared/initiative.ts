import { API_URL } from './consts';
import { UUID } from 'crypto';

export type Status = 'Blinded' | 'Charmed' | 'Deafened' | 'Frightened' | 'Grappled' | 'Incapacitated' | 'Invisible' | 'Paralyzed' | 'Petrified' | 'Poisoned' | 'Prone' | 'Restrained' | 'Stunned' | 'Unconscious';

export const ALL_STATUSES: Status[] = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];

export type Initiative = {
    id?: UUID;
    name: string;
    initiative: number;
    health?: number;
    maxHealth?: number;
    status?: Status[];
}

type Option = 'name' | 'health' | 'initiative' | 'status' | 'delete' | 'highlightCurrent' | undefined;

export async function fetchInitiatives(): Promise<[Initiative[], number, boolean]> {
    try {
        const response = await fetch(`${API_URL}/initiative`);
        const JSON = await response.json();
        const initiatives = JSON.initiatives as Initiative[];
        const currentTurnIndex = JSON.currentTurnIndex as number;
        const combatStarted = JSON.combatStarted as boolean;
        return [initiatives, currentTurnIndex, combatStarted];

    } catch (error) {
        console.error('Error fetching initiatives:', error);
        return [[], 0, false];
    }
}

export async function postInitiative(initiative: Initiative): Promise<Initiative | null> {
    try {
        const initiativeResponse = await fetch(`${API_URL}/initiative`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: initiative.name, initiative: initiative.initiative, health: initiative.health, maxHealth: initiative.maxHealth })
        });

        return await initiativeResponse.json();

    } catch (error) {
        console.error('Error sending initiative:', error);
        return null;
    }
}

export async function deleteInitiative(id: UUID): Promise<void> {
    try {
        await fetch(`${API_URL}/initiative/${id}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Error deleting initiative:', error);
    }
}

export async function updateStatus(id: UUID, status: Status[]): Promise<void> {
    try {
        await fetch(`${API_URL}/initiative/${id}/status`, {
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

interface HeaderRegistry extends Record<string, (tableRow: HTMLTableRowElement) => void> { }

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
    static nameHeader(tableRow: HTMLTableRowElement): void {
        const nameCell = document.createElement('th');
        nameCell.textContent = 'Name';
        tableRow.appendChild(nameCell);
    }

    @RegisterHeader('initiative')
    static initiative(tableRow: HTMLTableRowElement): void {
        const initiativeCell = document.createElement('th');
        initiativeCell.textContent = 'Initiative';
        tableRow.appendChild(initiativeCell);
    }

    @RegisterHeader('health')
    static health(tableRow: HTMLTableRowElement): void {
        const healthCell = document.createElement('th');
        healthCell.style.width = '120px';
        healthCell.textContent = 'Health';
        tableRow.appendChild(healthCell);
    }

    @RegisterHeader('status')
    static status(tableRow: HTMLTableRowElement): void {
        const statusCell = document.createElement('th');
        statusCell.textContent = 'Status';
        tableRow.appendChild(statusCell);
    }

    @RegisterHeader('delete')
    static delete(tableRow: HTMLTableRowElement): void {
        const deleteCell = document.createElement('th');
        deleteCell.textContent = 'Delete';
        tableRow.appendChild(deleteCell);
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
    @RegisterRowHandler('name')
    static nameRowHandler(tableRow: HTMLTableElement, init: Initiative, idsCreated: UUID[]): void {
        const nameCell = document.createElement('td');
        if (document.URL.includes('admin') || idsCreated.includes(init.id!)) {
            const nameField = document.createElement('input');
            nameField.type = 'text';
            nameField.value = init.name;
            nameField.style.width = '100%';
            nameField.style.boxSizing = 'border-box';
            nameField.style.border = '1px solid gray';
            nameField.style.padding = '2px';
            nameField.addEventListener('blur', async () => {
                const newName = nameField.value;
                // This code runs when the user clicks away from the editable cell
                await fetch(`${API_URL}/initiative/${init.id}/name`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: newName })
                });
                init.name = newName;
            });
            nameCell.appendChild(nameField);
            tableRow.appendChild(nameCell);
        } else {
            nameCell.textContent = init.name;
            tableRow.appendChild(nameCell);
        }
    }

    @RegisterRowHandler('initiative')
    static addInitiativeRow(tableRow: HTMLTableElement, init: Initiative): void {
        const initiativeCell = document.createElement('td');
        initiativeCell.textContent = init.initiative.toString();
        tableRow.appendChild(initiativeCell);
    }

    //TODO: Make the max health field editable
    @RegisterRowHandler('health')
    static addHealthRow(tableRow: HTMLTableElement, init: Initiative, idsCreated: UUID[]): void {
        const healthCell = document.createElement('td');
        if (document.URL.includes('admin') || idsCreated.includes(init.id!)) {
            const healthField = document.createElement('input');
            healthField.type = 'number';
            healthField.value = init.health?.toString() ?? '';
            healthField.style.width = '100%';
            healthField.style.boxSizing = 'border-box';

            healthField.addEventListener('blur', async () => {
                // This code runs when the user clicks away from the editable cell
                const newHealth = parseInt(healthField.value);
                await fetch(`${API_URL}/initiative/${init.id}/health`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ health: newHealth })
                });
                init.health = newHealth;
            });
            healthCell.appendChild(healthField);
        } else {
            healthCell.textContent = String(init.health) ?? '' + String(init.maxHealth ? `/${init.maxHealth}` : '');
        }
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
    static addStatusRow(tableRow: HTMLTableElement, init: Initiative, idsCreated: UUID[], _: any, __: any): void {
        const statusCell = document.createElement('td');

        if (document.URL.includes('admin') || idsCreated.includes(init.id!)) {
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
                await fetch(`${API_URL}/initiative/${init.id}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: selectedStatuses })
                });
                init.status = selectedStatuses;
            });
            statusCell.appendChild(statusSelect);
        } else {
            statusCell.textContent = init.status?.join(', ') ?? '';
        }
        tableRow.appendChild(statusCell);

    }

    @RegisterRowHandler('delete')
    static addDeleteRow(tableRow: HTMLTableElement, init: Initiative, idsCreated: UUID[], _: any, __: any): void {
        if (!document.URL.includes('admin') && !idsCreated.includes(init.id!)) {
            const emptyCell = document.createElement('td');
            tableRow.appendChild(emptyCell);
            return;
        }

        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
            await deleteInitiative(init.id!);
        });
        deleteCell.appendChild(deleteButton);
        tableRow.appendChild(deleteCell);
    }

    @RegisterRowHandler('highlightCurrent')
    static highlightCurrentRow(tableRow: HTMLTableElement, _: any, __: any, index: number, currentTurnIndex: number): void {
        if (index !== currentTurnIndex) {
            return;
        }
        tableRow.style.color = 'black';
        tableRow.style.backgroundColor = 'white';
        tableRow.querySelectorAll('td').forEach((cell: HTMLTableCellElement) => {
            cell.style.border = '2px solid black';
            cell.style.fontWeight = 'bold';
        });
    }
}

function createRows(table: HTMLTableElement, initiatives: Initiative[], idsCreated: UUID[], currentTurnIndex: number, options: Option[]): void {


    initiatives.forEach((init, index) => {
        const tableRow = document.createElement('tr');

        for (const option of options) {
            if (option === undefined) {
                continue;
            }
            if (option in rowHandlerRegistry) {
                rowHandlerRegistry[option](tableRow, init, idsCreated, index, currentTurnIndex);
            }
        }

        if (init.health == 0) {
            tableRow.style.backgroundColor = 'red';
            tableRow.style.textDecoration = 'line-through';
        }

        table.appendChild(tableRow);
    });

}

export async function renderInitiatives(initiatives: Initiative[], currentTurnIndex: number, idsCreated: UUID[], ...options: Option[]): Promise<void> {
    //TODO: Make it only update if there are changes to that partitcular field
    //Identify the div to attach the table to
    const initiativeDiv = document.getElementById('initiatives');
    if (!initiativeDiv) return;

    //Create a new table
    const table = document.createElement('table');

    //Insert the headers
    const tableHeaders = document.createElement('tr');

    for (const option of options) {
        if (option === undefined) {
            continue;
        }
        if (option in headerRegistry) {
            headerRegistry[option](tableHeaders);
        }
    }

    table.appendChild(tableHeaders);

    //Create a row for each initiative
    createRows(table, initiatives, idsCreated, currentTurnIndex, options);

    //Attach the table to the div
    initiativeDiv.innerHTML = '';
    initiativeDiv!.appendChild(table);
};

export function makeSignature(
    initiatives: Initiative[],
    currentTurnIndex: number,
    combatStarted: boolean
): string {
    return initiatives
        .map(i => [
            i.id,
            i.name,
            i.initiative,
            i.health,
            i.maxHealth,
            JSON.stringify(i.status ?? [])
        ].join(':'))
        .join('|')
        + `|turn:${currentTurnIndex}|combat:${combatStarted}`;
}