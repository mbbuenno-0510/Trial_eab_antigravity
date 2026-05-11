// src/services/dexie.ts
import Dexie, { Table } from 'dexie';

export interface CrisisEntry {
  id?: number; // auto-increment primary key
  userId: string;
  timestamp: number; // Unix epoch ms
  type: string; // e.g., 'Sensorial', 'Emocional', etc.
  description: string;
  synced: boolean; // whether this entry has been sent to Firebase
}

class CrisisDB extends Dexie {
  public crises!: Table<CrisisEntry, number>;
  constructor() {
    super('CrisisDB');
    this.version(1).stores({
      crises: '++id, userId, timestamp, type, synced',
    });
  }
}

export const db = new CrisisDB();

export default db;
