export interface User {
    id: string;
    username?: string;
    password?: string;
    initiatives?: any[]; // This will be an array of InitiativeEntity objects, but we can keep it as any[] for now to avoid circular dependencies
}