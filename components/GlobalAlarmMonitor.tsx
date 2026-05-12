
import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Medication, Therapy, Appointment, ProfileType, UserProfile } from '../types';
import { Bell, Volume2, Pill, Puzzle, Stethoscope, Check, X, BookOpen } from 'lucide-react';
import { Button } from './ui';

interface GlobalAlarmMonitorProps {
    userProfile: UserProfile;
}

const GlobalAlarmMonitor: React.FC<GlobalAlarmMonitorProps> = ({ userProfile }) => {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [therapies, setTherapies] = useState<Therapy[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    const [activeAlarms, setActiveAlarms] = useState<(Medication | Therapy | Appointment | { id: string, type: 'diary', studentName: string })[]>([]);
    const [triggeredAlarms, setTriggeredAlarms] = useState<Set<string>>(new Set());
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [todaySchoolLogs, setTodaySchoolLogs] = useState<Record<string, boolean>>({}); // studentId -> hasLogToday
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [childDisplayName, setChildDisplayName] = useState<string | null>(null);

    const targetUid = userProfile.profileType === ProfileType.CHILD 
        ? userProfile.uid 
        : (userProfile.manages?.[0] || userProfile.uid);

    // Fetch child name for notifications
    useEffect(() => {
        if (!targetUid) return;
        const unsub = db.collection('users').doc(targetUid).collection('child_profile').doc('main')
            .onSnapshot(doc => {
                if (doc.exists) setChildDisplayName(doc.data()?.childName || null);
            });
        return () => unsub();
    }, [targetUid]);

    // Audio Setup and Mobile Interaction Unlock
    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;

        // Unlock audio on mobile with ANY interaction
        const unlockAudio = () => {
            if (audioRef.current) {
                // Play and immediately pause to "warm up" the audio engine for mobile
                audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                    setIsAudioEnabled(true);
                    console.log("🔊 Áudio desbloqueado para o despertador!");
                }).catch(e => console.log("Aguardando interação para áudio...", e));
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

    const startAlarmSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.warn("Interação do usuário necessária para som:", e));
        }
    };

    const stopAlarmSound = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    // Data Listeners
    useEffect(() => {
        if (!targetUid) return;

        const medsUnsub = db.collection('users').doc(targetUid).collection('medications')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication));
                setMedications(data);
            });

        const therapiesUnsub = db.collection('users').doc(targetUid).collection('therapies')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Therapy));
                setTherapies(data);
            });

        const apptsUnsub = db.collection('users').doc(targetUid).collection('appointments')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
                setAppointments(data);
            });

        return () => {
            medsUnsub();
            therapiesUnsub();
            apptsUnsub();
        };
    }, [targetUid]);

    // School Diary Monitor - Check if today's logs exist
    useEffect(() => {
        if (userProfile.profileType !== ProfileType.SCHOOL || !userProfile.cnpj) return;
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Listen to logs for authorized students for today
        // Note: This is simplified. In a real app with many students, we'd need a more specific query.
        const unsub = db.collectionGroup('school_logs')
            .where('date', '==', todayStr)
            .where('schoolId', '==', userProfile.uid)
            .onSnapshot(snapshot => {
                const logsExist: Record<string, boolean> = {};
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.userId) logsExist[data.userId] = true;
                });
                setTodaySchoolLogs(logsExist);
            });
            
        return () => unsub();
    }, [userProfile.profileType, userProfile.cnpj, userProfile.uid]);

    // Alarm Background Monitor
    useEffect(() => {
        const checkAlarms = () => {
            const now = new Date();
            const currentDay = now.getDay();
            const todayStr = now.toISOString().split('T')[0];
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            let foundNewAlarm = false;
            const newTriggered = new Set(triggeredAlarms);
            const alarmsToActivate: (Medication | Therapy | Appointment)[] = [];

            // 1. Medications
            medications.forEach(med => {
                const isCorrectDay = !med.frequencyType || med.frequencyType === 'daily' || (med.selectedDays?.includes(currentDay));
                if (isCorrectDay && med.administrationTimes?.includes(currentTime)) {
                    const alarmKey = `med-${med.id}-${currentTime}`;
                    if (!newTriggered.has(alarmKey)) {
                        newTriggered.add(alarmKey);
                        alarmsToActivate.push(med);
                        foundNewAlarm = true;

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Hora do Medicamento!', {
                                body: `Está na hora de ${childDisplayName || 'seu dependente'} tomar ${med.name}.`,
                                icon: '/favicon.ico'
                            });
                        }
                    }
                }
            });

            // 2. Therapies
            therapies.forEach(therapy => {
                const isCorrectDay = therapy.dayOfWeek === currentDay;
                const timeToCheck = therapy.alarmTime || therapy.time;
                if (isCorrectDay && timeToCheck === currentTime) {
                    const alarmKey = `therapy-${therapy.id}-${currentTime}`;
                    if (!newTriggered.has(alarmKey)) {
                        newTriggered.add(alarmKey);
                        alarmsToActivate.push(therapy);
                        foundNewAlarm = true;

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Hora da Terapia!', {
                                body: `Lembrete: Terapia de ${therapy.name} planejada para ${childDisplayName || 'seu dependente'} às ${therapy.time}.`,
                                icon: '/favicon.ico'
                            });
                        }
                    }
                }
            });

            // 3. Appointments
            appointments.forEach(appt => {
                const isCorrectDay = appt.date === todayStr;
                const timeToCheck = appt.alarmTime || appt.time;
                if (isCorrectDay && timeToCheck === currentTime) {
                    const alarmKey = `appt-${appt.id}-${currentTime}`;
                    if (!newTriggered.has(alarmKey)) {
                        newTriggered.add(alarmKey);
                        alarmsToActivate.push(appt);
                        foundNewAlarm = true;

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Hora da Consulta!', {
                                body: `Lembrete: Consulta ${appt.title} para ${childDisplayName || 'seu dependente'} agendada para às ${appt.time}.`,
                                icon: '/favicon.ico'
                            });
                        }
                    }
                }
            });

            // 4. School Diary Reminder
            if (userProfile.profileType === ProfileType.SCHOOL && userProfile.diaryReminderTime === currentTime) {
                const alarmKey = `diary-reminder-${todayStr}-${currentTime}`;
                if (!newTriggered.has(alarmKey)) {
                    newTriggered.add(alarmKey);
                    
                    // Trigger alert if there are students managed by this school that don't have a log today
                    // (For simplicity, we check if the selected student or any managed student is missing)
                    const studentId = targetUid;
                    if (studentId && !todaySchoolLogs[studentId]) {
                        alarmsToActivate.push({ 
                            id: `diary-${studentId}`, 
                            type: 'diary', 
                            studentName: childDisplayName || 'aluno(a)' 
                        } as any);
                        foundNewAlarm = true;

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Lembrete: Diário de Sala', {
                                body: `Não esqueça de registrar o diário de sala para ${childDisplayName || 'seu aluno'}.`,
                                icon: '/favicon.ico'
                            });
                        }
                    }
                }
            }

            if (foundNewAlarm) {
                setTriggeredAlarms(newTriggered);
                setActiveAlarms(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const filteredNew = alarmsToActivate.filter(a => !existingIds.has(a.id));
                    return [...prev, ...filteredNew];
                });
                startAlarmSound();
            }
        };

        const interval = setInterval(checkAlarms, 10000); 
        return () => clearInterval(interval);
    }, [medications, therapies, appointments, triggeredAlarms, childDisplayName, userProfile, todaySchoolLogs, targetUid]);

    const handleDismissAlarm = (id: string) => {
        setActiveAlarms(prev => {
            const next = prev.filter(a => a.id !== id);
            if (next.length === 0) stopAlarmSound();
            return next;
        });
    };

    if (activeAlarms.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                <div className="bg-red-600 p-6 flex flex-col items-center text-white relative">
                    <div className="absolute top-4 right-4">
                        {isAudioEnabled ? (
                            <Volume2 className="w-6 h-6 animate-pulse" />
                        ) : (
                            <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full animate-pulse">Toque na tela para ligar o som</span>
                        )}
                    </div>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30 animate-bounce">
                        <Bell className="w-10 h-10 text-white fill-current" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">ALERTA ATIVO!</h2>
                    <p className="text-red-100 font-medium">Você tem {activeAlarms.length} lembrete(s) pendente(s)</p>
                </div>
                
                <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
                    {activeAlarms.map(item => {
                        const isDiary = 'type' in item && item.type === 'diary';
                        const isMed = !isDiary && 'dosageValue' in item;
                        const isTherapy = !isDiary && 'dayOfWeek' in item && !('date' in item);
                        const isAppt = !isDiary && 'date' in item;

                        let title = '';
                        let subtitle = '';
                        let icon = null;

                        if (isMed) {
                            const med = item as Medication;
                            title = med.name;
                            subtitle = `${med.dosageValue} ${med.dosageUnit}`;
                            icon = <Pill className="w-6 h-6 text-red-500" />;
                        } else if (isDiary) {
                            const diary = item as { id: string, type: 'diary', studentName: string };
                            title = 'Registro Pendente';
                            subtitle = `Diário de Sala: ${diary.studentName}`;
                            icon = <BookOpen className="w-6 h-6 text-orange-500" />;
                        } else if (isTherapy) {
                            const therapy = item as Therapy;
                            title = therapy.name;
                            subtitle = `Terapia - às ${therapy.time}`;
                            icon = <Puzzle className="w-6 h-6 text-teal-500" />;
                        } else if (isAppt) {
                            const appt = item as Appointment;
                            title = appt.title;
                            subtitle = `Consulta: ${appt.specialty} às ${appt.time}`;
                            icon = <Stethoscope className="w-6 h-6 text-blue-500" />;
                        }

                        return (
                            <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                                    {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 truncate uppercase text-xs">{title}</h4>
                                    <p className="text-[10px] font-bold text-red-600">{subtitle}</p>
                                </div>
                                <button 
                                    onClick={() => handleDismissAlarm(item.id!)}
                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg transition-all active:scale-90"
                                    title="Confirmar"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 pt-0">
                    <p className="text-center text-[10px] text-slate-400 mb-4 font-medium italic">Confirme para silenciar o alarme.</p>
                    <Button 
                        onClick={() => {
                            activeAlarms.forEach(a => handleDismissAlarm(a.id!));
                        }} 
                        className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-2xl shadow-xl"
                    >
                        SILENCIAR TODOS
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GlobalAlarmMonitor;
