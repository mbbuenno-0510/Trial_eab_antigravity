
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, StoredDocument, ProfileType, ChildExtendedProfile, HealthAccessRule, SchoolAccessRule } from '../types';
import { db, storage } from '../services/firebase';
import { FileText, Trash2, Eye, UploadCloud, User, Loader2, Save, Plus, ShieldCheck, GraduationCap, X, Edit2, Ban, AlertTriangle, FolderOpen, ArrowLeft, Users, ChevronDown, BellRing, Baby, Wind, Music, BookOpen, Gamepad2, Settings2, Sparkles, Palette, Dog, PenTool, BrainCircuit, MessageCircle, BookOpenCheck, Network, RefreshCw, Stethoscope, Briefcase } from 'lucide-react';
import { Card, Button, Input, TextArea, Modal } from './ui';
import UploadModal from './UploadModal';
import DocumentViewModal from './DocumentViewModal';

interface DocsViewProps {
    userProfile: UserProfile | null;
    preSelectedStudentId?: string | null;
}

// Subcomponente para Gerenciar Permissões de Saúde - COM TRAVA DE REGISTRO HISTÓRICO
const HealthAccessList = ({ allowed, onChange, disabled, childId }: { allowed: HealthAccessRule[], onChange: (list: HealthAccessRule[]) => void, disabled?: boolean, childId?: string | null }) => {
    const [newCouncil, setNewCouncil] = useState('CRM');
    const [newCode, setNewCode] = useState('');
    const [isRemoving, setIsRemoving] = useState<number | null>(null);

    const addRule = () => {
        if (newCode) {
            const cleanCode = newCode.trim();
            const exists = allowed.some(rule => rule.council === newCouncil && rule.code === cleanCode);
            if (exists) {
                alert("Este profissional já está na lista de autorizados.");
                return;
            }
            onChange([...allowed, { council: newCouncil, code: cleanCode }]);
            setNewCode('');
        }
    };

    const removeRule = async (index: number) => {
        const rule = allowed[index];
        
        if (childId) {
            setIsRemoving(index);
            try {
                // 1. Encontrar o UID do profissional baseado no Conselho/Código para verificar logs vinculados pelo ID
                const usersRef = db.collection('users');
                const proQuery = await usersRef
                    .where('professionalCouncil', '==', rule.council)
                    .where('professionalCode', '==', rule.code)
                    .limit(1)
                    .get();

                if (!proQuery.empty) {
                    const proUid = proQuery.docs[0].id;

                    // 2. Verificar Sessões (session_logs)
                    const sessionsSnap = await db.collection('users').doc(childId).collection('session_logs')
                        .where('professionalId', '==', proUid)
                        .limit(1)
                        .get();

                    if (!sessionsSnap.empty) {
                        alert(`Não é possível remover este profissional (${rule.council} ${rule.code}) pois existem sessões registradas por ele.`);
                        setIsRemoving(null);
                        return;
                    }

                    // 3. Verificar Metas (therapeutic_goals)
                    const goalsSnap = await db.collection('users').doc(childId).collection('therapeutic_goals')
                        .where('professionalId', '==', proUid)
                        .limit(1)
                        .get();

                    if (!goalsSnap.empty) {
                        alert(`Não é possível remover este profissional pois existem metas terapêuticas criadas por ele.`);
                        setIsRemoving(null);
                        return;
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar registros de saúde:", error);
                alert("Erro ao verificar registros. Tente novamente.");
                setIsRemoving(null);
                return;
            }
        }

        onChange(allowed.filter((_, i) => i !== index));
        setIsRemoving(null);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {allowed.map((rule, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-teal-50 p-3 rounded-lg text-sm border border-teal-200">
                        <div className="flex items-center gap-2">
                            <div className="bg-teal-100 p-1 rounded">
                                <ShieldCheck className="w-4 h-4 text-teal-600"/>
                            </div>
                            <span className="font-bold text-teal-800">{rule.council}</span>
                            <span className="font-mono text-teal-700">{rule.code}</span>
                        </div>
                        {!disabled && (
                            <button 
                                onClick={() => removeRule(idx)} 
                                disabled={isRemoving === idx}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors disabled:opacity-50" 
                                title="Remover acesso"
                            >
                                {isRemoving === idx ? <Loader2 className="w-4 h-4 animate-spin"/> : <X className="w-4 h-4"/>}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {!disabled && (
                <div className="mt-3">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 block">Adicionar Profissional</label>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all overflow-hidden">
                        <div className="relative h-full bg-slate-50 border-r border-slate-200 flex-shrink-0">
                            <select 
                                value={newCouncil} 
                                onChange={e => setNewCouncil(e.target.value)} 
                                className="appearance-none pl-3 pr-8 py-3 bg-transparent text-slate-700 text-sm font-bold focus:outline-none cursor-pointer h-full"
                            >
                                {['CRM', 'CRP', 'CREFITO', 'CRF', 'COREN', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <ChevronDown className="w-3 h-3" />
                            </div>
                        </div>
                        <input 
                            type="text" 
                            value={newCode} 
                            onChange={e => setNewCode(e.target.value)} 
                            placeholder="Nº Registro" 
                            className="flex-1 px-3 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none min-w-0"
                            onKeyDown={(e) => e.key === 'Enter' && addRule()}
                        />
                        <button 
                            onClick={addRule} 
                            disabled={!newCode.trim()}
                            className="bg-teal-600 text-white p-2 m-1 rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0" 
                            title="Adicionar"
                        >
                            <Plus className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Subcomponente para Gerenciar Permissões de Escola
const SchoolAccessList = ({ allowed, onChange, disabled, childId }: { allowed: SchoolAccessRule[], onChange: (list: SchoolAccessRule[]) => void, disabled?: boolean, childId?: string | null }) => {
    const [newCnpj, setNewCnpj] = useState('');
    const [newName, setNewName] = useState('');
    const [isRemoving, setIsRemoving] = useState<number | null>(null);

    const addRule = () => {
        if (newCnpj) {
            const cleanCnpj = newCnpj.replace(/[^\d]+/g, '');
            const exists = allowed.some(rule => rule.cnpj === cleanCnpj);
            if (exists) {
                alert("Esta escola (CNPJ) já está na lista de autorizados.");
                return;
            }
            onChange([...allowed, { cnpj: cleanCnpj, name: newName }]);
            setNewCnpj('');
            setNewName('');
        }
    };

    const removeRule = async (index: number) => {
        const rule = allowed[index];
        
        if (childId && rule.cnpj) {
            setIsRemoving(index);
            try {
                // 1. Encontrar UID da escola pelo CNPJ
                const schoolsRef = db.collection('users');
                const schoolSnapshot = await schoolsRef.where('cnpj', '==', rule.cnpj).limit(1).get();
                
                if (!schoolSnapshot.empty) {
                    const schoolUid = schoolSnapshot.docs[0].id;
                    
                    // 2. Verificar logs comportamentais
                    const logsRef = db.collection('users').doc(childId).collection('school_logs');
                    const logsSnapshot = await logsRef.where('schoolId', '==', schoolUid).limit(1).get();
                    
                    if (!logsSnapshot.empty) {
                        alert("Não é possível remover esta escola pois existem registros escolares vinculados a este CNPJ.");
                        setIsRemoving(null);
                        return;
                    }

                    // 3. Verificar logs de medicação
                    const medLogsRef = db.collection('users').doc(childId).collection('school_medication_logs');
                    const medLogsSnapshot = await medLogsRef.where('schoolId', '==', schoolUid).limit(1).get();

                    if (!medLogsSnapshot.empty) {
                        alert("Não é possível remover esta escola pois existem registros de medicação vinculados.");
                        setIsRemoving(null);
                        return;
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar registros da escola:", error);
                alert("Erro ao verificar registros escolares.");
                setIsRemoving(null);
                return;
            }
        }

        onChange(allowed.filter((_, i) => i !== index));
        setIsRemoving(null);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {allowed.map((rule, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-purple-50 p-3 rounded-lg text-sm border border-purple-200">
                        <div className="flex flex-col">
                            <span className="font-bold text-purple-800">{rule.name || 'Escola Sem Nome'}</span>
                            <span className="font-mono text-purple-600 text-xs">CNPJ: {rule.cnpj}</span>
                        </div>
                        {!disabled && (
                            <button 
                                onClick={() => removeRule(idx)} 
                                disabled={isRemoving === idx}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors disabled:opacity-50" 
                                title="Remover acesso"
                            >
                                {isRemoving === idx ? <Loader2 className="w-4 h-4 animate-spin"/> : <X className="w-4 h-4"/>}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {!disabled && (
                <div className="mt-3">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 block">Adicionar Escola</label>
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all overflow-hidden p-1">
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)} 
                            placeholder="Nome da Escola (Opcional)" 
                            className="w-full px-3 py-2 text-sm border-b border-slate-100 mb-1 focus:outline-none placeholder-slate-400 text-slate-700"
                        />
                        <div className="flex items-center">
                            <input 
                                type="text" 
                                value={newCnpj} 
                                onChange={e => setNewCnpj(e.target.value)} 
                                placeholder="CNPJ (apenas números)" 
                                className="flex-1 px-3 py-2 text-sm focus:outline-none placeholder-slate-400 text-slate-700 min-w-0"
                                onKeyDown={(e) => e.key === 'Enter' && addRule()}
                            />
                            <button 
                                onClick={addRule} 
                                disabled={!newCnpj.trim()}
                                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed m-1 flex-shrink-0" 
                                title="Adicionar"
                            >
                                <Plus className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DocsDynamicTabIcon = ({ tab }: { tab: 'docs' | 'profile' | 'team' }) => {
    const iconMap = {
        'docs': { icon: <FolderOpen className="w-6 h-6" />, gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/50' },
        'profile': { icon: <User className="w-6 h-6" />, gradient: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/50' },
        'team': { icon: <Network className="w-6 h-6" />, gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/50' }
    };
    const { icon, gradient, shadow } = iconMap[tab];
    return (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-300 bg-gradient-to-br ${gradient} shadow-xl ${shadow}`}>
            {icon}
        </div>
    );
};

const DocsView: React.FC<DocsViewProps> = ({ userProfile, preSelectedStudentId }) => {
    const [activeTab, setActiveTab] = useState<'docs' | 'profile' | 'team'>('docs');
    const [documents, setDocuments] = useState<StoredDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<StoredDocument | null>(null);
    const [isDeleting, setIsDeleting] = useState(false); 
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);
    const [docToEdit, setDocToEdit] = useState<StoredDocument | null>(null);
    const [filterFolder, setFilterFolder] = useState<'all' | 'personal' | 'medical'>('all');
    const [childProfile, setChildProfile] = useState<Partial<ChildExtendedProfile>>({});
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const isChild = userProfile?.profileType === ProfileType.CHILD;
    const isParent = userProfile?.profileType === ProfileType.ADULT;
    const isSchool = userProfile?.profileType === ProfileType.SCHOOL;
    const isHealth = userProfile?.profileType === ProfileType.PROFESSIONAL;
    const isIndependentAdult = userProfile?.profileType === null || (isParent && (!userProfile.manages || userProfile.manages.length === 0));

    // Regra: Qualquer perfil que NÃO seja criança pode deletar documentos (Adulto, Escola, Profissional)
    const canDelete = userProfile?.profileType !== ProfileType.CHILD;

    const targetUid = useMemo(() => {
        if (preSelectedStudentId) return preSelectedStudentId;
        if (isSchool || isHealth) return null;
        if (isChild) return userProfile.uid;
        if (isParent && userProfile.manages && userProfile.manages.length > 0) return userProfile.manages[0];
        return userProfile?.uid;
    }, [userProfile, preSelectedStudentId, isSchool, isHealth, isChild, isParent]);
    
    const showProfileTab = !!targetUid;
    
    // DEFINIÇÃO DE PERMISSÕES
    // Responsável (Pai/Mãe)
    const isGuardian = (isParent && targetUid !== userProfile?.uid) || isIndependentAdult;
    // Permissão para ENTRAR no modo de edição (Pai ou Profissional)
    const canEnterEditMode = isGuardian || isHealth;
    
    const canUpload = !isChild; // Criança não pode fazer upload

    const calculateAge = (birthDateString: string | undefined): string => {
        if (!birthDateString) return "";
        const today = new Date();
        const birthDate = new Date(birthDateString + 'T00:00:00');
        if (isNaN(birthDate.getTime())) return "";
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 0) return "Data futura";
        if (age === 0) {
            let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
            if (today.getDate() < birthDate.getDate()) months--;
            if (months <= 0) return "Recém-nascido";
            return months === 1 ? "1 mês" : `${months} meses`;
        }
        return age === 1 ? "1 ano" : `${age} anos`;
    };

    useEffect(() => {
        if (!targetUid) { setDocuments([]); setLoading(false); return; }
        const unsubDocs = db.collection('users').doc(targetUid).collection('documents').orderBy('uploadedAt', 'desc').onSnapshot(snap => {
            setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as StoredDocument)));
            setLoading(false);
        });
        return () => unsubDocs();
    }, [targetUid]);

    const filteredDocuments = useMemo(() => {
        let baseDocs = documents;
        
        if (isSchool) {
            baseDocs = documents.filter(doc => doc.uploaderId === userProfile?.uid);
        } else if (isHealth) {
            baseDocs = documents.filter(doc => {
                const isMyUpload = doc.uploaderId === userProfile?.uid;
                const isMedicalShared = (doc.category === 'Médicos' || doc.category === 'Medical') && doc.sharedWithHealth;
                return isMyUpload || isMedicalShared;
            });
        } else if (isChild) {
            // Criança só vê documentos pessoais
            baseDocs = documents.filter(doc => doc.category === 'Documentos Pessoais');
        }

        if (filterFolder === 'personal') {
            return baseDocs.filter(doc => doc.category === 'Documentos Pessoais');
        }
        if (filterFolder === 'medical') {
            return baseDocs.filter(doc => doc.category === 'Médicos' || doc.category === 'Medical');
        }
        
        return baseDocs;
    }, [documents, isSchool, isHealth, isChild, userProfile?.uid, childProfile.shareMedicalDocsWithHealth, filterFolder]);

    const fetchProfileData = async () => {
        if (!targetUid) return;
        const docRef = db.collection('users').doc(targetUid).collection('child_profile').doc('main');
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            const data = docSnap.data() as ChildExtendedProfile;
            // Garantir que novas configurações existam
            if (!data.sensoryConfig) {
                data.sensoryConfig = { 
                    allowBreath: true, allowSound: true, allowFidget: true, allowStories: true, allowPiano: true, allowGenius: true,
                    allowColors: true, allowAnimals: true, allowDrawing: true, allowMeditation: true,
                    allowCommunication: true, allowSocialStories: true, allowLiteracy: true, allowStoryCubes: true
                };
            } else {
                // Merge com defaults para novos campos
                data.sensoryConfig = {
                    allowBreath: data.sensoryConfig.allowBreath ?? true,
                    allowSound: data.sensoryConfig.allowSound ?? true,
                    allowFidget: data.sensoryConfig.allowFidget ?? true,
                    allowStories: data.sensoryConfig.allowStories ?? true,
                    allowPiano: data.sensoryConfig.allowPiano ?? true,
                    allowGenius: data.sensoryConfig.allowGenius ?? true,
                    allowColors: data.sensoryConfig.allowColors ?? true,
                    allowAnimals: data.sensoryConfig.allowAnimals ?? true,
                    allowDrawing: data.sensoryConfig.allowDrawing ?? true,
                    allowMeditation: data.sensoryConfig.allowMeditation ?? true,
                    allowCommunication: data.sensoryConfig.allowCommunication ?? true,
                    allowSocialStories: data.sensoryConfig.allowSocialStories ?? true,
                    allowLiteracy: data.sensoryConfig.allowLiteracy ?? true,
                    allowStoryCubes: data.sensoryConfig.allowStoryCubes ?? true
                };
            }
            setChildProfile(data);
            setIsEditing(false); 
        } else {
            setChildProfile({ 
                sensoryConfig: { 
                    allowBreath: true, allowSound: true, allowFidget: true, allowStories: true, allowPiano: true, allowGenius: true,
                    allowColors: true, allowAnimals: true, allowDrawing: true, allowMeditation: true,
                    allowCommunication: true, allowSocialStories: true, allowLiteracy: true, allowStoryCubes: true
                } 
            });
            if (canEnterEditMode) setIsEditing(true);
        }
    };

    useEffect(() => { if (activeTab === 'profile' || activeTab === 'team') fetchProfileData(); }, [targetUid, activeTab]);

    const handleSaveProfile = async () => {
        if (!targetUid) return;
        setIsSavingProfile(true);
        try {
            await db.collection('users').doc(targetUid).collection('child_profile').doc('main').set(childProfile, { merge: true });
            setIsEditing(false);
        } catch (error) { console.error("Erro save profile:", error); } finally { setIsSavingProfile(false); }
    };

    const toggleSensoryTool = (tool: keyof NonNullable<ChildExtendedProfile['sensoryConfig']>) => {
        if (!childProfile.sensoryConfig) return;
        setChildProfile({ ...childProfile, sensoryConfig: { ...childProfile.sensoryConfig, [tool]: !childProfile.sensoryConfig[tool] } });
    };

    // Função de Exclusão de Documento
    const handleDeleteDocument = async () => {
        if (!targetUid || !docToDelete) return;
        setIsDeleting(true);
        try {
            // Tenta deletar do Storage se tiver path
            if (docToDelete.storagePath) {
                await storage.ref(docToDelete.storagePath).delete().catch(err => console.warn("Storage delete error (pode já ter sido deletado):", err));
            }
            // Deleta do Firestore
            await db.collection('users').doc(targetUid).collection('documents').doc(docToDelete.id).delete();
            
            setIsDeleteModalOpen(false);
            setDocToDelete(null);
        } catch (error) {
            console.error("Error deleting doc:", error);
            setErrorMessage("Erro ao excluir documento. Tente novamente.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>;
    
    // Controle de formulário desabilitado:
    // Habilitado APENAS se tiver permissão de edição (Pai ou Profissional) E estiver no modo de edição
    const isFormDisabled = !canEnterEditMode || !isEditing;

    return (
        <div className="p-4 max-w-4xl mx-auto pb-24 font-sans animate-in fade-in">
            {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
                    <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /><span className="text-sm font-medium">{errorMessage}</span></div>
                    <button onClick={() => setErrorMessage(null)}><X className="w-4 h-4"/></button>
                </div>
            )}

            <div className="flex justify-center gap-4 p-2 bg-white rounded-3xl w-full shadow-lg border border-slate-100 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('docs')} className={`flex flex-col items-center justify-center transition-all duration-200 group min-w-[70px] ${activeTab === 'docs' ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}><DocsDynamicTabIcon tab="docs" /><span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === 'docs' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>Documentos</span></button>
                {showProfileTab && (<button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center transition-all duration-200 group min-w-[70px] ${activeTab === 'profile' ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}><DocsDynamicTabIcon tab="profile" /><span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>{isIndependentAdult ? 'Meu Perfil' : isSchool ? 'Perfil do Aluno' : 'Perfil da Criança'}</span></button>)}
                
                {/* ABA DE EQUIPE MULTIDISCIPLINAR (APENAS PARA PROFISSIONAIS) */}
                {isHealth && showProfileTab && (
                    <button onClick={() => setActiveTab('team')} className={`flex flex-col items-center justify-center transition-all duration-200 group min-w-[70px] ${activeTab === 'team' ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}><DocsDynamicTabIcon tab="team" /><span className={`text-xs mt-1 font-medium whitespace-nowrap ${activeTab === 'team' ? 'text-teal-600 font-bold' : 'text-slate-500'}`}>Equipe Multi</span></button>
                )}
            </div>

            {activeTab === 'docs' && (
                <div className="space-y-6">
                    {targetUid ? (
                        <>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <h2 className="text-xl font-bold text-slate-800">{isSchool ? 'Documentos Escolares' : 'Seus Documentos'}</h2>
                                <div className="flex gap-2">
                                    {canUpload && (<Button onClick={() => { setDocToEdit(null); setUploadModalOpen(true); }}><UploadCloud className="w-4 h-4 mr-2" /> Novo Upload</Button>)}
                                </div>
                            </div>

                            {/* SELETOR DE PASTAS */}
                            {!isSchool && !isChild && (
                                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                    <button 
                                        onClick={() => setFilterFolder('all')}
                                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${filterFolder === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        Todos
                                    </button>
                                    <button 
                                        onClick={() => setFilterFolder('personal')}
                                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border flex items-center gap-2 ${filterFolder === 'personal' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        <Briefcase className="w-3 h-3" /> Pessoais
                                    </button>
                                    <button 
                                        onClick={() => setFilterFolder('medical')}
                                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border flex items-center gap-2 ${filterFolder === 'medical' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        <Stethoscope className="w-3 h-3" /> Médicos
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredDocuments.length === 0 ? (
                                    <div className="col-span-1 md:col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum documento disponível.</p></div>
                                ) : (
                                    filteredDocuments.map(doc => (
                                        <Card key={doc.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow border-slate-200 cursor-pointer relative" onClick={() => { setSelectedDoc(doc); setViewModalOpen(true); }}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2.5 rounded-lg shrink-0 ${doc.mimeType.includes('pdf') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}><FileText className="w-5 h-5" /></div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-800 truncate text-sm">{doc.title}</h3>
                                                    <p className="text-xs text-slate-500">{doc.category} • {new Date(typeof doc.uploadedAt === 'number' ? doc.uploadedAt : (doc.uploadedAt as any).seconds * 1000).toLocaleDateString()}</p>
                                                    
                                                    {(doc.documentDate || doc.expiryDate) && (
                                                        <div className="flex gap-2 mt-1">
                                                            {doc.documentDate && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Doc: {new Date(doc.documentDate + 'T00:00:00').toLocaleDateString()}</span>}
                                                            {doc.expiryDate && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${new Date(doc.expiryDate) < new Date() ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>Exp: {new Date(doc.expiryDate + 'T00:00:00').toLocaleDateString()}</span>}
                                                        </div>
                                                    )}

                                                    {/* INDICADOR DE COMPARTILHAMENTO (APENAS DOCS MÉDICOS PARA PAIS) */}
                                                    {isGuardian && (doc.category === 'Médicos' || doc.category === 'Medical') && (
                                                        <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <div className="relative">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="sr-only peer" 
                                                                        checked={doc.sharedWithHealth || false} 
                                                                        onChange={async (e) => {
                                                                            const val = e.target.checked;
                                                                            if (targetUid) {
                                                                                await db.collection('users').doc(targetUid).collection('documents').doc(doc.id).update({ sharedWithHealth: val });
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600"></div>
                                                                </div>
                                                                <span className={`text-[10px] font-bold uppercase transition-colors ${doc.sharedWithHealth ? 'text-teal-600' : 'text-slate-400'}`}>
                                                                    {doc.sharedWithHealth ? 'Compartilhado' : 'Privado'}
                                                                </span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0 z-10">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                                {canUpload && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setDocToEdit(doc); setUploadModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); setIsDeleteModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (<div className="text-center py-12 text-slate-400"><Users className="w-12 h-12 mx-auto mb-2 opacity-50"/><p>Selecione um paciente para visualizar os documentos.</p></div>)}
                </div>
            )}

            {/* ABA EQUIPE MULTIDISCIPLINAR (PROFISSIONAL) */}
            {activeTab === 'team' && isHealth && showProfileTab && (
                <div className="animate-in fade-in space-y-6">
                    <Card title="Compartilhamento Multidisciplinar">
                        <div className="space-y-6">
                            <p className="text-sm text-slate-600 bg-teal-50 p-4 rounded-xl border border-teal-100 leading-relaxed flex items-start gap-3">
                                <Network className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                                <span>
                                    <strong>Área Restrita aos Profissionais:</strong> Aqui você define com quais outros especialistas 
                                    você deseja compartilhar informações sobre este paciente. Esta lista é privada e gerenciada por você, 
                                    independente das permissões gerais dadas pelos pais.
                                </span>
                            </p>

                            <div className="p-5 rounded-2xl border-2 bg-white border-teal-100 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
                                    Minha Rede de Colaboração
                                </h3>
                                
                                <HealthAccessList 
                                    // Pega a lista específica do usuário logado (UID) dentro do mapa de compartilhamento
                                    allowed={childProfile.interProfessionalSharing?.[userProfile?.uid || ''] || []} 
                                    onChange={async (list) => {
                                        if (!userProfile?.uid || !targetUid) return;
                                        
                                        // Atualiza o estado local para UX imediata
                                        const updatedSharingMap = { 
                                            ...(childProfile.interProfessionalSharing || {}),
                                            [userProfile.uid]: list 
                                        };
                                        const newProfile = {...childProfile, interProfessionalSharing: updatedSharingMap};
                                        setChildProfile(newProfile);
                                        
                                        // Salva no Firestore
                                        try {
                                            await db.collection('users').doc(targetUid).collection('child_profile').doc('main').set({ 
                                                interProfessionalSharing: updatedSharingMap 
                                            }, { merge: true });
                                        } catch (err) {
                                            console.error("Erro ao atualizar equipe:", err);
                                            alert("Erro ao salvar alterações da equipe.");
                                        }
                                    }}
                                    disabled={false}
                                    childId={targetUid}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'profile' && showProfileTab && (
                <div className="space-y-6">
                    {canEnterEditMode && (<div className="flex justify-end mb-2">{!isEditing ? (<button onClick={() => setIsEditing(true)} className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline"><Edit2 className="w-4 h-4"/> Editar Perfil</button>) : (<div className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-2"><Edit2 className="w-3 h-3"/> Modo Edição</div>)}</div>)}

                    <Card title="Informações Pessoais">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Nome Completo" value={childProfile.childName || ''} onChange={e => setChildProfile({...childProfile, childName: e.target.value})} disabled={isFormDisabled || isHealth} />
                                <div className="relative">
                                    <Input label="Data de Nascimento" type="date" value={childProfile.birthDate || ''} onChange={e => setChildProfile({...childProfile, birthDate: e.target.value})} disabled={isFormDisabled || isHealth} />
                                    {childProfile.birthDate && (<div className="absolute right-2 top-8 flex items-center gap-1 px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-200 shadow-sm animate-in fade-in zoom-in duration-300"><Baby className="w-3 h-3" />{calculateAge(childProfile.birthDate)}</div>)}
                                </div>
                            </div>
                            
                            <div className="pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 ml-1">Nível de Suporte TEA</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: '1', label: 'Nível 1', desc: 'Suporte Leve', color: 'bg-green-100 text-green-700 border-green-200' },
                                        { id: '2', label: 'Nível 2', desc: 'Suporte Moderado', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                        { id: '3', label: 'Nível 3', desc: 'Suporte Substancial', color: 'bg-red-100 text-red-700 border-red-200' }
                                    ].map(lvl => (
                                        <button 
                                            key={lvl.id}
                                            disabled={isFormDisabled || isHealth}
                                            onClick={() => setChildProfile({...childProfile, teaLevel: lvl.id as any})}
                                            className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${childProfile.teaLevel === lvl.id ? lvl.color : 'bg-white border-slate-100 text-slate-400 grayscale'}`}
                                        >
                                            <span className="font-black text-xs uppercase">{lvl.label}</span>
                                            <span className="text-[10px] opacity-80">{lvl.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* CURADORIA DA SALA DA CALMA - APENAS PAIS */}
                    {isGuardian && (
                        <Card title="Curadoria da Sala da Calma">
                            <div className="space-y-6">
                                <p className="text-xs text-slate-500 italic flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <Settings2 className="w-4 h-4 text-blue-500" /> Selecione quais ferramentas estarão disponíveis para a criança de acordo com sua faixa etária e perfil sensorial.
                                </p>

                                <div className="space-y-4">
                                    <div className="border-b border-slate-100 pb-2">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Para os Pequenos (0-6 anos)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { id: 'allowColors', label: 'Luzes Coloridas', icon: <Palette className="w-4 h-4" />, color: 'text-pink-500' },
                                            { id: 'allowAnimals', label: 'Sons de Animais', icon: <Dog className="w-4 h-4" />, color: 'text-amber-600' },
                                            { id: 'allowSound', label: 'Sons Relaxantes', icon: <Music className="w-4 h-4" />, color: 'text-purple-600' },
                                            { id: 'allowFidget', label: 'Estourar Bolhas', icon: <Gamepad2 className="w-4 h-4" />, color: 'text-red-600' }
                                        ].map(tool => (
                                            <button
                                                key={tool.id}
                                                disabled={isFormDisabled}
                                                onClick={() => toggleSensoryTool(tool.id as any)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                                            >
                                                <div className={`${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? tool.color : 'text-slate-400'}`}>{tool.icon}</div>
                                                <span className={`text-xs font-bold ${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? 'text-slate-800' : 'text-slate-400'}`}>{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="border-b border-slate-100 pb-2 mt-6">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Idade Escolar e Desenvolvimento (6-12 anos)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { id: 'allowBreath', label: 'Respiração', icon: <Wind className="w-4 h-4" />, color: 'text-blue-600' },
                                            { id: 'allowDrawing', label: 'Desenho Zen', icon: <PenTool className="w-4 h-4" />, color: 'text-emerald-600' },
                                            { id: 'allowPiano', label: 'Piano Calmo', icon: <Music className="w-4 h-4" />, color: 'text-orange-600' },
                                            { id: 'allowGenius', label: 'Jogo Genius', icon: <Gamepad2 className="w-4 h-4" />, color: 'text-indigo-600' }
                                        ].map(tool => (
                                            <button
                                                key={tool.id}
                                                disabled={isFormDisabled}
                                                onClick={() => toggleSensoryTool(tool.id as any)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                                            >
                                                <div className={`${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? tool.color : 'text-slate-400'}`}>{tool.icon}</div>
                                                <span className={`text-xs font-bold ${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? 'text-slate-800' : 'text-slate-400'}`}>{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="border-b border-slate-100 pb-2 mt-6">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Cognição e Maturidade (10+ anos)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { id: 'allowStories', label: 'Livros de Histórias', icon: <BookOpen className="w-4 h-4" />, color: 'text-yellow-600' },
                                            { id: 'allowMeditation', label: 'Meditação Guiada', icon: <BrainCircuit className="w-4 h-4" />, color: 'text-cyan-600' }
                                        ].map(tool => (
                                            <button
                                                key={tool.id}
                                                disabled={isFormDisabled}
                                                onClick={() => toggleSensoryTool(tool.id as any)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                                            >
                                                <div className={`${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? tool.color : 'text-slate-400'}`}>{tool.icon}</div>
                                                <span className={`text-xs font-bold ${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? 'text-slate-800' : 'text-slate-400'}`}>{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="border-b border-slate-100 pb-2 mt-6">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Comunicação e Desenvolvimento</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { id: 'allowCommunication', label: 'Painel AAC', icon: <MessageCircle className="w-4 h-4" />, color: 'text-teal-600' },
                                            { id: 'allowSocialStories', label: 'Histórias Sociais', icon: <BookOpenCheck className="w-4 h-4" />, color: 'text-lime-600' },
                                            { id: 'allowLiteracy', label: 'Leitura Mágica', icon: <Sparkles className="w-4 h-4" />, color: 'text-violet-600' },
                                            { id: 'allowStoryCubes', label: 'Dados de Histórias', icon: <RefreshCw className="w-4 h-4" />, color: 'text-purple-500' }
                                        ].map(tool => (
                                            <button
                                                key={tool.id}
                                                disabled={isFormDisabled}
                                                onClick={() => toggleSensoryTool(tool.id as any)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                                            >
                                                <div className={`${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? tool.color : 'text-slate-400'}`}>{tool.icon}</div>
                                                <span className={`text-xs font-bold ${childProfile.sensoryConfig?.[tool.id as keyof NonNullable<ChildExtendedProfile['sensoryConfig']>] ? 'text-slate-800' : 'text-slate-400'}`}>{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card title="Preferências">
                        <div className="space-y-4">
                            <TextArea label="Preferências Sensoriais" value={childProfile.sensoryPreferences || ''} onChange={e => setChildProfile({...childProfile, sensoryPreferences: e.target.value})} placeholder="O que a criança gosta sensorialmente..." disabled={isFormDisabled || isHealth} />
                            <TextArea label="Itens de Desconforto" value={childProfile.discomfortItems || ''} onChange={e => setChildProfile({...childProfile, discomfortItems: e.target.value})} placeholder="Barulhos, texturas..." disabled={isFormDisabled || isHealth} />
                            
                            <TextArea 
                                label="Favoritos / Hiperfocos" 
                                value={childProfile.favorites || ''} 
                                onChange={e => setChildProfile({...childProfile, favorites: e.target.value})} 
                                placeholder="Gosta de falar de futebol, Minecraft, dinossauros..." 
                                disabled={isFormDisabled || isHealth} 
                            />
                            
                            <TextArea 
                                label="Comunicação" 
                                value={childProfile.communicationMethods || ''} 
                                onChange={e => setChildProfile({...childProfile, communicationMethods: e.target.value})} 
                                placeholder="Verbal, gestos, uso de tablets, etc..." 
                                disabled={isFormDisabled || isHealth} 
                            />

                            {/* SEGURANÇA E ALERTAS: APENAS SE FOR EDITOR (PAI/RESPONSÁVEL) */}
                            {isGuardian && (
                                <div className={`mt-4 pt-4 border-t border-slate-100 ${isFormDisabled ? 'opacity-70' : ''}`}>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><BellRing className="w-4 h-4 text-indigo-500" /> Segurança e Alertas</h4>
                                    <div className="space-y-3">
                                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                            <label className="flex items-center gap-3 cursor-pointer"><div className="relative"><input type="checkbox" className="sr-only peer" checked={childProfile.notifyGuardianOnCalmRoomEnter || false} onChange={e => setChildProfile({...childProfile, notifyGuardianOnCalmRoomEnter: e.target.checked})} disabled={isFormDisabled}/><div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></div><span className={`text-sm font-bold ${childProfile.notifyGuardianOnCalmRoomEnter ? 'text-indigo-900' : 'text-slate-600'}`}>Notificar Responsável ao entrar na Sala da Calma</span></label>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                            <label className="flex items-center gap-3 cursor-pointer"><div className="relative"><input type="checkbox" className="sr-only peer" checked={childProfile.showSchoolHistoryToGuardian || false} onChange={e => setChildProfile({...childProfile, showSchoolHistoryToGuardian: e.target.checked})} disabled={isFormDisabled}/><div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div></div><span className={`text-sm font-bold ${childProfile.showSchoolHistoryToGuardian ? 'text-purple-900' : 'text-slate-600'}`}>Ver Histórico Escolar no Diário</span></label>
                                            <p className="text-[10px] text-purple-600 mt-2 ml-14 leading-tight">Habilita uma nova aba no Diário para ver os registros feitos pela escola.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* COMPARTILHAMENTO E ACESSO - PAIS E PROFISSIONAIS (PARA ADD COLEGAS) */}
                    {canEnterEditMode && !isHealth && (
                        <Card title="Compartilhamento e Acesso">
                            <div className="space-y-6">
                                {/* Profissionais de Saúde */}
                                <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${childProfile.isVisibleToHealth ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className="relative flex items-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300 transition-all"
                                                    checked={childProfile.isVisibleToHealth || false}
                                                    onChange={e => setChildProfile({...childProfile, isVisibleToHealth: e.target.checked})}
                                                    disabled={isFormDisabled} // Profissionais não podem desativar o acesso global
                                                />
                                            </div>
                                            <span className={`font-bold text-sm ${childProfile.isVisibleToHealth ? 'text-teal-800' : 'text-slate-600'}`}>
                                                Permitir acesso de Profissionais de Saúde
                                            </span>
                                        </label>
                                        <ShieldCheck className={`w-5 h-5 ${childProfile.isVisibleToHealth ? 'text-teal-600' : 'text-slate-300'}`} />
                                    </div>

                                    {childProfile.isVisibleToHealth && (
                                        <div className="animate-in fade-in slide-in-from-top-2 pl-1">
                                            <HealthAccessList 
                                                allowed={childProfile.allowedHealthProfessionals || []} 
                                                onChange={list => setChildProfile({...childProfile, allowedHealthProfessionals: list})}
                                                disabled={isFormDisabled}
                                                childId={targetUid}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Escola - Apenas Pais veem e editam */}
                                {isGuardian && (
                                    <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${childProfile.isVisibleToSchool ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 transition-all"
                                                        checked={childProfile.isVisibleToSchool || false}
                                                        onChange={e => setChildProfile({...childProfile, isVisibleToSchool: e.target.checked})}
                                                        disabled={isFormDisabled}
                                                    />
                                                </div>
                                                <span className={`font-bold text-sm ${childProfile.isVisibleToSchool ? 'text-purple-800' : 'text-slate-600'}`}>
                                                    Permitir acesso da Escola
                                                </span>
                                            </label>
                                            <GraduationCap className={`w-5 h-5 ${childProfile.isVisibleToSchool ? 'text-purple-600' : 'text-slate-300'}`} />
                                        </div>

                                        {childProfile.isVisibleToSchool && (
                                            <div className="animate-in fade-in slide-in-from-top-2 pl-1">
                                                <SchoolAccessList 
                                                    allowed={childProfile.allowedSchools || []} 
                                                    onChange={list => setChildProfile({...childProfile, allowedSchools: list})}
                                                    disabled={isFormDisabled}
                                                    childId={targetUid || undefined}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {canEnterEditMode && (
                        <div className="sticky bottom-4 z-20">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={fetchProfileData} disabled={isSavingProfile} className="flex-1 shadow-lg border-2 border-slate-200 bg-white"><Ban className="w-4 h-4 mr-2" /> Cancelar</Button>
                                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex-[2] bg-blue-600 hover:bg-blue-700 shadow-xl font-bold text-lg">{isSavingProfile ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5 mr-2" /> Salvar Alterações</>}</Button>
                                </div>
                            ) : (
                                <Button onClick={() => setIsEditing(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-xl py-4 font-bold text-lg"><Edit2 className="w-5 h-5 mr-2" /> Editar Perfil</Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <UploadModal 
                isOpen={isUploadModalOpen} 
                onClose={() => { setUploadModalOpen(false); setDocToEdit(null); }} 
                initialData={docToEdit}
                onUpload={async (title, category, file, sharedWithHealth, documentDate, expiryDate, isEditing) => {
                if (!targetUid) return;
                
                // Helper to convert to Base64
                const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });

                try {
                    const timestamp = Date.now();
                    let downloadUrl = isEditing ? (docToEdit?.downloadUrl || '') : '';
                    let storagePath = isEditing ? (docToEdit?.storagePath || '') : '';
                    let dataUrl = isEditing ? (docToEdit?.dataUrl || '') : '';

                    // Only process new file if provided
                    if (file) {
                        // Strategy: Use Base64 for small files (< 700KB) to ensure it works without Storage
                        // Use Storage for larger files.
                        if (file.size < 700 * 1024) {
                             dataUrl = await toBase64(file);
                             downloadUrl = '';
                             storagePath = '';
                        } else {
                             // Fallback to Storage
                             storagePath = `documents/${targetUid}/${timestamp}_${file.name}`;
                             const snapshot = await storage.ref(storagePath).put(file);
                             downloadUrl = await snapshot.ref.getDownloadURL();
                             dataUrl = '';
                        }

                        // Deleta arquivo antigo se houver novo e for edição
                        if (isEditing && docToEdit?.storagePath && docToEdit.storagePath !== storagePath) {
                            await storage.ref(docToEdit.storagePath).delete().catch(e => console.warn("Old file delete failed:", e));
                        }
                    }

                    const docData = {
                        userId: targetUid,
                        title,
                        category,
                        sharedWithHealth: !!sharedWithHealth,
                        documentDate: documentDate || null,
                        expiryDate: expiryDate || null,
                        ...(file ? {
                            mimeType: file.type,
                            filename: file.name,
                            downloadUrl: downloadUrl || null,
                            dataUrl: dataUrl || null,
                            storagePath: storagePath || null
                        } : {})
                    };

                    if (isEditing && docToEdit) {
                        await db.collection('users').doc(targetUid).collection('documents').doc(docToEdit.id).update(docData);
                    } else {
                        await db.collection('users').doc(targetUid).collection('documents').add({
                            ...docData,
                            mimeType: file?.type || '',
                            filename: file?.name || '',
                            uploadedAt: Date.now(),
                            uploaderId: userProfile?.uid
                        });
                    }
                    
                    setDocToEdit(null);
                } catch (error: any) {
                    console.error("Upload/Update failed", error);
                    alert(`Erro ao salvar documento: ${error.message}`);
                    throw error; 
                }
            }} />
            <DocumentViewModal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} document={selectedDoc} />
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Documento">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Tem certeza que deseja excluir o documento <strong>{docToDelete?.title}</strong>?</p>
                    <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded border border-red-100">Atenção: Esta ação é irreversível e o arquivo será removido do sistema.</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDeleteDocument} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Sim, Excluir"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DocsView;
