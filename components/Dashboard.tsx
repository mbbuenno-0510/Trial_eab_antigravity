// src/components/Dashboard.tsx

import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, Wind, Sparkles, CheckCircle, Calendar, AlertTriangle, CheckCircle2, Star, Trophy } from 'lucide-react'; 

// Importações dos componentes
import WelcomeCard from './WelcomeCard';
import DashboardSummaryCard from './DashboardSummaryCard';
import NextTherapyCard from './NextTherapyCard';
import LastDiaryCard from './LastDiaryCard';
import { Card, Button } from './ui'; 
import { GuidelineCard } from './GuidelineCard';
import { db } from '../services/firebase';
import firebase from 'firebase/compat/app';

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
        lastDiaryEntry,
        therapeuticGuidelines,
        adaptationEvents,
        pedagogicalAchievements
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

    const handleMarkGuidelineAsRead = async (guidelineId: string) => {
        if (!userProfile || !userProfile.manages || userProfile.manages.length === 0) return;
        const targetUid = userProfile.manages[0];
        try {
            await db.collection('users').doc(targetUid).collection('therapeutic_guidelines').doc(guidelineId).update({
                readByParents: true
            });
        } catch (error) {
            console.error("Error marking guideline as read:", error);
        }
    };

    const handleProvideGuidelineFeedback = async (guidelineId: string, workedWell: boolean, notes?: string) => {
        if (!userProfile || !userProfile.manages || userProfile.manages.length === 0) return;
        const targetUid = userProfile.manages[0];
        const feedback = {
            date: new Date().toISOString().split('T')[0],
            role: 'Parent',
            workedWell,
            notes: notes || ''
        };

        try {
            await db.collection('users').doc(targetUid).collection('therapeutic_guidelines').doc(guidelineId).update({
                effectivenessFeedback: firebase.firestore.FieldValue.arrayUnion(feedback)
            });
        } catch (error) {
            console.error("Error providing guideline feedback:", error);
        }
    };

    const handleMarkEventAsPrepared = async (eventId: string) => {
        if (!userProfile || !userProfile.manages || userProfile.manages.length === 0) return;
        const targetUid = userProfile.manages[0];
        try {
            await db.collection('users').doc(targetUid).collection('adaptation_events').doc(eventId).update({
                preparedByParents: true
            });
        } catch (error) {
            console.error("Error marking event as prepared:", error);
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

            {/* 2.5 DIRETRIZES TERAPÊUTICAS (Dicas do Terapeuta) */}
            {therapeuticGuidelines.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-bold text-slate-700">Como eu funciono (Dicas do Terapeuta)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {therapeuticGuidelines.map(guideline => (
                            <GuidelineCard 
                                key={guideline.id}
                                guideline={guideline}
                                userRole="Parent"
                                onMarkAsRead={handleMarkGuidelineAsRead}
                                onProvideFeedback={handleProvideGuidelineFeedback}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 2.6 CALENDÁRIO DE ADAPTAÇÃO (Alertas da Escola) */}
            {adaptationEvents.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-bold text-slate-700">Eventos de Adaptação (Escola)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {adaptationEvents.filter(e => {
                            const eventDate = new Date(e.date + 'T12:00:00');
                            return eventDate >= new Date(new Date().setHours(0,0,0,0));
                        }).map(event => (
                            <div key={event.id} className="p-4 bg-white border-2 border-purple-100 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex gap-4 items-start">
                                    <div className="bg-purple-100 p-3 rounded-xl text-purple-600 shrink-0">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase">{event.type}</span>
                                            <span className="text-xs font-bold text-slate-400">{new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800">{event.title}</h4>
                                        {event.description && <p className="text-xs text-slate-500 mt-1">{event.description}</p>}
                                    </div>
                                </div>
                                
                                {!event.preparedByParents ? (
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-2 max-w-xs">
                                            <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0" />
                                            <p className="text-[10px] text-blue-800 leading-tight">Prepare a criança com antecipação visual e histórias sociais para este evento.</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleMarkEventAsPrepared(event.id)}
                                            className="bg-purple-600 hover:bg-purple-700 text-xs py-2 h-auto"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como Preparado
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100 font-bold text-xs shrink-0">
                                        <CheckCircle2 className="w-4 h-4" /> Preparado
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}


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
            {/* 4. LINHA DO TEMPO DE VITÓRIAS (Marcos Pedagógicos) */}
            {pedagogicalAchievements.length > 0 && (
                <div className="mt-8 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Linha do Tempo de Vitórias</h3>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase">PDI Dinâmico</span>
                    </div>

                    <div className="relative border-l-2 border-amber-100 ml-3 space-y-6">
                        {pedagogicalAchievements.sort((a, b) => {
                            const dateA = new Date(a.date).getTime();
                            const dateB = new Date(b.date).getTime();
                            return dateB - dateA;
                        }).map((achievement, idx) => (
                            <div key={achievement.id} className="relative pl-8 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Ponto na linha */}
                                <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                </div>
                                
                                <div className="bg-white p-4 rounded-2xl border-2 border-amber-50 shadow-sm hover:border-amber-100 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
                                            {new Date(achievement.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                        </span>
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    </div>
                                    <p className="text-sm text-slate-700 font-bold leading-relaxed">
                                        {achievement.achievementDescription}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-2 italic flex items-center gap-1">
                                        Registrado por Escola
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VERSÃO NO RODAPÉ DO DASHBOARD */}
            <p className="text-[10px] text-slate-400 mt-8 mb-4 font-bold tracking-wider text-center uppercase">
                Desenvolvido por MichelBB | v1.1.0
            </p>
        </div>
    );
};

export default Dashboard;