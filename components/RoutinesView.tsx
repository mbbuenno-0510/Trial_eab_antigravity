
import React, { useState, useEffect, useMemo, FC, ReactElement } from 'react';
// IMPORTAÇÃO LUCIDE-REACT PARA ÍCONES (Usados dentro do wrapper 3D)
import { Trophy, Star, Loader2, Home, School, CalendarCheck, Target, Gift, Medal, CheckCircle, Clock, Plus, LayoutList, BookOpen, CalendarDays, Layers } from 'lucide-react';
// ASSUMIMOS QUE VOCÊ ATUALIZOU RoutineItem, RoutineFrequency, etc.
import { RoutineItem, RoutineFrequency, Period, PERIODS, RoutineLog, UserProfile, ProfileType, GoalConfig, DailyRewardHistory } from '../types'; 

// Importa os serviços e componentes refatorados
import { suggestRoutineIcon } from '../services/geminiService';
import { db } from '../services/firebase';
import RoutineListItem from './RoutineListItem';
import StarProgressBarHorizontal from './StarProgressBarHorizontal'; // Componente externo com animação
import { Card, Button, Input, Select } from './ui'; // Componentes de UI compartilhados

// ====================================================================
// CONSTANTES PARA DIAS DA SEMANA
// ====================================================================
const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// ====================================================================
// ÍCONE PLACEHOLDER 3D/COLORIDO REVISADO (SIMULAÇÃO)
// ====================================================================

interface DynamicIconProps {
    tab: 'add' | 'house' | 'school' | 'history' | 'goals';
}

const DynamicTabIcon: FC<DynamicIconProps> = ({ tab }) => {
    // --- MAPEAR CORES, GRADIENTES e ÍCONES ---
    const iconMap: { [key in typeof tab]: { icon: ReactElement; gradient: string; shadowColor: string; } } = {
        'add': { icon: <Plus className="w-6 h-6" />, gradient: 'from-pink-500 to-red-600', shadowColor: 'shadow-pink-500/50' },
        'house': { icon: <Home className="w-6 h-6" />, gradient: 'from-green-500 to-teal-600', shadowColor: 'shadow-green-500/50' },
        'school': { icon: <BookOpen className="w-6 h-6" />, gradient: 'from-sky-500 to-indigo-600', shadowColor: 'shadow-sky-500/50' },
        'history': { icon: <CalendarCheck className="w-6 h-6" />, gradient: 'from-purple-500 to-fuchsia-600', shadowColor: 'shadow-purple-500/50' },
        'goals': { icon: <Target className="w-6 h-6" />, gradient: 'from-yellow-500 to-orange-600', shadowColor: 'shadow-orange-500/50' },
    };

    const { icon, gradient, shadowColor } = iconMap[tab];

    // Renderiza o "Sticker" 3D: um contêiner colorido e arredondado com sombra forte.
    return (
        <div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                         bg-gradient-to-br ${gradient} 
                         shadow-xl ${shadowColor} 
                         text-white // Cor do ícone dentro do contêiner 3D
                         transition-all duration-300 transform 
                         hover:scale-105`}
        >
             {icon}
        </div>
    );
};


// ====================================================================
// COMPONENTES DE GAMIFICAÇÃO 
// ====================================================================

const XP_PER_TASK = 10;
const XP_PER_LEVEL = 100;

interface LevelStats {
    level: number;
    xpCurrent: number;
    xpToNextLevel: number;
    progressPercent: number;
}

const calculateLevel = (totalXp: number): LevelStats => {
    if (totalXp < 0) totalXp = 0;
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    const xpCurrent = totalXp % XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL - xpCurrent;
    const progressPercent = (xpCurrent / XP_PER_LEVEL) * 100;
    return { level, xpCurrent, xpToNextLevel, progressPercent };
};

const PlayerCard: React.FC<{ stats: LevelStats, username: string }> = ({ stats, username }) => {
    // ... (PlayerCard permanece inalterado, usa apenas o XP total)
    return (
        <div className="p-5 rounded-2xl text-white shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700 mb-6 w-full relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                        <Trophy className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Nível</p>
                        <h3 className="text-3xl font-black leading-none">{stats.level}</h3>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold">{username}</p>
                    <p className="text-xs opacity-70 mt-1 font-mono">XP Total: {stats.level * XP_PER_LEVEL + stats.xpCurrent}</p>
                </div>
            </div>
            <div className="mt-4 relative z-10">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-1 opacity-90">
                    <span>Progresso</span>
                    <span>Próximo: Nível {stats.level + 1}</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm border border-white/10">
                    <div 
                        className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(253,224,71,0.5)]"
                        style={{ width: `${stats.progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

interface RoutinesViewProps {
    userProfile: UserProfile | null;
}

const FREQUENCIES: RoutineFrequency[] = ['Diário', 'Semanal', 'Mensal', 'Ocasional'];

// 🛠️ CORREÇÃO: Usar Data Local para evitar problemas de fuso horário (UTC vs Local)
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const RoutinesView: React.FC<RoutinesViewProps> = ({ userProfile }) => {
    
    // 1. Determinação do UID Ativo
    const activeUid = useMemo(() => {
        if (!userProfile) return null;
        if (userProfile.profileType === ProfileType.CHILD) return userProfile.uid;
        if (userProfile.profileType === ProfileType.ADULT && userProfile.manages && userProfile.manages.length > 0) {
            return userProfile.manages[0]; 
        }
        return userProfile.uid; 
    }, [userProfile]);

    // --- STATES ---
    const [routines, setRoutines] = useState<RoutineItem[]>([]);
    const [routineLogs, setRoutineLogs] = useState<RoutineLog[]>([]);
    const [totalXp, setTotalXp] = useState(0); 
    
    // Configuração de Metas (ATUALIZADO com metas diárias e semanais)
    const [goalConfig, setGoalConfig] = useState<GoalConfig>({ 
        targetPercentageDaily: 80, 
        rewardTextDaily: '30 min de Tablet', 
        targetPercentageWeekly: 90, 
        rewardTextWeekly: 'Passeio no parque', 
        isEnabled: false,
        isWeeklyEnabled: false // 🆕 Inicializa como falso
    });
    const [isSavingGoal, setIsSavingGoal] = useState(false);
    const [dailyRewardHistory, setDailyRewardHistory] = useState<DailyRewardHistory[]>([]);

    // Local UI States
    const [newItem, setNewItem] = useState('');
    const [frequency, setFrequency] = useState<RoutineFrequency>('Diário');
    const [selectedDays, setSelectedDays] = useState<number[]>([]); // 🆕 Estado para dias selecionados
    const [category, setCategory] = useState<'house' | 'school'>('house');
    const [period, setPeriod] = useState<Period>('Manhã');
    const [addAllPeriods, setAddAllPeriods] = useState(false); // 🆕 Estado para adicionar em todos os períodos
    const [isAddingRoutine, setIsAddingRoutine] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [routineToDeleteId, setRoutineToDeleteId] = useState<string | null>(null);

    // Filtros Histórico
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'missed'>('all');

    // Variáveis de perfil 
    const isChild = userProfile?.profileType === ProfileType.CHILD;
    const isAdultOnly = userProfile?.profileType === ProfileType.ADULT;
    const canSeeExecutionTabs = true; 
    const canManage = !isChild; 
    const executionIsBlockedForAdult = isAdultOnly;
    
    // Permissão: Permite acesso a todos exceto CHILD
    const canSeeManagementTabs = userProfile?.profileType !== ProfileType.CHILD; 
    
    // Abas
    const [activeTab, setActiveTab] = useState<'add' | 'house' | 'school' | 'history' | 'goals'>(
        isChild ? 'house' : 'add' 
    );
    const [periodFilter, setPeriodFilter] = useState<Period | null>(null);

    // Estatísticas
    const playerStats = useMemo(() => {
        const completedTasksCount = routineLogs.filter(log => log.status === 'completed').length;
        const cumulativeXp = completedTasksCount * XP_PER_TASK;
        return calculateLevel(cumulativeXp);
    }, [routineLogs]);
    
    const username = userProfile?.displayName || 'Jogador';
    const today = getTodayDateString();
    const todayDayIndex = new Date().getDay(); // 0 (Domingo) a 6 (Sábado)

    // --- LÓGICA DE METAS E CÁLCULO DIÁRIO (Função Auxiliar) ---
    const calculateCurrentStats = (currentRoutines: RoutineItem[], today: string) => {
        // 🎯 LÓGICA DE FILTRAGEM DIÁRIA ATUALIZADA
        // Agora filtra também pelos dias da semana selecionados
        const targetRoutines = currentRoutines.filter(r => {
            if (r.frequency === 'Ocasional') return false; // Ocasionais não contam pra meta diária
            
            if (r.frequency === 'Semanal') {
                // Se for semanal e tiver dias específicos, só conta se for hoje
                if (r.selectedDays && r.selectedDays.length > 0) {
                    return r.selectedDays.includes(todayDayIndex);
                }
                // Se for semanal sem dias (legado), conta sempre ou nunca? Vamos assumir que "Semanal" sem dias é "Todo dia" para compatibilidade, ou "Nunca"? 
                // Assumindo que o usuário vai editar. Vamos mostrar para não sumir.
                return true; 
            }
            
            // Diário conta sempre
            return true;
        }); 
        
        const totalTarget = targetRoutines.length;
        
        if (totalTarget === 0) return { percent: 0, completed: 0, total: 0 };

        const completedTodayCount = targetRoutines.filter(r => r.lastCompletedDate === today).length;
        const percent = Math.min(100, Math.round((completedTodayCount / totalTarget) * 100));

        return { percent, completed: completedTodayCount, total: targetRoutines.length };
    };

    // --- LÓGICA DE CÁLCULO SEMANAL (Apenas para o display da meta - o log é mais complexo) ---
    const calculateWeeklyTargetTasks = useMemo(() => {
        // Placeholder: considera tarefas ativas
        return routines.filter(r => r.frequency === 'Diário' || r.frequency === 'Semanal').length;
    }, [routines]);

    const calculateWeeklyProgress = useMemo(() => {
        const startOfWeek = new Date(new Date().setDate(new Date().getDate() - todayDayIndex)).toISOString().split('T')[0];
        const logsThisWeek = routineLogs.filter(log => log.date >= startOfWeek && log.status === 'completed');
        
        // Estimativa simplificada
        const totalPossibleTasks = routines.reduce((sum, r) => {
            if (r.frequency === 'Diário') return sum + 7;
            if (r.frequency === 'Semanal') return sum + (r.selectedDays?.length || 1);
            return sum;
        }, 0);

        if (totalPossibleTasks === 0) return { percent: 0, total: 0 };
        const totalCompleted = logsThisWeek.length;
        const percent = Math.min(100, Math.round((totalCompleted / totalPossibleTasks) * 100));

        return { percent, completed: totalCompleted, total: totalPossibleTasks };
    }, [routines, routineLogs, todayDayIndex]);


    const dailyProgressStats = useMemo(() => {
        return calculateCurrentStats(routines, today);
    }, [routines, today, todayDayIndex]);


    // --- LISTENERS ---

    useEffect(() => {
        if (!activeUid) return;

        // 1. Rotinas
        const unsubRoutines = db.collection('users').doc(activeUid).collection('routines').onSnapshot((snap) => {
            const currentRoutines = snap.docs.map(d => ({ id: d.id, ...d.data() } as RoutineItem));
            setRoutines(currentRoutines);
        });

        // 2. Logs
        const unsubLogs = db.collection('users').doc(activeUid).collection('routine_logs').orderBy('date', 'desc').onSnapshot((snap) => {
            const logsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as RoutineLog));
            setRoutineLogs(logsData);
            setTotalXp(logsData.filter(log => log.status === 'completed').length * XP_PER_TASK);
        });

        // 3. Configuração de Metas (ATUALIZADO para novos campos)
        const unsubGoalConfig = db.collection('users').doc(activeUid).collection('goals_config').doc('default').onSnapshot((docSnap) => {
            if (docSnap.exists) {
                const data = docSnap.data() as Partial<GoalConfig>;
                setGoalConfig({
                    ...goalConfig, 
                    ...data,
                    targetPercentageDaily: data.targetPercentageDaily || 80,
                    rewardTextDaily: data.rewardTextDaily || '30 min de Tablet',
                    targetPercentageWeekly: data.targetPercentageWeekly || 90,
                    rewardTextWeekly: data.rewardTextWeekly || 'Passeio no parque',
                    isWeeklyEnabled: data.isWeeklyEnabled ?? false,
                });
            }
        });

        // 4. Histórico de Recompensas
        const unsubRewards = db.collection('users').doc(activeUid).collection('rewards_history').orderBy('date', 'desc').onSnapshot((snap) => {
            const rewardsData = snap.docs.map(d => d.data() as DailyRewardHistory);
            setDailyRewardHistory(rewardsData);
        });

        return () => {
            unsubRoutines();
            unsubLogs();
            unsubGoalConfig();
            unsubRewards();
        };
    }, [activeUid]);

    // --- SALVAR CONFIGURAÇÃO DE META ---
    const handleSaveGoalConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeUid) return;
        setIsSavingGoal(true);
        try {
            await db.collection('users').doc(activeUid).collection('goals_config').doc('default').set(goalConfig);
            alert('Configuração de metas salva com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar metas:", error);
            alert('Erro ao salvar.');
        } finally {
            setIsSavingGoal(false);
        }
    };

    // --- HANDLE TOGGLE REWARD CLAIMED (Controle dos Pais) ---
    const handleToggleRewardClaimed = async (date: string, currentValue: boolean) => {
        if (!activeUid || isChild) return;
        try {
            await db.collection('users').doc(activeUid).collection('rewards_history').doc(date).update({ rewardClaimed: !currentValue });
        } catch (error) {
            console.error("Erro ao atualizar status da recompensa:", error);
            alert('Erro ao atualizar status.');
        }
    };

    // --- HELPER: TOGGLE DAY ---
    const toggleDay = (dayIndex: number) => {
        setSelectedDays(prev => {
            if (prev.includes(dayIndex)) {
                return prev.filter(d => d !== dayIndex);
            } else {
                return [...prev, dayIndex].sort();
            }
        });
    };

    // --- CRUD ROTINAS (ATUALIZADO) ---

    const addRoutine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeUid || !newItem.trim()) return;
        if (isChild) {
            alert("Apenas perfis de gestão (Adulto) podem adicionar rotinas.");
            return;
        }

        // Validação para Semanal
        if (frequency === 'Semanal' && selectedDays.length === 0) {
            alert("Selecione pelo menos um dia da semana para rotinas semanais.");
            return;
        }

        setIsAddingRoutine(true);
        try {
            let icon = '📝';
            try { icon = await suggestRoutineIcon(newItem); } catch (e) { console.error(e); }

            // 🆕 LÓGICA PARA CRIAR EM TODOS OS PERÍODOS
            const periodsToCreate: Period[] = addAllPeriods ? ['Manhã', 'Tarde', 'Noite'] : [period];

            const promises = periodsToCreate.map(p => {
                 const newRoutine: Omit<RoutineItem, 'id'> = {
                    userId: activeUid, 
                    title: newItem.trim(),
                    frequency: frequency,
                    type: category,
                    lastCompletedDate: null, 
                    period: p, // Usa o período do loop
                    icon,
                    // Salva dias selecionados apenas se for Semanal (ou Diário pode ser implícito)
                    selectedDays: frequency === 'Semanal' ? selectedDays : [], 
                };
                return db.collection('users').doc(activeUid).collection('routines').add(newRoutine);
            });
            
            await Promise.all(promises);
            
            setNewItem('');
            setSelectedDays([]); // Reset
            setAddAllPeriods(false); // Reset checkbox
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar rotina.");
        } finally {
            setIsAddingRoutine(false);
        }
    };

    // 🔑 TOGGLE ROTINA COM VERIFICAÇÃO DE META (Mantido)
    const toggleRoutine = async (id: string) => {
        if (!activeUid) return;
        if (executionIsBlockedForAdult) {
            alert("Apenas o perfil de Criança pode marcar tarefas como concluídas.");
            return;
        }

        const routine = routines.find(r => r.id === id);
        if (!routine) return;

        const isCompletedToday = routine.lastCompletedDate === today;
        
        try {
            // 1. Atualiza Rotina
            await db.collection('users').doc(activeUid).collection('routines').doc(id).update({
                lastCompletedDate: isCompletedToday ? null : today 
            });

            // 2. Atualiza Log
            if (!isCompletedToday) {
                const newLog: Omit<RoutineLog, 'id'> = {
                    routineId: id, userId: activeUid, title: routine.title, date: today, status: 'completed', 
                    type: routine.type, period: routine.period, icon: routine.icon,
                };
                await db.collection('users').doc(activeUid).collection('routine_logs').add(newLog);
            } else {
                // Remover log
                const snapshot = await db.collection('users').doc(activeUid).collection('routine_logs')
                    .where('routineId', '==', id)
                    .where('date', '==', today)
                    .where('status', '==', 'completed')
                    .get();
                snapshot.forEach(doc => doc.ref.delete());
            }

            // 3. 🎯 LÓGICA DE RECOMPENSA
            if (goalConfig.isEnabled) {
                const updatedRoutinesSimulated = routines.map(r => 
                    r.id === id 
                        ? { ...r, lastCompletedDate: isCompletedToday ? null : today } as RoutineItem
                        : r
                );

                const newStats = calculateCurrentStats(updatedRoutinesSimulated, today);
                
                const goalWasMet = newStats.percent >= goalConfig.targetPercentageDaily; 
                
                const previousHistory = dailyRewardHistory.find(h => h.date === today);

                await db.collection('users').doc(activeUid).collection('rewards_history').doc(today).set({
                    date: today,
                    achievedPercentage: newStats.percent,
                    targetPercentage: goalConfig.targetPercentageDaily,
                    goalWasMet: goalWasMet, 
                    rewardText: goalConfig.rewardTextDaily || 'Recompensa Surpresa',
                    rewardClaimed: previousHistory?.rewardClaimed ?? false
                }, { merge: true });
            }

        } catch (error) {
            console.error("Error toggling:", error);
        }
    };

    const deleteRoutine = async () => {
        if (!activeUid || !routineToDeleteId || isChild) return;
        try {
            await db.collection('users').doc(activeUid).collection('routines').doc(routineToDeleteId).delete();
            alert("Rotina excluída.");
        } catch (error) {
            alert("Erro ao excluir.");
        } finally {
            setIsDeleteModalOpen(false);
            setRoutineToDeleteId(null);
        }
    };

    // --- FILTROS DE EXIBIÇÃO (ATUALIZADO PARA DIAS DA SEMANA) ---
    const getFilteredRoutines = (type: 'house' | 'school') => {
        return routines
            .filter(r => {
                // Filtro 1: Tipo e Período (existente)
                if (r.type !== type) return false;
                if (periodFilter && r.period !== periodFilter) return false;
                
                // Filtro 2: Frequência e Dia da Semana (NOVO)
                if (r.frequency === 'Ocasional') return true; // Ocasionais aparecem sempre
                if (r.frequency === 'Mensal') return true;    // Mensais aparecem sempre (simplificação)
                if (r.frequency === 'Diário') return true;    // Diários aparecem sempre

                // Se for Semanal, verificar se hoje é um dos dias selecionados
                if (r.frequency === 'Semanal') {
                    if (r.selectedDays && r.selectedDays.length > 0) {
                        return r.selectedDays.includes(todayDayIndex);
                    }
                    // Se não tiver dias selecionados (legado), mostra (ou esconde). Vamos mostrar.
                    return true;
                }
                
                return true;
            })
            .sort((a, b) => {
                // Ordenar: Pendentes primeiro, depois completas
                const completedA = a.lastCompletedDate === today;
                const completedB = b.lastCompletedDate === today;
                if (completedA !== completedB) return completedA ? 1 : -1;
                // Depois por período
                const pA = a.period ? PERIODS.indexOf(a.period) : 99;
                const pB = b.period ? PERIODS.indexOf(b.period) : 99;
                if (pA !== pB) return pA - pB;
                return a.title.localeCompare(b.title);
            });
    };

    // --- VISUAL DA META DO DIA (Para Criança - USANDO METAS DIÁRIAS) ---
    const renderDailyGoalWidget = () => {
        if (!goalConfig.isEnabled) return null;
        
        // Verifica se a meta foi atingida usando o useMemo de estatísticas
        const isGoalMet = dailyProgressStats.percent >= goalConfig.targetPercentageDaily;
        
        return (
            <div className={`mx-4 mb-4 p-4 rounded-2xl border-2 transition-all duration-500 shadow-md ${isGoalMet ? 'bg-green-50 border-green-200' : 'bg-white border-indigo-100'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${isGoalMet ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {isGoalMet ? <Medal className="w-5 h-5 animate-bounce" /> : <Target className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Meta Diária</h4>
                            <p className="text-xs text-slate-500">{isGoalMet ? 'Conquistada!' : `Alcance ${goalConfig.targetPercentageDaily}% para ganhar:`}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-xl font-black ${isGoalMet ? 'text-green-600' : 'text-indigo-600'}`}>
                            {dailyProgressStats.percent}%
                        </span>
                        <span className="text-xs text-slate-400 font-medium"> / {goalConfig.targetPercentageDaily}%</span>
                    </div>
                </div>
                
                {/* Barra de Progresso da Meta */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-2">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isGoalMet ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(100, dailyProgressStats.percent)}%` }}
                    />
                </div>

                {/* Descrição da Recompensa */}
                <div className={`flex items-center gap-2 text-sm font-medium ${isGoalMet ? 'text-green-700' : 'text-slate-600'}`}>
                    <Gift className={`w-4 h-4 ${isGoalMet ? 'text-green-600' : 'text-slate-400'}`} />
                    <span>{isGoalMet ? `Você ganhou: ${goalConfig.rewardTextDaily}` : `Prêmio: ${goalConfig.rewardTextDaily || 'Surpresa'}`}</span>
                </div>
            </div>
        );
    };

    // Calcula o número de tarefas necessárias (para UX dos pais - DIÁRIO)
    // Atualizado para considerar o filtro de dia da semana na contagem total
    const totalTargetRoutinesDaily = routines.filter(r => {
        if (r.frequency === 'Ocasional') return false;
        if (r.frequency === 'Semanal') {
            return r.selectedDays && r.selectedDays.includes(todayDayIndex);
        }
        return true; 
    }).length;

    const requiredTasksDaily = Math.ceil((goalConfig.targetPercentageDaily / 100) * totalTargetRoutinesDaily);

    const getTabLabel = (tab: 'add' | 'house' | 'school' | 'history' | 'goals'): string => {
        switch (tab) {
            case 'add': return 'Adicionar';
            case 'house': return 'Casa';
            case 'school': return 'Escola';
            case 'history': return 'Histórico';
            case 'goals': return 'Metas';
            default: return '';
        }
    };
    
    // Lista de abas para renderização
    const executionTabs: ('house' | 'school')[] = ['house', 'school'];
    const managementTabs: ('add' | 'history' | 'goals')[] = ['add', 'history', 'goals'];


    return (
        <div className="space-y-6 animate-fade-in pb-24 p-4 max-w-4xl mx-auto">
            {/* Player Card (Criança) */}
            {isChild && <PlayerCard stats={playerStats} username={username} />}

            {/* --- Abas de Navegação (Menu de Ícones 3D Dinâmico) --- */}
            <div className="flex justify-between p-2 bg-white rounded-3xl w-full shadow-lg">
                
                {/* Abas de EXECUÇÃO (Para todos) */}
                {canSeeExecutionTabs && executionTabs.map(tab => (
                    <div className="relative flex-1 flex flex-col items-center" key={tab}>
                        <button 
                            onClick={() => setActiveTab(tab)} 
                            className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative z-10 
                                ${activeTab === tab 
                                    ? 'shadow-xl transform scale-100'
                                    : 'hover:bg-slate-50'
                                }`}
                        >
                            <DynamicTabIcon tab={tab} />
                            {/* Nome da Aba Abaixo do Ícone */}
                            <span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === tab ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                                {getTabLabel(tab)}
                            </span>
                        </button>
                    </div>
                ))}
                
                {/* Abas de GESTÃO (ADULT/PROFESSIONAL) */}
                {canSeeManagementTabs && managementTabs.map(tab => (
                    <div className="relative flex-1 flex flex-col items-center" key={tab}>
                        <button 
                            onClick={() => setActiveTab(tab)} 
                            className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative z-10 
                                ${activeTab === tab 
                                    ? 'shadow-xl transform scale-100'
                                    : 'hover:bg-slate-50'
                                }`}
                        >
                            <DynamicTabIcon tab={tab} />
                            {/* Nome da Aba Abaixo do Ícone */}
                            <span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === tab ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                                {getTabLabel(tab)}
                            </span>
                        </button>
                    </div>
                ))}

            </div>

            {/* --- ABA DE CONFIGURAÇÃO DE METAS (ADULT/PROFISSIONAL) --- */}
            {activeTab === 'goals' && canSeeManagementTabs && (
                <div className="space-y-6">
                    <Card title="🎯 Configurar Metas e Recompensas">
                        {activeUid && canManage ? (
                            <form onSubmit={handleSaveGoalConfig} className="space-y-6">
                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only peer" checked={goalConfig.isEnabled} onChange={e => setGoalConfig({...goalConfig, isEnabled: e.target.checked})} />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">Ativar Sistema de Recompensas</span>
                                    </label>
                                </div>

                                <div className={`space-y-8 ${!goalConfig.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {/* --- META DIÁRIA --- */}
                                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                                        <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><CalendarCheck className='w-5 h-5'/> Meta Diária</h3>
                                        <div className="mb-4">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Porcentagem Diária: <span className="text-indigo-600 text-lg">{goalConfig.targetPercentageDaily}%</span>
                                                {totalTargetRoutinesDaily > 0 && (
                                                    <span className="text-sm font-normal text-slate-500 ml-2">
                                                        (≈ {requiredTasksDaily} de {totalTargetRoutinesDaily} tarefas hoje)
                                                    </span>
                                                )}
                                            </label>
                                            <input 
                                                type="range" 
                                                min="10" 
                                                max="100" 
                                                step="5"
                                                value={goalConfig.targetPercentageDaily} 
                                                onChange={e => setGoalConfig({...goalConfig, targetPercentageDaily: parseInt(e.target.value)})}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">A criança precisa completar esta porcentagem de rotinas diárias para ganhar o prêmio diário.</p>
                                        </div>

                                        <div className="mb-4">
                                            <Input 
                                                label="Prêmio Diário" 
                                                placeholder="Ex: 30min de Tablet" 
                                                type="text" 
                                                value={goalConfig.rewardTextDaily} 
                                                onChange={e => setGoalConfig({...goalConfig, rewardTextDaily: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* --- META SEMANAL (ATUALIZADA) --- */}
                                    <div className={`p-4 rounded-xl border transition-colors duration-300 ${goalConfig.isWeeklyEnabled ? 'border-yellow-200 bg-yellow-50' : 'border-slate-200 bg-slate-50'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className={`font-bold flex items-center gap-2 ${goalConfig.isWeeklyEnabled ? 'text-yellow-800' : 'text-slate-500'}`}>
                                                <Trophy className={`w-5 h-5 ${!goalConfig.isWeeklyEnabled && 'grayscale opacity-50'}`}/> 
                                                Meta Semanal
                                            </h3>
                                            
                                            {/* TOGGLE META SEMANAL */}
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <span className={`text-xs font-bold ${goalConfig.isWeeklyEnabled ? 'text-yellow-700' : 'text-slate-400'}`}>
                                                    {goalConfig.isWeeklyEnabled ? 'Ativado' : 'Desativado'}
                                                </span>
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={goalConfig.isWeeklyEnabled || false} 
                                                        onChange={e => setGoalConfig({...goalConfig, isWeeklyEnabled: e.target.checked})} 
                                                    />
                                                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* CONTEÚDO CONDICIONAL */}
                                        <div className={`transition-all duration-300 ${!goalConfig.isWeeklyEnabled ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                                            <p className="text-xs text-slate-500 mb-4">(Tarefas Diárias + Semanais)</p>
                                            
                                            <div className="mb-4">
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Porcentagem Semanal: <span className="text-orange-600 text-lg">{goalConfig.targetPercentageWeekly}%</span>
                                                    {calculateWeeklyTargetTasks > 0 && (
                                                        <span className="text-sm font-normal text-slate-500 ml-2">
                                                            (Baseado em {calculateWeeklyTargetTasks} rotinas ativas)
                                                        </span>
                                                    )}
                                                </label>
                                                <input 
                                                    type="range" 
                                                    min="10" 
                                                    max="100" 
                                                    step="5"
                                                    value={goalConfig.targetPercentageWeekly} 
                                                    onChange={e => setGoalConfig({...goalConfig, targetPercentageWeekly: parseInt(e.target.value)})}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">É a porcentagem de *conclusões* de rotinas Diárias e Semanais esperada durante 7 dias.</p>
                                            </div>

                                            <div className="mb-4">
                                                <Input 
                                                    label="Prêmio Semanal (Maior)" 
                                                    placeholder="Ex: Passeio no parque, Escolher filme..." 
                                                    type="text" 
                                                    value={goalConfig.rewardTextWeekly} 
                                                    onChange={e => setGoalConfig({...goalConfig, rewardTextWeekly: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSavingGoal}>
                                    {isSavingGoal ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : 'Salvar Configuração'}
                                </Button>
                            </form>
                        ) : (
                            <p className="text-sm text-slate-500">Faça login para configurar metas.</p>
                        )}
                    </Card>

                    {/* Histórico de Metas Recente (INALTERADO) */}
                    <Card title="🏆 Histórico de Conquistas (Últimos 7 dias)">
                        {dailyRewardHistory.length === 0 ? (
                            <p className="text-slate-400 text-center py-4 text-sm">Nenhum histórico registrado ainda.</p>
                        ) : (
                            <div className="space-y-3">
                                {dailyRewardHistory.slice(0, 7).map((history) => (
                                    <div 
                                        key={history.date} 
                                        // Colore baseado se a meta foi ATINGIDA (goalWasMet)
                                        className={`flex items-start justify-between p-3 rounded-xl border transition-colors ${history.goalWasMet ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">
                                                {new Date(history.date + 'T12:00:00').toLocaleDateString('pt-BR')} 
                                                <span className={`ml-2 text-xs font-medium ${history.goalWasMet ? 'text-green-600' : 'text-red-600'}`}>
                                                    ({history.goalWasMet ? '🎯 Meta Atingida' : '❌ Meta Perdida'})
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-500">Alcançado: {history.achievedPercentage}% / {history.targetPercentage}%</p>
                                            <p className="text-xs font-medium mt-1 text-indigo-600 flex items-center gap-1">
                                                <Gift className="w-3 h-3 text-indigo-400"/> {history.rewardText}
                                            </p>
                                        </div>
                                        {/* Botão de Controle dos Pais: Marcar Recompensa Entregue */}
                                        {history.goalWasMet ? (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleRewardClaimed(history.date, history.rewardClaimed)}
                                                className={`ml-4 px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${history.rewardClaimed ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white text-green-600 border border-green-400 hover:bg-green-100'}`}
                                            >
                                                {history.rewardClaimed ? <CheckCircle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                                                {history.rewardClaimed ? 'Recompensa Dada' : 'Marcar como Entregue'}
                                            </button>
                                        ) : (
                                            <span className="ml-4 px-3 py-1 rounded-full text-xs font-bold text-slate-500 bg-slate-100">Sem Recompensa</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* --- ABA ADICIONAR (ADULT) --- */}
            {activeTab === 'add' && canSeeManagementTabs && (
                <Card title="Adicionar Nova Rotina">
                    {activeUid && canManage ? (
                        <form onSubmit={addRoutine} className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="w-full md:w-1/3">
                                    <Select label="Categoria" value={category} onChange={(e) => setCategory(e.target.value as 'house' | 'school')}>
                                        <option value="house">🏠 Casa</option>
                                        <option value="school">🎓 Escola</option>
                                    </Select>
                                </div>
                                <div className="w-full md:w-2/3">
                                    <Input label="Nome da Tarefa" type="text" placeholder="Ex: Arrumar a mochila..." value={newItem} onChange={e => setNewItem(e.target.value)} required />
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="w-full md:w-1/3">
                                    <Select label="Frequência" value={frequency} onChange={(e) => setFrequency(e.target.value as RoutineFrequency)}>
                                        {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                    </Select>
                                </div>
                                <div className="w-full md:w-1/3">
                                    <label className="text-sm font-medium text-slate-700 block mb-2">Período</label>
                                    {/* Period Selector Buttons */}
                                    <div className={`flex gap-1 bg-white p-1 border border-slate-300 rounded-lg transition-opacity ${addAllPeriods ? 'opacity-40 pointer-events-none' : ''}`}>
                                        {PERIODS.map(p => (
                                            <button 
                                                key={p} 
                                                type="button" 
                                                onClick={() => setPeriod(p)} 
                                                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Add All Periods Checkbox */}
                                    <div className="mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={addAllPeriods}
                                                onChange={(e) => setAddAllPeriods(e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-600"
                                            />
                                            <span className="text-xs text-slate-600 font-medium">
                                                Adicionar em todos os turnos
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/3">
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isAddingRoutine}>
                                        {isAddingRoutine ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </div>
                            </div>
                            
                            {/* SELETOR DE DIAS DA SEMANA (Visível se Semanal) */}
                            {frequency === 'Semanal' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                                        Selecionar Dias da Semana
                                    </label>
                                    <div className="flex justify-between gap-2">
                                        {WEEKDAYS_SHORT.map((day, index) => {
                                            const isSelected = selectedDays.includes(index);
                                            return (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => toggleDay(index)}
                                                    className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                                                        isSelected
                                                            ? 'bg-indigo-600 text-white shadow-md scale-105'
                                                            : 'bg-white border border-slate-300 text-slate-500 hover:border-indigo-400'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">A rotina aparecerá na lista "Hoje" apenas nos dias selecionados.</p>
                                </div>
                            )}

                        </form>
                    ) : (
                        <div className="text-yellow-800 bg-yellow-50 p-4 rounded-lg">Login necessário.</div>
                    )}
                </Card>
            )}

            {/* --- LISTAS DE EXECUÇÃO (CASA E ESCOLA) --- */}
            {(activeTab === 'house' || activeTab === 'school') && canSeeExecutionTabs && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden pb-4">
                    
                    {/* BARRA DE PROGRESSO DA ESTRELA (XP) USANDO PROGRESSO DIÁRIO */}
                    <div className="px-4 pt-4">
                        <StarProgressBarHorizontal 
                            progress={dailyProgressStats.percent} 
                            // 🔑 CORREÇÃO: Passando o número real de tarefas diárias
                            total={dailyProgressStats.total} 
                            // 🔑 CORREÇÃO: Passando o número de tarefas concluídas para currentValue
                            currentValue={dailyProgressStats.completed}
                            label="Progresso Diário (Hoje)" 
                        />
                    </div>
                    
                    {/* WIDGET DE META DO DIA (Visível para Criança) */}
                    {isChild && renderDailyGoalWidget()}

                    {/* Filtros de Período */}
                    <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
                        <button onClick={() => setPeriodFilter(null)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${!periodFilter ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
                        {PERIODS.map(p => (
                            <button key={p} onClick={() => setPeriodFilter(p)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${periodFilter === p ? 'bg-sky-500 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>{p}</button>
                        ))}
                    </div>

                    <div className="px-4 space-y-3 min-h-[300px]">
                        {getFilteredRoutines(activeTab as 'house' | 'school').length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                <span className="text-4xl block mb-2 opacity-30">{activeTab === 'house' ? '🏠' : '🎓'}</span>
                                Nenhuma rotina agendada para hoje.
                            </div>
                        )}
                        {getFilteredRoutines(activeTab as 'house' | 'school').map(r => (
                            <RoutineListItem 
                                key={r.id} 
                                routine={r} 
                                today={today} 
                                executionBlocked={executionIsBlockedForAdult} 
                                canManage={canManage} 
                                toggleRoutine={toggleRoutine} 
                                openDeleteConfirmation={(id) => { setRoutineToDeleteId(id); setIsDeleteModalOpen(true); }} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* --- HISTÓRICO (ADULT/PROFISSIONAL) --- */}
            {activeTab === 'history' && canSeeManagementTabs && (
                <Card title="Histórico Detalhado">
                    {/* Filtros simplificados para o exemplo */}
                    <div className="flex gap-2 mb-4">
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Início" />
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="Fim" />
                    </div>
                    <div className="space-y-2">
                        {routineLogs.slice(0, 20).map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                                <div>
                                    <p className="font-bold text-slate-800">{log.title}</p>
                                    <p className="text-xs text-slate-500">{new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {log.period}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {log.status === 'completed' ? 'Feito' : 'Pendente'}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Modal Confirmação (INALTERADO) */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
                        <h3 className="font-bold text-lg mb-2 text-slate-800">Excluir Rotina?</h3>
                        <p className="text-slate-600 mb-6 text-sm">Isso apagará o histórico desta tarefa. Confirmar?</p>
                        <div className="flex justify-end gap-3">
                            <Button className="bg-slate-200 text-slate-700 hover:bg-slate-300" onClick={() => setIsDeleteModalOpen(false)} type="button">Cancelar</Button>
                            <Button className="bg-red-600 hover:bg-red-700" onClick={deleteRoutine} type="button">Excluir</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoutinesView;
