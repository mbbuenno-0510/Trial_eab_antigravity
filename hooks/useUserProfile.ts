
// src/hooks/useUserProfile.ts

import { useState, useEffect } from 'react';
import { db } from '../services/firebase'; // Assumindo a instância do Firestore
import { UserProfile } from '../types'; // Assumindo que UserProfile está em types.ts

interface UserProfileState {
    userProfile: UserProfile | null;
    loading: boolean;
}

/**
 * Hook para buscar o perfil completo do usuário (UserProfile) no Firestore em tempo real.
 * O perfil é armazenado em 'users/{uid}'.
 */
export const useUserProfile = (uid: string | null): UserProfileState => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setProfile(null);
            setLoading(false);
            return;
        }

        const docRef = db.collection('users').doc(uid);
        
        // Inicia o listener em tempo real usando a sintaxe compat (namespaced)
        const unsubscribe = docRef.onSnapshot((docSnapshot) => {
            if (docSnapshot.exists) {
                // Mapeia os dados do Firestore para a interface UserProfile
                const data = docSnapshot.data() as UserProfile;
                setProfile({ ...data, uid: docSnapshot.id }); 
            } else {
                console.warn(`Perfil do usuário com UID ${uid} não encontrado.`);
                setProfile(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar UserProfile:", error);
            setProfile(null);
            setLoading(false);
        });

        // Limpa o listener ao desmontar o componente ou mudar o UID
        return () => unsubscribe();
        
    }, [uid]);

    return { userProfile: profile, loading };
};
