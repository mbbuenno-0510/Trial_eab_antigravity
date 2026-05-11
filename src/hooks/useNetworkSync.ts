// src/hooks/useNetworkSync.ts
import { useEffect } from 'react';
import { syncPendingCrises } from '../services/crisisService';

/**
 * Hook that listens for online status changes (and Wi‑Fi if supported)
 * and triggers synchronization of offline‑stored crises.
 */
export function useNetworkSync() {
  useEffect(() => {
    const handleOnline = () => {
      // Prefer Wi‑Fi when the Network Information API is available
      const connection = (navigator as any).connection;
      if (connection && connection.type && connection.type !== 'wifi') {
        // Not Wi‑Fi, ignore for now (you can adjust logic as needed)
        return;
      }
      syncPendingCrises();
    };
    window.addEventListener('online', handleOnline);
    // Initial check in case we start already online
    if (navigator.onLine) {
      handleOnline();
    }
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
