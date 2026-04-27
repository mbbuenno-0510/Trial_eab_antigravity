
// ... imports (maintain existing imports)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { UserProfile, MoodType, MoodEntry, ProfileType, BehaviorEntry, SchoolLog, SchoolMedicationLog } from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { GoogleGenAI, Modality } from "@google/genai";
import { Loader2, Calendar as CalendarIcon, Mic, StopCircle, Bot, Trash2, Volume2, BookHeart, ClipboardList, Smile, History, BarChart3, Wind, GraduationCap, AlertTriangle, Pill, Activity, Clock, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import RobotMascot from './RobotMascot';
import BehaviorDiary from './BehaviorDiary'; 

// ... (Rest of constants and helpers - keep as is)
// ... EMOTION_DETAILS, MOOD_CATEGORY_VALUES, PERIOD_ORDER, getLocalTodayString, TODAY_STRING
// ... Audio functions

// Re-declare constants to ensure context is kept if I don't paste the whole file, 
// but XML format requires full content usually or concise replacement. 
// I will provide the FULL file content with the modifications.

// ... (All imports and constants)

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

const EMOTION_DETAILS: Record<MoodType, { color: string; icon: string; label: string; explanation: string; category: string }> = {
  [MoodType.HAPPY]: { color: '#34D399', icon: '😊', label: 'Alegria', explanation: 'A Alegria nos conecta com as pessoas que amamos e nos dá energia para brincar!', category: 'Bom' },
  [MoodType.CALM]: { color: '#93C5FD', icon: '😌', label: 'Calma', explanation: 'A Calma ajuda a gente a pensar melhor e relaxar o corpo.', category: 'Bom' },
  [MoodType.TIRED]: { color: '#FDE047', icon: '😐', label: 'Normal', explanation: 'Tudo bem se sentir Normal ou Cansado, às vezes precisamos recarregar.', category: 'Médio' },
  [MoodType.SAD]: { color: '#94A3B8', icon: '😢', label: 'Tristeza', explanation: 'A Tristeza é normal. Chorar pode ajudar a lavar o que dói.', category: 'Ruim' },
  [MoodType.ANGRY]: { color: '#FCA5A5', icon: '😠', label: 'Raiva', explanation: 'A Raiva é forte! Que tal respirar fundo para ela passar?', category: 'Ruim' },
  [MoodType.ANXIOUS]: { color: '#F9A8D4', icon: '😨', label: 'Medo', explanation: 'O Medo protege a gente, mas você é muito corajoso(a)!', category: 'Ruim' },
};

const MOOD_CATEGORY_VALUES: Record<string, number> = {
  'Ruim': 1,
  'Médio': 2,
  'Bom': 3,
};

const MOOD_CATEGORY_COLORS: Record<string, string> = {
  'Bom': '#34D399',
  'Médio': '#FBBF24',
  'Ruim': '#EF4444',
};

const PERIOD_ORDER: Record<MoodEntry['period'], number> = {
  'Manhã': 1,
  'Tarde': 2,
  'Noite': 3,
};

const getLocalTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TODAY_STRING = getLocalTodayString(); 

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; 
    }
  }
  return buffer;
}

const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text || !process.env.GEMINI_API_KEY) return null; 
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

// --- COMPONENTES AUXILIARES ---

const InsightBox: React.FC<{
  mood: MoodType;
  text: string;
  onSpeakerClick?: () => void;
  isSpeaking?: boolean;
  isLoading?: boolean;
}> = ({ mood, text, onSpeakerClick, isSpeaking, isLoading }) => {
  return (
    <div style={{backgroundImage: 'linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(251, 191, 36, 0.1), rgba(52, 211, 153, 0.1), rgba(96, 165, 250, 0.1))'}} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 min-h-[150px]">
      <RobotMascot mood={mood} onSpeakerClick={onSpeakerClick} isSpeaking={isSpeaking} isLoading={isLoading} />
      <div className="relative flex-1">
        <div className="speech-bubble text-gray-700 text-sm md:text-base font-medium leading-relaxed">
          {isLoading ? (
            <span className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
            </span>
          ) : text}
        </div>
        <style>{`.speech-bubble { position: relative; background: #E5E7EB; border-radius: .5em; padding: 12px; animation: fadeIn 0.4s ease-out; } .speech-bubble:after { content: ''; position: absolute; left: 0; top: 50%; width: 0; height: 0; border: 12px solid transparent; border-right-color: #E5E7EB; border-left: 0; margin-top: -12px; margin-left: -12px; } @keyframes fadeIn { from { opacity: 0; transform: scale(0.9) translateX(-10px); } to { opacity: 1; transform: scale(1) translateX(0); } }`}</style>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    entryDate?: string;
}
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, entryDate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 ease-out duration-300">
                <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5"/> Apagar Registro?
                </h3>
                <p className="text-gray-700 mb-6 text-sm">
                    Você tem certeza que deseja apagar o registro de humor do dia **{entryDate || 'Selecionado'}**? Esta ação não pode ser desfeita.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg transition-colors hover:bg-gray-100"
                    >
                        Não, Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg transition-colors hover:bg-red-600"
                    >
                        Sim, Apagar
                    </button>
                </div>
            </div>
        </div>
    );
};

const MoodDynamicTabIcon = ({ tab }: { tab: 'register' | 'history' | 'analysis' | 'calm_history' | 'school_history' }) => {
    const iconMap = {
        'register': {
            icon: <Smile className="w-6 h-6" />,
            gradient: 'from-pink-500 to-rose-500',
            shadow: 'shadow-pink-500/50'
        },
        'history': {
            icon: <History className="w-6 h-6" />,
            gradient: 'from-blue-500 to-cyan-500',
            shadow: 'shadow-blue-500/50'
        },
        'analysis': {
            icon: <BarChart3 className="w-6 h-6" />,
            gradient: 'from-purple-500 to-indigo-500',
            shadow: 'shadow-purple-500/50'
        },
        'calm_history': {
            icon: <Wind className="w-6 h-6" />,
            gradient: 'from-teal-400 to-emerald-500',
            shadow: 'shadow-teal-500/50'
        },
        'school_history': {
            icon: <GraduationCap className="w-6 h-6" />,
            gradient: 'from-violet-500 to-fuchsia-500',
            shadow: 'shadow-violet-500/50'
        }
    };

    const { icon, gradient, shadow } = iconMap[tab];

    return (
        <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-300
            bg-gradient-to-br ${gradient} shadow-xl ${shadow}
        `}>
            {icon}
        </div>
    );
};

// 🆕 Componente de Filtro de Data Reutilizável
const DateRangeFilter = ({ startDate, setStartDate, endDate, setEndDate }: { startDate: string, setStartDate: (v: string) => void, endDate: string, setEndDate: (v: string) => void }) => (
    <div className="flex gap-2 items-center flex-1 min-w-[200px]">
        <div className="relative flex-1">
            <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400 pointer-events-none">De</span>
            <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="p-2 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-600 font-medium"
            />
        </div>
        <div className="relative flex-1">
            <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400 pointer-events-none">Até</span>
            <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="p-2 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-600 font-medium"
            />
        </div>
    </div>
);


// --- COMPONENTES PRINCIPAL ---

interface MoodDiaryProps {
  userProfile: UserProfile | null;
  preSelectedChildId?: string | null;
  readOnly?: boolean;
}

type DiaryMode = 'MOOD' | 'BEHAVIOR';

const MoodDiary: React.FC<MoodDiaryProps> = ({ userProfile, preSelectedChildId, readOnly = false }) => {
  const isChildProfile = userProfile?.profileType === ProfileType.CHILD;
  const isAdultProfile = userProfile?.profileType === ProfileType.ADULT;
  
  const [diaryMode, setDiaryMode] = useState<DiaryMode>('MOOD');
  
  const canRegister = useMemo(() => {
    if (readOnly) return false;
    return userProfile?.profileType !== ProfileType.ADULT;
  }, [userProfile, readOnly]); 

  const targetUid = useMemo(() => {
    if (preSelectedChildId) return preSelectedChildId;
    if (!userProfile) return null;
    if (userProfile.profileType === ProfileType.ADULT && userProfile.manages && userProfile.manages.length > 0) {
        return userProfile.manages[0];
    }
    return userProfile.uid;
  }, [userProfile, preSelectedChildId]);
  
  const isManagingChild = (userProfile?.profileType === ProfileType.ADULT && targetUid !== userProfile?.uid) || preSelectedChildId;

  const [childDisplayName, setChildDisplayName] = useState<string | null>(null);
  const [showSchoolTab, setShowSchoolTab] = useState(false);

  const initialActiveTab = canRegister ? 'register' : 'history';
  const [activeTab, setActiveTab] = useState<'register' | 'history' | 'analysis' | 'calm_history' | 'school_history'>(initialActiveTab);
  
  const [mood, setMood] = useState<MoodType | null>(null);
  const [notes, setNotes] = useState('');
  const [period, setPeriod] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã');
  const [entryDate, setEntryDate] = useState(TODAY_STRING); 
  const [emotionExplanation, setEmotionExplanation] = useState("Selecione um humor.");
  
  const [history, setHistory] = useState<MoodEntry[]>([] as MoodEntry[]);
  const [calmHistory, setCalmHistory] = useState<BehaviorEntry[]>([]); 
  const [schoolLogs, setSchoolLogs] = useState<SchoolLog[]>([]);
  const [schoolMedLogs, setSchoolMedLogs] = useState<SchoolMedicationLog[]>([]);
  const [schoolHistoryView, setSchoolHistoryView] = useState<'behavior' | 'medication'>('behavior');
  
  const [displayState, setDisplayState] = useState<'form' | 'insight'>('form');
  const [currentInsight, setCurrentInsight] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);
  
  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [prefetchedAudioBuffer, setPrefetchedAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // Explanation Audio
  const [isSpeakingExplanation, setIsSpeakingExplanation] = useState(false);
  const [isSynthesizingExplanation, setIsSynthesizingExplanation] = useState(false);
  const explanationAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [explanationAudioBuffer, setExplanationAudioBuffer] = useState<AudioBuffer | null>(null);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textBaseRef = useRef<string>('');

  // 🆕 History Filters (Global Dates)
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ id: string, dateString: string } | null>(null);

  const [speakingHistoryId, setSpeakingHistoryId] = useState<string | null>(null);
  const historyAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isHistoryAudioLoading, setIsHistoryAudioLoading] = useState(false);
  const historyAudioCache = useRef<Record<string, AudioBuffer>>({});

  const stopAllAudio = useCallback(() => {
      if (isListening && recognitionRef.current) recognitionRef.current.stop();
      if (audioSourceRef.current) { audioSourceRef.current.stop(); setIsPlaying(false); audioSourceRef.current = null; }
      if (explanationAudioSourceRef.current) { explanationAudioSourceRef.current.stop(); setIsSpeakingExplanation(false); explanationAudioSourceRef.current = null; }
      if (historyAudioSourceRef.current) { historyAudioSourceRef.current.stop(); setSpeakingHistoryId(null); historyAudioSourceRef.current = null; }
      if (audioContextRef.current && audioContextRef.current.state === 'running') { audioContextRef.current.suspend(); }
  }, [isListening]);

  useEffect(() => {
    if (isManagingChild && targetUid) {
        const fetchChildData = async () => {
            try {
                const path = `users/${targetUid}/child_profile/main`;
                const profileSnap = await db.collection("users").doc(targetUid).collection("child_profile").doc("main").get().catch(err => handleFirestoreError(err, OperationType.GET, path));
                if(profileSnap && profileSnap.exists) {
                    const data = profileSnap.data();
                    if (data) {
                        setChildDisplayName(data.childName || 'Criança');
                        setShowSchoolTab(data.showSchoolHistoryToGuardian || false);
                    }
                    return;
                }
                const userPath = `users/${targetUid}`;
                const docSnap = await db.collection("users").doc(targetUid).get().catch(err => handleFirestoreError(err, OperationType.GET, userPath));
                if (docSnap && docSnap.exists) setChildDisplayName(docSnap.data()?.displayName || 'Criança');
                else setChildDisplayName('Criança Desconhecida');
            } catch (error) { console.error("Erro ao buscar dados da criança:", error); setChildDisplayName('Erro ao carregar'); }
        };
        fetchChildData();
    } else { setChildDisplayName(null); setShowSchoolTab(false); }
  }, [isManagingChild, targetUid]); 

  useEffect(() => {
    if (!targetUid) return;
    const unsubscribeMood = db.collection("users").doc(targetUid).collection("mood_entries")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
          const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MoodEntry));
          setHistory(entries);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${targetUid}/mood_entries`));
    return () => unsubscribeMood();
  }, [targetUid]);

  useEffect(() => {
      if (activeTab === 'school_history' && targetUid) {
          // REMOVIDO .limit(20) para permitir filtro de data completo
          const unsubscribeSchool = db.collection("users").doc(targetUid).collection("school_logs")
            .orderBy("date", "desc")
            .onSnapshot((snapshot) => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SchoolLog));
                setSchoolLogs(logs);
            }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${targetUid}/school_logs`));
          const unsubscribeSchoolMeds = db.collection("users").doc(targetUid).collection("school_medication_logs")
            .orderBy("timestamp", "desc")
            .onSnapshot((snapshot) => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SchoolMedicationLog));
                setSchoolMedLogs(logs);
            }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${targetUid}/school_medication_logs`));
          return () => { unsubscribeSchool(); unsubscribeSchoolMeds(); };
      }
  }, [activeTab, targetUid]);

  useEffect(() => {
      if (activeTab === 'calm_history' && targetUid) {
          // REMOVIDO .limit(30) para permitir filtro de data completo
          const unsubscribeCalm = db.collection("users").doc(targetUid).collection("behavior_entries")
            .orderBy("timestamp", "desc")
            .onSnapshot((snapshot) => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BehaviorEntry));
                const calmLogs = logs.filter(log => log.description && log.description.includes('Sala de Calma'));
                setCalmHistory(calmLogs);
            }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${targetUid}/behavior_entries`));
          return () => unsubscribeCalm();
      }
  }, [activeTab, targetUid]);

  // Speech Recognition Setup (Same as before)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'pt-BR';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => { setTimeout(() => { if (isListening) setIsListening(false); }, 100); };
      recognition.onerror = (event: any) => { console.error("Speech Recognition Error:", event.error); setIsListening(false); };
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) { if (event.results[i].isFinal) transcript += event.results[i][0].transcript; }
        if (transcript) setNotes(prev => (prev && !prev.endsWith(' ')) ? prev + ' ' + transcript : prev + transcript);
      };
      recognitionRef.current = recognition;
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [isListening]); 

  useEffect(() => { return () => { stopAllAudio(); if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close(); }; }, [stopAllAudio]);

  useEffect(() => {
    const fetchExplanation = async () => {
        stopAllAudio(); setExplanationAudioBuffer(null);
        if (!mood) { setEmotionExplanation("Selecione um humor."); return; }
        setIsSynthesizingExplanation(true);
        try {
            const text = EMOTION_DETAILS[mood].explanation;
            setEmotionExplanation(text);
            const base64Audio = await generateSpeech(text);
            if (base64Audio) {
                if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const ctx = audioContextRef.current;
                const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                setExplanationAudioBuffer(buffer);
            }
        } catch (err) { console.error(err); } finally { setIsSynthesizingExplanation(false); }
    };
    fetchExplanation();
  }, [mood, stopAllAudio]);
    
  useEffect(() => {
    if (userProfile?.profileType === ProfileType.ADULT || readOnly) { if (activeTab === 'register') setActiveTab('history'); }
    else if (isChildProfile && activeTab === 'analysis') setActiveTab('register');
  }, [isChildProfile, activeTab, userProfile?.profileType, readOnly]);

  const isEntryToday = (entryDateString: string | undefined): boolean => {
    if (!entryDateString) return false;
    return entryDateString === TODAY_STRING;
  };

  const isEntryDuplicate = useMemo(() => {
    if (!entryDate || !period) return false;
    return history.some(entry => entry.dateString === entryDate && entry.period === period);
  }, [history, entryDate, period]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    stopAllAudio();
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); } 
    else { textBaseRef.current = notes; if (audioContextRef.current && audioContextRef.current.state === 'suspended') audioContextRef.current.resume(); recognitionRef.current.start(); }
  };

  const handleSpeakExplanation = () => {
    if (isSpeakingExplanation) { stopAllAudio(); return; }
    if (!explanationAudioBuffer || !audioContextRef.current) return;
    stopAllAudio();
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource(); source.buffer = explanationAudioBuffer; source.connect(ctx.destination);
    source.onended = () => { setIsSpeakingExplanation(false); explanationAudioSourceRef.current = null; };
    source.start(); explanationAudioSourceRef.current = source; setIsSpeakingExplanation(true);
  };

  const handlePlayHistoryInsight = useCallback(async (entry: MoodEntry) => {
      if (!entry.aiFeedback) return;
      if (speakingHistoryId === entry.id) { stopAllAudio(); return; }
      stopAllAudio();
      setIsHistoryAudioLoading(true); setSpeakingHistoryId(entry.id);
      try {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          const ctx = audioContextRef.current; if (ctx.state === 'suspended') ctx.resume();
          let buffer: AudioBuffer;
          if (historyAudioCache.current[entry.id]) { buffer = historyAudioCache.current[entry.id]; } 
          else {
              const base64Audio = await generateSpeech(entry.aiFeedback);
              if (!base64Audio) throw new Error("Falha na API TTS");
              buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              historyAudioCache.current[entry.id] = buffer;
          }
          const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination);
          source.onended = () => { setSpeakingHistoryId(null); historyAudioSourceRef.current = null; };
          source.start(); historyAudioSourceRef.current = source;
      } catch (error) { console.error("Erro ao tocar histórico:", error); setSpeakingHistoryId(null); alert("Não foi possível reproduzir o áudio."); } 
      finally { setIsHistoryAudioLoading(false); }
  }, [speakingHistoryId, stopAllAudio]);

  const handleConfirmDeleteStart = (entryId: string, entryDateString: string) => {
      if (!isEntryToday(entryDateString)) { alert(`Você só pode apagar registros feitos no dia de hoje (${new Date().toLocaleDateString('pt-BR')}).`); return; }
      setEntryToDelete({ id: entryId, dateString: entryDateString }); setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteExecute = useCallback(async () => {
      if (!targetUid || !entryToDelete) { setShowDeleteConfirm(false); setEntryToDelete(null); return; }
      const path = `users/${targetUid}/mood_entries/${entryToDelete.id}`;
      try { await db.collection("users").doc(targetUid).collection("mood_entries").doc(entryToDelete.id).delete().catch(err => handleFirestoreError(err, OperationType.DELETE, path)); } 
      catch (error) { console.error("Erro ao apagar registro:", error); } 
      finally { setShowDeleteConfirm(false); setEntryToDelete(null); }
  }, [targetUid, entryToDelete]);

  const handleConfirmDeleteCancel = () => { setShowDeleteConfirm(false); setEntryToDelete(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister || !mood || !targetUid || entryDate > TODAY_STRING || isEntryDuplicate) return;
    stopAllAudio(); setIsAnalysing(true);
    try {
        let aiFeedback = "Continue firme! 🌟";
        if (process.env.GEMINI_API_KEY) {
            const userRole = isChildProfile ? 'uma criança' : 'um adulto'; 
            const prompt = `Aja como um psicólogo empático para ${userRole}. O usuário está sentindo: ${EMOTION_DETAILS[mood].label}. Período: ${period}. Notas: "${notes}". Responda com um insight curto, positivo e acolhedor (máximo 2 frases).`;
            const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: "user", parts: [{ text: prompt }] }] });
            if (result.text) aiFeedback = result.text.trim();
        }
        const moodEntry: Omit<MoodEntry, 'id'> = { userId: targetUid, timestamp: Date.now(), dateString: entryDate, mood, notes, period, aiFeedback };
        const path = `users/${targetUid}/mood_entries`;
        if(targetUid) await db.collection("users").doc(targetUid).collection("mood_entries").add(moodEntry).catch(err => handleFirestoreError(err, OperationType.WRITE, path));
        else throw new Error("UID de destino não encontrado.");
        setCurrentInsight(aiFeedback); setDisplayState('insight'); setPrefetchedAudioBuffer(null);
        const base64Audio = await generateSpeech(aiFeedback);
        if (base64Audio) {
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            setPrefetchedAudioBuffer(buffer);
        }
    } catch (error: any) { console.error("Erro ao salvar:", error); alert(`Falha ao registrar humor: ${error.message || 'Erro desconhecido'}`); } 
    finally { setIsAnalysing(false); }
  };

  const handlePlayInsight = () => {
    if (isPlaying) { stopAllAudio(); return; }
    if (!prefetchedAudioBuffer || !audioContextRef.current) return;
    stopAllAudio();
    const ctx = audioContextRef.current; if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource(); source.buffer = prefetchedAudioBuffer; source.connect(ctx.destination);
    source.onended = () => { setIsPlaying(false); audioSourceRef.current = null; };
    source.start(); audioSourceRef.current = source; setIsPlaying(true);
  };

  const handleReset = () => {
      setMood(null); setNotes(''); setCurrentInsight(''); setDisplayState('form'); setPrefetchedAudioBuffer(null); setEmotionExplanation("Selecione um humor."); setEntryDate(TODAY_STRING); setPeriod('Manhã');           
  };

  const chartData = useMemo(() => {
    if (isChildProfile || history.length === 0) return [];
    const grouped = history.reduce<Record<string, { sum: number; count: number }>>((acc, entry) => {
      const d = entry.dateString || ''; if (!d) return acc;
      if (!acc[d]) acc[d] = { sum: 0, count: 0 };
      const cat = EMOTION_DETAILS[entry.mood]?.category || 'Médio';
      acc[d].sum += MOOD_CATEGORY_VALUES[cat]; acc[d].count += 1; return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0])).slice(-30).map(([date, val]) => {
        const v = val as { sum: number; count: number };
        return { date: date.split('-').slice(1).reverse().join('/'), val: Number((v.sum / v.count).toFixed(2)) };
    });
  }, [history, isChildProfile]);

  const crisisData = useMemo(() => {
    if (isChildProfile) return [];
      const counts: Record<string, number> = { 'Manhã': 0, 'Tarde': 0, 'Noite': 0 };
      history.filter(e => EMOTION_DETAILS[e.mood]?.category === 'Ruim').forEach(e => { if (counts[e.period] !== undefined) counts[e.period]++; });
      return Object.keys(PERIOD_ORDER).map(periodName => ({ name: periodName, value: counts[periodName as keyof typeof counts] || 0 })) as { name: 'Manhã' | 'Tarde' | 'Noite', value: number }[];
  }, [history, isChildProfile]);

  // --- FILTROS APLICADOS ---

  const filteredHistory = useMemo(() => {
    let result: MoodEntry[] = history.filter(e => {
        const entryMoodCategory = EMOTION_DETAILS[e.mood]?.category;
        if (moodFilter && entryMoodCategory !== moodFilter) return false;
        // Date Range
        if (startDate && e.dateString && e.dateString < startDate) return false;
        if (endDate && e.dateString && e.dateString > endDate) return false;
        return true;
    });
    result.sort((a, b) => {
        const dateA = a.dateString || ''; const dateB = b.dateString || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA); 
        const periodOrderA = PERIOD_ORDER[a.period] || 99; const periodOrderB = PERIOD_ORDER[b.period] || 99;
        return periodOrderA - periodOrderB;
    });
    return result;
  }, [history, moodFilter, startDate, endDate]);

  const filteredCalmHistory = useMemo(() => {
      let result = calmHistory;
      if (startDate) result = result.filter(e => e.dateString >= startDate);
      if (endDate) result = result.filter(e => e.dateString <= endDate);
      return result;
  }, [calmHistory, startDate, endDate]);

  const filteredSchoolLogs = useMemo(() => {
      let result = schoolLogs;
      if (startDate) result = result.filter(e => e.date >= startDate);
      if (endDate) result = result.filter(e => e.date <= endDate);
      return result;
  }, [schoolLogs, startDate, endDate]);

  const filteredSchoolMedLogs = useMemo(() => {
      let result = schoolMedLogs;
      if (startDate) result = result.filter(e => e.date >= startDate);
      if (endDate) result = result.filter(e => e.date <= endDate);
      return result;
  }, [schoolMedLogs, startDate, endDate]);

  const moodOptions = Object.values(MoodType).map(m => ({ type: m, ...EMOTION_DETAILS[m] }));

  // SE FOR ADULTO E ESTIVER NO MODO COMPORTAMENTAL (E NÃO READONLY)
  if (isAdultProfile && diaryMode === 'BEHAVIOR' && !readOnly) {
      return (
          <div className="p-4 max-w-md mx-auto pb-24 font-sans">
              {isManagingChild && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg flex items-center gap-2 mb-4">
                      <span>📘</span><span>Registrando comportamento de: <strong>{childDisplayName || 'Carregando...'}</strong></span>
                  </div>
              )}
              <div className="bg-slate-100 p-1 rounded-xl flex mb-6 shadow-inner">
                  <button onClick={() => setDiaryMode('MOOD')} className="flex-1 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1"><BookHeart className="w-4 h-4"/> <span className="hidden sm:inline">Humor</span></button>
                  <button onClick={() => setDiaryMode('BEHAVIOR')} className="flex-1 py-2 rounded-lg text-sm font-bold bg-white text-blue-600 shadow-sm flex items-center justify-center gap-1"><ClipboardList className="w-4 h-4"/> <span className="hidden sm:inline">Comp.</span></button>
              </div>
              {userProfile && <BehaviorDiary userProfile={userProfile} />}
          </div>
      );
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-24 font-sans">
        
        {isManagingChild && !readOnly && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg flex items-center gap-2 mb-4">
                <span>📘</span><span>Visualizando humor de: <strong>{childDisplayName || 'Carregando nome...'}</strong></span>
            </div>
        )}

        {isAdultProfile && !readOnly && (
            <div className="bg-slate-100 p-1 rounded-xl flex mb-6 shadow-inner">
                <button onClick={() => setDiaryMode('MOOD')} className="flex-1 py-2 rounded-lg text-sm font-bold bg-white text-blue-600 shadow-sm flex items-center justify-center gap-1"><BookHeart className="w-4 h-4"/> <span className="hidden sm:inline">Humor</span></button>
                <button onClick={() => setDiaryMode('BEHAVIOR')} className="flex-1 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1"><ClipboardList className="w-4 h-4"/> <span className="hidden sm:inline">Comp.</span></button>
            </div>
        )}
        
      {!readOnly && (
          <div className="flex justify-between gap-2 p-2 bg-white rounded-3xl w-full shadow-lg border border-slate-100 mb-6 overflow-x-auto">
            {canRegister && (
                <button onClick={() => setActiveTab('register')} className={`flex flex-col items-center justify-center transition-all duration-200 group flex-1 min-w-[70px] ${activeTab === 'register' ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}>
                    <MoodDynamicTabIcon tab="register" /><span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === 'register' ? 'text-pink-600 font-bold' : 'text-slate-500'}`}>Registrar</span>
                </button>
            )}
            <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center justify-center transition-all duration-200 group flex-1 min-w-[70px] ${activeTab === 'history' ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}>
                <MoodDynamicTabIcon tab="history" /><span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === 'history' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>Histórico</span>
            </button>
            {isAdultProfile && (
                <button onClick={() => setActiveTab('calm_history')} className={`flex flex-col items-center justify-center transition-all duration-200 group flex-1 min-w-[70px] ${activeTab === 'calm_history' ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}>
                    <MoodDynamicTabIcon tab="calm_history" /><span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === 'calm_history' ? 'text-teal-600 font-bold' : 'text-slate-500'}`}>Sala Calma</span>
                </button>
            )}
            {showSchoolTab && (
                <button onClick={() => setActiveTab('school_history')} className={`flex flex-col items-center justify-center transition-all duration-200 group flex-1 min-w-[70px] ${activeTab === 'school_history' ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}>
                    <MoodDynamicTabIcon tab="school_history" /><span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === 'school_history' ? 'text-violet-600 font-bold' : 'text-slate-500'}`}>Escola</span>
                </button>
            )}
            {userProfile?.profileType !== ProfileType.CHILD && (
                <button onClick={() => setActiveTab('analysis')} className={`flex flex-col items-center justify-center transition-all duration-200 group flex-1 min-w-[70px] ${activeTab === 'analysis' ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}>
                    <MoodDynamicTabIcon tab="analysis" /><span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === 'analysis' ? 'text-purple-600 font-bold' : 'text-slate-500'}`}>Análise</span>
                </button>
            )}
          </div>
      )}
      
      {/* REGISTER TAB */}
      {activeTab === 'register' && canRegister && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
            {displayState === 'form' ? (
                <>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {moodOptions.map((opt) => (
                            <button key={opt.type} onClick={() => setMood(opt.type)} className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all aspect-square relative overflow-hidden group ${mood === opt.type ? 'ring-4 ring-offset-2 ring-blue-200 scale-105 z-10 shadow-lg' : 'opacity-90 hover:opacity-100 hover:scale-105'}`} style={{ backgroundColor: opt.color }}>
                                <div className="absolute inset-2 border-2 border-white/20 rounded-xl pointer-events-none"></div>
                                <span className="text-3xl mb-1">{opt.icon}</span>
                                <span className="text-white font-bold text-[10px]">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mb-6">
                        {mood ? <InsightBox mood={mood} text={emotionExplanation} onSpeakerClick={handleSpeakExplanation} isSpeaking={isSpeakingExplanation} isLoading={isSynthesizingExplanation}/> : <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">Selecione uma emoção acima para começar.</div>}
                    </div>
                    {mood && (
                        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 ml-1">Data</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarIcon className="w-5 h-5 text-slate-400" /></div>
                                    <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} max={TODAY_STRING} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-700" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 ml-1">Período</label>
                                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                                    {['Manhã', 'Tarde', 'Noite'].map(p => (
                                        <button key={p} type="button" onClick={() => setPeriod(p as any)} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 ml-1">Notas (Opcional)</label>
                                <div className="relative">
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-3 border border-slate-200 rounded-xl resize-none" placeholder="Como você se sente?" />
                                    <button type="button" onClick={toggleListening} className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                                </div>
                            </div>
                            <button type="submit" disabled={isAnalysing || isEntryDuplicate || !mood} className={`w-full py-3 rounded-xl text-white font-bold ${isAnalysing || isEntryDuplicate || !mood ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {isAnalysing ? <><Loader2 className="w-5 h-5 animate-spin inline mr-2"/> Analisando...</> : isEntryDuplicate ? 'Registro já existe' : 'Registrar'}
                            </button>
                        </form>
                    )}
                </>
            ) : (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 text-center">Registro Salvo!</h2>
                    <InsightBox mood={mood || MoodType.CALM} text={currentInsight} onSpeakerClick={handlePlayInsight} isSpeaking={isPlaying} isLoading={isAnalysing}/>
                    <button onClick={handleReset} className="w-full py-3 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100">Novo Registro</button>
                </div>
            )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="animate-in fade-in">
          <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select value={moodFilter || ''} onChange={e => setMoodFilter(e.target.value || null)} className="flex-1 p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-transparent font-bold text-slate-600">
                    <option value="">Todos os Humores</option>
                    {Object.keys(MOOD_CATEGORY_VALUES).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
              </div>
              <DateRangeFilter startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
          </div>

          <div className="space-y-3">
            {filteredHistory.length === 0 ? <p className="text-center text-slate-500">Nenhum registro encontrado.</p> : filteredHistory.map(entry => {
                const details = EMOTION_DETAILS[entry.mood];
                const isToday = isEntryToday(entry.dateString);
                const isThisPlaying = speakingHistoryId === entry.id && !isHistoryAudioLoading;
                const isThisLoading = speakingHistoryId === entry.id && isHistoryAudioLoading;

                return (
                    <div key={entry.id} className="p-4 bg-white rounded-xl shadow-sm border-l-4" style={{ borderColor: details.color }}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{details.icon}</span>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{details.label}</p>
                                    <p className="text-xs text-slate-500">{new Date(entry.dateString).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - {entry.period}</p>
                                </div>
                            </div>
                            {isToday && canRegister && (
                                <button onClick={() => handleConfirmDeleteStart(entry.id, entry.dateString)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            )}
                        </div>
                        {entry.notes && <p className="text-sm text-slate-600 italic mb-2">"{entry.notes}"</p>}
                        {entry.aiFeedback && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-3">
                                <div className="bg-blue-50 p-2 rounded-full"><Bot className="w-4 h-4 text-blue-600" /></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-blue-700 mb-0.5">Insight do Robô</p>
                                    <p className="text-sm text-slate-700 leading-snug">{entry.aiFeedback}</p>
                                </div>
                                <button onClick={() => handlePlayHistoryInsight(entry)} disabled={isHistoryAudioLoading && speakingHistoryId !== entry.id} className={`p-2 rounded-full transition-colors ${isThisPlaying ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600'}`} title={isThisPlaying ? "Parar" : "Ouvir"}>
                                    {isThisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isThisPlaying ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
            <DeleteConfirmModal isOpen={showDeleteConfirm} onClose={handleConfirmDeleteCancel} onConfirm={handleConfirmDeleteExecute} entryDate={entryToDelete?.dateString} />
          </div>
        </div>
      )}

      {/* 🆕 CALM HISTORY TAB */}
      {activeTab === 'calm_history' && (
          <div className="animate-in fade-in space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4"><Wind className="w-5 h-5 text-teal-500" /> Histórico de Acesso</h3>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                  <DateRangeFilter startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
              </div>
              
              {filteredCalmHistory.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                      <Wind className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum acesso registrado.</p>
                  </div>
              ) : (
                  filteredCalmHistory.map(log => (
                      <div key={log.id} className="p-4 bg-white border-l-4 border-teal-400 rounded-xl shadow-sm flex items-center gap-4 relative">
                          <div className="bg-teal-50 p-2 rounded-full text-teal-600"><Wind className="w-6 h-6" /></div>
                          <div className="flex-1">
                              <p className="font-bold text-slate-800 text-sm">Entrada na Sala de Calma</p>
                              <p className="text-xs text-slate-500 mt-0.5">{new Date(log.timestamp as number).toLocaleDateString('pt-BR')} às {new Date(log.timestamp as number).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                              <div className="flex gap-2 mt-2"><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">Período: {log.period}</span></div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}

      {/* 🆕 SCHOOL HISTORY TAB */}
      {activeTab === 'school_history' && showSchoolTab && (
          <div className="animate-in fade-in space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-violet-500" /> Histórico Escolar</h3>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                        <button onClick={() => setSchoolHistoryView('behavior')} className={`flex-1 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${schoolHistoryView === 'behavior' ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}><Activity className="w-3 h-3"/> Comportamental</button>
                        <button onClick={() => setSchoolHistoryView('medication')} className={`flex-1 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${schoolHistoryView === 'medication' ? 'bg-pink-100 text-pink-700' : 'text-slate-500 hover:text-slate-700'}`}><Pill className="w-3 h-3"/> Medicação</button>
                    </div>
                    <DateRangeFilter startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
                  </div>
              </div>

              {schoolHistoryView === 'behavior' ? (
                  <>
                      {filteredSchoolLogs.length === 0 ? (
                          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400"><GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum registro escolar.</p></div>
                      ) : (
                          filteredSchoolLogs.map(log => (
                              <div key={log.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                  <div className="flex justify-between items-center mb-3">
                                      <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded">{new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                      {log.dysregulationCount > 0 && (<span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {log.dysregulationCount} Ocorrência(s)</span>)}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div className="bg-slate-50 p-2 rounded-lg"><p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Social</p><p className="text-sm font-semibold text-slate-800">{log.socialInteraction}</p></div>
                                      <div className="bg-slate-50 p-2 rounded-lg"><p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Participação</p><p className="text-sm font-semibold text-slate-800">{log.participation}</p></div>
                                  </div>
                                  {log.generalNotes && (<div className="text-sm border-t border-slate-100 pt-2 mt-2"><p className="text-xs font-bold text-slate-500 mb-1">Observações da Escola:</p><p className="text-slate-700 italic">"{log.generalNotes}"</p></div>)}
                              </div>
                          ))
                      )}
                  </>
              ) : (
                  <>
                      {filteredSchoolMedLogs.length === 0 ? (
                          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-pink-200 text-slate-400"><Pill className="w-12 h-12 mx-auto mb-2 opacity-50 text-pink-300" /><p>Nenhum registro de medicação.</p></div>
                      ) : (
                          filteredSchoolMedLogs.map(log => (
                              <div key={log.id} className="p-3 bg-white border border-pink-100 rounded-xl shadow-sm relative overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-400"></div>
                                  <div className="pl-3">
                                      <div className="flex justify-between items-start mb-1">
                                          <div className="flex items-center gap-2"><span className="text-xs font-bold bg-pink-50 text-pink-700 px-2 py-1 rounded">{new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span><span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {log.time}</span></div>
                                      </div>
                                      <div className="flex items-center gap-2 mb-1"><Pill className="w-4 h-4 text-pink-500"/><span className="font-bold text-slate-800">{log.medicationName}</span></div>
                                      <p className="text-xs text-slate-600">Dosagem: <span className="font-semibold">{log.dosage}</span></p>
                                      {log.notes && (<p className="text-xs text-slate-500 mt-1 italic">Obs: {log.notes}</p>)}
                                  </div>
                              </div>
                          ))
                      )}
                  </>
              )}
          </div>
      )}

      {/* ANALYSIS TAB (Se não for criança) */}
      {activeTab === 'analysis' && userProfile?.profileType !== 'CHILD' && (
           <div className="animate-in fade-in space-y-6">
                <h2 className="text-xl font-bold mb-4">📈 Tendência Média do Humor (Últimos 30 dias)</h2>
                <p className="text-sm text-slate-500 mb-2">1 = Ruim, 2 = Médio, 3 = Bom</p>
                <div className="h-64 w-full bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                  {chartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="date" tick={{fontSize: 10}}/>
                              <YAxis domain={[1, 3]} hide />
                              <Tooltip />
                              <Line type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={3} dot={false}/>
                          </LineChart>
                      </ResponsiveContainer>
                  ) : (
                      <p className="h-full flex items-center justify-center text-slate-400">Dados insuficientes para o gráfico.</p>
                  )}
                </div>
                
                <h2 className="text-xl font-bold mt-8 mb-4">🚨 Eventos de Humor Ruim por Período</h2>
                <div className="h-64 w-full bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                  {crisisData.length > 0 && crisisData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={crisisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="value" name="Crises" fill={MOOD_CATEGORY_COLORS['Ruim']} radius={[4, 4, 0, 0]}/>
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <p className="h-full flex items-center justify-center text-slate-400">Nenhum registro de humor "Ruim" para análise.</p>
                  )}
                </div>
           </div>
      )}
    </div>
  );
};

export default MoodDiary;
