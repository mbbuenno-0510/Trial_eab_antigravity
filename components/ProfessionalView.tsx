
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, ProfileType, SessionLog, TherapeuticGoal, GoalType, GoalStatus, ChildExtendedProfile, MoodEntry, BehaviorEntry, SchoolLog } from '../types';
import { db, auth } from '../services/firebase';
import { GoogleGenAI } from "@google/genai";
import { 
    LayoutDashboard, ClipboardList, Target, LineChart, 
    Plus, Save, CheckCircle2, Clock, Brain, MessageCircle, 
    AlertTriangle, CalendarCheck, FileText, ChevronRight,
    Users, Activity, Star, LogOut, ChevronDown, Loader2, Search, ExternalLink, Link, AlertOctagon, BookHeart, FileBarChart, Copy, Sparkles, GraduationCap, History, Stethoscope, Network, ShieldCheck, Filter
} from 'lucide-react';
import { Card, Button, Input, TextArea, Select, Modal } from './ui';
import MoodDiary from './MoodDiary';
import BehaviorDiary from './BehaviorDiary';
import RoutinesView from './RoutinesView';

// Inicialização da IA
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ProfessionalViewProps {
    userProfile: UserProfile;
    activeSubTab: 'overview' | 'session' | 'goals' | 'analysis';
    selectedPatientId?: string | null;
    onSelectPatient?: (id: string | null) => void;
}

interface PatientOption {
    uid: string;
    displayName: string;
}

interface ExternalProfessionalOption {
    uid: string;
    displayName: string;
    council: string;
}

const SESSION_TAGS = [
    "Treino de Mandos",
    "Generalização",
    "Habilidades Sociais",
    "Regulação Emocional",
    "Coordenação Motora",
    "Foco e Atenção",
    "Autonomia",
    "Atividades Sensoriais"
];

// Modelos de Relatório
type ReportModel = 'CHILD_MOOD' | 'PARENTS_BEHAVIOR' | 'SCHOOL_ANALYSIS' | 'PROFESSIONAL_ANALYSIS' | 'MULTI_ANALYSIS' | 'COMBINED' | 'CLINICAL';

const REPORT_MODELS: { id: ReportModel; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'CHILD_MOOD', label: 'Análise Emocional (Criança)', desc: 'Foco nos padrões de humor e relatos da criança.', icon: <BookHeart className="w-5 h-5 text-blue-500"/> },
    { id: 'PARENTS_BEHAVIOR', label: 'Análise Comportamental (Pais)', desc: 'Foco em crises, gatilhos e observações dos pais.', icon: <ClipboardList className="w-5 h-5 text-teal-500"/> },
    { id: 'SCHOOL_ANALYSIS', label: 'Análise Escolar (Professores)', desc: 'Foco na socialização, participação e ocorrências na escola.', icon: <GraduationCap className="w-5 h-5 text-indigo-500"/> },
    { id: 'PROFESSIONAL_ANALYSIS', label: 'Minha Análise Clínica', desc: 'Foco na evolução clínica e notas das suas sessões.', icon: <Stethoscope className="w-5 h-5 text-orange-500"/> },
    { id: 'MULTI_ANALYSIS', label: 'Análise Multidisciplinar', desc: 'Foco nos registros compartilhados por outros profissionais.', icon: <Network className="w-5 h-5 text-pink-500"/> },
    { id: 'COMBINED', label: 'Relatório Integrado (360°)', desc: 'Correlaciona humor, casa, escola, suas sessões e equipe multi.', icon: <Activity className="w-5 h-5 text-purple-500"/> },
    { id: 'CLINICAL', label: 'Modelo Clínico Formal', desc: 'Linguagem técnica (SOAP/ABA) para documentação oficial.', icon: <FileText className="w-5 h-5 text-slate-600"/> }
];

// Helper para data local YYYY-MM-DD
const getLocalTodayString = (date?: Date) => {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getPastDateString = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return getLocalTodayString(d);
};

// Helper para formatar CPF
const formatCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const ProfessionalView: React.FC<ProfessionalViewProps> = ({ userProfile, activeSubTab, selectedPatientId, onSelectPatient }) => {
    
    // --- ESTADOS DE DADOS DO PACIENTE ---
    const [childName, setChildName] = useState<string>('Carregando...');
    const [childProfileData, setChildProfileData] = useState<ChildExtendedProfile | null>(null);
    
    // --- ESTADOS DE SELEÇÃO DE PACIENTE (Vinculação) ---
    const [availablePatients, setAvailablePatients] = useState<PatientOption[]>([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isIndexMissing, setIsIndexMissing] = useState(false);
    const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);
    
    // CPF Search State
    const [cpfSearchInput, setCpfSearchInput] = useState('');
    const [isSearchingCpf, setIsSearchingCpf] = useState(false);

    // --- ESTADOS DE SESSÃO E METAS ---
    const [sessionNote, setSessionNote] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sessionMood, setSessionMood] = useState<'Bom' | 'Regular' | 'Difícil' | undefined>(undefined);
    const [isSavingSession, setIsSavingSession] = useState(false);
    
    // Armazenamento RAW (sem filtro) para processamento local
    const [rawGoals, setRawGoals] = useState<TherapeuticGoal[]>([]);
    const [rawRecentSessions, setRawRecentSessions] = useState<SessionLog[]>([]);
    const [rawSessionHistoryLogs, setRawSessionHistoryLogs] = useState<SessionLog[]>([]);

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [currentGoal, setCurrentGoal] = useState<Partial<TherapeuticGoal>>({ type: 'PTI', status: 'active' });
    const [isSavingGoal, setIsSavingGoal] = useState(false);

    // --- ESTADOS DA ABA DADOS (Análise) ---
    const [analysisMode, setAnalysisMode] = useState<'data_view' | 'report_gen'>('data_view');
    const [dataViewType, setDataViewType] = useState<'child_mood' | 'parents_behavior' | 'school_log' | 'session_history' | 'multi_disciplinary'>('child_mood');
    const [schoolLogs, setSchoolLogs] = useState<SchoolLog[]>([]);
    
    // 🆕 Filtros de Data para as abas de Dados
    const [viewStartDate, setViewStartDate] = useState<string>('');
    const [viewEndDate, setViewEndDate] = useState<string>('');

    // --- ESTADOS DE MULTIDISCIPLINAR ---
    const [allowedExternalPros, setAllowedExternalPros] = useState<ExternalProfessionalOption[]>([]);
    const [selectedExternalProId, setSelectedExternalProId] = useState<string>('');
    const [externalProSessions, setExternalProSessions] = useState<SessionLog[]>([]);
    const [externalProGoals, setExternalProGoals] = useState<TherapeuticGoal[]>([]);
    const [isLoadingExternalData, setIsLoadingExternalData] = useState(false);

    // --- ESTADOS DO GERADOR DE RELATÓRIO ---
    const [reportStartDate, setReportStartDate] = useState(getPastDateString(30));
    const [reportEndDate, setReportEndDate] = useState(getLocalTodayString());
    const [selectedModel, setSelectedModel] = useState<ReportModel>('COMBINED');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const handleLogout = () => {
        if (onSelectPatient) onSelectPatient(null);
        auth.signOut();
    };

    const filterVisibleItems = <T extends { professionalId?: string }>(items: T[]): T[] => {
        if (!userProfile.uid) return [];
        return items.filter(item => item.professionalId === userProfile.uid);
    };

    const goals = useMemo(() => filterVisibleItems(rawGoals), [rawGoals, userProfile]);
    const recentSessions = useMemo(() => filterVisibleItems(rawRecentSessions), [rawRecentSessions, userProfile]);
    const sessionHistoryLogs = useMemo(() => filterVisibleItems(rawSessionHistoryLogs), [rawSessionHistoryLogs, userProfile]);


    // --- BUSCA DE PACIENTES AUTORIZADOS ---
    useEffect(() => {
        const fetchAuthorizedPatients = async () => {
            if (!userProfile.professionalCode) return; 
            
            setIsLoadingPatients(true);
            setFetchError(null);
            setIsIndexMissing(false);
            setIndexCreationUrl(null);

            try {
                const snapshot = await db.collectionGroup('child_profile')
                    .where('isVisibleToHealth', '==', true)
                    .get();

                const myCouncil = userProfile.professionalCouncil || 'CRM';
                const myCode = userProfile.professionalCode.trim();
                const foundPatients: PatientOption[] = [];

                const promises = snapshot.docs.map(async (doc) => {
                    const data = doc.data() as ChildExtendedProfile;
                    const allowedPros = data.allowedHealthProfessionals || [];
                    
                    const isAllowed = allowedPros.some((rule: any) => {
                        return rule.council === myCouncil && rule.code === myCode;
                    });

                    if (isAllowed) {
                        const childNameFromProfile = data.childName;
                        const userRef = doc.ref.parent.parent;
                        if (userRef) {
                            if (childNameFromProfile) {
                                foundPatients.push({ uid: userRef.id, displayName: childNameFromProfile });
                            } else {
                                try {
                                    const userSnap = await userRef.get();
                                    if (userSnap.exists) {
                                        foundPatients.push({ uid: userSnap.id, displayName: userSnap.data()?.displayName || 'Paciente' });
                                    }
                                } catch (e) {
                                    foundPatients.push({ uid: userRef.id, displayName: 'Paciente (Nome Indisponível)' });
                                }
                            }
                        }
                    }
                });

                await Promise.all(promises);
                setAvailablePatients(foundPatients);

            } catch (error: any) {
                if (error.message && error.message.includes('index')) {
                    console.warn("Índice do Firestore ausente. Ativando modo manual.");
                    setIsIndexMissing(true);
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const match = error.message.match(urlRegex);
                    if (match && match[0]) setIndexCreationUrl(match[0]);
                } else {
                    console.error("Erro ao buscar pacientes:", error);
                    setFetchError("Erro na busca automática.");
                }
            } finally {
                setIsLoadingPatients(false);
            }
        };

        fetchAuthorizedPatients();
    }, [userProfile.professionalCode, userProfile.professionalCouncil]);

    const handleSearchByCPF = async () => {
        if (!cpfSearchInput.trim()) return;
        setIsSearchingCpf(true);
        setFetchError(null);
        try {
            const snapshot = await db.collectionGroup('child_profile')
                .where('cpf', '==', cpfSearchInput)
                .where('isVisibleToHealth', '==', true)
                .get();
            
            if (snapshot.empty) {
                alert("Nenhum paciente encontrado com este CPF ou permissão de saúde desativada.");
                setIsSearchingCpf(false);
                return;
            }

            const doc = snapshot.docs[0];
            const data = doc.data() as ChildExtendedProfile;
            const myCouncil = userProfile.professionalCouncil || 'CRM';
            const myCode = userProfile.professionalCode || '';
            
            const allowedPros = data.allowedHealthProfessionals || [];
            const isAllowed = allowedPros.some((rule: any) => {
                return rule.council === myCouncil && rule.code === myCode;
            });

            if (!isAllowed) {
                alert(`Paciente encontrado, mas seu registro (${myCouncil} ${myCode}) não está autorizado.`);
                setIsSearchingCpf(false);
                return;
            }

            const patientUid = doc.ref.parent.parent!.id;
            const patientName = data.childName || 'Paciente';
            const patientOption: PatientOption = { uid: patientUid, displayName: patientName };

            setAvailablePatients(prev => {
                if (prev.some(s => s.uid === patientOption.uid)) return prev;
                return [...prev, patientOption];
            });
            
            if (onSelectPatient) onSelectPatient(patientOption.uid);
            setCpfSearchInput(''); 
            setFetchError(null);

        } catch (error: any) {
            console.error("Erro busca CPF:", error);
            if (error.message && error.message.includes('index')) {
                setIsIndexMissing(true);
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const match = error.message.match(urlRegex);
                if (match && match[0]) setIndexCreationUrl(match[0]);
                alert("A busca por CPF requer um índice novo no Firestore. Link gerado no console.");
            } else {
                setFetchError("Erro ao buscar CPF.");
            }
        } finally {
            setIsSearchingCpf(false);
        }
    };

    const targetUid = useMemo(() => {
        return selectedPatientId || null;
    }, [selectedPatientId]);

    // --- CARREGAMENTO DE DADOS DO PACIENTE SELECIONADO ---
    useEffect(() => {
        if (!targetUid) {
            setChildName("Nenhuma criança vinculada");
            setRawRecentSessions([]);
            setRawGoals([]);
            setChildProfileData(null);
            setAllowedExternalPros([]);
            return;
        }

        const selected = availablePatients.find(p => p.uid === targetUid);
        if (selected) {
            setChildName(selected.displayName);
        } else {
            db.collection("users").doc(targetUid).get().then(uDoc => {
                if (uDoc.exists) setChildName(uDoc.data()?.displayName || 'Criança');
            });
        }

        const unsubProfile = db.collection("users").doc(targetUid).collection("child_profile").doc("main")
            .onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data() as ChildExtendedProfile;
                    setChildProfileData(data);
                    if (data.childName) setChildName(data.childName);
                }
            });

        const unsubGoals = db.collection('users').doc(targetUid).collection('therapeutic_goals')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snap => setRawGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as TherapeuticGoal))));

        const unsubSessions = db.collection('users').doc(targetUid).collection('session_logs')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .onSnapshot(snap => setRawRecentSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionLog))));

        return () => { unsubProfile(); unsubGoals(); unsubSessions(); };
    }, [targetUid, availablePatients]);

    useEffect(() => {
        const fetchSharingPros = async () => {
            if (!childProfileData?.interProfessionalSharing || !userProfile || !targetUid) {
                setAllowedExternalPros([]);
                return;
            }

            const myCouncil = userProfile.professionalCouncil;
            const myCode = userProfile.professionalCode;
            const validPros: ExternalProfessionalOption[] = [];

            const sharingMap = childProfileData.interProfessionalSharing;
            const authorIds = Object.keys(sharingMap);

            const promises = authorIds.map(async (authorId) => {
                if (authorId === userProfile.uid) return;

                const rules = sharingMap[authorId] || [];
                const isAllowed = rules.some(r => r.council === myCouncil && r.code === myCode);

                if (isAllowed) {
                    try {
                        const userDoc = await db.collection('users').doc(authorId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            validPros.push({
                                uid: authorId,
                                displayName: userData?.displayName || 'Profissional',
                                council: `${userData?.professionalCouncil || ''} ${userData?.professionalCode || ''}`
                            });
                        }
                    } catch (err) {
                        console.error("Erro ao buscar nome do profissional:", err);
                        validPros.push({ uid: authorId, displayName: 'Profissional Desconhecido', council: '' });
                    }
                }
            });

            await Promise.all(promises);
            setAllowedExternalPros(validPros);
        };

        fetchSharingPros();
    }, [childProfileData, userProfile, targetUid]);

    // --- BUSCA DE DADOS EXTERNOS (MULTIDISCIPLINAR) ---
    useEffect(() => {
        if (!selectedExternalProId || !targetUid) {
            setExternalProSessions([]);
            setExternalProGoals([]);
            return;
        }

        setIsLoadingExternalData(true);

        let sessionsQuery = db.collection('users').doc(targetUid).collection('session_logs')
            .where('professionalId', '==', selectedExternalProId);
        
        // 🆕 Aplica filtro de data se existir
        if (viewStartDate || viewEndDate) {
            sessionsQuery = sessionsQuery.orderBy('date', 'desc');
            if (viewStartDate) sessionsQuery = sessionsQuery.where('date', '>=', viewStartDate);
            if (viewEndDate) sessionsQuery = sessionsQuery.where('date', '<=', viewEndDate);
        } else {
            sessionsQuery = sessionsQuery.orderBy('timestamp', 'desc').limit(20);
        }

        const unsubSessions = sessionsQuery.onSnapshot(snap => {
            setExternalProSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionLog)));
            setIsLoadingExternalData(false);
        }, err => {
            console.error("Erro consulta multi (pode ser índice):", err);
            setIsLoadingExternalData(false);
        });

        // Goals geralmente não precisam de filtro de data estrito na visualização básica, mantendo padrão
        const unsubGoals = db.collection('users').doc(targetUid).collection('therapeutic_goals')
            .where('professionalId', '==', selectedExternalProId)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snap => {
                setExternalProGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as TherapeuticGoal)));
            });

        return () => {
            unsubSessions();
            unsubGoals();
        };
    }, [selectedExternalProId, targetUid, viewStartDate, viewEndDate]);


    // --- BUSCAR DADOS DE DIÁRIO ESCOLAR (SELECIONADO) ---
    useEffect(() => {
        if (activeSubTab === 'analysis' && analysisMode === 'data_view' && dataViewType === 'school_log' && targetUid) {
             let query = db.collection('users').doc(targetUid).collection('school_logs').orderBy('date', 'desc');
             
             // 🆕 Aplica filtro de data
             if (viewStartDate) query = query.where('date', '>=', viewStartDate);
             if (viewEndDate) query = query.where('date', '<=', viewEndDate);
             
             if (!viewStartDate && !viewEndDate) query = query.limit(20);

             const unsub = query.onSnapshot(snap => {
                    setSchoolLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolLog)));
                });
            return () => unsub();
        }
    }, [activeSubTab, analysisMode, dataViewType, targetUid, viewStartDate, viewEndDate]);

    // --- BUSCAR DADOS DE HISTÓRICO DE SESSÕES (SELECIONADO - RAW) ---
    useEffect(() => {
        if (activeSubTab === 'analysis' && analysisMode === 'data_view' && dataViewType === 'session_history' && targetUid) {
             let query = db.collection('users').doc(targetUid).collection('session_logs').orderBy('date', 'desc'); // Usa data para filtro consistente
             
             // 🆕 Aplica filtro de data
             if (viewStartDate) query = query.where('date', '>=', viewStartDate);
             if (viewEndDate) query = query.where('date', '<=', viewEndDate);

             if (!viewStartDate && !viewEndDate) query = query.limit(50);

             const unsub = query.onSnapshot(snap => {
                    setRawSessionHistoryLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionLog)));
                });
            return () => unsub();
        }
    }, [activeSubTab, analysisMode, dataViewType, targetUid, viewStartDate, viewEndDate]);

    const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

    const handleSaveSession = async () => {
        if (!targetUid) return;
        if (selectedTags.length === 0 && !sessionNote.trim()) { alert("Adicione pelo menos uma tag ou nota."); return; }
        setIsSavingSession(true);
        try {
            const newLog = { userId: targetUid, professionalId: userProfile.uid, date: getLocalTodayString(), timestamp: Date.now(), tags: selectedTags, notes: sessionNote, moodRating: sessionMood };
            await db.collection('users').doc(targetUid).collection('session_logs').add(newLog);
            setSessionNote(''); setSelectedTags([]); setSessionMood(undefined); alert("Sessão registrada!");
        } catch (error) { console.error(error); alert("Erro ao registrar."); } finally { setIsSavingSession(false); }
    };

    const handleSaveGoal = async () => {
        if (!targetUid || !currentGoal.title) { alert("Preencha o título."); return; }
        setIsSavingGoal(true);
        try {
            const goalData = { ...currentGoal, userId: targetUid, professionalId: userProfile.uid, createdAt: currentGoal.createdAt || Date.now(), status: currentGoal.status || 'active', type: currentGoal.type || 'PTI' };
            if (currentGoal.id) await db.collection('users').doc(targetUid).collection('therapeutic_goals').doc(currentGoal.id).update(goalData);
            else await db.collection('users').doc(targetUid).collection('therapeutic_goals').add(goalData);
            setIsGoalModalOpen(false); setCurrentGoal({ type: 'PTI', status: 'active' });
        } catch (error) { console.error(error); alert("Erro ao salvar meta."); } finally { setIsSavingGoal(false); }
    };

    // --- FUNÇÃO GERAR RELATÓRIO (IA) ---
    const handleGenerateReport = async () => {
        if (!targetUid) return;
        setIsGeneratingReport(true);
        setGeneratedReport('');

        try {
            // 1. Fetch Mood Data (Child)
            let moodText = "Sem registros de humor.";
            if (selectedModel !== 'PARENTS_BEHAVIOR' && selectedModel !== 'SCHOOL_ANALYSIS' && selectedModel !== 'PROFESSIONAL_ANALYSIS' && selectedModel !== 'MULTI_ANALYSIS') {
                const moodSnap = await db.collection('users').doc(targetUid).collection('mood_entries')
                    .where('dateString', '>=', reportStartDate)
                    .where('dateString', '<=', reportEndDate)
                    .get();
                let moodData = moodSnap.docs.map(d => ({...d.data(), timestamp: d.data().timestamp || 0 } as MoodEntry));
                moodData.sort((a, b) => (typeof a.timestamp === 'number' ? a.timestamp : 0) - (typeof b.timestamp === 'number' ? b.timestamp : 0));
                
                if (moodData.length > 0) {
                    moodText = JSON.stringify(moodData.map(m => ({ date: m.dateString, mood: m.mood, notes: m.notes, period: m.period })));
                }
            }

            // 2. Fetch Behavior Data (Parents)
            let behaviorText = "Sem registros comportamentais.";
            if (selectedModel !== 'CHILD_MOOD' && selectedModel !== 'SCHOOL_ANALYSIS' && selectedModel !== 'PROFESSIONAL_ANALYSIS' && selectedModel !== 'MULTI_ANALYSIS') {
                const behaviorSnap = await db.collection('users').doc(targetUid).collection('behavior_entries')
                    .where('dateString', '>=', reportStartDate)
                    .where('dateString', '<=', reportEndDate)
                    .get();
                let behaviorData = behaviorSnap.docs.map(d => ({...d.data(), timestamp: d.data().timestamp || 0 } as BehaviorEntry));
                behaviorData.sort((a, b) => (typeof a.timestamp === 'number' ? a.timestamp : 0) - (typeof b.timestamp === 'number' ? b.timestamp : 0));

                if (behaviorData.length > 0) {
                    behaviorText = JSON.stringify(behaviorData.map(b => ({ date: b.dateString, type: b.type, intensity: b.intensity, context: b.description })));
                }
            }

            // 3. Fetch School Data (Escola)
            let schoolText = "Sem registros escolares.";
            if (selectedModel === 'SCHOOL_ANALYSIS' || selectedModel === 'COMBINED' || selectedModel === 'CLINICAL') {
                const schoolSnap = await db.collection('users').doc(targetUid).collection('school_logs')
                    .where('date', '>=', reportStartDate)
                    .where('date', '<=', reportEndDate)
                    .get();
                let schoolData = schoolSnap.docs.map(d => ({...d.data(), timestamp: d.data().timestamp || 0 } as SchoolLog));
                schoolData.sort((a, b) => (typeof a.timestamp === 'number' ? a.timestamp : 0) - (typeof b.timestamp === 'number' ? b.timestamp : 0));

                if (schoolData.length > 0) {
                    schoolText = JSON.stringify(schoolData.map(s => ({
                        date: s.date,
                        social: s.socialInteraction,
                        participation: s.participation,
                        crises: s.dysregulationCount,
                        details: s.dysregulationDetails,
                        notes: s.generalNotes,
                        strategies: s.successfulStrategies
                    })));
                }
            }

            // 4. Fetch Session Data (Professional) & Multi Data
            let sessionText = "Sem registros das suas sessões.";
            let multiText = "Sem registros multidisciplinares.";

            if (selectedModel === 'PROFESSIONAL_ANALYSIS' || selectedModel === 'COMBINED' || selectedModel === 'CLINICAL' || selectedModel === 'MULTI_ANALYSIS') {
                const sessionSnap = await db.collection('users').doc(targetUid).collection('session_logs')
                    .where('date', '>=', reportStartDate)
                    .where('date', '<=', reportEndDate)
                    .get();
                const allSessions = sessionSnap.docs.map(d => ({...d.data(), timestamp: d.data().timestamp || 0 } as SessionLog));
                allSessions.sort((a, b) => (typeof a.timestamp === 'number' ? a.timestamp : 0) - (typeof b.timestamp === 'number' ? b.timestamp : 0));

                if (selectedModel !== 'MULTI_ANALYSIS') {
                    const mySessions = allSessions.filter(s => s.professionalId === userProfile.uid);
                    if (mySessions.length > 0) {
                        sessionText = JSON.stringify(mySessions.map(s => ({
                            date: s.date,
                            moodRating: s.moodRating,
                            tags: s.tags,
                            notes: s.notes
                        })));
                    }
                }

                if (selectedModel === 'MULTI_ANALYSIS' || selectedModel === 'COMBINED') {
                    const isSharedWithMe = (authorId: string) => {
                        if (!childProfileData?.interProfessionalSharing) return false;
                        const rules = childProfileData.interProfessionalSharing[authorId] || [];
                        return rules.some(r => r.council === userProfile.professionalCouncil && r.code === userProfile.professionalCode);
                    };

                    const sharedSessions = allSessions.filter(s => s.professionalId !== userProfile.uid && s.professionalId && isSharedWithMe(s.professionalId));
                    if (sharedSessions.length > 0) {
                        multiText = JSON.stringify(sharedSessions.map(s => ({
                            date: s.date,
                            moodRating: s.moodRating,
                            tags: s.tags,
                            notes: s.notes,
                            professionalId: s.professionalId 
                        })));
                    }
                }
            }

            // 5. Construct Prompt
            let promptContext = "";
            switch (selectedModel) {
                case 'CHILD_MOOD': promptContext = `Analise apenas os dados de humor da criança. Foco em padrões emocionais, frequência de sentimentos e horários. Dados: ${moodText}`; break;
                case 'PARENTS_BEHAVIOR': promptContext = `Analise apenas os dados comportamentais registrados pelos pais. Identifique gatilhos, tipos de crise e intensidade. Dados: ${behaviorText}`; break;
                case 'SCHOOL_ANALYSIS': promptContext = `Analise apenas os dados do diário escolar. Identifique padrões de socialização, participação e ocorrências. Dados: ${schoolText}`; break;
                case 'PROFESSIONAL_ANALYSIS': promptContext = `Analise apenas os dados das sessões terapêuticas realizadas POR MIM. Identifique progressos nas metas, consistência no atendimento e observações clínicas. Dados: ${sessionText}`; break;
                case 'MULTI_ANALYSIS': promptContext = `Analise apenas os dados de sessões de OUTROS profissionais da equipe multidisciplinar. Busque por insights, abordagens complementares ou divergentes. Dados: ${multiText}`; break;
                case 'COMBINED': promptContext = `Faça uma análise integrada correlacionando: 1. Humor da criança: ${moodText} 2. Comportamento em Casa: ${behaviorText} 3. Desempenho Escolar: ${schoolText} 4. Minhas Sessões: ${sessionText} 5. Dados Multidisciplinares: ${multiText} Busque conexões entre os ambientes.`; break;
                case 'CLINICAL': promptContext = `Gere um relatório técnico formal (estilo evolução clínica/SOAP). Dados Humor: ${moodText}. Dados Comportamento: ${behaviorText}. Dados Escolares: ${schoolText}. Dados Sessões: ${sessionText}.`; break;
            }

            const fullPrompt = `Você é um psicólogo especialista em desenvolvimento infantil e autismo.
            O paciente chama-se ${childName}.
            O período da análise é de ${new Date(reportStartDate).toLocaleDateString('pt-BR')} até ${new Date(reportEndDate).toLocaleDateString('pt-BR')}.
            
            ${promptContext}
            
            Responda em Português do Brasil, formatado em Markdown claro. Seja empático mas profissional.`;

            // 6. Call AI
            const result = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
            });

            setGeneratedReport(result.text || "Não foi possível gerar o relatório.");

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            alert("Erro ao gerar relatório. Tente um período menor.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const copyReport = () => {
        navigator.clipboard.writeText(generatedReport);
        alert("Relatório copiado!");
    };

    if (!targetUid) {
        return (
            <div className="p-8 text-center text-slate-500 h-full flex flex-col items-center justify-center">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                    <Users className="w-16 h-16 mx-auto mb-4 text-teal-400" />
                    <h2 className="text-xl font-bold text-slate-700">Bem-vindo, Profissional!</h2>
                    {availablePatients.length > 0 && (
                        <div className="mt-6 w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-sm font-bold text-slate-700 mb-2 text-left">Selecione um Paciente</label>
                            <div className="relative">
                                <select value="" onChange={(e) => onSelectPatient && onSelectPatient(e.target.value)} disabled={isLoadingPatients} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-teal-500 font-bold">
                                    <option value="" disabled>Escolha na lista...</option>
                                    {isLoadingPatients && <option>Carregando pacientes...</option>}
                                    {availablePatients.map(p => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">{isLoadingPatients ? <Loader2 className="w-4 h-4 animate-spin"/> : <ChevronDown className="w-4 h-4" />}</div>
                            </div>
                        </div>
                    )}
                    {isIndexMissing && <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 max-w-sm flex flex-col items-center"><p className="font-bold flex items-center gap-2 justify-center"><AlertOctagon className="w-4 h-4"/> Configuração Pendente</p><p className="mt-1">A listagem automática está indisponível (Índice Firestore).</p>{indexCreationUrl && <a href={indexCreationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 bg-amber-200 hover:bg-amber-300 text-amber-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm">Criar Índice Agora <ExternalLink className="w-3 h-3" /></a>}</div>}
                    <div className={`mt-6 w-full bg-white p-4 rounded-xl border shadow-sm ${isIndexMissing ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-200'}`}>
                        <label className="block text-sm font-bold text-slate-700 mb-2 text-left">Encontrar por CPF</label>
                        <div className="flex gap-2">
                            <Input placeholder="000.000.000-00" value={cpfSearchInput} onChange={e => setCpfSearchInput(formatCPF(e.target.value))} className="text-sm bg-white"/>
                            <Button onClick={handleSearchByCPF} disabled={isSearchingCpf} className="bg-slate-100 text-slate-600 hover:bg-teal-100 hover:text-teal-700">{isSearchingCpf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />}</Button>
                        </div>
                        {fetchError && <p className="text-xs text-red-500 mt-2 text-left">{fetchError}</p>}
                    </div>
                    {availablePatients.length === 0 && !isLoadingPatients && <p className="text-sm mt-6 text-slate-400 max-w-md">Peça aos pais para irem em <strong>Docs &gt; Perfil da Criança</strong> e adicionarem seu Conselho ({userProfile.professionalCouncil}) e Registro ({userProfile.professionalCode}).</p>}
                </div>
                <Button variant="ghost" onClick={handleLogout} className="mt-8 text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair da conta</Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-5xl mx-auto pb-24 font-sans animate-in fade-in">
            
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-teal-100 p-2 rounded-full"><Users className="w-6 h-6 text-teal-700" /></div>
                    <div><p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Paciente</p><h2 className="text-lg font-black text-teal-900">{childName}</h2></div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="hidden md:block text-right"><p className="text-xs text-teal-600 font-bold">Módulo Terapêutico</p><p className="text-xs text-teal-500">{new Date().toLocaleDateString('pt-BR')}</p></div>
                    <button onClick={handleLogout} className="md:hidden text-teal-600 p-1" title="Sair"><LogOut className="w-5 h-5" /></button>
                </div>
            </div>

            {activeSubTab === 'overview' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-teal-600"/> Selecionar Paciente</label>
                    {fetchError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700 mb-3"><AlertOctagon className="w-4 h-4 flex-shrink-0" /><span>{fetchError}</span></div>}
                    <div className="relative mb-4">
                        <select value={selectedPatientId || ''} onChange={(e) => onSelectPatient && onSelectPatient(e.target.value)} disabled={isLoadingPatients} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-teal-500 font-bold disabled:opacity-50">
                            <option value="">Selecione um paciente...</option>
                            {isLoadingPatients && <option>Carregando pacientes...</option>}
                            {availablePatients.map(p => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">{isLoadingPatients ? <Loader2 className="w-4 h-4 animate-spin"/> : <ChevronDown className="w-4 h-4" />}</div>
                    </div>
                    <div className={`pt-2 border-t border-slate-100 ${isIndexMissing ? 'bg-amber-50/50 p-2 rounded mt-2' : ''}`}>
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Ou buscar por CPF</p>
                        <div className="flex gap-2">
                            <Input placeholder="000.000.000-00" value={cpfSearchInput} onChange={e => setCpfSearchInput(formatCPF(e.target.value))} className="text-sm bg-white"/>
                            <Button onClick={handleSearchByCPF} disabled={isSearchingCpf} className="bg-slate-100 text-slate-600 hover:bg-teal-100 hover:text-teal-700">{isSearchingCpf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />}</Button>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'overview' && (
                <div className="grid grid-cols-1 gap-6">
                    <Card title="📝 Últimos Registros de Sessão" className="h-full">
                        {recentSessions.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">Nenhuma sessão visível (Seus registros ou compartilhados).</p> : (
                            <div className="space-y-3">
                                {recentSessions.map(session => (
                                    <div key={session.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">{new Date(session.timestamp as number).toLocaleDateString('pt-BR')}</span>
                                            {session.moodRating && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${session.moodRating === 'Bom' ? 'bg-green-100 text-green-700' : session.moodRating === 'Regular' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{session.moodRating}</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-2">{session.tags.map(t => <span key={t} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>)}</div>
                                        {session.notes && <p className="text-xs text-slate-600 italic">"{session.notes}"</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeSubTab === 'session' && (
                <Card title="Registro Rápido de Sessão">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">O que foi trabalhado hoje?</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {SESSION_TAGS.map(tag => (
                                    <button key={tag} onClick={() => toggleTag(tag)} className={`p-3 rounded-xl text-xs font-bold transition-all border ${selectedTags.includes(tag) ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>{tag}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Como foi a sessão?</label>
                            <div className="flex gap-4">
                                {(['Bom', 'Regular', 'Difícil'] as const).map(m => (
                                    <button key={m} onClick={() => setSessionMood(m)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${sessionMood === m ? m === 'Bom' ? 'bg-green-100 border-green-300 text-green-800' : m === 'Regular' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-slate-200 text-slate-500'}`}>{m}</button>
                                ))}
                            </div>
                        </div>
                        <TextArea label="Anotações Clínicas (Opcional)" placeholder="Descreva progressos, dificuldades ou observações relevantes..." value={sessionNote} onChange={e => setSessionNote(e.target.value)}/>
                        <Button onClick={handleSaveSession} disabled={isSavingSession} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg">{isSavingSession ? 'Salvando...' : 'Registrar Sessão'}</Button>
                    </div>
                </Card>
            )}

            {activeSubTab === 'goals' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Target className="w-6 h-6 text-teal-600" /> Metas Terapêuticas</h2>
                        <Button onClick={() => { setCurrentGoal({ type: 'PTI', status: 'active' }); setIsGoalModalOpen(true); }}><Plus className="w-4 h-4 mr-2"/> Nova Meta</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {goals.length === 0 ? <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-slate-300"><p className="text-slate-400">Nenhuma meta visível.</p></div> : (
                            goals.map(goal => (
                                <div key={goal.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${goal.type === 'PEI' ? 'bg-purple-500' : goal.type === 'PTI' ? 'bg-teal-500' : 'bg-blue-500'}`}></div>
                                    <div className="pl-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${goal.type === 'PEI' ? 'bg-purple-50 text-purple-700 border-purple-100' : goal.type === 'PTI' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{goal.type}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${goal.status === 'active' ? 'bg-green-100 text-green-700' : goal.status === 'completed' ? 'bg-slate-100 text-slate-600 line-through' : 'bg-yellow-100 text-yellow-700'}`}>{goal.status === 'active' ? 'Em Andamento' : goal.status === 'completed' ? 'Concluída' : 'Pausada'}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg mb-1">{goal.title}</h3>
                                        <p className="text-sm text-slate-600 leading-relaxed mb-3">{goal.description}</p>
                                        <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-2">
                                            <span>Criado em: {new Date(goal.createdAt as number).toLocaleDateString('pt-BR')}</span>
                                            {goal.professionalId === userProfile.uid && (
                                                <button onClick={() => { setCurrentGoal(goal); setIsGoalModalOpen(true); }} className="text-teal-600 font-bold hover:underline">Editar</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={currentGoal.id ? "Editar Meta" : "Nova Meta Terapêutica"}>
                        <div className="space-y-4">
                            <Input label="Título da Meta" value={currentGoal.title || ''} onChange={e => setCurrentGoal({...currentGoal, title: e.target.value})} placeholder="Ex: Aumentar vocabulário" />
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Tipo</label>
                                    <select value={currentGoal.type} onChange={e => setCurrentGoal({...currentGoal, type: e.target.value as GoalType})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                        <option value="PTI">PTI (Plano Terapêutico)</option>
                                        <option value="PEI">PEI (Plano Educacional)</option>
                                        <option value="Semanal">Objetivo Semanal</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Status</label>
                                    <select value={currentGoal.status} onChange={e => setCurrentGoal({...currentGoal, status: e.target.value as GoalStatus})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                        <option value="active">Em Andamento</option>
                                        <option value="completed">Concluída</option>
                                        <option value="paused">Pausada</option>
                                    </select>
                                </div>
                            </div>
                            <TextArea label="Descrição Detalhada / Estratégias" value={currentGoal.description || ''} onChange={e => setCurrentGoal({...currentGoal, description: e.target.value})} placeholder="Descreva como o objetivo será trabalhado..." />
                            <Input label="Prazo (Opcional)" type="date" value={currentGoal.deadline || ''} onChange={e => setCurrentGoal({...currentGoal, deadline: e.target.value})} />
                            <Button onClick={handleSaveGoal} disabled={isSavingGoal} className="w-full bg-teal-600 hover:bg-teal-700">{isSavingGoal ? 'Salvando...' : 'Salvar Meta'}</Button>
                        </div>
                    </Modal>
                </div>
            )}

            {activeSubTab === 'analysis' && (
                <div className="space-y-4">
                    
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4 shadow-inner overflow-x-auto no-scrollbar">
                        <button onClick={() => setAnalysisMode('data_view')} className={`flex-1 min-w-[140px] py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${analysisMode === 'data_view' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LineChart className="w-4 h-4"/> Visualização de Dados</button>
                        <button onClick={() => setAnalysisMode('report_gen')} className={`flex-1 min-w-[140px] py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${analysisMode === 'report_gen' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Sparkles className="w-4 h-4"/> Gerador de Relatórios</button>
                    </div>

                    <div className="animate-in fade-in">
                        
                        {analysisMode === 'data_view' && (
                            <>
                                <div className="flex bg-slate-100/50 p-1 rounded-lg mb-4 border border-slate-200 overflow-x-auto no-scrollbar">
                                    <button onClick={() => setDataViewType('child_mood')} className={`flex-1 min-w-[80px] py-2 px-1 rounded-md text-xs font-bold transition-all flex flex-col md:flex-row items-center justify-center gap-1.5 ${dataViewType === 'child_mood' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`} title="Humor da Criança"><BookHeart className="w-4 h-4" /><span>Criança</span></button>
                                    <button onClick={() => setDataViewType('parents_behavior')} className={`flex-1 min-w-[80px] py-2 px-1 rounded-md text-xs font-bold transition-all flex flex-col md:flex-row items-center justify-center gap-1.5 ${dataViewType === 'parents_behavior' ? 'bg-teal-100 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`} title="Comportamento (Pais)"><ClipboardList className="w-4 h-4" /><span>Pais</span></button>
                                    <button onClick={() => setDataViewType('school_log')} className={`flex-1 min-w-[80px] py-2 px-1 rounded-md text-xs font-bold transition-all flex flex-col md:flex-row items-center justify-center gap-1.5 ${dataViewType === 'school_log' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`} title="Diário Escolar"><GraduationCap className="w-4 h-4" /><span>Escola</span></button>
                                    <button onClick={() => setDataViewType('session_history')} className={`flex-1 min-w-[80px] py-2 px-1 rounded-md text-xs font-bold transition-all flex flex-col md:flex-row items-center justify-center gap-1.5 ${dataViewType === 'session_history' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`} title="Histórico de Sessões"><History className="w-4 h-4" /><span>Sessões</span></button>
                                    <button onClick={() => setDataViewType('multi_disciplinary')} className={`flex-1 min-w-[90px] py-2 px-1 rounded-md text-xs font-bold transition-all flex flex-col md:flex-row items-center justify-center gap-1.5 ${dataViewType === 'multi_disciplinary' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`} title="Visão Multidisciplinar"><Network className="w-4 h-4" /><span>Multi</span></button>
                                </div>

                                {/* 🆕 FILTRO DE DATAS PARA ABAS ESPECÍFICAS */}
                                {(dataViewType === 'parents_behavior' || dataViewType === 'school_log' || dataViewType === 'session_history' || dataViewType === 'multi_disciplinary') && (
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row gap-3 items-center">
                                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Filter className="w-4 h-4"/> Filtrar por Data:
                                        </span>
                                        <div className="flex gap-2 flex-1 w-full sm:w-auto">
                                            <div className="relative flex-1">
                                                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400 pointer-events-none">De</span>
                                                <input type="date" value={viewStartDate} onChange={e => setViewStartDate(e.target.value)} className="p-2 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-teal-100 text-slate-600 font-medium"/>
                                            </div>
                                            <div className="relative flex-1">
                                                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400 pointer-events-none">Até</span>
                                                <input type="date" value={viewEndDate} onChange={e => setViewEndDate(e.target.value)} className="p-2 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-teal-100 text-slate-600 font-medium"/>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {dataViewType === 'child_mood' && (
                                    <MoodDiary userProfile={userProfile} preSelectedChildId={targetUid} readOnly={true} />
                                )}
                                
                                {dataViewType === 'parents_behavior' && (
                                    <BehaviorDiary userProfile={userProfile} preSelectedChildId={targetUid} readOnly={true} startDate={viewStartDate} endDate={viewEndDate} />
                                )}

                                {dataViewType === 'school_log' && (
                                    <div className="space-y-4">
                                        {schoolLogs.length === 0 ? <p className="text-slate-400 text-center py-8 text-sm">Nenhum registro escolar disponível para este período.</p> : (
                                            schoolLogs.map(log => (
                                                <div key={log.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                                        {log.dysregulationCount > 0 && (<span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {log.dysregulationCount} Ocorrência(s)</span>)}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <div className="bg-blue-50 p-2 rounded-lg"><p className="text-[10px] text-blue-600 font-bold uppercase mb-0.5">Interação Social</p><p className="text-sm font-semibold text-blue-800">{log.socialInteraction}</p></div>
                                                        <div className="bg-green-50 p-2 rounded-lg"><p className="text-[10px] text-green-600 font-bold uppercase mb-0.5">Participação</p><p className="text-sm font-semibold text-blue-800">{log.participation}</p></div>
                                                    </div>
                                                    {log.dysregulationDetails && log.dysregulationCount > 0 && (<div className="mb-3 text-sm"><p className="text-xs font-bold text-red-600 mb-1">⚠️ Detalhes da Ocorrência:</p><p className="text-slate-600 bg-red-50 p-2 rounded border border-red-100">{log.dysregulationDetails}</p></div>)}
                                                    {log.successfulStrategies && (<div className="mb-3 text-sm"><p className="text-xs font-bold text-teal-600 mb-1">💡 Estratégias Úteis:</p><p className="text-slate-600 bg-teal-50 p-2 rounded border border-teal-100">{log.successfulStrategies}</p></div>)}
                                                    {log.generalNotes && (<div className="text-sm"><p className="text-xs font-bold text-slate-500 mb-1">📝 Observações Gerais:</p><p className="text-slate-600 italic">"{log.generalNotes}"</p></div>)}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {dataViewType === 'session_history' && (
                                    <div className="space-y-4">
                                        {sessionHistoryLogs.length === 0 ? <p className="text-slate-400 text-center py-8 text-sm">Nenhuma sessão visível para este período.</p> : (
                                            sessionHistoryLogs.map(session => (
                                                <div key={session.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{new Date(session.timestamp as number).toLocaleDateString('pt-BR')}</span>
                                                        {session.moodRating && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${session.moodRating === 'Bom' ? 'bg-green-100 text-green-700' : session.moodRating === 'Regular' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{session.moodRating}</span>}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mb-3">{session.tags.map(t => <span key={t} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-md">{t}</span>)}</div>
                                                    {session.notes && (<div className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs font-bold text-slate-500 mb-1">Anotações:</p><p className="text-slate-700 italic">"{session.notes}"</p></div>)}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {dataViewType === 'multi_disciplinary' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <Card title="Histórico de Outros Profissionais">
                                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                                                <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Selecione um Profissional</label>
                                                <p className="text-xs text-indigo-700 mb-3 leading-snug">Abaixo estão listados apenas os profissionais que habilitaram o compartilhamento de seus registros com você.</p>
                                                <div className="relative">
                                                    <select value={selectedExternalProId} onChange={e => setSelectedExternalProId(e.target.value)} className="w-full appearance-none bg-white border border-indigo-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                                        <option value="">Selecione...</option>
                                                        {allowedExternalPros.map(pro => (<option key={pro.uid} value={pro.uid}>{pro.displayName} {pro.council ? `(${pro.council})` : ''}</option>))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500"><ChevronDown className="w-4 h-4" /></div>
                                                </div>
                                            </div>

                                            {isLoadingExternalData ? (
                                                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/><p>Buscando registros...</p></div>
                                            ) : selectedExternalProId ? (
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2 border-b border-slate-100 pb-2"><History className="w-4 h-4 text-indigo-500"/> Últimas Sessões</h4>
                                                        {externalProSessions.length === 0 ? <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center">Nenhuma sessão registrada neste período.</p> : (
                                                            <div className="space-y-3">
                                                                {externalProSessions.map(session => (
                                                                    <div key={session.id} className="p-3 bg-white border-l-4 border-indigo-400 rounded-r-xl shadow-sm border-t border-r border-b border-slate-200">
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{new Date(session.timestamp as number).toLocaleDateString('pt-BR')}</span>
                                                                            {session.moodRating && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">{session.moodRating}</span>}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1 mb-2">{session.tags.map(t => <span key={t} className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">{t}</span>)}</div>
                                                                        {session.notes && <p className="text-sm text-slate-600 italic">"{session.notes}"</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2 border-b border-slate-100 pb-2"><Target className="w-4 h-4 text-teal-500"/> Metas Definidas</h4>
                                                        {externalProGoals.length === 0 ? <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center">Nenhuma meta definida.</p> : (
                                                            <div className="space-y-3">
                                                                {externalProGoals.map(goal => (
                                                                    <div key={goal.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${goal.type === 'PEI' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>{goal.type}</span>
                                                                            <span className={`text-[10px] font-bold ${goal.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>{goal.status === 'active' ? 'Em Andamento' : 'Concluída/Pausada'}</span>
                                                                        </div>
                                                                        <h5 className="font-bold text-slate-800 text-sm">{goal.title}</h5>
                                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{goal.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 text-slate-300"><Network className="w-12 h-12 mx-auto mb-2 opacity-50"/><p>Selecione um profissional acima para ver os dados.</p></div>
                                            )}
                                        </Card>
                                    </div>
                                )}
                            </>
                        )}

                        {analysisMode === 'report_gen' && (
                            <div className="space-y-6">
                                <Card title="Gerar Novo Relatório">
                                    <div className="space-y-5">
                                        <div className="flex gap-4">
                                            <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase mb-1">Início</label><Input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} /></div>
                                            <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase mb-1">Fim</label><Input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} /></div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Modelo de Análise</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {REPORT_MODELS.map(model => (
                                                    <button key={model.id} onClick={() => setSelectedModel(model.id)} className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 hover:shadow-md ${selectedModel === model.id ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-slate-200 bg-white hover:border-purple-300'}`}>
                                                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">{model.icon}</div>
                                                        <div><p className={`font-bold text-sm ${selectedModel === model.id ? 'text-purple-900' : 'text-slate-800'}`}>{model.label}</p><p className="text-xs text-slate-500 mt-1 leading-snug">{model.desc}</p></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <Button onClick={handleGenerateReport} disabled={isGeneratingReport || !targetUid} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg py-4">{isGeneratingReport ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Analisando dados...</> : <><Sparkles className="w-5 h-5 mr-2"/> Gerar Relatório com IA</>}</Button>
                                    </div>
                                </Card>
                                {generatedReport && (
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden animate-in slide-in-from-bottom-4">
                                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileBarChart className="w-5 h-5 text-purple-600"/> Resultado da Análise</h3>
                                            <button onClick={copyReport} className="text-xs flex items-center gap-1 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-bold text-slate-600 transition-colors"><Copy className="w-3 h-3"/> Copiar Texto</button>
                                        </div>
                                        <div className="p-6 bg-white"><div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">{generatedReport}</div></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProfessionalView;
