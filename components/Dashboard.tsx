// src/components/Dashboard.tsx

import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, Wind, Sparkles, CheckCircle } from 'lucide-react'; 

// Importações dos componentes
import WelcomeCard from './WelcomeCard';
import DashboardSummaryCard from './DashboardSummaryCard';
import NextTherapyCard from './NextTherapyCard';
import LastDiaryCard from './LastDiaryCard';
import { Card, Button } from './ui'; 

// Hooks e Tipos
import { auth } from '../services/firebase'; 
import { useDashboardData } from '../hooks/useDashboardData';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { UserProfile, ProfileType } from '../types';
import { Smartphone } from 'lucide-react';

interface DashboardProps {
    currentUser: User | null;
    userProfile: UserProfile | null;
    onChangeView: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, userProfile, onChangeView }) => {
    
    // Obter dados do dashboard usando o perfil passado via props
    const { 
        loading, 
        totalDiaries, 
        upcomingAppointments, 
        pendingTasks, 
        totalDocuments,
        upcomingTherapies, 
        lastDiaryEntry 
    } = useDashboardData(userProfile);

    const { isInstallable, isStandalone, installPWA } = usePWAInstall();

    // Seleciona o próximo compromisso para o card de destaque
    const nextAppointment = upcomingTherapies.length > 0 ? upcomingTherapies[0] : null;

    // --- Função de Logout ---
    const handleLogout = async () => {
        try {
            await auth.signOut(); 
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };
    
    if (loading) {
        return <div className="p-4 text-center flex items-center justify-center h-screen"><span className="animate-pulse">Carregando dados...</span></div>;
    }

    // Calcula o total de compromissos futuros (únicos + recorrentes)
    const totalUpcomingEvents = upcomingAppointments + upcomingTherapies.filter(appt => appt.isRecurrent).length;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            
            {/* 1. CABEÇALHO COM WELCOMECARD E BOTÃO SAIR */}
            <div className="flex justify-between items-start mb-6">
                
                {/* Welcome Card (Ocupa o espaço principal) */}
                <WelcomeCard userProfile={userProfile} currentUser={currentUser} />
                
                <div className="flex flex-col items-end gap-2 ml-4">
                    {/* BOTÃO SAIR NO TOPO */}
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center text-sm text-slate-500 hover:text-red-500 p-2"
                    >
                        <LogOut className="w-4 h-4 mr-1" />
                        Sair
                    </Button>
                </div>
            </div>

            {/* 2. SUMÁRIO DOS DADOS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                
                {/* CARD 1: DIÁRIO DE HUMOR (CLICÁVEL para 'diary') */}
                <div 
                    onClick={() => onChangeView('diary')}
                    className="cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
                >
                    <DashboardSummaryCard title="Diário de Humor" value={totalDiaries} icon="Diary" />
                </div>

                {/* CARD 2: COMPROMISSOS */}
                <DashboardSummaryCard title="Compromissos" value={totalUpcomingEvents} icon="Calendar" /> 
                
                {/* CARD 3: PENDÊNCIAS (CLICÁVEL para 'routines') */}
                <div
                    onClick={() => onChangeView('routines')}
                    className="cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
                >
                    <DashboardSummaryCard title="Pendências" value={pendingTasks} icon="Task" />
                </div>

                {/* CARD 4: DOCUMENTOS (CLICÁVEL para 'docs') */}
                <div
                    onClick={() => onChangeView('docs')} 
                    className="cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
                >
                    <DashboardSummaryCard title="Documentos" value={totalDocuments} icon="Document" />
                </div>
            </div>

            {/* 3. CARTÕES DE DESTAQUE (Next Appointment & Last Diary) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Próximos Compromissos */}
                <div>
                    {nextAppointment ? (
                        <NextTherapyCard nextTherapy={nextAppointment} />
                    ) : (
                        <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-lg text-center text-slate-500 min-h-[140px] flex items-center justify-center flex-col">
                            <CheckCircle className="w-8 h-8 mb-2 text-green-400 opacity-50" />
                            <span className="text-sm">Nada agendado para hoje.</span>
                        </Card>
                    )}
                </div>
                
                {/* Último Registro do Diário */}
                <LastDiaryCard lastEntry={lastDiaryEntry} />
            </div>
        </div>
    );
};

export default Dashboard;