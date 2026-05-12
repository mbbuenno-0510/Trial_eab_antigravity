import Dexie, { Table } from 'dexie';
import { MoodEntry, SchoolLog, SchoolMedicationLog } from '../types';

export interface OfflineEntry<T> {
    id?: string;
    localId?: string; // ID local para o Dexie
    data: T;
    synced: boolean;
    timestamp: number;
    userId: string;
}

export class EABOfflineDatabase extends Dexie {
    moodEntries!: Table<OfflineEntry<MoodEntry>>;
    schoolLogs!: Table<OfflineEntry<SchoolLog>>;
    medicationLogs!: Table<OfflineEntry<SchoolMedicationLog>>;

    constructor() {
        super('EABOfflineDB');
        this.version(1).stores({
            moodEntries: '++localId, synced, userId, timestamp',
            schoolLogs: '++localId, synced, userId, timestamp',
            medicationLogs: '++localId, synced, userId, timestamp'
        });
    }
}

export const offlineDb = new EABOfflineDatabase();
