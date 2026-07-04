import { User } from './user';
import { Initiative } from './initiative';

export interface Room {
    id: string;
    admin: User;
    name: string;
    players: User[]; // Array of users
    initiatives: Initiative[]; // Array of initiatives
    combatStarted: boolean;
    turnIndex: number; // Index of the current turn in the initiatives array
}