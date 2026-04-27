
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, SchoolLog, ChildExtendedProfile, Medication, StoredDocument, SchoolMedicationLog } from '../types';
import { db, auth } from '../services/firebase';
import { 
    GraduationCap, Users, BookOpen, AlertOctagon, Lightbulb, 
    Save, Calendar, LogOut, ChevronDown, Loader2, ExternalLink, Hash, Search, ArrowRight, Plus, Trash2, Edit2, Pill, FileText, CheckCircle, Clock, Activity, AlertTriangle
} from 'lucide-react';
import { Card, Button, Input, TextArea, Modal, Select } from './ui';
import DocumentViewModal from './DocumentViewModal'; // Import para visualizar receitas

interface SchoolViewProps {
    userProfile: UserProfile;
    activeSubTab: 'home' | 'log' | 'history';
    selectedStudentId?: string | null; // 🆕 Prop de controle
    onSelectStudent?: (id: string | null) => void; // 🆕 Callback atualizado para aceitar null
    onChangeView?: (view: string) => void; // 🆕 Para navegar para Docs
}

interface StudentOption {
    uid: string;
    displayName: string;
}

interface ParentContact {
    name: string;
    phone: string;
}

// Helper para data local YYYY-MM-DD
const getLocalTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SchoolView: React.FC<SchoolViewProps> = ({ userProfile, activeSubTab, selectedStudentId, onSelectStudent, onChangeView }) => {
    const [studentName, setStudentName] = useState<string>('Carregando...');
    const [recentLogs, setRecentLogs] = useState<SchoolLog[]>([]);
    
    // --- ESTADOS DE HISTÓRICO DE MEDICAÇÃO ---
    const [medicationLogs, setMedicationLogs] = useState<SchoolMedicationLog[]>([]);
    const [historyViewType, setHistoryViewType] = useState<'behavior' | 'medication'>('behavior');

    // Student Selection State (Use prop if available, otherwise local - but logic now prioritizes prop)
    const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
    
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isIndexMissing, setIsIndexMissing] = useState(false);
    const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);
    
    // RA Search State
    const [raSearchInput, setRaSearchInput] = useState('');
    const [isSearchingRa, setIsSearchingRa] = useState(false);

    // Registry Data State
    const [studentRegistry, setStudentRegistry] = useState<any>({});
    const [isRaModalOpen, setIsRaModalOpen] = useState(false);
    
    // Form States for Registry
    const [raInput, setRaInput] = useState('');
    const [yearInput, setYearInput] = useState('');
    const [periodInput, setPeriodInput] = useState('Manhã');
    const [birthDateInput, setBirthDateInput] = useState('');
    const [contacts, setContacts] = useState<ParentContact[]>([{ name: '', phone: '' }]);
    
    const [isSavingRa, setIsSavingRa] = useState(false);

    // Form State for Log
    const [logDate, setLogDate] = useState(getLocalTodayString());
    const [socialInteraction, setSocialInteraction] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
    const [participation, setParticipation] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
    const [dysregulationCount, setDysregulationCount] = useState<number>(0);
    const [dysregulationDetails, setDysregulationDetails] = useState('');
    const [successfulStrategies, setSuccessfulStrategies] = useState('');
    const [generalNotes, setGeneralNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // --- STATES PARA EDIÇÃO E EXCLUSÃO ---
    const [editingLog, setEditingLog] = useState<SchoolLog | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Estados do Formulário de Edição
    const [editSocial, setEditSocial] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
    const [editParticipation, setEditParticipation] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
    const [editDysregulationCount, setEditDysregulationCount] = useState(0);
    const [editDysregulationDetails, setEditDysregulationDetails] = useState('');
    const [editStrategies, setEditStrategies] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Estado para Exclusão
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [logToDelete, setLogToDelete] = useState<SchoolLog | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- STATES PARA MEDICAMENTOS ESCOLARES ---
    const [schoolMedications, setSchoolMedications] = useState<Medication[]>([]);
    const [adminTime, setAdminTime] = useState<Record<string, string>>({}); // ID do Med -> Hora
    const [adminDate, setAdminDate] = useState<Record<string, string>>({}); // ID do Med -> Data
    const [isAdministering, setIsAdministering] = useState<Record<string, boolean>>({});
    
    // --- NOVO: ESTADOS PARA MODAL DE CONFIRMAÇÃO DE ADMINISTRAÇÃO ---
    const [isConfirmAdministerModalOpen, setIsConfirmAdministerModalOpen] = useState(false);
    const [administerData, setAdministerData] = useState<{ med: Medication, date: string, time: string } | null>(null);

    // Estados para Visualização de Documento (Receita)
    const [isDocumentViewModalOpen, setDocumentViewModalOpen] = useState(false);
    const [documentToView, setDocumentToView] = useState<StoredDocument | null>(null);

    // FUNÇÃO DE LOGOUT (Limpa Buffer)
    const handleLogout = () => {
        if (onSelectStudent) onSelectStudent(null);
        auth.signOut();
    };

    // --- BUSCA DE ALUNOS AUTORIZADOS ---
    useEffect(() => {
        const fetchAuthorizedStudents = async () => {
            if (!userProfile.cnpj) return;
            
            setIsLoadingStudents(true);
            setFetchError(null);
            setIsIndexMissing(false);
            setIndexCreationUrl(null);

            try {
                const snapshot = await db.collectionGroup('child_profile')
                    .where('isVisibleToSchool', '==', true)
                    .get();

                const myCNPJ = userProfile.cnpj.replace(/[^\d]+/g, '');
                const foundStudents: StudentOption[] = [];

                const promises = snapshot.docs.map(async (doc) => {
                    const data = doc.data() as ChildExtendedProfile;
                    const allowedSchools = data.allowedSchools || [];
                    
                    const isAllowed = allowedSchools.some((rule: any) => {
                        const ruleCNPJ = rule.cnpj?.replace(/[^\d]+/g, '');
                        return ruleCNPJ === myCNPJ;
                    });

                    if (isAllowed) {
                        const childNameFromProfile = data.childName;
                        const userRef = doc.ref.parent.parent;
                        if (userRef) {
                            if (childNameFromProfile) {
                                foundStudents.push({
                                    uid: userRef.id,
                                    displayName: childNameFromProfile
                                });
                            } else {
                                try {
                                    const userSnap = await userRef.get();
                                    if (userSnap.exists) {
                                        foundStudents.push({
                                            uid: userSnap.id,
                                            displayName: userSnap.data()?.displayName || 'Aluno(a)'
                                        });
                                    }
                                } catch (e) {
                                    console.warn("Não foi possível ler dados do usuário pai, usando ID.", e);
                                    foundStudents.push({
                                        uid: userRef.id,
                                        displayName: 'Aluno (Nome Indisponível)'
                                    });
                                }
                            }
                        }
                    }
                });

                await Promise.all(promises);
                
                setAvailableStudents(foundStudents);
                
                // NOTA: Auto-seleção removida para forçar a escolha manual pelo usuário.

            } catch (error: any) {
                if (error.message && error.message.includes('index')) {
                    console.warn("Índice do Firestore ausente.");
                    setIsIndexMissing(true);
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const match = error.message.match(urlRegex);
                    if (match && match[0]) {
                        setIndexCreationUrl(match[0]);
                    }
                } else {
                    console.error("Erro ao buscar alunos:", error);
                    if (error.code === 'permission-denied') {
                        setFetchError("Permissão negada. Verifique as regras.");
                    } else {
                        setFetchError("Erro na busca automática.");
                    }
                }
            } finally {
                setIsLoadingStudents(false);
            }
        };

        fetchAuthorizedStudents();
    }, [userProfile.cnpj]);

    // --- BUSCA POR RA ---
    const handleSearchByRA = async () => {
        if (!userProfile.uid || !raSearchInput.trim()) return;
        setIsSearchingRa(true);
        try {
            // Busca nos registros internos da escola
            const snapshot = await db.collection('users').doc(userProfile.uid)
                .collection('students_registry')
                .where('ra', '==', raSearchInput.trim())
                .get();
            
            if (!snapshot.empty) {
                const studentId = snapshot.docs[0].id;
                // Verifica se o aluno encontrado está na lista de autorizados (permissão Docs > Perfil)
                const student = availableStudents.find(s => s.uid === studentId);
                
                if (student) {
                    if (onSelectStudent) onSelectStudent(studentId);
                    setRaSearchInput('');
                } else {
                    alert("Aluno encontrado no registro interno, mas a escola não tem permissão de visualização ativa (Verifique Docs > Perfil da Criança).");
                }
            } else {
                alert("Nenhum aluno encontrado com este RA.");
            }
        } catch (error) {
            console.error("Erro busca RA:", error);
            alert("Erro ao buscar por RA.");
        } finally {
            setIsSearchingRa(false);
        }
    };

    // --- FETCH REGISTRY DATA (RA + DETAILS) ---
    useEffect(() => {
        if (!userProfile.uid || !selectedStudentId) {
            setStudentRegistry({});
            return;
        }
        // Busca dados no sub-collection da ESCOLA (students_registry)
        const unsub = db.collection('users').doc(userProfile.uid)
            .collection('students_registry').doc(selectedStudentId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    setStudentRegistry(doc.data() || {});
                } else {
                    setStudentRegistry({});
                }
            });
        return () => unsub();
    }, [userProfile.uid, selectedStudentId]);

    // Identificar a Criança Alvo
    // ALTERAÇÃO: Depende EXCLUSIVAMENTE da seleção manual.
    const targetUid = useMemo(() => {
        return selectedStudentId || null;
    }, [selectedStudentId]);

    // --- BUSCAR MEDICAMENTOS PARA ESCOLA ---
    useEffect(() => {
        if (!targetUid) {
            setSchoolMedications([]);
            return;
        }

        const unsubMeds = db.collection('users').doc(targetUid).collection('medications')
            .where('administeredAtSchool', '==', true)
            .onSnapshot(snap => {
                const meds = snap.docs.map(d => ({ id: d.id, ...d.data() } as Medication));
                setSchoolMedications(meds);
                
                // Inicializa o horário padrão como "agora" para cada med
                const now = new Date();
                const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const dateString = getLocalTodayString();

                const timeState: Record<string, string> = {};
                const dateState: Record<string, string> = {};

                meds.forEach(m => {
                    timeState[m.id!] = timeString;
                    dateState[m.id!] = dateString;
                });
                
                setAdminTime(prev => ({ ...timeState, ...prev })); // Merge para não sobrescrever edições
                setAdminDate(prev => ({ ...dateState, ...prev })); // Merge
            });

        return () => unsubMeds();
    }, [targetUid]);

    // --- SOLICITAR ADMINISTRAÇÃO (ABRE MODAL) ---
    const requestAdministerMedication = (med: Medication) => {
        if (!targetUid || !med.id) return;
        
        const time = adminTime[med.id] || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const date = adminDate[med.id] || getLocalTodayString();

        setAdministerData({ med, date, time });
        setIsConfirmAdministerModalOpen(true);
    };

    // --- CONFIRMAR E REGISTRAR ADMINISTRAÇÃO ---
    const confirmAdministerMedication = async () => {
        if (!targetUid || !administerData) return;
        const { med, date, time } = administerData;

        // Fecha modal
        setIsConfirmAdministerModalOpen(false);
        setIsAdministering(prev => ({ ...prev, [med.id!]: true }));

        try {
            // VERIFICAÇÃO DE DUPLICIDADE (Otimizada)
            const logsCollection = db.collection('users').doc(targetUid).collection('school_medication_logs');
            
            // Busca apenas por ID e Data para evitar erro de índice composto complexo com Time
            const duplicateQuery = await logsCollection
                .where('medicationId', '==', med.id)
                .where('date', '==', date)
                .get();

            // Filtra o horário em memória
            const isDuplicate = duplicateQuery.docs.some(doc => doc.data().time === time);

            if (isDuplicate) {
                alert(`ERRO: Já existe um registro para ${med.name} nesta data (${date}) e horário (${time}).`);
                return;
            }

            // SE NÃO HOUVER DUPLICIDADE, GRAVA
            const logEntry: Omit<SchoolMedicationLog, 'id'> = {
                userId: targetUid,
                schoolId: userProfile.uid,
                medicationId: med.id,
                medicationName: med.name,
                dosage: `${med.dosageValue} ${med.dosageUnit}`,
                date: date,
                time: time,
                administeredAt: new Date().toISOString(),
                timestamp: Date.now(),
                notes: 'Administrado na escola'
            };

            await logsCollection.add(logEntry);
            alert(`Administração de ${med.name} registrada com sucesso!`);

        } catch (error: any) {
            console.error("Erro ao registrar medicação:", error);
            alert(`Erro ao registrar administração: ${error.message}`);
        } finally {
            setIsAdministering(prev => ({ ...prev, [med.id!]: false }));
            setAdministerData(null);
        }
    };

    // --- VIEW ATTACHMENT (RECEITA) ---
    const handleViewMedAttachment = (med: Medication) => {
        if (med.downloadUrl || (med.attachmentBase64 && med.attachmentFilename)) {
            const docToView: StoredDocument = {
                id: med.id!, 
                userId: med.userId,
                title: `${med.name} - Receita/Anexo`,
                category: 'Receita Médica',
                mimeType: med.attachmentMimeType || 'application/octet-stream',
                filename: med.attachmentFilename || 'arquivo',
                dataUrl: med.attachmentBase64 || undefined,
                downloadUrl: med.downloadUrl || undefined,
                storagePath: med.storagePath || undefined,
                uploadedAt: Date.now(),
            };
            setDocumentToView(docToView);
            setDocumentViewModalOpen(true);
        } else {
            alert("Nenhum anexo disponível para este medicamento.");
        }
    };


    useEffect(() => {
        if (!targetUid) {
            setStudentName("Nenhum aluno selecionado");
            setRecentLogs([]);
            setMedicationLogs([]);
            return;
        }

        const selected = availableStudents.find(s => s.uid === targetUid);
        if (selected) {
            setStudentName(selected.displayName);
        } else {
            db.collection("users").doc(targetUid).collection("child_profile").doc("main").get().then(doc => {
                if (doc.exists && doc.data()?.childName) {
                    setStudentName(doc.data()?.childName);
                } else {
                    db.collection("users").doc(targetUid).get().then(uDoc => {
                        if (uDoc.exists) setStudentName(uDoc.data()?.displayName || 'Aluno');
                    }).catch(() => setStudentName('Aluno'));
                }
            }).catch(() => setStudentName('Aluno'));
        }

        // Fetch School Logs (Comportamental)
        const unsubLogs = db.collection('users').doc(targetUid).collection('school_logs')
            .orderBy('date', 'desc')
            .limit(10)
            .onSnapshot(snap => {
                setRecentLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolLog)));
            }, (error) => {
                console.error("Erro ao ler logs comportamentais:", error);
            });

        // Fetch Medication Logs (Medicação)
        const unsubMedLogs = db.collection('users').doc(targetUid).collection('school_medication_logs')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .onSnapshot(snap => {
                setMedicationLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolMedicationLog)));
            }, (error) => {
                console.error("Erro ao ler logs de medicação:", error);
            });

        return () => {
            unsubLogs();
            unsubMedLogs();
        };
    }, [targetUid, availableStudents]);

    const handleSaveLog = async () => {
        if (!targetUid) return;

        setIsSaving(true);
        try {
            const newLog: Omit<SchoolLog, 'id'> = {
                userId: targetUid,
                schoolId: userProfile.uid,
                date: logDate,
                timestamp: Date.now(),
                socialInteraction,
                participation,
                dysregulationCount,
                dysregulationDetails,
                successfulStrategies,
                generalNotes
            };

            await db.collection('users').doc(targetUid).collection('school_logs').add(newLog);

            alert("Registro escolar salvo com sucesso!");
            setDysregulationCount(0);
            setDysregulationDetails('');
            setSuccessfulStrategies('');
            setGeneralNotes('');
            
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar registro.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- LOG EDIT HANDLERS ---
    const handleEditClick = (e: React.MouseEvent, log: SchoolLog) => {
        e.stopPropagation();
        setEditingLog(log);
        setEditSocial(log.socialInteraction);
        setEditParticipation(log.participation);
        setEditDysregulationCount(log.dysregulationCount);
        setEditDysregulationDetails(log.dysregulationDetails || '');
        setEditStrategies(log.successfulStrategies || '');
        setEditNotes(log.generalNotes || '');
        setIsEditModalOpen(true);
    };

    const handleUpdateLog = async () => {
        if (!targetUid || !editingLog) return;
        setIsUpdating(true);
        try {
            await db.collection('users').doc(targetUid).collection('school_logs').doc(editingLog.id).update({
                socialInteraction: editSocial,
                participation: editParticipation,
                dysregulationCount: editDysregulationCount,
                dysregulationDetails: editDysregulationDetails,
                successfulStrategies: editStrategies,
                generalNotes: editNotes,
            });
            setIsEditModalOpen(false);
            setEditingLog(null);
        } catch (error) {
            console.error("Erro ao atualizar:", error);
            alert("Erro ao atualizar registro.");
        } finally {
            setIsUpdating(false);
        }
    };

    // --- LOG DELETE HANDLERS ---
    const openDeleteModal = (e: React.MouseEvent, log: SchoolLog) => {
        e.stopPropagation();
        setLogToDelete(log);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteLog = async () => {
        if (!targetUid || !logToDelete) return;
        setIsDeleting(true);
        try {
            await db.collection('users').doc(targetUid).collection('school_logs').doc(logToDelete.id).delete();
            setIsDeleteModalOpen(false);
            setLogToDelete(null);
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir registro.");
        } finally {
            setIsDeleting(false);
        }
    };

    // --- SALVAR CADASTRO (RA + DETALHES) ---
    const handleSaveRegistry = async () => {
        if (!userProfile.uid || !selectedStudentId) return;
        setIsSavingRa(true);
        try {
            // Filtra contatos vazios
            const validContacts = contacts.filter(c => c.name.trim() !== '' || c.phone.trim() !== '');
            
            // Compatibilidade com campo antigo (string)
            const legacyContactString = validContacts.length > 0 
                ? `${validContacts[0].name}: ${validContacts[0].phone}` 
                : '';

            await db.collection('users').doc(userProfile.uid)
                .collection('students_registry').doc(selectedStudentId)
                .set({ 
                    ra: raInput,
                    year: yearInput,
                    period: periodInput,
                    birthDate: birthDateInput,
                    contact: legacyContactString, // Mantém compatibilidade
                    contacts: validContacts, // Novo formato array
                    updatedAt: Date.now(),
                    studentName: studentName
                }, { merge: true });
            
            setIsRaModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar cadastro:", error);
            alert("Erro ao salvar cadastro.");
        } finally {
            setIsSavingRa(false);
        }
    };

    const openRegistryModal = () => {
        setRaInput(studentRegistry.ra || '');
        setYearInput(studentRegistry.year || '');
        setPeriodInput(studentRegistry.period || 'Manhã');
        setBirthDateInput(studentRegistry.birthDate || '');
        
        // Inicializa contatos (novo array ou migração de string antiga)
        if (studentRegistry.contacts && Array.isArray(studentRegistry.contacts) && studentRegistry.contacts.length > 0) {
            setContacts(studentRegistry.contacts);
        } else if (studentRegistry.contact) {
            setContacts([{ name: 'Responsável', phone: studentRegistry.contact }]);
        } else {
            setContacts([{ name: '', phone: '' }]);
        }
        
        setIsRaModalOpen(true);
    };

    // Handlers para contatos dinâmicos
    const updateContact = (index: number, field: keyof ParentContact, value: string) => {
        const newContacts = [...contacts];
        newContacts[index][field] = value;
        setContacts(newContacts);
    };

    const addContact = () => {
        setContacts([...contacts, { name: '', phone: '' }]);
    };

    const removeContact = (index: number) => {
        const newContacts = contacts.filter((_, i) => i !== index);
        setContacts(newContacts.length > 0 ? newContacts : [{ name: '', phone: '' }]);
    };

    const renderLogItem = (log: SchoolLog) => {
        const isToday = log.date === getLocalTodayString();
        
        return (
            <div key={log.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                        {log.dysregulationCount > 0 && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                {log.dysregulationCount} Ocorrência(s)
                            </span>
                        )}
                        {/* Ações de Edição/Exclusão para registros de HOJE */}
                        {isToday && (
                            <div className="flex gap-1 ml-2">
                                <button 
                                    onClick={(e) => handleEditClick(e, log)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={(e) => openDeleteModal(e, log)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                    <div>🤝 Social: <strong>{log.socialInteraction}</strong></div>
                    <div>📚 Participação: <strong>{log.participation}</strong></div>
                </div>

                {log.dysregulationCount > 0 && log.dysregulationDetails && (
                    <div className="bg-red-50 p-2 rounded text-xs text-red-800 mt-1 mb-1 border border-red-100">
                        <strong>⚠️ Ocorrência:</strong> {log.dysregulationDetails}
                    </div>
                )}

                {log.successfulStrategies && (
                    <div className="bg-green-50 p-2 rounded text-xs text-green-800 mt-1 border border-green-100">
                        <strong>💡 Estratégia:</strong> {log.successfulStrategies}
                    </div>
                )}

                {log.generalNotes && (
                    <div className="bg-slate-50 p-2 rounded text-xs text-slate-700 mt-1 border border-slate-200">
                        <strong>📝 Observações:</strong> {log.generalNotes}
                    </div>
                )}
            </div>
        );
    };

    // Componente de Log de Medicação
    const renderMedicationLogItem = (log: SchoolMedicationLog) => (
        <div key={log.id} className="p-3 bg-white border border-pink-100 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-400"></div>
            <div className="pl-3">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-pink-50 text-pink-700 px-2 py-1 rounded">
                            {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3"/> {log.time}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <Pill className="w-4 h-4 text-pink-500"/>
                    <span className="font-bold text-slate-800">{log.medicationName}</span>
                </div>
                <p className="text-xs text-slate-600">
                    Dosagem: <span className="font-semibold">{log.dosage}</span>
                </p>
                {log.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">Obs: {log.notes}</p>
                )}
            </div>
        </div>
    );

    if (!targetUid && !isLoadingStudents && !fetchError && availableStudents.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 h-full flex flex-col items-center justify-center">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <GraduationCap className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <h2 className="text-xl font-bold text-slate-700">Bem-vindo, Escola!</h2>
                    
                    {isIndexMissing && (
                        <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 max-w-sm flex flex-col items-center">
                            <p className="font-bold flex items-center gap-2 justify-center"><AlertOctagon className="w-4 h-4"/> Configuração Pendente</p>
                            <p className="mt-1">A listagem automática está indisponível (Índice Firestore).</p>
                            
                            {indexCreationUrl && (
                                <a 
                                    href={indexCreationUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="mt-3 flex items-center gap-1 bg-amber-200 hover:bg-amber-300 text-amber-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                >
                                    Criar Índice Agora <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    )}
                    
                    <p className="mt-4">Nenhum aluno vinculado.</p>
                    <p className="text-sm mt-6 text-slate-400 max-w-md">
                        Peça aos pais para irem em <strong>Docs &gt; Perfil da Criança</strong> e adicionarem o CNPJ ({userProfile.cnpj}).
                    </p>
                </div>
                <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="mt-8 text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                    <LogOut className="w-4 h-4" /> Sair da conta
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto pb-24 font-sans animate-in fade-in">
            
            {/* Header / Student Card */}
            {selectedStudentId && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5 mb-6 shadow-sm relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex gap-4 items-start">
                            <div className="bg-purple-600 p-3 rounded-2xl shadow-lg shrink-0">
                                <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-0.5">Aluno(a)</p>
                                <h2 className="text-xl font-black text-slate-800 leading-tight mb-2">{studentName}</h2>
                                
                                {studentRegistry.year && (
                                    <span className="text-xs font-bold text-purple-700 bg-purple-200 px-2 py-1 rounded-md inline-block mb-3">
                                        {studentRegistry.year} • {studentRegistry.period}
                                    </span>
                                )}

                                {/* Informações Complementares */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-700">
                                    {studentRegistry.ra && (
                                        <p><span className="font-bold text-purple-900/60">RA:</span> {studentRegistry.ra}</p>
                                    )}
                                    {studentRegistry.birthDate && (
                                        <p><span className="font-bold text-purple-900/60">Nasc:</span> {new Date(studentRegistry.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                    )}
                                    
                                    {/* Exibição de Contatos */}
                                    {(studentRegistry.contacts && studentRegistry.contacts.length > 0) ? (
                                        <div className="sm:col-span-2 mt-1">
                                            <span className="font-bold text-purple-900/60 block mb-0.5">Contatos:</span>
                                            {studentRegistry.contacts.map((c: ParentContact, idx: number) => (
                                                <div key={idx} className="ml-1 flex gap-1">
                                                    <span className="font-semibold">{c.name}:</span>
                                                    <span>{c.phone}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : studentRegistry.contact && (
                                        <p className="sm:col-span-2 mt-1"><span className="font-bold text-purple-900/60">Contato:</span> {studentRegistry.contact}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleLogout}
                            className="text-purple-400 hover:text-purple-600 transition-colors p-2"
                            title="Sair"
                        >
                            <LogOut className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}

            {/* --- DASHBOARD / HOME --- */}
            {activeSubTab === 'home' && (
                <div className="space-y-6">
                    
                    {/* CAIXA DE SELEÇÃO DE ALUNOS (DROPDOWN + BUSCA RA + COMPLEMENTAR) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600"/> Selecionar Aluno
                        </label>
                        
                        {fetchError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700 mb-3">
                                <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                                <span>{fetchError}</span>
                            </div>
                        )}

                        {isIndexMissing && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex flex-col gap-2 text-xs text-amber-700 mb-3">
                                <div className="flex items-center gap-2">
                                    <AlertOctagon className="w-3 h-3 flex-shrink-0" />
                                    <span>Busca automática indisponível.</span>
                                </div>
                                {indexCreationUrl && (
                                    <a href={indexCreationUrl} target="_blank" rel="noopener noreferrer" className="self-start flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded text-amber-800 font-bold">
                                        Criar Índice <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Select Automático */}
                        <div className="relative mb-2">
                            <select
                                value={selectedStudentId || ''}
                                onChange={(e) => onSelectStudent && onSelectStudent(e.target.value)}
                                disabled={isLoadingStudents}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-purple-500 font-bold disabled:opacity-50"
                            >
                                <option value="">Selecione um aluno...</option>
                                {isLoadingStudents && <option>Carregando alunos...</option>}
                                {availableStudents.map(student => (
                                    <option key={student.uid} value={student.uid}>
                                        {student.displayName}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                                {isLoadingStudents ? <Loader2 className="w-4 h-4 animate-spin"/> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>

                        {/* Busca por RA */}
                        <div className="flex gap-2 items-center mt-2 mb-2">
                            <div className="flex-1 relative">
                                <Input 
                                    placeholder="Ou busque por RA..." 
                                    value={raSearchInput} 
                                    onChange={e => setRaSearchInput(e.target.value)}
                                    className="text-sm py-2"
                                />
                            </div>
                            <Button 
                                onClick={handleSearchByRA} 
                                disabled={isSearchingRa || !raSearchInput.trim()}
                                className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none w-auto py-2"
                                title="Buscar"
                            >
                                {isSearchingRa ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />}
                            </Button>
                        </div>

                        {/* Link para Perfil Completo & Complementar Cadastro */}
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                            {/* Link para Docs/Perfil (Só aparece se aluno selecionado) */}
                            {selectedStudentId && onChangeView && (
                                <button 
                                    onClick={() => onChangeView('docs')}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                                >
                                    Mostre todas as informações Cadastradas aqui <ArrowRight className="w-3 h-3"/>
                                </button>
                            )}

                            <Button 
                                onClick={openRegistryModal} 
                                className="bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 text-xs py-1.5 px-3 h-auto ml-auto"
                                disabled={!selectedStudentId}
                            >
                                <Hash className="w-3 h-3 mr-1"/> Complementar Cadastro
                            </Button>
                        </div>
                    </div>

                    {/* --- MEDICAMENTOS PARA ADMINISTRAÇÃO ESCOLAR (NOVO) --- */}
                    {selectedStudentId && schoolMedications.length > 0 && (
                        <Card title="Medicações a Administrar">
                            <div className="space-y-4">
                                {schoolMedications.map(med => (
                                    <div key={med.id} className="p-4 rounded-xl border border-pink-100 bg-pink-50/50 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-pink-100 p-2 rounded-full text-pink-600">
                                                    <Pill className="w-5 h-5"/>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{med.name}</h4>
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        {med.dosageValue} {med.dosageUnit} • {med.frequencyType === 'daily' ? 'Diário' : 'Dias Específicos'}
                                                        {med.administrationTimes && med.administrationTimes.length > 0 && ` • ${med.administrationTimes.join(', ')}`}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Botão de Anexo/Receita */}
                                            {(med.downloadUrl || (med.attachmentBase64 && med.attachmentFilename)) && (
                                                <button 
                                                    onClick={() => handleViewMedAttachment(med)}
                                                    className="flex items-center gap-1 text-[10px] font-bold bg-white border border-slate-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    <FileText className="w-3 h-3"/> Ver Receita
                                                </button>
                                            )}
                                        </div>

                                        {med.instructions && (
                                            <div className="bg-white/60 p-3 rounded-xl border border-pink-100/50 text-xs text-pink-900/80 italic flex gap-2 shadow-inner">
                                                <AlertTriangle className="w-4 h-4 text-pink-400 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="font-bold text-[10px] uppercase text-pink-600 mb-0.5">Instruções dos Pais:</p>
                                                    {med.instructions}
                                                </div>
                                            </div>
                                        )}

                                        {/* Área de Registro: Data e Hora lado a lado, Botão abaixo */}
                                        <div className="flex flex-col gap-2 border-t border-pink-100 pt-3">
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                                    <Calendar className="w-3 h-3 text-slate-400"/>
                                                    <input 
                                                        type="date" 
                                                        value={adminDate[med.id!] || ''}
                                                        onChange={(e) => setAdminDate({...adminDate, [med.id!]: e.target.value})}
                                                        className="text-sm font-medium text-slate-700 outline-none w-full bg-transparent"
                                                    />
                                                </div>
                                                <div className="w-24 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                                    <Clock className="w-3 h-3 text-slate-400"/>
                                                    <input 
                                                        type="time" 
                                                        value={adminTime[med.id!] || ''}
                                                        onChange={(e) => setAdminTime({...adminTime, [med.id!]: e.target.value})}
                                                        className="text-sm font-medium text-slate-700 outline-none w-full bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Botão abre modal de confirmação em vez de alert/confirm nativo */}
                                            <Button 
                                                onClick={() => requestAdministerMedication(med)}
                                                disabled={isAdministering[med.id!]}
                                                className="w-full bg-pink-600 hover:bg-pink-700 text-white text-xs py-2 h-auto"
                                            >
                                                {isAdministering[med.id!] ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3 mr-1"/>}
                                                Registrar Administração
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* --- REGISTRO DIÁRIO --- */}
            {activeSubTab === 'log' && (
                <div className="space-y-6">
                    <Card title="Diário Escolar">
                        <div className="space-y-6">
                            {/* Data */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Data do Registro</label>
                                <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} />
                            </div>

                            {/* Avaliações Rápidas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-500"/> Interações Sociais
                                    </label>
                                    <div className="flex gap-2">
                                        {['Baixa', 'Média', 'Alta'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setSocialInteraction(level as any)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                    socialInteraction === level 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-green-500"/> Participação em Atividades
                                    </label>
                                    <div className="flex gap-2">
                                        {['Baixa', 'Média', 'Alta'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setParticipation(level as any)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                    participation === level 
                                                    ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Ocorrências */}
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <label className="block text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                                    <AlertOctagon className="w-4 h-4"/> Ocorrências de Desregulação
                                </label>
                                <div className="flex items-center gap-4 mb-3">
                                    <button 
                                        onClick={() => setDysregulationCount(Math.max(0, dysregulationCount - 1))}
                                        className="w-8 h-8 bg-white rounded-full border border-orange-200 text-orange-600 font-bold"
                                    >-</button>
                                    <span className="text-xl font-bold text-orange-900">{dysregulationCount}</span>
                                    <button 
                                        onClick={() => setDysregulationCount(dysregulationCount + 1)}
                                        className="w-8 h-8 bg-white rounded-full border border-orange-200 text-orange-600 font-bold"
                                    >+</button>
                                </div>
                                {dysregulationCount > 0 && (
                                    <TextArea 
                                        label="Detalhes da Ocorrência"
                                        placeholder="O que aconteceu? Qual foi o gatilho?"
                                        value={dysregulationDetails}
                                        onChange={e => setDysregulationDetails(e.target.value)}
                                        className="bg-white"
                                    />
                                )}
                            </div>

                            {/* Estratégias */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-yellow-500"/> Estratégias que funcionaram
                                </label>
                                <TextArea 
                                    placeholder="Ex: Pausa sensorial, uso de fone de ouvido, conversa calma..."
                                    value={successfulStrategies}
                                    onChange={e => setSuccessfulStrategies(e.target.value)}
                                />
                            </div>

                            {/* Notas Gerais */}
                            <TextArea 
                                label="Observações Gerais do Dia"
                                placeholder="Recados para os pais ou terapeutas..."
                                value={generalNotes}
                                onChange={e => setGeneralNotes(e.target.value)}
                            />

                            <Button 
                                onClick={handleSaveLog} 
                                disabled={isSaving}
                                className="w-full bg-purple-600 hover:bg-purple-700 py-4 shadow-lg text-white font-bold"
                            >
                                {isSaving ? 'Salvando...' : 'Salvar Registro do Dia'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- HISTÓRICO COMPLETO --- */}
            {activeSubTab === 'history' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 text-lg">Histórico</h2>
                    </div>

                    {/* Toggle de Visualização (Abas do Histórico) */}
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200">
                        <button 
                            onClick={() => setHistoryViewType('behavior')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                historyViewType === 'behavior' 
                                ? 'bg-white text-purple-700 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Activity className="w-3 h-3"/> Diário Comportamental
                        </button>
                        <button 
                            onClick={() => setHistoryViewType('medication')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                historyViewType === 'medication' 
                                ? 'bg-white text-pink-700 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Pill className="w-3 h-3"/> Histórico de Medicação
                        </button>
                    </div>

                    {/* Conteúdo do Histórico */}
                    {historyViewType === 'behavior' ? (
                        <>
                            {recentLogs.length === 0 ? (
                                <p className="text-center text-slate-400 py-8 text-sm">Sem histórico comportamental.</p>
                            ) : (
                                recentLogs.map(log => renderLogItem(log))
                            )}
                        </>
                    ) : (
                        <>
                            {medicationLogs.length === 0 ? (
                                <p className="text-center text-slate-400 py-8 text-sm">Sem histórico de medicação.</p>
                            ) : (
                                medicationLogs.map(log => renderMedicationLogItem(log))
                            )}
                        </>
                    )}
                </div>
            )}

            {/* MODAL DE CADASTRO DE RA */}
            <Modal isOpen={isRaModalOpen} onClose={() => setIsRaModalOpen(false)} title="Complementar Cadastro">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Insira os dados escolares e de contato para controle interno.</p>
                    
                    <Input 
                        label="Registro Acadêmico (RA)" 
                        value={raInput} 
                        onChange={e => setRaInput(e.target.value)} 
                        placeholder="Ex: 12345-6"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Ano / Série" 
                            value={yearInput} 
                            onChange={e => setYearInput(e.target.value)} 
                            placeholder="Ex: 5º Ano B"
                        />
                        
                        <Select
                            label="Período"
                            value={periodInput}
                            onChange={e => setPeriodInput(e.target.value)}
                        >
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Integral">Integral</option>
                        </Select>
                    </div>

                    <Input 
                        label="Data de Nascimento" 
                        type="date"
                        value={birthDateInput} 
                        onChange={e => setBirthDateInput(e.target.value)} 
                    />

                    {/* Contatos dos Pais (Dinâmico) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Contatos dos Pais/Responsáveis</label>
                        <div className="space-y-2">
                            {contacts.map((contact, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input 
                                        placeholder="Nome (Ex: Mãe)" 
                                        value={contact.name} 
                                        onChange={e => updateContact(index, 'name', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input 
                                        placeholder="Telefone" 
                                        value={contact.phone} 
                                        onChange={e => updateContact(index, 'phone', e.target.value)}
                                        className="flex-1"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => removeContact(index)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Remover Contato"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={addContact} 
                                className="w-full border-dashed border-2 border-slate-300 text-slate-500 hover:text-purple-600 hover:border-purple-300"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Contato
                            </Button>
                        </div>
                    </div>

                    <Button onClick={handleSaveRegistry} disabled={isSavingRa} className="w-full bg-purple-600 hover:bg-purple-700 mt-4">
                        {isSavingRa ? 'Salvando...' : 'Salvar Dados'}
                    </Button>
                </div>
            </Modal>

            {/* MODAL DE EDIÇÃO DE REGISTRO (RESTAURADO) */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Registro Diário">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Interação Social</label>
                            <div className="flex gap-1">
                                {['Baixa', 'Média', 'Alta'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setEditSocial(level as any)}
                                        className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                                            editSocial === level 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Participação</label>
                            <div className="flex gap-1">
                                {['Baixa', 'Média', 'Alta'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setEditParticipation(level as any)}
                                        className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                                            editParticipation === level 
                                            ? 'bg-green-600 text-white border-green-600' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <label className="block text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4"/> Ocorrências
                        </label>
                        <div className="flex items-center gap-4 mb-2">
                            <button onClick={() => setEditDysregulationCount(Math.max(0, editDysregulationCount - 1))} className="w-8 h-8 bg-white rounded-full border border-orange-200 text-orange-600 font-bold">-</button>
                            <span className="text-xl font-bold text-orange-900">{editDysregulationCount}</span>
                            <button onClick={() => setEditDysregulationCount(editDysregulationCount + 1)} className="w-8 h-8 bg-white rounded-full border border-orange-200 text-orange-600 font-bold">+</button>
                        </div>
                        <TextArea 
                            label="Detalhes"
                            value={editDysregulationDetails}
                            onChange={e => setEditDysregulationDetails(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    <TextArea 
                        label="Estratégias que funcionaram"
                        value={editStrategies}
                        onChange={e => setEditStrategies(e.target.value)}
                    />

                    <TextArea 
                        label="Observações Gerais"
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                    />

                    <Button onClick={handleUpdateLog} disabled={isUpdating} className="w-full bg-purple-600 hover:bg-purple-700">
                        {isUpdating ? 'Salvando...' : 'Atualizar Registro'}
                    </Button>
                </div>
            </Modal>

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (NOVO) */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Tem certeza que deseja excluir este registro do histórico?</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancelar</Button>
                        <Button variant="danger" onClick={confirmDeleteLog} disabled={isDeleting}>
                            {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Excluindo...</> : "Sim, Excluir"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL DE CONFIRMAÇÃO DE ADMINISTRAÇÃO (SUBSTITUI window.confirm) */}
            <Modal isOpen={isConfirmAdministerModalOpen} onClose={() => setIsConfirmAdministerModalOpen(false)} title="Confirmar Administração">
                <div className="space-y-4">
                    {administerData && (
                        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2 text-pink-700 font-bold">
                                <Pill className="w-5 h-5"/>
                                <span>{administerData.med.name}</span>
                            </div>
                            <p className="text-sm text-slate-700">
                                Confirmar administração de <strong>{administerData.med.dosageValue} {administerData.med.dosageUnit}</strong>?
                            </p>
                            
                            {administerData.med.instructions && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-pink-100 text-xs text-pink-800 italic">
                                    <strong>Atenção:</strong> {administerData.med.instructions}
                                </div>
                            )}

                            <div className="mt-3 text-xs text-slate-500 flex gap-4">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(administerData.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {administerData.time}</span>
                            </div>
                        </div>
                    )}
                    
                    <p className="text-xs text-slate-500 italic text-center">Esta ação será registrada no histórico do aluno.</p>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsConfirmAdministerModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-pink-600 hover:bg-pink-700 text-white" onClick={confirmAdministerMedication}>
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL DE VISUALIZAÇÃO DE RECEITA */}
            <DocumentViewModal
                isOpen={isDocumentViewModalOpen}
                onClose={() => setDocumentViewModalOpen(false)}
                document={documentToView}
            />

        </div>
    );
};

export default SchoolView;
