import { Initiative } from '../shared/initiative';
import { UUID } from 'crypto';

export function getIndexById(id: UUID, initiatives: Initiative[]): number | null {
    const index = initiatives.findIndex(init => init.id === id);
    return index == -1 ? null : index;
}