import { db } from './firebase';
import { offlineDb, OfflineEntry } from './offlineDb';

export const syncOfflineData = async () => {
    if (!navigator.onLine) return;

    console.log('🔄 Iniciando sincronização de dados offline...');

    // 1. Sincronizar Diário de Humor
    const unsyncedMood = await offlineDb.moodEntries.where('synced').equals(0).toArray();
    for (const entry of unsyncedMood) {
        try {
            const userId = entry.userId;
            await db.collection('users').doc(userId).collection('mood_entries').add({
                ...entry.data,
                syncedFromOffline: true
            });
            await offlineDb.moodEntries.update(entry.localId!, { synced: true });
            console.log('✅ Humor sincronizado:', entry.localId);
        } catch (error) {
            console.error('❌ Erro ao sincronizar humor:', error);
        }
    }

    // 2. Sincronizar Diários Escolares
    const unsyncedSchoolLogs = await offlineDb.schoolLogs.where('synced').equals(0).toArray();
    for (const entry of unsyncedSchoolLogs) {
        try {
            const studentId = entry.userId;
            await db.collection('users').doc(studentId).collection('school_logs').add({
                ...entry.data,
                syncedFromOffline: true
            });
            await offlineDb.schoolLogs.update(entry.localId!, { synced: true });
            console.log('✅ Log escolar sincronizado:', entry.localId);
        } catch (error) {
            console.error('❌ Erro ao sincronizar log escolar:', error);
        }
    }

    // 3. Sincronizar Medicamentos Escolares
    const unsyncedMeds = await offlineDb.medicationLogs.where('synced').equals(0).toArray();
    for (const entry of unsyncedMeds) {
        try {
            const studentId = entry.userId;
            await db.collection('users').doc(studentId).collection('school_medication_logs').add({
                ...entry.data,
                syncedFromOffline: true
            });
            await offlineDb.medicationLogs.update(entry.localId!, { synced: true });
            console.log('✅ Medicação sincronizada:', entry.localId);
        } catch (error) {
            console.error('❌ Erro ao sincronizar medicação:', error);
        }
    }
};

// Listener para volta da conexão
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        syncOfflineData();
    });
}
