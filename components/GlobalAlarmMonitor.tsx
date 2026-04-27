
import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Medication, Therapy, Appointment, ProfileType, UserProfile } from '../types';
import { Bell, Volume2, Pill, Puzzle, Stethoscope, Check, X } from 'lucide-react';
import { Button } from './ui';

interface GlobalAlarmMonitorProps {
    userProfile: UserProfile;
}

const GlobalAlarmMonitor: React.FC<GlobalAlarmMonitorProps> = ({ userProfile }) => {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [therapies, setTherapies] = useState<Therapy[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    const [activeAlarms, setActiveAlarms] = useState<(Medication | Therapy | Appointment)[]>([]);
    const [triggeredAlarms, setTriggeredAlarms] = useState<Set<string>>(new Set());
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

    // Audio Setup
    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
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

        const interval = setInterval(checkAlarms, 30000); 
        return () => clearInterval(interval);
    }, [medications, therapies, appointments, triggeredAlarms, childDisplayName]);

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
                        <Volume2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30 animate-bounce">
                        <Bell className="w-10 h-10 text-white fill-current" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">ALERTA ATIVO!</h2>
                    <p className="text-red-100 font-medium">Você tem {activeAlarms.length} lembrete(s) pendente(s)</p>
                </div>
                
                <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
                    {activeAlarms.map(item => {
                        const isMed = 'dosageValue' in item;
                        const isTherapy = 'dayOfWeek' in item && !('date' in item);
                        const isAppt = 'date' in item;

                        let title = '';
                        let subtitle = '';
                        let icon = null;

                        if (isMed) {
                            title = item.name;
                            subtitle = `${item.dosageValue} ${item.dosageUnit}`;
                            icon = <Pill className="w-6 h-6 text-red-500" />;
                        } else if (isTherapy) {
                            title = item.name;
                            subtitle = `Terapia - às ${item.time}`;
                            icon = <Puzzle className="w-6 h-6 text-teal-500" />;
                        } else if (isAppt) {
                            title = (item as Appointment).title;
                            subtitle = `Consulta: ${(item as Appointment).specialty} às ${item.time}`;
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
