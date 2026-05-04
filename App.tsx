
import React, { useEffect, useState, useMemo } from 'react';
import { db, auth, handleFirestoreError, OperationType } from './services/firebase';
import firebase from 'firebase/compat/app'; // Import for types
import { LayoutDashboard, BookHeart, BookOpen, HeartPulse, ListTodo, FileText, Loader2, Wind, LogOut, ClipboardList, Target, Activity, School as SchoolIcon, History, X, Bell, AlertTriangle } from 'lucide-react';
import { UserProfile, ProfileType, ChildExtendedProfile } from './types'; 
import Auth from './Auth';
import Dashboard from './components/Dashboard';
import MoodDiary from './components/MoodDiary';
import HealthView from './components/HealthView';
import RoutinesView from './components/RoutinesView';
import DocsView from './components/DocsView';
import SensoryView from './components/SensoryView'; 
import ProfessionalView from './components/ProfessionalView'; 
import SchoolView from './components/SchoolView'; 
import ErrorBoundary from './components/ErrorBoundary';
import GlobalAlarmMonitor from './components/GlobalAlarmMonitor';
import PWAInstallHint from './components/PWAInstallHint';

type ViewState = 
    'dashboard' | 'diary' | 'health' | 'routines' | 'docs' | 'sensory' | 
    'prof_overview' | 'prof_session' | 'prof_goals' | 'prof_analysis' | 'prof_guidelines' |
    'school_home' | 'school_log' | 'school_history';

const NotificationPopup = ({ message, onClose, visible }: { message: string, onClose: () => void, visible: boolean }) => {
    if (!visible) return null;
    return (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-2xl p-4 flex items-start gap-3 relative overflow-hidden">
                <div className="bg-red-100 p-2 rounded-full shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                </div>
                <div className="flex-1 mr-2">
                    <h4 className="font-bold text-slate-800 text-sm uppercase mb-1">Atenção Necessária</h4>
                    <p className="text-sm text-slate-600 leading-snug">{message}</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-0 left-0 h-1 bg-red-100 w-full">
                    <div className="h-full bg-red-500 w-full animate-[shrink_10s_linear_forwards]" style={{ animationDuration: '10s' }}></div>
                </div>
            </div>
            <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
        </div>
    );
};

const AppContent: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<ViewState>('dashboard');
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });

    // 🆕 Estado para o perfil da criança ativa (necessário para a sala da calma)
    const [activeChildProfile, setActiveChildProfile] = useState<ChildExtendedProfile | null>(null);
    const [showPWAHint, setShowPWAHint] = useState(false);
    const [installPlatform, setInstallPlatform] = useState<'ios' | 'android' | 'windows'>('ios');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            // VERIFICATION CHECK: Only allow access if verified OR if it is a child account (mock domain)
            if (user && (user.emailVerified || user.email?.endsWith('@child.eab.app'))) {
                setCurrentUser(user);
                try {
                    const path = `users/${user.uid}`;
                    const docSnap = await db.collection("users").doc(user.uid).get().catch(err => handleFirestoreError(err, OperationType.GET, path));
                    if (docSnap && docSnap.exists) {
                        const profile = docSnap.data() as UserProfile;
                        setUserProfile(profile);
                        
                        if (profile.profileType === ProfileType.PROFESSIONAL) setCurrentView('prof_overview');
                        else if (profile.profileType === ProfileType.SCHOOL) setCurrentView('school_home');

                        // Busca perfil da criança se for conta de criança
                        if (profile.profileType === ProfileType.CHILD) {
                            const childPath = `users/${user.uid}/child_profile/main`;
                            const childSnap = await db.collection('users').doc(user.uid).collection('child_profile').doc('main').get().catch(err => handleFirestoreError(err, OperationType.GET, childPath));
                            if (childSnap && childSnap.exists) setActiveChildProfile(childSnap.data() as ChildExtendedProfile);
                        } else if (profile.profileType === ProfileType.ADULT && profile.manages?.length) {
                             // Busca perfil da primeira criança gerenciada para carregar regras da sala da calma
                             // Use .get() here to avoid permission errors on initial load if data is fresh
                             try {
                                 const childPath = `users/${profile.manages[0]}/child_profile/main`;
                                 const childSnap = await db.collection('users').doc(profile.manages[0]).collection('child_profile').doc('main').get().catch(err => handleFirestoreError(err, OperationType.GET, childPath));
                                 if (childSnap && childSnap.exists) setActiveChildProfile(childSnap.data() as ChildExtendedProfile);
                             } catch (err) {
                                 console.warn("Could not fetch child profile immediately:", err);
                             }
                        }
                    } else {
                        // User exists in Auth but not in Firestore yet (creation lag or error)
                        // Treat as logged out to avoid crashes, or handle creation flow.
                        // For now, let's allow it but profile is null.
                    }
                } catch (error) { 
                    console.error("Error fetching user profile:", error);
                    // If permission denied here, it's critical. 
                }
            } else {
                // If not verified or not logged in
                setCurrentUser(null);
                setUserProfile(null);
                setSelectedChildId(null);
                setActiveChildProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Only run background listener if we have a valid profile and managed children
        if (!userProfile || userProfile.profileType !== ProfileType.ADULT || !userProfile.manages || userProfile.manages.length === 0) return;
        
        const unsubscribes: (() => void)[] = [];
        
        userProfile.manages.forEach(childId => {
            // Add error handler to onSnapshot to prevent crashing if permission is temporarily denied
            const path = `users/${childId}/behavior_entries`;
            const query = db.collection('users').doc(childId).collection('behavior_entries').orderBy('timestamp', 'desc').limit(1);
            
            const unsub = query.onSnapshot({
                next: async (snapshot) => {
                    if (!snapshot.empty) {
                        const change = snapshot.docChanges()[0];
                        if (change && change.type === 'added') {
                            const data = change.doc.data();
                            const isRecent = (Date.now() - data.timestamp) < 30000; 
                            const isCalmRoomAlert = data.description && typeof data.description === 'string' && data.description.includes('Sala de Calma');
                            if (isRecent && isCalmRoomAlert) {
                                let childName = 'Sua criança';
                                try {
                                    const childProfileDoc = await db.collection('users').doc(childId).collection('child_profile').doc('main').get();
                                    if (childProfileDoc.exists && childProfileDoc.data()?.childName) childName = childProfileDoc.data()?.childName;
                                } catch (e) {}
                                try {
                                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                                    audio.volume = 0.5;
                                    audio.play().catch(e => console.log('Audio autoplay blocked', e));
                                } catch (e) {}
                                setNotification({ visible: true, message: `🔔 ${childName} acabou de entrar na Sala de Calma.` });
                                setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 10000);
                            }
                        }
                    }
                },
                error: (error) => {
                    console.warn(`Background listener error for child ${childId} (likely permission or missing doc):`, error.message);
                    // We don't call handleFirestoreError here to avoid crashing the whole app for a background notification error
                }
            });
            unsubscribes.push(unsub);
        });
        return () => unsubscribes.forEach(u => u());
    }, [userProfile]);

    useEffect(() => {
        if (!loading && userProfile) {
            if (userProfile.profileType === ProfileType.CHILD && currentView === 'health') setCurrentView('dashboard');
            if (userProfile.profileType === ProfileType.PROFESSIONAL && ['dashboard', 'diary', 'health', 'routines'].includes(currentView)) setCurrentView('prof_overview');
            if (userProfile.profileType === ProfileType.SCHOOL && ['dashboard', 'diary', 'health', 'routines'].includes(currentView)) setCurrentView('school_home');
        }
    }, [loading, userProfile, currentView]);

    const handleEnterCalmRoom = async () => {
        setCurrentView('sensory');
        if (userProfile?.profileType === ProfileType.CHILD && userProfile.linkedGuardianId) {
            try {
                const profilePath = `users/${userProfile.uid}/child_profile/main`;
                const profileSnap = await db.collection("users").doc(userProfile.uid).collection("child_profile").doc("main").get().catch(err => {
                    handleFirestoreError(err, OperationType.GET, profilePath);
                    return null;
                });
                const prefs = profileSnap?.data() as ChildExtendedProfile | undefined;
                if (prefs?.notifyGuardianOnCalmRoomEnter) {
                    const behaviorPath = `users/${userProfile.uid}/behavior_entries`;
                    await db.collection("users").doc(userProfile.uid).collection("behavior_entries").add({
                        userId: userProfile.uid, authorId: 'SYSTEM', timestamp: Date.now(), dateString: new Date().toISOString().split('T')[0],
                        type: 'CRISIS', intensity: 'MODERADA', description: '⚠️ ALERTA AUTOMÁTICO: A criança entrou na Sala de Calma (Botão de Pânico acionado).',
                        period: new Date().getHours() < 12 ? 'Manhã' : new Date().getHours() < 18 ? 'Tarde' : 'Noite', duration: 'Início agora'
                    }).catch(err => handleFirestoreError(err, OperationType.WRITE, behaviorPath));
                }
            } catch (err) { console.error("Error processing alert:", err); }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
    if (!currentUser) return <Auth onLoginSuccess={() => {}} onShowPWAHint={(platform) => { setInstallPlatform(platform || 'ios'); setShowPWAHint(true); }} />;

    const renderView = () => {
        if (userProfile?.profileType === ProfileType.PROFESSIONAL) {
            switch (currentView) {
                case 'prof_overview': return <ProfessionalView userProfile={userProfile} activeSubTab="overview" selectedPatientId={selectedChildId} onSelectPatient={setSelectedChildId} setCurrentView={setCurrentView} />;
                case 'prof_session': return <ProfessionalView userProfile={userProfile} activeSubTab="session" selectedPatientId={selectedChildId} onSelectPatient={setSelectedChildId} setCurrentView={setCurrentView} />;
                case 'prof_goals': return <ProfessionalView userProfile={userProfile} activeSubTab="goals" selectedPatientId={selectedChildId} onSelectPatient={setSelectedChildId} setCurrentView={setCurrentView} />;
                case 'prof_analysis': return <ProfessionalView userProfile={userProfile} activeSubTab="analysis" selectedPatientId={selectedChildId} onSelectPatient={setSelectedChildId} setCurrentView={setCurrentView} />;
                case 'prof_guidelines': return <ProfessionalView userProfile={userProfile} activeSubTab="guidelines" selectedPatientId={selectedChildId} onSelectPatient={setSelectedChildId} setCurrentView={setCurrentView} />;
                case 'docs': return <DocsView userProfile={userProfile} preSelectedStudentId={selectedChildId} />; 
                default: return <ProfessionalView userProfile={userProfile} activeSubTab="overview" selectedPatientId={selectedChildId} onSelectPatient={setSelectedChildId} setCurrentView={setCurrentView} />;
            }
        }
        if (userProfile?.profileType === ProfileType.SCHOOL) {
            switch (currentView) {
                case 'school_home': return <SchoolView userProfile={userProfile} activeSubTab="home" selectedStudentId={selectedChildId} onSelectStudent={setSelectedChildId} onChangeView={(v) => setCurrentView(v as any)} />;
                case 'school_log': return <SchoolView userProfile={userProfile} activeSubTab="log" selectedStudentId={selectedChildId} onSelectStudent={setSelectedChildId} onChangeView={(v) => setCurrentView(v as any)} />;
                case 'school_history': return <SchoolView userProfile={userProfile} activeSubTab="history" selectedStudentId={selectedChildId} onSelectStudent={setSelectedChildId} onChangeView={(v) => setCurrentView(v as any)} />;
                case 'docs': return <DocsView userProfile={userProfile} preSelectedStudentId={selectedChildId} />;
                default: return <SchoolView userProfile={userProfile} activeSubTab="home" selectedStudentId={selectedChildId} onSelectStudent={setSelectedChildId} onChangeView={(v) => setCurrentView(v as any)} />;
            }
        }
        switch (currentView) {
            case 'dashboard': return <Dashboard userProfile={userProfile} currentUser={currentUser} onChangeView={(v) => setCurrentView(v as ViewState)} />;
            case 'diary': return <MoodDiary userProfile={userProfile} />;
            case 'health': return <HealthView userProfile={userProfile} />;
            case 'routines': return <RoutinesView userProfile={userProfile} />;
            case 'docs': return <DocsView userProfile={userProfile} />;
            case 'sensory': return <SensoryView onBack={() => setCurrentView('dashboard')} childProfile={activeChildProfile} />;
            default: return <Dashboard userProfile={userProfile} currentUser={currentUser} onChangeView={(v) => setCurrentView(v as ViewState)} />;
        }
    };

    let navItems = [];
    if (userProfile?.profileType === ProfileType.PROFESSIONAL) {
        navItems = [ 
            { id: 'prof_overview', label: 'Início', icon: LayoutDashboard, show: true }, 
            { id: 'prof_session', label: 'Sessão', icon: ClipboardList, show: true, special: true }, 
            { id: 'prof_goals', label: 'Metas', icon: Target, show: true }, 
            { id: 'prof_guidelines', label: 'Diretrizes', icon: BookOpen, show: true },
            { id: 'prof_analysis', label: 'Dados', icon: Activity, show: true }, 
            { id: 'docs', label: 'Docs', icon: FileText, show: true } 
        ];
    } else if (userProfile?.profileType === ProfileType.SCHOOL) {
        navItems = [ { id: 'school_home', label: 'Início', icon: LayoutDashboard, show: true }, { id: 'school_log', label: 'Diário', icon: SchoolIcon, show: true, special: true }, { id: 'school_history', label: 'Histórico', icon: History, show: true }, { id: 'docs', label: 'Docs', icon: FileText, show: true } ];
    } else {
        navItems = [ { id: 'dashboard', label: 'Início', icon: LayoutDashboard, show: true }, { id: 'diary', label: 'Diário', icon: BookHeart, show: true }, { id: 'health', label: 'Saúde', icon: HeartPulse, show: userProfile?.profileType !== ProfileType.CHILD, special: true }, { id: 'routines', label: 'Rotinas', icon: ListTodo, show: true }, { id: 'docs', label: 'Docs', icon: FileText, show: true } ];
    }

    const isHealth = userProfile?.profileType === ProfileType.PROFESSIONAL;
    const isSchool = userProfile?.profileType === ProfileType.SCHOOL;
    let activeColor = isHealth ? 'text-teal-600' : isSchool ? 'text-purple-600' : 'text-blue-600';
    let activeBg = isHealth ? 'bg-teal-600' : isSchool ? 'bg-purple-600' : 'bg-blue-600';
    let activeLightBg = isHealth ? 'bg-teal-50' : isSchool ? 'bg-purple-50' : 'bg-blue-50';

    return (
        <div className="h-[100dvh] bg-slate-50 flex md:flex-row flex-col font-sans overflow-hidden">
            <NotificationPopup visible={notification.visible} message={notification.message} onClose={() => setNotification(prev => ({...prev, visible: false}))} />
            {userProfile && <GlobalAlarmMonitor userProfile={userProfile} />}
            <PWAInstallHint isOpen={showPWAHint} onClose={() => setShowPWAHint(false)} platform={installPlatform} />
            
            <aside className="hidden md:flex w-20 lg:w-64 bg-white border-r border-slate-200 flex-col py-6 z-20 shadow-md transition-all duration-300">
                <div className="mb-8 px-4 flex items-center justify-center lg:justify-start gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-sm border ${isHealth ? 'bg-teal-50 border-teal-100' : isSchool ? 'bg-purple-50 border-purple-100' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>{isHealth ? '🩺' : isSchool ? '🎓' : '🤖'}</div><span className="text-xl font-black text-slate-800 tracking-tight hidden lg:block">EAB</span></div>
                <div className="flex-1 w-full space-y-2 px-3">
                    {navItems.filter(item => item.show).map(item => (<button key={item.id} onClick={() => setCurrentView(item.id as ViewState)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${currentView === item.id ? `${activeLightBg} ${activeColor} shadow-sm font-bold` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'}`} title={item.label}><item.icon className={`w-6 h-6 flex-shrink-0 ${currentView === item.id ? 'stroke-2' : 'stroke-[1.5]'}`} /><span className="hidden lg:block text-sm">{item.label}</span>{currentView === item.id && (<div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full hidden lg:block ${activeBg}`}></div>)}</button>))}
                </div>
                <div className="mt-auto px-3 border-t border-slate-100 pt-4"><div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50"><div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{userProfile?.displayName?.charAt(0) || 'U'}</div><div className="hidden lg:block overflow-hidden"><p className="text-xs font-bold text-slate-700 truncate">{userProfile?.displayName}</p><p className="text-[10px] text-slate-400 capitalize">{userProfile?.profileType === 'CHILD' ? 'Criança' : userProfile?.profileType === 'Health' ? 'Profissional' : userProfile?.profileType === 'School' ? 'Escola' : 'Responsável'}</p></div></div></div>
            </aside>
            
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50">
                <div className="flex-1 overflow-y-auto scroll-smooth pb-32 md:pb-4"><div className="max-w-5xl mx-auto w-full md:p-6">{renderView()}</div></div>
                {userProfile?.profileType === ProfileType.CHILD && currentView !== 'sensory' && (<button onClick={handleEnterCalmRoom} className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 bg-gradient-to-tr from-green-400 to-teal-500 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center animate-bounce-slow ring-4 ring-white/30 group" title="Preciso de Calma"><Wind className="w-8 h-8 group-hover:rotate-12 transition-transform" /><span className="sr-only">Preciso de Calma</span></button>)}
            </main>
            
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg px-6 py-3 z-[100] pb-safe"><div className="flex justify-between items-end">{navItems.filter(item => item.show).map((item) => (item.special ? (<div key={item.id} className="relative -top-6"><button onClick={() => setCurrentView(item.id as ViewState)} className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg border-4 border-slate-50 transition-transform hover:scale-105 active:scale-95 ${currentView === item.id ? `${activeBg} text-white` : 'bg-white text-slate-400'}`}><item.icon className="w-7 h-7" /></button><span className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] font-medium ${currentView === item.id ? activeColor : 'text-slate-400'}`}>{item.label}</span></div>) : (<button key={item.id} onClick={() => setCurrentView(item.id as ViewState)} className={`flex flex-col items-center gap-1 transition-colors min-w-[3.5rem] ${currentView === item.id ? activeColor : 'text-slate-400 hover:text-slate-600'}`}><div className={`p-1 rounded-full transition-colors ${currentView === item.id ? activeLightBg : ''}`}><item.icon className={`w-6 h-6 ${currentView === item.id ? 'stroke-2' : ''}`} /></div><span className={`text-[10px] font-medium ${currentView === item.id ? 'font-bold' : ''}`}>{item.label}</span></button>)))}</div></nav>
            
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};

export default App;
