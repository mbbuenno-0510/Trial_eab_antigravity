// src/services/crisisService.ts
import { db as firebaseDb } from '../services/firebase';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db as dexieDb, CrisisEntry } from './dexie';

/**
 * Adds a crisis entry to IndexedDB and attempts immediate Firebase sync if online.
 */
export async function addCrisisOffline(entry: Omit<CrisisEntry, 'id' | 'synced'>): Promise<void> {
  const now = Date.now();
  const fullEntry: CrisisEntry = {
    ...entry,
    timestamp: now,
    synced: false,
  };
  // Save to IndexedDB
  await dexieDb.crises.add(fullEntry);
  // If we are online, try to sync right away
  if (navigator.onLine) {
    await syncPendingCrises();
  }
}

/**
 * Retrieves all unsynced crisis entries.
 */
export function getPendingCrises(): Promise<CrisisEntry[]> {
  return dexieDb.crises.where('synced').equals(false).toArray();
}

/**
 * Marks a crisis entry as synced in IndexedDB.
 */
export async function markCrisisSynced(id: number): Promise<void> {
  await dexieDb.crises.update(id, { synced: true });
}

/**
 * Sends all pending crises to Firestore and marks them as synced.
 */
export async function syncPendingCrises(): Promise<void> {
  const pending = await getPendingCrises();
  for (const entry of pending) {
    try {
      const docRef = await addDoc(collection(firebaseDb, `users/${entry.userId}/crises`), {
        timestamp: entry.timestamp,
        type: entry.type,
        description: entry.description,
      });
      // Mark as synced locally
      if (entry.id !== undefined) {
        await markCrisisSynced(entry.id);
      }
    } catch (e) {
      console.warn('Failed to sync crisis entry', e);
      // Keep as unsynced for next attempt
    }
  }
}
