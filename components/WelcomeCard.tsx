// src/components/WelcomeCard.tsx

import React from 'react';
import { User } from 'firebase/auth'; // 👈 Import necessário para o tipo currentUser
import { UserProfile } from '../types';

interface WelcomeCardProps {
    userProfile: UserProfile | null;
    currentUser: User | null; // 👈 Adicionado para fallback do nome
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userProfile, currentUser }) => {
    
    // CORREÇÃO DE ROBUSTEZ:
    // 1. Tenta usar o campo específico do primeiro nome no perfil (se existir, assumindo a estrutura do Firestore)
    // Se userProfile tiver uma propriedade 'firstName', priorizamos ela. Caso contrário, usamos o displayName.
    const profileFullName = (userProfile as any)?.firstName || userProfile?.displayName; // Usando (as any) se 'firstName' não estiver na interface UserProfile
    
    // 2. Tenta obter o nome completo do objeto de autenticação (fallback).
    const authFullName = currentUser?.displayName;

    // 3. Prioriza o nome completo mais confiável.
    const finalFullName = profileFullName || authFullName || "Amigo";

    // ✅ EXTRAÇÃO DO PRIMEIRO NOME: Garante que apenas a primeira palavra seja usada para a saudação.
    const firstName = finalFullName.split(' ')[0];
    
    return (
        <div className="p-4 rounded-xl shadow-lg text-slate-800" 
             style={{ 
                 background: 'linear-gradient(135deg, #B3D9FF, #FFFFAA, #FFD1DC)', 
                 minHeight: '120px' 
             }}>
            
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold mb-2">
                        Olá, 
                        {/* Destaque Visual Aplicado */}
                        <span className="text-blue-700 font-extrabold ml-1">
                            {firstName}! 👋
                        </span>
                    </h2>
                    <p className="text-sm font-medium text-slate-700 opacity-90">
                        Um espaço seguro para organizar seu dia e cuidar de quem você ama.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeCard;