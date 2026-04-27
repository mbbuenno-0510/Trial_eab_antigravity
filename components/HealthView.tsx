
import React, { useState, useMemo, useEffect, FC, ReactElement } from 'react';
import { Appointment, Therapy, Medication, DOSAGE_UNITS, UserProfile, ProfileType, StoredDocument, TherapyTask, SchoolMedicationLog } from '../types';
// Assumindo que Card, Button, Input, Select, Modal, TextArea são componentes UI externos
import { Card, Button, Input, Select, Modal, TextArea } from './ui'; 
import { db, storage } from '../services/firebase';
// Importação de ícones
import { Trash2, Edit2, Plus, Clock, Calendar, Check, Paperclip, X, Pill, Stethoscope, Box, Puzzle, Loader2, AlertTriangle, School, GraduationCap, Info, FileText } from 'lucide-react'; 

// Importação do componente real DocumentViewModal
import DocumentViewModal from './DocumentViewModal'; 

interface HealthViewProps {
    userProfile: UserProfile | null;
}

// --- CONSTANTES ---
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MED_CATEGORIES = ['Uso Contínuo', 'Antibiótico', 'Analgésico', 'Vitamina', 'Antialérgico', 'Outros'];
const HEALTH_COUNCILS = ['CRM', 'CRP', 'CREFITO', 'CRF', 'COREN', 'Outros'];

const CATEGORY_STYLES: Record<string, string> = {
    'Uso Contínuo': 'border-l-4 border-l-blue-500 bg-blue-50/50',
    'Antibiótico': 'border-l-4 border-l-rose-500 bg-rose-50/50',
    'Analgésico': 'border-l-4 border-l-amber-500 bg-amber-50/50',
    'Vitamina': 'border-l-4 border-l-emerald-500 bg-emerald-50/50',
    'Antialérgico': 'border-l-4 border-l-purple-500 bg-purple-50/50',
    'Outros': 'border-l-4 border-l-slate-400 bg-slate-50/50'
};

const CATEGORY_BADGES: Record<string, string> = {
    'Uso Contínuo': 'bg-blue-100 text-blue-700',
    'Antibiótico': 'bg-rose-100 text-rose-700',
    'Analgésico': 'bg-amber-100 text-amber-700',
    'Vitamina': 'bg-emerald-100 text-emerald-700',
    'Antialérgico': 'bg-purple-100 text-purple-700',
    'Outros': 'bg-slate-100 text-slate-700'
};

// ====================================================================
// ÍCONE PLACEHOLDER 3D/COLORIDO
// ====================================================================

interface DynamicIconProps {
    tab: 'meds' | 'stock' | 'appointments' | 'therapies' | 'school_history';
}

const HealthDynamicTabIcon: FC<DynamicIconProps> = ({ tab }) => {
    const iconMap: { [key in typeof tab]: { icon: ReactElement; gradient: string; shadowColor: string; } } = {
        'meds': { icon: <Pill className="w-6 h-6" />, gradient: 'from-pink-500 to-red-600', shadowColor: 'shadow-pink-500/50' },
        'appointments': { icon: <Stethoscope className="w-6 h-6" />, gradient: 'from-blue-500 to-cyan-600', shadowColor: 'shadow-blue-500/50' },
        'therapies': { icon: <Puzzle className="w-6 h-6" />, gradient: 'from-green-500 to-teal-600', shadowColor: 'shadow-green-500/50' }, 
        'stock': { icon: <Box className="w-6 h-6" />, gradient: 'from-orange-500 to-amber-600', shadowColor: 'shadow-orange-500/50' },
        'school_history': { icon: <GraduationCap className="w-6 h-6" />, gradient: 'from-purple-500 to-indigo-600', shadowColor: 'shadow-purple-500/50' },
    };

    const { icon, gradient, shadowColor } = iconMap[tab];

    return (
        <div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                         bg-gradient-to-br ${gradient} 
                         shadow-xl ${shadowColor} 
                         text-white 
                         transition-all duration-300 transform 
                         hover:scale-105`}
        >
            {icon}
        </div>
    );
};

// ===============================================
// FUNÇÕES AUXILIARES DE CÁLCULO
// ===============================================

const calculateDaysLeft = (med: Medication): number => {
    const stockInPackages = med.stock || 0; 
    const dosesPerPackage = med.packageSize && med.packageSize > 0 ? med.packageSize : 0;
    const totalDosesInStock = stockInPackages * dosesPerPackage; 

    const dosePerTime = med.dosageValue || 0;
    const timesPerDay = med.administrationTimes?.length || 0;
    
    if (totalDosesInStock <= 0 || dosePerTime <= 0 || timesPerDay <= 0) return 0;
    
    let consumptionPerDay = dosePerTime * timesPerDay;

    if (med.frequencyType === 'specific_days' && med.selectedDays && med.selectedDays.length > 0) {
        const daysPerWeek = med.selectedDays.length;
        const totalConsumptionPerWeek = consumptionPerDay * daysPerWeek;
        consumptionPerDay = totalConsumptionPerWeek / 7;
    }
    
    if (consumptionPerDay <= 0) return 0;

    return Math.floor(totalDosesInStock / consumptionPerDay);
};

// ===============================================
// FUNÇÃO PARA AGENDAMENTO DE LEMBRETE (SIMULADO)
// ===============================================
const scheduleReminder = (medName: string, date: string, time: string) => {
    alert(`Lembrete de Alto Custo ACIONADO: Retirada de ${medName} agendada para ${new Date(date).toLocaleDateString('pt-BR')} às ${time}.`);
};

// --- FUNÇÕES AUXILIARES DE DATA ---
const isToday = (dateString: string) => {
    const today = new Date();
    const consultDate = new Date(`${dateString}T00:00:00.000Z`);
    return (
        today.getUTCFullYear() === consultDate.getUTCFullYear() &&
        today.getUTCMonth() === consultDate.getUTCMonth() &&
        today.getUTCDate() === consultDate.getUTCDate()
    );
};

const isDayToday = (dayIndex: number) => {
    return dayIndex === new Date().getDay();
};

// ===============================================
// SUB-COMPONENTE: MedicationForm
// ===============================================

interface MedicationFormProps {
    initialMed?: Medication | null;
    targetUid: string | null;
    onClose: () => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({ initialMed, targetUid, onClose }) => {
    const [newMed, setNewMed] = useState<Partial<Medication>>(() => ({
        dosageUnit: initialMed?.dosageUnit || 'mg',
        frequencyType: initialMed?.frequencyType || 'daily',
        category: initialMed?.category || 'Outros',
        name: initialMed?.name || '',
        administeredAtSchool: initialMed?.administeredAtSchool || false,
        ...initialMed,
    }));
    
    const [dosageInput, setDosageInput] = useState(() => String(initialMed?.dosageValue || '').replace('.', ','));
    const [administrationTimes, setAdministrationTimes] = useState<string[]>(initialMed?.administrationTimes || []);
    const [selectedDays, setSelectedDays] = useState<number[]>(initialMed?.selectedDays || []);
    const [newTime, setNewTime] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(initialMed?.downloadUrl || null);
    const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachmentFile(file);
            setRemoveExistingAttachment(false);
            // Preview if it's an image
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setAttachmentPreview(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setAttachmentPreview(null);
            }
        }
    };

    const handleAddTime = () => {
        if (newTime && !administrationTimes.includes(newTime)) {
            setAdministrationTimes(prev => [...prev, newTime].sort());
            setNewTime('');
        }
    };

    const handleRemoveTime = (timeToRemove: string) => {
        setAdministrationTimes(prev => prev.filter(t => t !== timeToRemove));
    };

    const toggleDay = (dayIndex: number) => {
        setSelectedDays(prev => {
            if (prev.includes(dayIndex)) {
                return prev.filter(d => d !== dayIndex);
            } else {
                return [...prev, dayIndex].sort();
            }
        });
    };
    
    const handleSaveMedication = async () => {
        if (!targetUid) return;
        const cleanDosage = dosageInput.trim().replace(',', '.');
        const parsedDosage = parseFloat(cleanDosage);
        
        if(newMed.name && !isNaN(parsedDosage) && administrationTimes.length > 0) {
            if (newMed.frequencyType === 'specific_days' && selectedDays.length === 0) {
                alert("Selecione pelo menos um dia da semana.");
                return;
            }

            setIsSaving(true);
            setUploadProgress(0);
            try {
                const docRef = initialMed?.id 
                    ? db.collection('users').doc(targetUid).collection('medications').doc(initialMed.id)
                    : db.collection('users').doc(targetUid).collection('medications').doc();

                let uploadData: Partial<Medication> = {};

                if (attachmentFile) {
                    const fileExt = attachmentFile.name.split('.').pop();
                    const fileName = `prescription_${Date.now()}.${fileExt}`;
                    const filePath = `users/${targetUid}/medications/${docRef.id}/${fileName}`;
                    const fileRef = storage.ref().child(filePath);
                    
                    // Removendo anexo anterior se existir
                    if (initialMed?.storagePath) {
                        try {
                            await storage.ref().child(initialMed.storagePath).delete();
                        } catch (e) {
                            console.warn("Erro ao deletar anexo antigo:", e);
                        }
                    }

                    const uploadTask = fileRef.put(attachmentFile);
                    
                    // Monitorar progresso (opcional, mas bom para UX)
                    uploadTask.on('state_changed', 
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        }
                    );

                    await uploadTask;
                    const downloadUrl = await fileRef.getDownloadURL();
                    
                    uploadData = {
                        downloadUrl: downloadUrl,
                        storagePath: filePath,
                        attachmentFilename: attachmentFile.name,
                        attachmentMimeType: attachmentFile.type,
                    };
                } else if (removeExistingAttachment) {
                    if (initialMed?.storagePath) {
                        try {
                            await storage.ref().child(initialMed.storagePath).delete();
                        } catch (e) {
                            console.warn("Erro ao deletar anexo:", e);
                        }
                    }
                    uploadData = {
                        downloadUrl: null,
                        storagePath: null,
                        attachmentFilename: null,
                        attachmentMimeType: null,
                    };
                }

                const medData: any = {
                    ...newMed,
                    ...uploadData,
                    id: docRef.id,
                    stock: initialMed?.stock || 0,
                    minStock: initialMed?.minStock || 5,
                    packageSize: initialMed?.packageSize || 0,
                    packageUnit: initialMed?.packageUnit || (newMed.dosageUnit || 'unidade(s)'),
                    altoCusto: newMed.altoCusto || false,
                    altoCustoInstructions: newMed.altoCustoInstructions || '',
                    instructions: newMed.instructions || '',
                    dataRetirada: newMed.dataRetirada || '',
                    horaRetirada: newMed.horaRetirada || '',
                    administeredAtSchool: newMed.administeredAtSchool || false,

                    dosageValue: parsedDosage,
                    dosageUnit: newMed.dosageUnit || 'mg',
                    administrationTimes: administrationTimes,
                    frequencyType: newMed.frequencyType || 'daily',
                    selectedDays: newMed.frequencyType === 'specific_days' ? selectedDays : [],
                    category: newMed.category || 'Outros',
                    userId: targetUid,
                };

                if (initialMed?.id) {
                    await docRef.update(medData);
                } else {
                    await docRef.set(medData);
                }
                
                onClose();
            } catch (error: any) {
                console.error("Erro ao salvar medicamento:", error);
                alert(`Erro ao salvar: ${error.message}`);
            } finally {
                setIsSaving(false);
            }
        } else {
            if (!newMed.name) alert("Nome do medicamento é obrigatório.");
            if (isNaN(parsedDosage)) alert("Por favor, insira uma dosagem válida.");
            if (administrationTimes.length === 0) alert("Adicione pelo menos um horário de administração.");
        }
    }

    return (
        <div className="flex flex-col h-full relative">
            <div className="space-y-3 pb-24">
                <div className="flex gap-2">
                    <div className="flex-[2]">
                        <Input 
                            label="Nome do Medicamento" 
                            value={newMed.name || ''} 
                            onChange={e => setNewMed({...newMed, name: e.target.value})} 
                            placeholder="Ex: Paracetamol"
                        />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <Select
                            label="Categoria"
                            value={newMed.category || 'Outros'}
                            onChange={(e) => setNewMed({...newMed, category: e.target.value})}
                        >
                            {MED_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* --- SEÇÃO DE ANEXO (RECEITA) --- */}
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 space-y-2">
                    <label className="block text-xs font-bold text-blue-700 uppercase mb-1 ml-1 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> Anexo / Receita Médica
                    </label>
                    
                    <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white border-2 border-dashed border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-all">
                                <Plus className="w-4 h-4" />
                                <span className="text-xs font-bold">{attachmentFile ? 'Alterar Anexo' : 'Adicionar Receita / Foto'}</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                            </div>
                        </label>
                        
                {(attachmentFile || (attachmentPreview && !removeExistingAttachment)) && (
                            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-blue-100 shadow-sm pr-2">
                                {attachmentPreview ? (
                                    <img src={attachmentPreview} alt="Preview" className="w-10 h-10 object-cover rounded shadow-inner" />
                                ) : (
                                    <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                    </div>
                                )}
                                <div className="max-w-[100px]">
                                    <p className="text-[10px] font-bold text-slate-700 truncate">{attachmentFile?.name || initialMed?.attachmentFilename || 'Anexo'}</p>
                                    <p className="text-[8px] text-slate-400">{attachmentFile ? 'Novo arquivo' : 'Arquivo salvo'}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => { 
                                        setAttachmentFile(null); 
                                        setAttachmentPreview(null);
                                        if (!attachmentFile) setRemoveExistingAttachment(true);
                                    }}
                                    className="p-1 text-slate-300 hover:text-red-500"
                                    title="Remover anexo"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                    {uploadProgress !== null && uploadProgress < 100 && isSaving && (
                        <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            type="text"
                            label="Dose"
                            value={dosageInput}
                            onChange={e => setDosageInput(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="w-24">
                        <Select
                            label="Unid."
                            value={newMed.dosageUnit}
                            onChange={(e) => setNewMed({...newMed, dosageUnit: e.target.value})}
                        >
                            {DOSAGE_UNITS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </Select>
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Frequência</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setNewMed({...newMed, frequencyType: 'daily'})}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                newMed.frequencyType === 'daily' || !newMed.frequencyType
                                ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Diariamente
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewMed({...newMed, frequencyType: 'specific_days'})}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                newMed.frequencyType === 'specific_days'
                                ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Dias Específicos
                        </button>
                    </div>
                </div>

                {newMed.frequencyType === 'specific_days' && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between">
                            {WEEKDAYS_SHORT.map((day, index) => {
                                const isSelected = selectedDays.includes(index);
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => toggleDay(index)}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                                            isSelected
                                                ? 'bg-blue-600 text-white shadow-md scale-110'
                                                : 'bg-white border border-slate-300 text-slate-500 hover:border-blue-400'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                        Horários de Administração
                    </label>
                    <div className="flex gap-2 mb-3">
                        <Input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="flex-grow text-sm"
                        />
                        <Button variant="primary" onClick={handleAddTime} type="button" className="px-4">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {administrationTimes.length === 0 && <span className="text-xs text-slate-400 italic py-1">Nenhum horário definido</span>}
                        {administrationTimes.map(time => (
                            <span key={time} className="inline-flex items-center px-3 py-1 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-full shadow-sm">
                                {time}
                                <button
                                    onClick={() => handleRemoveTime(time)}
                                    className="ml-2 text-slate-400 hover:text-red-500 focus:outline-none"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-2">
                    <label className="flex items-center gap-3 p-3 border border-indigo-100 rounded-lg bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={newMed.administeredAtSchool || false}
                            onChange={e => setNewMed({...newMed, administeredAtSchool: e.target.checked})}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex items-center gap-2">
                            <School className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm font-bold text-indigo-800">Administrar na Escola</span>
                        </div>
                    </label>
                </div>

                <TextArea 
                    label="Instruções de Uso / Observações" 
                    value={newMed.instructions || ''} 
                    onChange={e => setNewMed({...newMed, instructions: e.target.value})} 
                    placeholder="Ex: Misturar na comida, não dar em jejum..."
                    rows={2}
                />

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input 
                            type="checkbox" 
                            checked={newMed.altoCusto || false} 
                            onChange={e => setNewMed({...newMed, altoCusto: e.target.checked})} 
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm font-bold text-amber-700">Medicamento de Alto Custo</span>
                    </label>
                    {newMed.altoCusto && (
                        <div className="animate-in fade-in slide-in-from-top-1 space-y-2">
                            <TextArea 
                                label="Instruções de Retirada (Farmácia, Documentos, etc)" 
                                rows={2}
                                value={newMed.altoCustoInstructions || ''} 
                                onChange={e => setNewMed({...newMed, altoCustoInstructions: e.target.value})} 
                                placeholder="Ex: Pegar na Farmácia Central toda última terça... / Precisa de cópia do RG..."
                                className="text-xs"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Próxima Retirada" type="date" value={newMed.dataRetirada || ''} onChange={e => setNewMed({...newMed, dataRetirada: e.target.value})} />
                                <Input label="Hora" type="time" value={newMed.horaRetirada || ''} onChange={e => setNewMed({...newMed, horaRetirada: e.target.value})} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="sticky -mx-6 p-4 bg-white border-t border-slate-100 flex gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ bottom: '2rem', marginBottom: '2rem' }}>
                <Button variant="secondary" onClick={onClose} className="flex-1 py-3" disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSaveMedication} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg" disabled={isSaving}>
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> {uploadProgress !== null && uploadProgress < 100 ? `Transmitindo... ${Math.round(uploadProgress)}%` : 'Finalizando...'}</> : (initialMed?.id ? "Salvar Alterações" : "Adicionar Medicamento")}
                </Button>
            </div>
        </div>
    );
};

// ... AppointmentModal e TherapyModal permanecem inalterados ...
interface AppointmentModalProps {
    initialAppt: Appointment | Partial<Appointment>;
    targetUid: string | null;
    onClose: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ initialAppt, targetUid, onClose }) => {
    const [newAppt, setNewAppt] = useState<Partial<Appointment>>({ 
        professionalCouncil: 'CRM', 
        professionalCode: '', 
        ...initialAppt 
    });

    const isEditing = !!initialAppt.id;

    const addAppointment = async () => {
        if (!targetUid) return;
        if (newAppt.title && newAppt.specialty && newAppt.date && newAppt.time) {
            
            const apptData = {
                ...newAppt,
                professionalCouncil: newAppt.professionalCouncil || 'CRM',
                professionalCode: newAppt.professionalCode || '',
                userId: targetUid
            };

            if (isEditing) {
                await db.collection('users').doc(targetUid).collection('appointments').doc(initialAppt.id!).update(apptData);
            } else {
                await db.collection('users').doc(targetUid).collection('appointments').add(apptData);
            }
            
            onClose();

        } else {
            alert("Preencha o título, especialidade, data e horário da consulta.");
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? "Editar Consulta" : "Agendar Consulta"}>
            <div className="space-y-4">
                <Input label="Título da Consulta" value={newAppt.title || ''} onChange={e => setNewAppt({...newAppt, title: e.target.value})} />
                <Input label="Especialidade/Local" value={newAppt.specialty || ''} onChange={e => setNewAppt({...newAppt, specialty: e.target.value})} />
                <div className="flex gap-2">
                    <Input label="Data" type="date" value={newAppt.date || ''} onChange={e => setNewAppt({...newAppt, date: e.target.value})} />
                    <Input label="Hora da Consulta" type="time" value={newAppt.time || ''} onChange={e => setNewAppt({...newAppt, time: e.target.value})} />
                </div>
                <Input label="Hora do Alarme (Opcional)" type="time" value={newAppt.alarmTime || ''} onChange={e => setNewAppt({...newAppt, alarmTime: e.target.value})} />
                <Input label="Nome do Profissional (Opcional)" value={newAppt.professionalName || ''} onChange={e => setNewAppt({...newAppt, professionalName: e.target.value})} />
                <div className="flex gap-2">
                    <div className="w-32 flex-shrink-0">
                        <Select label="Conselho" value={newAppt.professionalCouncil || 'CRM'} onChange={e => setNewAppt({...newAppt, professionalCouncil: e.target.value})}>
                            {HEALTH_COUNCILS.map(council => <option key={council} value={council}>{council}</option>)}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Input label="Nº Registro (Opcional)" value={newAppt.professionalCode || ''} onChange={e => setNewAppt({...newAppt, professionalCode: e.target.value})}/>
                    </div>
                </div>
                <div className="pt-2"><Button onClick={addAppointment} className="w-full">{isEditing ? "Salvar Alterações" : "Agendar Consulta"}</Button></div>
            </div>
        </Modal>
    );
};

interface TherapyModalProps {
    initialTherapy: Therapy | Partial<Therapy>;
    targetUid: string | null;
    onClose: () => void;
}

const TherapyModal: React.FC<TherapyModalProps> = ({ initialTherapy, targetUid, onClose }) => {
    const [newTherapy, setNewTherapy] = useState<Partial<Therapy>>(() => ({ 
        dayOfWeek: 1, 
        time: '', 
        alarmTime: '', 
        professionalCouncil: 'CRP', 
        professionalCode: '',
        ...initialTherapy
    }));
    const isEditing = !!initialTherapy.id;

    const addTherapy = async () => {
        if (!targetUid) return;
        if (newTherapy.name && newTherapy.time && newTherapy.dayOfWeek !== undefined) {
            const therapyData = {
                name: newTherapy.name,
                time: newTherapy.time,
                dayOfWeek: newTherapy.dayOfWeek,
                alarmTime: newTherapy.alarmTime || '', 
                professionalCouncil: newTherapy.professionalCouncil || 'CRP',
                professionalCode: newTherapy.professionalCode || '',
                professionalName: newTherapy.professionalName || '',
                userId: targetUid
            };
            if (isEditing) await db.collection('users').doc(targetUid).collection('therapies').doc(initialTherapy.id!).update(therapyData);
            else await db.collection('users').doc(targetUid).collection('therapies').add(therapyData);
            onClose();
        } else {
            alert("Preencha o nome, horário e dia da terapia.");
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? "Editar Terapia/Rotina" : "Agendar Terapia/Rotina"}>
            <div className="space-y-4">
                <Input label="Nome da Terapia/Rotina" value={newTherapy.name || ''} onChange={e => setNewTherapy({...newTherapy, name: e.target.value})} />
                <div className="flex gap-2">
                    <Select label="Dia da Semana" value={newTherapy.dayOfWeek} onChange={e => setNewTherapy({...newTherapy, dayOfWeek: parseInt(e.target.value)})}>
                        {WEEKDAYS.map((day, index) => <option key={index} value={index}>{day}</option>)}
                    </Select>
                    <Input label="Hora da Sessão" type="time" value={newTherapy.time || ''} onChange={e => setNewTherapy({...newTherapy, time: e.target.value})} />
                </div>
                <Input label="Nome do Profissional (Opcional)" value={newTherapy.professionalName || ''} onChange={e => setNewTherapy({...newTherapy, professionalName: e.target.value})} />
                <div className="flex gap-2">
                    <div className="w-32 flex-shrink-0">
                        <Select label="Conselho" value={newTherapy.professionalCouncil || 'CRP'} onChange={e => setNewTherapy({...newTherapy, professionalCouncil: e.target.value})}>
                            {HEALTH_COUNCILS.map(council => <option key={council} value={council}>{council}</option>)}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Input label="Nº Registro (Opcional)" value={newTherapy.professionalCode || ''} onChange={e => setNewTherapy({...newTherapy, professionalCode: e.target.value})}/>
                    </div>
                </div>
                <Input label="Hora do Alarme (Opcional)" type="time" value={newTherapy.alarmTime || ''} onChange={e => setNewTherapy({...newTherapy, alarmTime: e.target.value})} />
                <div className="pt-2"><Button onClick={addTherapy} className="w-full">{isEditing ? "Salvar Alterações" : "Agendar Terapia"}</Button></div>
            </div>
        </Modal>
    );
};

// ===============================================
// COMPONENTE HEALTHVIEW
// ===============================================

const HealthView: React.FC<HealthViewProps> = ({ userProfile }) => {
    const [activeTab, setActiveTab] = useState<'meds' | 'stock' | 'appointments' | 'therapies' | 'school_history'>('meds');

    // Data States
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [therapies, setTherapies] = useState<Therapy[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [schoolMedLogs, setSchoolMedLogs] = useState<SchoolMedicationLog[]>([]);

    // Modals
    const [isApptModalOpen, setApptModalOpen] = useState(false);
    const [isTherapyModalOpen, setTherapyModalOpen] = useState(false);
    const [isMedModalOpen, setMedModalOpen] = useState(false);
    const [isStockModalOpen, setStockModalOpen] = useState(false);
    
    // Estados para Visualização de Documento
    const [isDocumentViewModalOpen, setDocumentViewModalOpen] = useState(false);
    const [documentToView, setDocumentToView] = useState<StoredDocument | null>(null);
    
    // Confirmação de Exclusão
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'appointment' | 'therapy' | 'medication', id: string, title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Terapia Tasks
    const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});

    // Editing States
    const [currentAppt, setCurrentAppt] = useState<Appointment | Partial<Appointment>>({});
    const [currentTherapy, setCurrentTherapy] = useState<Therapy | Partial<Therapy>>({});
    const [currentMed, setCurrentMed] = useState<Medication | Partial<Medication>>({});
    const [currentMedToEditStock, setCurrentMedToEditStock] = useState<Medication | null>(null);

    const [childDisplayName, setChildDisplayName] = useState<string | null>(null);

    const targetUid = useMemo(() => {
        if (!userProfile) return null;
        if (userProfile.profileType === ProfileType.ADULT && userProfile.manages && userProfile.manages.length > 0) {
            return userProfile.manages[0];
        }
        return userProfile.uid;
    }, [userProfile]);

    useEffect(() => {
        if (userProfile?.profileType === ProfileType.ADULT && targetUid && targetUid !== userProfile.uid) {
            db.collection("users").doc(targetUid).get().then(doc => {
                if (doc.exists) setChildDisplayName(doc.data()?.displayName || 'Filho(a)');
                else setChildDisplayName('Filho(a)');
            }).catch(() => setChildDisplayName('Filho(a)'));
        } else {
            setChildDisplayName(null);
        }
    }, [userProfile, targetUid]);

    // Listeners
    useEffect(() => {
        if (!targetUid) return;

        const unsubMeds = db.collection('users').doc(targetUid).collection('medications').onSnapshot((snap) => {
            setMedications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Medication)));
        });
        const unsubAppts = db.collection('users').doc(targetUid).collection('appointments').onSnapshot((snap) => {
            setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
        });
        const unsubTherapies = db.collection('users').doc(targetUid).collection('therapies').onSnapshot((snap) => {
            setTherapies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Therapy)));
        });
        let unsubSchoolLogs = () => {};
        if (userProfile?.profileType === ProfileType.ADULT) {
            unsubSchoolLogs = db.collection('users').doc(targetUid).collection('school_medication_logs')
                .orderBy('timestamp', 'desc').limit(50)
                .onSnapshot((snap) => {
                    // CORREÇÃO: Usando a variável de estado correta (setSchoolMedLogs)
                    setSchoolMedLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolMedicationLog)));
                });
        }
        return () => { unsubMeds(); unsubAppts(); unsubTherapies(); unsubSchoolLogs(); };
    }, [targetUid, userProfile?.profileType]);
    
    // Handlers
    const handleOpenNewApptModal = () => { setCurrentAppt({}); setApptModalOpen(true); }
    const handleEditAppointment = (appt: Appointment) => { setCurrentAppt(JSON.parse(JSON.stringify(appt))); setApptModalOpen(true); }
    const closeApptModal = () => { setApptModalOpen(false); setCurrentAppt({}); }
    const requestDeleteAppointment = (id: string, title: string) => setDeleteConfirmation({ type: 'appointment', id, title });

    const handleOpenNewTherapyModal = () => { setCurrentTherapy({ dayOfWeek: 1, time: '', alarmTime: '', professionalCouncil: 'CRP', professionalCode: '' }); setTherapyModalOpen(true); }
    const handleEditTherapy = (therapy: Therapy) => { setCurrentTherapy(JSON.parse(JSON.stringify(therapy))); setTherapyModalOpen(true); }
    const closeTherapyModal = () => { setTherapyModalOpen(false); setCurrentTherapy({}); }
    const requestDeleteTherapy = (id: string, name: string) => setDeleteConfirmation({ type: 'therapy', id, title: name });
    
    const handleTaskInputChange = (therapyId: string, value: string) => setTaskInputs(prev => ({ ...prev, [therapyId]: value }));
    const handleAddTask = async (therapy: Therapy) => {
        const text = taskInputs[therapy.id] || '';
        if (!text.trim() || !targetUid) return;
        const newTask: TherapyTask = { id: Date.now().toString(), description: text.trim(), isCompleted: false };
        try {
            await db.collection('users').doc(targetUid).collection('therapies').doc(therapy.id).update({ tasks: [...(therapy.tasks || []), newTask] });
            setTaskInputs(prev => ({ ...prev, [therapy.id]: '' }));
        } catch (error) { console.error(error); alert("Erro ao salvar observação."); }
    };
    const handleToggleTask = async (therapy: Therapy, task: TherapyTask) => {
        if (!targetUid) return;
        const updatedTasks = (therapy.tasks || []).map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t);
        try { await db.collection('users').doc(targetUid).collection('therapies').doc(therapy.id).update({ tasks: updatedTasks }); } catch (error) { console.error(error); }
    };
    const handleDeleteTask = async (therapy: Therapy, taskId: string) => {
        if (!targetUid) return;
        const updatedTasks = (therapy.tasks || []).filter(t => t.id !== taskId);
        try { await db.collection('users').doc(targetUid).collection('therapies').doc(therapy.id).update({ tasks: updatedTasks }); } catch (error) { console.error(error); }
    };

    const handleOpenNewMedModal = () => { setCurrentMed({}); setMedModalOpen(true); }
    const handleEditMedication = (med: Medication) => { setCurrentMed(JSON.parse(JSON.stringify(med))); setMedModalOpen(true); };
    const closeMedModal = () => { setMedModalOpen(false); setCurrentMed({}); };
    const requestDeleteMedication = (id: string, name: string) => setDeleteConfirmation({ type: 'medication', id, title: name });

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation || !targetUid) return;
        setIsDeleting(true);
        try {
            if (deleteConfirmation.type === 'appointment') await db.collection('users').doc(targetUid).collection('appointments').doc(deleteConfirmation.id).delete();
            else if (deleteConfirmation.type === 'therapy') await db.collection('users').doc(targetUid).collection('therapies').doc(deleteConfirmation.id).delete();
            else if (deleteConfirmation.type === 'medication') {
                 const medToDelete = medications.find(m => m.id === deleteConfirmation.id);
                 if (medToDelete && medToDelete.storagePath) {
                    await storage.ref(medToDelete.storagePath).delete().catch(err => console.warn(err));
                 }
                 await db.collection('users').doc(targetUid).collection('medications').doc(deleteConfirmation.id).delete();
            }
        } catch (error) { console.error(error); alert("Ocorreu um erro ao tentar excluir."); } 
        finally { setIsDeleting(false); setDeleteConfirmation(null); }
    };

    const handleViewDocument = (med: Medication) => {
        if (med.downloadUrl || (med.attachmentBase64 && med.attachmentFilename)) {
            const docToView: StoredDocument = {
                id: med.id!, userId: med.userId, title: `${med.name} - Receita`, category: 'Receita Médica',
                mimeType: med.attachmentMimeType || 'application/octet-stream', filename: med.attachmentFilename || 'arquivo',
                dataUrl: med.attachmentBase64 || undefined, downloadUrl: med.downloadUrl || undefined,
                storagePath: med.storagePath || undefined, uploadedAt: Date.now(),
            };
            setDocumentToView(docToView); setDocumentViewModalOpen(true);
        }
    };
    const closeDocumentViewModal = () => { setDocumentViewModalOpen(false); setDocumentToView(null); };
    
    const handleEditStock = (med: Medication) => { setCurrentMedToEditStock(JSON.parse(JSON.stringify(med))); setStockModalOpen(true); };
    const handleStockModalChange = (field: keyof Medication, value: any) => {
        if (currentMedToEditStock) setCurrentMedToEditStock(prev => ({ ...prev!, [field]: value }));
    };
    const handleSaveStockDetails = async () => {
        if (!targetUid || !currentMedToEditStock) return;
        const updates: Partial<Medication> = {
            altoCusto: currentMedToEditStock.altoCusto || false,
            dataRetirada: currentMedToEditStock.altoCusto ? currentMedToEditStock.dataRetirada : '',
            horaRetirada: currentMedToEditStock.altoCusto ? currentMedToEditStock.horaRetirada : '',
            packageSize: Math.max(0, currentMedToEditStock.packageSize || 0),
            packageUnit: currentMedToEditStock.packageUnit
        };
        if (updates.altoCusto) scheduleReminder(currentMedToEditStock.name, updates.dataRetirada!, updates.horaRetirada!);
        await db.collection('users').doc(targetUid).collection('medications').doc(currentMedToEditStock.id!).update(updates);
        setStockModalOpen(false); setCurrentMedToEditStock(null);
    };
    const updateStock = async (id: string, delta: number, currentStock: number) => {
        if (!targetUid) return;
        await db.collection('users').doc(targetUid).collection('medications').doc(id).update({ stock: Math.max(0, currentStock + delta) });
    };
    const updateMinStockDetail = async (id: string, newMinStock: number) => {
        if (!targetUid) return;
        await db.collection('users').doc(targetUid).collection('medications').doc(id).update({ minStock: Math.max(0, newMinStock) });
    };
    const formatFrequency = (med: Medication) => {
        if (med.frequencyType === 'specific_days' && med.selectedDays) {
            if (med.selectedDays.length === 7) return "Todos os dias";
            return med.selectedDays.map(d => WEEKDAYS[d].substring(0, 3)).join(', ');
        }
        return "Diariamente";
    };
    
    const activeTherapyDays = useMemo(() => {
        if (!therapies || therapies.length === 0) return [];
        const days = Array.from(new Set(therapies.map(t => t.dayOfWeek)));
        return days.sort((a: number, b: number) => a - b);
    }, [therapies]);
    const sortedAppointments = useMemo(() => [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [appointments]);
    
    const getTabLabel = (tab: 'meds' | 'stock' | 'appointments' | 'therapies' | 'school_history'): string => {
        switch (tab) {
            case 'meds': return 'Medicação'; case 'stock': return 'Estoque'; case 'appointments': return 'Consultas'; case 'therapies': return 'Terapias'; case 'school_history': return 'Escola'; default: return '';
        }
    };
    const showSchoolTab = userProfile?.profileType === ProfileType.ADULT;

    return (
        <div className="p-4 max-w-4xl mx-auto pb-24 font-sans animate-in fade-in">
            {userProfile?.profileType === ProfileType.ADULT && targetUid !== userProfile.uid && (
                 <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex items-center gap-3 shadow-sm">
                    <div className="bg-teal-100 p-2 rounded-full"><Stethoscope className="w-6 h-6 text-teal-700" /></div>
                    <div><p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Gerenciando Saúde de</p><h2 className="text-lg font-black text-teal-900">{childDisplayName || 'Dependente'}</h2></div>
                </div>
            )}

            <div className="flex justify-between p-2 bg-white rounded-3xl w-full shadow-lg border border-slate-100 mb-6 overflow-x-auto">
                {(['meds', 'stock', 'appointments', 'therapies', ...(showSchoolTab ? ['school_history'] : [])] as const).map(tab => (
                    <div className="relative flex-1 flex flex-col items-center min-w-[60px]" key={tab}>
                        <button onClick={() => setActiveTab(tab as any)} className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative z-10 ${activeTab === tab ? 'scale-110' : 'opacity-70 hover:opacity-100 hover:bg-slate-50'}`}>
                            <HealthDynamicTabIcon tab={tab as any} />
                            <span className={`text-[10px] mt-1 font-bold whitespace-nowrap ${activeTab === tab ? 'text-teal-600' : 'text-slate-400'}`}>{getTabLabel(tab as any)}</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* 1. MEDICAÇÃO */}
            {activeTab === 'meds' && (
                <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-700">Medicamentos</h3>
                <div className="flex gap-2">
                    <Button onClick={handleOpenNewMedModal} className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="w-4 h-4 mr-2"/> Adicionar
                    </Button>
                </div>
            </div>
                    {medications.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400"><Pill className="w-12 h-12 mx-auto mb-2 opacity-50"/><p>Nenhum medicamento cadastrado.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                                {medications.map(med => {
                                    const daysLeft = calculateDaysLeft(med);
                                    const isCritical = daysLeft <= 7 && daysLeft > 0;
                                    const isOut = daysLeft <= 0;
                                    
                                    return (
                                        <Card key={med.id} className={`relative overflow-hidden transition-all hover:shadow-md ${CATEGORY_STYLES[med.category || 'Outros'] || CATEGORY_STYLES['Outros']}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${CATEGORY_BADGES[med.category || 'Outros'] || CATEGORY_BADGES['Outros']}`}>{med.category || 'Outros'}</span>
                                                    <h4 className="text-lg font-black text-slate-800 mt-1 flex items-center gap-2">
                                                        {med.name}
                                                        {med.administeredAtSchool && <School className="w-4 h-4 text-indigo-400" />}
                                                    </h4>
                                                    <p className="text-sm text-slate-600 font-bold">{med.dosageValue} {med.dosageUnit}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEditMedication(med)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                                                    <button onClick={() => requestDeleteMedication(med.id!, med.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>

                                            {med.instructions && (
                                                <div className="mb-3 p-2 bg-indigo-50/30 border border-indigo-100/50 rounded-xl text-[11px] text-indigo-700 leading-tight italic flex gap-2">
                                                    <Info className="w-4 h-4 shrink-0 opacity-50" />
                                                    <span>{med.instructions}</span>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm"><Calendar className="w-3 h-3 text-teal-500"/> {formatFrequency(med)}</div>
                                                {med.administrationTimes?.map(time => (
                                                    <div key={time} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                                                        <Clock className="w-3 h-3 text-teal-500"/> {time}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt- auto pt-3 border-t border-slate-100 flex justify-between items-end">
                                                <div className="space-y-1">
                                                    {(med.downloadUrl || (med.attachmentBase64 && med.attachmentFilename)) ? (
                                                        <button onClick={() => handleViewDocument(med)} className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"><Paperclip className="w-3 h-3"/> Ver Receita/Anexo</button>
                                                    ) : <span className="text-[10px] text-slate-400">Sem anexo</span>}
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <Box className={`w-3.5 h-3.5 ${isOut ? 'text-red-500' : isCritical ? 'text-amber-500' : 'text-slate-400'}`} />
                                                        <span className={`text-[11px] font-black ${isOut ? 'text-red-600' : isCritical ? 'text-amber-600' : 'text-slate-700'}`}>
                                                            {daysLeft} dias de estoque
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1">
                                                    {med.altoCusto && (
                                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3"/> ALTO CUSTO
                                                        </span>
                                                    )}
                                                    {isCritical && <span className="text-[9px] font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full animate-pulse">ESTOQUE BAIXO</span>}
                                                    {isOut && <span className="text-[9px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full">ESTOQUE ZERADO</span>}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}

            {/* 2. ESTOQUE */}
            {activeTab === 'stock' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700">Controle de Estoque</h3>
                    {medications.length === 0 ? <p className="text-slate-400 text-center">Cadastre medicamentos primeiro.</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {medications.map(med => {
                                const daysLeft = calculateDaysLeft(med);
                                const isLow = med.stock <= med.minStock;
                                const stockStatusColor = isLow ? 'text-red-600 bg-red-50 border-red-200' : daysLeft < 7 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-green-600 bg-green-50 border-green-200';
                                return (
                                    <Card key={med.id} className="p-4 border-l-4 border-l-slate-400">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-800">{med.name}</h4>
                                            <button onClick={() => handleEditStock(med)} className="text-xs font-bold text-blue-600 hover:underline">Detalhes</button>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 uppercase font-bold">Estoque Atual</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <button onClick={() => updateStock(med.id!, -1, med.stock)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">-</button>
                                                    <span className="text-xl font-black text-slate-800">{med.stock}</span>
                                                    <button onClick={() => updateStock(med.id!, 1, med.stock)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">+</button>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-2 rounded-lg border ${stockStatusColor} flex flex-col items-center min-w-[80px]`}>
                                                <span className="text-xs font-bold uppercase">Duração</span><span className="text-lg font-black">{daysLeft}</span><span className="text-[10px]">dias est.</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg text-xs flex justify-between items-center">
                                            <span className="text-slate-500">Alerta se menor que:</span>
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={med.minStock} onChange={(e) => updateMinStockDetail(med.id!, parseInt(e.target.value))} className="w-12 p-1 text-center border border-slate-300 rounded text-slate-700 font-bold"/>
                                                <span className="text-slate-400">un.</span>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 3. CONSULTAS */}
            {activeTab === 'appointments' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold text-slate-700">Agenda Médica</h3><Button onClick={handleOpenNewApptModal} className="bg-blue-500 hover:bg-blue-600"><Plus className="w-4 h-4 mr-2"/> Agendar</Button></div>
                    {sortedAppointments.length === 0 ? <p className="text-slate-400 text-center py-8">Nenhuma consulta agendada.</p> : (
                        <div className="space-y-3">
                            {sortedAppointments.map(appt => (
                                <div key={appt.id} className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                                    <div className={`w-2 ${isToday(appt.date) ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                    <div className="p-4 flex-1">
                                        <div className="flex justify-between items-start">
                                            <div><h4 className="font-bold text-slate-800 text-lg">{appt.title}</h4><p className="text-sm text-slate-600 font-medium">{appt.specialty}</p>{appt.professionalName && <p className="text-xs text-slate-500 mt-0.5">Dr(a). {appt.professionalName}</p>}</div>
                                            <div className="text-right"><p className={`text-sm font-bold ${isToday(appt.date) ? 'text-blue-600' : 'text-slate-500'}`}>{new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p><p className="text-lg font-black text-slate-700">{appt.time}</p></div>
                                        </div>
                                        <div className="mt-3 flex justify-end gap-2 border-t border-slate-50 pt-2">
                                            <button onClick={() => handleEditAppointment(appt)} className="text-xs font-bold text-blue-500 hover:bg-blue-50 px-2 py-1 rounded">Editar</button>
                                            <button onClick={() => requestDeleteAppointment(appt.id!, appt.title)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded">Excluir</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. TERAPIAS */}
            {activeTab === 'therapies' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold text-slate-700">Terapias Semanais</h3><Button onClick={handleOpenNewTherapyModal} className="bg-teal-500 hover:bg-teal-600"><Plus className="w-4 h-4 mr-2"/> Adicionar</Button></div>
                    {activeTherapyDays.length === 0 ? <p className="text-slate-400 text-center py-8">Nenhuma terapia recorrente.</p> : (
                        activeTherapyDays.map(dayIndex => (
                            <div key={dayIndex} className="mb-4">
                                <h4 className={`font-bold text-sm uppercase mb-2 ${isDayToday(dayIndex) ? 'text-teal-600' : 'text-slate-500'}`}>{WEEKDAYS[dayIndex]} {isDayToday(dayIndex) && '(Hoje)'}</h4>
                                <div className="space-y-2">
                                    {therapies.filter(t => t.dayOfWeek === dayIndex).sort((a,b) => a.time.localeCompare(b.time)).map(therapy => (
                                        <div key={therapy.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{therapy.time}</span>
                                                    <div><p className="font-bold text-slate-800">{therapy.name}</p>{therapy.professionalName && <p className="text-xs text-slate-500">{therapy.professionalName}</p>}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEditTherapy(therapy)} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                                                    <button onClick={() => requestDeleteTherapy(therapy.id!, therapy.name)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                            <div className="mt-3 bg-teal-50/50 rounded-lg p-2 border border-teal-100">
                                                <div className="space-y-1 mb-2">
                                                    {therapy.tasks?.map(task => (
                                                        <div key={task.id} className="flex items-center gap-2 group">
                                                            <button onClick={() => handleToggleTask(therapy, task)} className={`w-4 h-4 rounded border flex items-center justify-center ${task.isCompleted ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-300'}`}>{task.isCompleted && <Check className="w-3 h-3"/>}</button>
                                                            <span className={`text-xs flex-1 ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.description}</span>
                                                            <button onClick={() => handleDeleteTask(therapy, task.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><X className="w-3 h-3"/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="Adicionar obs/tarefa..." className="flex-1 text-xs px-2 py-1 rounded border border-slate-200" value={taskInputs[therapy.id] || ''} onChange={(e) => handleTaskInputChange(therapy.id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask(therapy)}/>
                                                    <button onClick={() => handleAddTask(therapy)} className="bg-teal-100 text-teal-700 p-1 rounded hover:bg-teal-200"><Plus className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 5. HISTÓRICO ESCOLAR */}
            {activeTab === 'school_history' && showSchoolTab && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700">Histórico de Administração Escolar</h3>
                    {schoolMedLogs.length === 0 ? <p className="text-slate-400 text-center py-8">Nenhum registro de medicação na escola.</p> : (
                        <div className="space-y-3">
                            {schoolMedLogs.map(log => (
                                <div key={log.id} className="p-3 bg-white border border-pink-100 rounded-xl shadow-sm flex items-start gap-3 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-400"></div>
                                    <div className="flex-1 pl-2">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-slate-800 text-sm">{log.medicationName}</p>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {log.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">Dose: {log.dosage}</p>
                                        {log.notes && <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-2 italic border border-slate-100">"{log.notes}"</p>}
                                        <div className="flex items-center gap-1 mt-2">
                                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white"/></div>
                                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Administrado na Escola</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODAIS */}
            <Modal isOpen={isMedModalOpen} onClose={closeMedModal} title={currentMed.id ? "Editar Medicamento" : "Novo Medicamento"}>
                <MedicationForm initialMed={currentMed as Medication} targetUid={targetUid} onClose={closeMedModal} />
            </Modal>

            <Modal isOpen={isStockModalOpen} onClose={() => setStockModalOpen(false)} title="Detalhes do Estoque">
                {currentMedToEditStock && (
                    <div className="space-y-4">
                        <Input label="Tamanho da Embalagem (Doses/Comp por caixa)" type="number" value={currentMedToEditStock.packageSize || 0} onChange={e => handleStockModalChange('packageSize', parseInt(e.target.value))} />
                        <div className="flex items-center gap-2 mt-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <input type="checkbox" checked={currentMedToEditStock.altoCusto || false} onChange={e => handleStockModalChange('altoCusto', e.target.checked)} className="w-5 h-5 text-amber-600"/>
                            <span className="text-sm font-bold text-amber-800">Medicamento de Alto Custo</span>
                        </div>
                        {currentMedToEditStock.altoCusto && (
                            <div className="space-y-3 pl-4 border-l-2 border-amber-200">
                                <TextArea 
                                    label="Instruções de Retirada" 
                                    rows={2} 
                                    value={currentMedToEditStock.altoCustoInstructions || ''} 
                                    onChange={e => handleStockModalChange('altoCustoInstructions', e.target.value)} 
                                    placeholder="Local, documentos, etc..."
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input label="Data de Retirada" type="date" value={currentMedToEditStock.dataRetirada || ''} onChange={e => handleStockModalChange('dataRetirada', e.target.value)} />
                                    <Input label="Hora" type="time" value={currentMedToEditStock.horaRetirada || ''} onChange={e => handleStockModalChange('horaRetirada', e.target.value)} />
                                </div>
                                <p className="text-xs text-amber-600 italic">O sistema enviará um lembrete na data configurada.</p>
                            </div>
                        )}
                        <TextArea 
                            label="Instruções de Uso" 
                            rows={2} 
                            value={currentMedToEditStock.instructions || ''} 
                            onChange={e => handleStockModalChange('instructions', e.target.value)} 
                        />
                        <Button onClick={handleSaveStockDetails} className="w-full">Salvar Detalhes</Button>
                    </div>
                )}
            </Modal>

            {isApptModalOpen && <AppointmentModal initialAppt={currentAppt as Appointment} targetUid={targetUid} onClose={closeApptModal} />}
            {isTherapyModalOpen && <TherapyModal initialTherapy={currentTherapy as Therapy} targetUid={targetUid} onClose={closeTherapyModal} />}
            
            <Modal isOpen={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} title="Confirmar Exclusão">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Tem certeza que deseja excluir <strong>{deleteConfirmation?.title}</strong>? Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setDeleteConfirmation(null)} disabled={isDeleting}>Cancelar</Button>
                        <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Sim, Excluir"}</Button>
                    </div>
                </div>
            </Modal>

            <DocumentViewModal isOpen={isDocumentViewModalOpen} onClose={closeDocumentViewModal} document={documentToView} />
        </div>
    );
};

export default HealthView;
