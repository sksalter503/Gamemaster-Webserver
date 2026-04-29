import { API_URL } from './consts';
import { user } from '../client/login';

//export type Status = 'Blinded' | 'Charmed' | 'Deafened' | 'Frightened' | 'Grappled' | 'Incapacitated' | 'Invisible' | 'Paralyzed' | 'Petrified' | 'Poisoned' | 'Prone' | 'Restrained' | 'Stunned' | 'Unconscious';
export interface Status {
    name: string;
    duration?: number;
}

export const ALL_STATUSES: string[] = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];

export interface Initiative {
    id?: string;
    name: string;
    initiative: number;
    health?: number;
    hideHealthValue?: boolean;
    hideHealthBar?: boolean;
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

export async function postInitiative(user: any, initiative: Initiative): Promise<Initiative | null> {
    try {
        const initiativeResponse = await fetch(`${API_URL}/initiative`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    user: {
                        id: user.id
                    },
                    initiative: {
                        name: initiative.name,
                        initiative: initiative.initiative,
                        health: initiative.health,
                        maxHealth: initiative.maxHealth,
                        hideHealthValue: initiative.hideHealthValue,
                        hideHealthBar: initiative.hideHealthBar
                    }
                })
        });

        return await initiativeResponse.json();

    } catch (error) {
        console.error('Error sending initiative:', error);
        return null;
    }
}

export async function deleteInitiative(id: string): Promise<void> {
    try {
        await fetch(`${API_URL}/initiative/${id}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Error deleting initiative:', error);
    }
}

export async function updateStatus(id: string, status: Status[]): Promise<void> {
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
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        if (!headerRegistry) {
            headerRegistry = {} as any;
        }
        headerRegistry[name] = descriptor.value;
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
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        if (!rowHandlerRegistry) {
            rowHandlerRegistry = {} as any;
        }
        rowHandlerRegistry[name] = descriptor.value;
    };
}

function initiativeBelongsToUser(init: Initiative): boolean {
    return user!.initiatives!.some((userInit: Initiative) => userInit.id === init.id);
}

class RowHandlers {
    @RegisterRowHandler('name')
    static nameRowHandler(tableRow: HTMLTableElement, init: Initiative): void {
        const nameCell = document.createElement('td');
        if (document.URL.includes('admin') || initiativeBelongsToUser(init)) {
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
    static addHealthRow(tableRow: HTMLTableElement, init: Initiative): void {
        const healthCell = document.createElement('td');
        if (document.URL.includes('admin') || initiativeBelongsToUser(init)) {
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
        } else if (init.hideHealthValue) {
            healthCell.textContent = '';
        } else {
            healthCell.textContent = String(init.health) ?? '' + String(init.maxHealth ? `/${init.maxHealth}` : '');
        }
        tableRow.appendChild(healthCell);

        // Create health bar
        if (init.hideHealthBar) {
            return;
        }
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
    static addStatusRow(tableRow: HTMLTableElement, init: Initiative): void {

        // Create the cell of the table
        const statusCell = document.createElement('td');

        // Check to see if the user should be able to edit the statuses
        if (document.URL.includes('admin') || initiativeBelongsToUser(init)) {

            // 1. Create a button with a plus sign with the display set to "block" by default
            const plusButton = document.createElement('button');
            plusButton.textContent = '+';
            plusButton.style.display = 'block';

            // Append the plus button to the cell
            statusCell.appendChild(plusButton);

            // 2. Create a button with a minus sign and have its display be "hidden" by default
            const minusButton = document.createElement('button');
            minusButton.textContent = '-';
            minusButton.style.display = 'none';

            //Append the minus button to the cell
            statusCell.appendChild(minusButton);

            // 3. Create the dropdown menu with the display set to "hidden" by default
            const statusSelect = document.createElement('select');
            statusSelect.style.display = 'none';
            statusSelect.multiple = false;
            statusSelect.style.width = '100%';
            statusSelect.size = 14;

            // Add a <ul> element that reflects the currently selected statuses, where the initial display is set to "block"
            // TODO: add a delete button for each status in the list that when clicked, removes that status from the initiative
            const statusList = document.createElement('ul');
            statusList.style.display = 'block';
            statusList.style.listStyleType = 'none';
            statusList.style.padding = '0';
            statusList.style.margin = '0';
            statusCell.appendChild(statusList);

            // Add <li> elements for each of the initiative's current statuses to the <ul> element
            init.status?.forEach(status => {
                const removeButton = document.createElement('button');
                removeButton.textContent = 'x';
                removeButton.style.marginRight = '5px';
                removeButton.addEventListener('click', async () => {
                    const updatedStatuses = init.status!.filter(s => s.name !== status.name);
                    init.status = updatedStatuses;
                    await updateStatus(init.id!, updatedStatuses);
                });
                const statusItem = document.createElement('li');
                if (status.duration) {
                    statusItem.textContent = `${status.name} (${status.duration} rounds)`;
                } else {
                    statusItem.textContent = status.name;
                }
                removeButton.appendChild(statusItem);
                statusList.appendChild(removeButton);
            });

            // Generate the list based on the list contained within ALL_STATUSES
            createStatusOptions(init, statusSelect);

            // Create the custom status text field
            const customStatusField = document.createElement('input');
            customStatusField.type = 'text';
            customStatusField.placeholder = 'Custom status';
            customStatusField.style.width = '100%';
            customStatusField.style.boxSizing = 'border-box';
            customStatusField.style.marginTop = '5px';
            statusSelect.appendChild(customStatusField);

            // Add a duration field for statuses
            const durationField = document.createElement('input');
            durationField.type = 'number';
            durationField.placeholder = 'Duration (0 is infinite)';
            durationField.min = '0';
            durationField.style.width = '100%';
            durationField.style.boxSizing = 'border-box';
            durationField.style.marginTop = '5px';
            statusSelect.appendChild(durationField);

            // Add the submit button for the status dropdown
            const submitStatusButton = document.createElement('button');
            submitStatusButton.textContent = 'Submit';
            submitStatusButton.style.marginTop = '5px';
            statusSelect.appendChild(submitStatusButton);

            // 4. Add an event for when the plus button is clicked that:
            plusButton.addEventListener('click', () => {
                // 4a. sets the plus button to hidden
                plusButton.style.display = 'none';
                // 4b. sets the minus button to display: "block"
                minusButton.style.display = 'block';
                // 4c. sets the dropdown menu to display: "block"
                statusSelect.style.display = 'block';
                // 4d. sets the <ul> element to display: "none"
                statusList.style.display = 'none';
            });

            // 5. Add an event for when the minus button is clicked that:
            minusButton.addEventListener('click', () => {
                // 5a. sets the plus button to display: "block"
                plusButton.style.display = 'block';
                // 5b. sets the minus button to display: "hidden"
                minusButton.style.display = 'none';
                // 5c. sets the dropdown menu to display: "hidden"
                statusSelect.style.display = 'none';
                // 5d. sets the <ul> element to display: "block"
                statusList.style.display = 'block';
            });

            // 6. Add the submit listener for the button:
            submitStatusButton.addEventListener('click', async () => {

                const selectedStatus = statusSelect.value;
                let newStatus: Status;
                const duration = parseInt(durationField.value, 10);

                if (selectedStatus === 'Custom') {
                    const customStatus = customStatusField.value.trim();
                    if (customStatus === '') {
                        alert('Please enter a custom status.');
                        return;
                    }
                    newStatus = { name: customStatus, duration: isNaN(duration) ? 0 : duration };
                } else {
                    newStatus = { name: selectedStatus, duration: isNaN(duration) ? 0 : duration };
                }
                // Add the new status to the initiative's statuses

                const updatedStatuses = [...(init.status ?? []), newStatus];
                init.status = updatedStatuses;
                await updateStatus(init.id!, updatedStatuses);

            });

            // Append the dropdown to the cell
            statusCell.appendChild(statusSelect);
        }
        //The user is not allowed to edit the statuses, therefore:
        else {

            // Display the current statuses as text
            statusCell.textContent = init.status?.join(', ') ?? '';
        }

        // Append the cell to the row
        tableRow.appendChild(statusCell);

    }
    @RegisterRowHandler('delete')
    static addDeleteRow(tableRow: HTMLTableElement, init: Initiative): void {
        if (!document.URL.includes('admin') && !initiativeBelongsToUser(init)) {
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
    static highlightCurrentRow(tableRow: HTMLTableElement, _: any, index: number, currentTurnIndex: number): void {
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

function createStatusOptions(init: Initiative, statusSelect: HTMLSelectElement): void {

    ALL_STATUSES.forEach(status => {

        // Create the option element
        const option = document.createElement('option');
        option.value = status;
        option.text = status;

        // Append the option to the dropdown
        statusSelect.appendChild(option);
    });

    const customStatusOption = document.createElement('option');
    customStatusOption.value = 'Custom';
    customStatusOption.text = 'Custom';
    statusSelect.appendChild(customStatusOption);
}

function createRows(table: HTMLTableElement, initiatives: Initiative[], currentTurnIndex: number, options: Option[]): void {


    initiatives.forEach((init, index) => {
        const tableRow = document.createElement('tr');

        for (const option of options) {
            if (option === undefined) {
                continue;
            }
            if (option in rowHandlerRegistry) {
                rowHandlerRegistry[option](tableRow, init, index, currentTurnIndex);
            }
        }

        if (init.health == 0) {
            tableRow.style.backgroundColor = 'red';
            tableRow.style.textDecoration = 'line-through';
        }

        table.appendChild(tableRow);
    });

}

export async function renderInitiatives(initiatives: Initiative[], currentTurnIndex: number, ...options: Option[]): Promise<void> {
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
    createRows(table, initiatives, currentTurnIndex, options);

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