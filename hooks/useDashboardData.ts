
import { useState, useEffect, useCallback, useMemo } from 'react'; 
import { UserProfile, Appointment, MoodEntry, Therapy } from '../types'; 
import { db } from '../services/firebase'; 

interface DashboardData {
    totalDiaries: number;
    upcomingAppointments: number;
    pendingTasks: number;
    totalDocuments: number;
    upcomingTherapies: Appointment[]; 
    lastDiaryEntry: MoodEntry | null;
    loading: boolean;
}

interface Routine {
    id: string;
    title: string;
    isActive?: boolean;
    lastCompletedDate?: string; 
}

const findNextOccurrenceDate = (baseAppt: Appointment, occurrenceIndex: number = 0): Date | null => {
    
    const dayMap: { [key: string]: number } = {
        'Dom.': 0, 'Seg.': 1, 'Ter.': 2, 'Qua.': 3, 'Qui.': 4, 'Sex.': 5, 'Sáb.': 6
    };

    let targetDay: number | undefined;

    if (typeof baseAppt.dayOfWeek === 'number') {
        targetDay = baseAppt.dayOfWeek;
    }
    
    if (targetDay === undefined) {
        const scheduleDayMatch = baseAppt.schedule?.match(/^(Dom|Seg|Ter|Qua|Qui|Sex|Sáb)\./);
        if (scheduleDayMatch) {
             targetDay = dayMap[scheduleDayMatch[0]];
        }
    }
    
    if (targetDay === undefined || targetDay < 0 || targetDay > 6) return null; 
    
    const targetTime = baseAppt.time || '00:00';
    const [targetHour, targetMinute] = targetTime.split(':').map(Number);
    
    const now = new Date();
    let nextDate = new Date();
    
    nextDate.setHours(targetHour, targetMinute, 0, 0);

    let dayDiff = targetDay - nextDate.getDay();
    
    if (dayDiff < 0 || (dayDiff === 0 && nextDate.getTime() <= now.getTime())) {
        dayDiff += 7;
    }
    
    dayDiff += (occurrenceIndex * 7);

    nextDate.setDate(nextDate.getDate() + dayDiff);
    
    return nextDate;
};

const generateRecurrentAppointments = (baseAppointments: Appointment[], maxOccurrences: number = 2): Appointment[] => {
    const finalList: Appointment[] = [];
    const nowTimestamp = new Date().getTime();
    
    baseAppointments.forEach(baseAppt => {
        if (baseAppt.isRecurrent) {
            for (let i = 0; i < maxOccurrences; i++) { 
                const nextDate = findNextOccurrenceDate(baseAppt, i); 

                if (nextDate && nextDate.getTime() >= nowTimestamp) { 
                    finalList.push({
                        ...baseAppt,
                        id: `${baseAppt.id}-${nextDate.getTime()}`, 
                        date: nextDate.toISOString().split('T')[0],
                        time: baseAppt.time, 
                        timestamp: nextDate.getTime(),
                        isRecurrent: true, 
                        specialty: baseAppt.specialty || baseAppt.title || 'Terapia Recorrente',
                        dayOfWeek: baseAppt.dayOfWeek,
                    } as Appointment); 
                    
                    break; 
                }
            }
        } else {
             const timePart = baseAppt.time ? `${baseAppt.time}:00` : '00:00:00';
             const dateTimeStr = `${baseAppt.date}T${timePart}`;
             
             const apptDate = new Date(dateTimeStr);
             
             if (apptDate.getTime() >= nowTimestamp && !isNaN(apptDate.getTime())) { 
                 finalList.push({
                     ...baseAppt,
                     timestamp: apptDate.getTime(),
                     isRecurrent: false,
                 });
             }
        }
    });

    return finalList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

export const useDashboardData = (userProfile: UserProfile | null): DashboardData => {
    const [data, setData] = useState<DashboardData>({
        totalDiaries: 0,
        upcomingAppointments: 0,
        pendingTasks: 0, 
        totalDocuments: 0, 
        upcomingTherapies: [],
        lastDiaryEntry: null,
        loading: true,
    });
    
    const [rawAppointments, setRawAppointments] = useState<Appointment[]>([]);
    const [rawTherapies, setRawTherapies] = useState<Therapy[]>([]); 

    const targetUid = useMemo(() => {
        if (!userProfile) return null;
        if (userProfile.profileType === 'ADULT' && userProfile.manages && userProfile.manages.length > 0) {
            return userProfile.manages[0];
        }
        return userProfile.uid;
    }, [userProfile]);

    const updateDashboardEvents = useCallback((appointments: Appointment[], therapies: Therapy[]) => {
        const mappedTherapies: Appointment[] = therapies.map((therapy) => ({
            id: therapy.id,
            userId: therapy.userId,
            title: therapy.name, 
            specialty: therapy.specialty || 'Terapia',
            date: '', 
            time: therapy.time,
            dayOfWeek: therapy.dayOfWeek, 
            isRecurrent: true,
        } as Appointment));

        const baseAppointments = [...appointments, ...mappedTherapies];
        const allUpcoming = generateRecurrentAppointments(baseAppointments);
        const upcomingMedicalAppointments = allUpcoming.filter(appt => !appt.isRecurrent).length; 

        setData(prev => ({
            ...prev,
            upcomingTherapies: allUpcoming, 
            upcomingAppointments: upcomingMedicalAppointments, 
        }));

    }, []); 

    const setupListeners = useCallback(() => {
        const uid = targetUid; 
        if (!uid) return () => {};

        const unsubscribes: (() => void)[] = [];
        setData(prev => ({ ...prev, loading: false }));
        
        // MOOD ENTRIES
        const moodCollectionRef = db.collection('users').doc(uid).collection('mood_entries'); 

        unsubscribes.push(moodCollectionRef.onSnapshot((snapshot) => {
            const total = snapshot.size;
            setData(prev => ({ ...prev, totalDiaries: total }));
        }));
        
        // LAST DIARY ENTRY
        // Using namespaced syntax: orderBy and limit on the collection reference
        const lastEntryQuery = moodCollectionRef.orderBy('timestamp', 'desc').limit(1);
        unsubscribes.push(lastEntryQuery.onSnapshot((snapshot) => {
            const lastEntry: MoodEntry | null = snapshot.docs[0]
                ? ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as MoodEntry)
                : null;
            setData(prev => ({ ...prev, lastDiaryEntry: lastEntry }));
        }));

        // APPOINTMENTS
        const apptsCollectionRef = db.collection('users').doc(uid).collection('appointments');
        unsubscribes.push(apptsCollectionRef.onSnapshot((snapshot) => {
            const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
            setRawAppointments(appointments); 
        }));

        // THERAPIES
        const therapiesCollectionRef = db.collection('users').doc(uid).collection('therapies');
        unsubscribes.push(therapiesCollectionRef.onSnapshot((snapshot) => {
            const therapies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Therapy));
            setRawTherapies(therapies); 
        }));

        // DOCUMENTS
        const docsCollectionRef = db.collection('users').doc(uid).collection('documents');
        unsubscribes.push(docsCollectionRef.onSnapshot((snapshot) => {
            setData(prev => ({ ...prev, totalDocuments: snapshot.size }));
        }));

        // ROUTINES (PENDING TASKS)
        const routinesCollectionRef = db.collection('users').doc(uid).collection('routines');
        unsubscribes.push(routinesCollectionRef.onSnapshot((snapshot) => {
            let pendingCount = 0;
            const today = new Date().toISOString().split('T')[0];
            
            const routines: Routine[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Routine));

            routines.forEach(routine => {
                if (routine.lastCompletedDate !== today) {
                    pendingCount++;
                }
            });

            setData(prev => ({ ...prev, pendingTasks: pendingCount }));
        }));

        return () => unsubscribes.forEach(unsub => unsub());

    }, [targetUid]);

    useEffect(() => {
        if (userProfile?.uid) { 
             updateDashboardEvents(rawAppointments, rawTherapies);
        }
    }, [rawAppointments, rawTherapies, updateDashboardEvents, userProfile]);
    
    useEffect(() => {
        if (userProfile) { 
            const cleanup = setupListeners();
            return cleanup;
        } else if (userProfile === null) {
            setData(prev => ({ ...prev, loading: false }));
        }
    }, [userProfile, setupListeners]);

    return data;
};
