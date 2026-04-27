
import React, { useState, useEffect } from 'react';
import firebase, { db, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, BehaviorEntry, BehaviorEventType, CrisisIntensity } from '../types';
import { AlertTriangle, Utensils, Moon, Zap, AlertCircle, Gift, Save, Clock, Trash2, Calendar } from 'lucide-react';

interface BehaviorDiaryProps {
  userProfile: UserProfile;
  preSelectedChildId?: string | null; 
  readOnly?: boolean; 
  startDate?: string; // 🆕 Filtro Data Início
  endDate?: string;   // 🆕 Filtro Data Fim
}

const EVENT_TYPES: { id: BehaviorEventType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'CRISIS', label: 'Crise', icon: <AlertTriangle />, color: 'bg-red-100 text-red-600 border-red-200' },
  { id: 'FOOD', label: 'Alimentação', icon: <Utensils />, color: 'bg-green-100 text-green-600 border-green-200' },
  { id: 'SLEEP', label: 'Sono', icon: <Moon />, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 'HYPERFOCUS', label: 'Hiperfoco', icon: <Zap />, color: 'bg-purple-100 text-purple-600 border-purple-200' },
  { id: 'TRIGGER', label: 'Gatilho', icon: <AlertCircle />, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { id: 'REINFORCER', label: 'Reforçador', icon: <Gift />, color: 'bg-pink-100 text-pink-600 border-pink-200' },
];

const INTENSITIES: { id: CrisisIntensity; label: string; color: string }[] = [
  { id: 'LEVE', label: 'Leve', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'MODERADA', label: 'Moderada', color: 'bg-orange-100 text-orange-700' },
  { id: 'INTENSA', label: 'Intensa', color: 'bg-red-100 text-red-700' },
];

// Helper para obter data local formatada (YYYY-MM-DD)
const getLocalTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const BehaviorDiary: React.FC<BehaviorDiaryProps> = ({ userProfile, preSelectedChildId, readOnly = false, startDate, endDate }) => {
  const [selectedType, setSelectedType] = useState<BehaviorEventType | null>(null);
  const [intensity, setIntensity] = useState<CrisisIntensity | null>(null);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [period, setPeriod] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã');
  
  // Inicialização com Data Local
  const [entryDate, setEntryDate] = useState(getLocalTodayString());
  
  const [history, setHistory] = useState<BehaviorEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Determinar o UID da criança alvo
  const targetUid = preSelectedChildId || (userProfile.manages && userProfile.manages.length > 0 ? userProfile.manages[0] : null);

  // Carregar histórico com filtros opcionais
  useEffect(() => {
    if (!targetUid) return;

    let query: any = db.collection('users').doc(targetUid).collection('behavior_entries');

    // 🆕 Lógica de Filtro de Datas
    if (startDate || endDate) {
        // Se houver filtro, ordena por dataString para permitir range queries simples sem índices complexos imediatos
        query = query.orderBy('dateString', 'desc');
        
        if (startDate) query = query.where('dateString', '>=', startDate);
        if (endDate) query = query.where('dateString', '<=', endDate);
    } else {
        // Comportamento padrão: últimos 20 por timestamp
        query = query.orderBy('timestamp', 'desc').limit(20);
    }

    const unsubscribe = query.onSnapshot(snapshot => {
        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BehaviorEntry));
        // Filter out system generated alerts (Calm Room)
        const filteredEntries = entries.filter(e => e.authorId !== 'SYSTEM');
        setHistory(filteredEntries);
      }, (err: any) => handleFirestoreError(err, OperationType.LIST, `users/${targetUid}/behavior_entries`));

    return () => unsubscribe();
  }, [targetUid, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUid || !selectedType) return;

    if (selectedType === 'CRISIS' && !intensity) {
      alert("Por favor, selecione a intensidade da crise.");
      return;
    }

    setLoading(true);
    try {
      const newEntry: Omit<BehaviorEntry, 'id'> = {
        userId: targetUid,
        authorId: userProfile.uid,
        timestamp: Date.now(),
        dateString: entryDate,
        type: selectedType,
        period,
        description,
        duration,
        ...(selectedType === 'CRISIS' && { intensity: intensity || undefined }),
      };

      const path = `users/${targetUid}/behavior_entries`;
      await db.collection('users').doc(targetUid).collection('behavior_entries').add(newEntry).catch(err => handleFirestoreError(err, OperationType.WRITE, path));
      
      // Reset form
      setSelectedType(null);
      setIntensity(null);
      setDescription('');
      setDuration('');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar registro.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    if (!targetUid || !window.confirm("Apagar este registro?")) return;
    const path = `users/${targetUid}/behavior_entries/${id}`;
    try {
      await db.collection('users').doc(targetUid).collection('behavior_entries').doc(id).delete().catch(err => handleFirestoreError(err, OperationType.DELETE, path));
    } catch (error) {
      console.error("Erro ao apagar:", error);
    }
  };

  if (!targetUid) {
    return <div className="p-4 text-center text-slate-500">Nenhuma criança vinculada ou selecionada.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* SELEÇÃO DO TIPO DE EVENTO - OCULTO SE READONLY */}
      {!readOnly && (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                O que você observou?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EVENT_TYPES.map((type) => (
                <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); setIntensity(null); }}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedType === type.id 
                    ? `${type.color} ring-2 ring-offset-2 ring-blue-100` 
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
                >
                <div className="text-xl">{type.icon}</div>
                <span className="text-xs font-bold">{type.label}</span>
                </button>
            ))}
            </div>
        </div>
      )}

      {/* FORMULÁRIO DE DETALHES - OCULTO SE READONLY */}
      {!readOnly && selectedType && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-blue-200 shadow-md animate-in slide-in-from-top-2">
           <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  {EVENT_TYPES.find(t => t.id === selectedType)?.icon}
                  Detalhes: {EVENT_TYPES.find(t => t.id === selectedType)?.label}
              </h3>
              <button type="button" onClick={() => setSelectedType(null)} className="text-xs text-slate-400 underline">Cancelar</button>
           </div>

           <div className="space-y-4">
              <div className="flex gap-3">
                 <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Data</label>
                    <input 
                        type="date" 
                        value={entryDate} 
                        onChange={e => setEntryDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Período</label>
                    <select 
                        value={period} 
                        onChange={e => setPeriod(e.target.value as any)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                    </select>
                 </div>
              </div>

              {selectedType === 'CRISIS' && (
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Intensidade da Crise</label>
                      <div className="flex gap-2">
                          {INTENSITIES.map(lvl => (
                              <button
                                key={lvl.id}
                                type="button"
                                onClick={() => setIntensity(lvl.id)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                                    intensity === lvl.id 
                                    ? lvl.color + ' border-transparent ring-2 ring-offset-1 ring-slate-200'
                                    : 'bg-white text-slate-500 border-slate-200'
                                }`}
                              >
                                {lvl.label}
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">O que aconteceu? (Observações)</label>
                  <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Descreva gatilhos, contexto ou alimentos..."
                      className="w-full p-3 border border-slate-200 rounded-lg text-sm h-24 resize-none"
                  />
              </div>

              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Duração (Opcional)</label>
                  <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input 
                          type="text" 
                          value={duration} 
                          onChange={e => setDuration(e.target.value)}
                          placeholder="Ex: 20 min"
                          className="w-full pl-9 p-2 border border-slate-200 rounded-lg text-sm"
                      />
                  </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                  <Save className="w-4 h-4" />
                  {loading ? 'Salvando...' : 'Registrar Evento'}
              </button>
           </div>
        </form>
      )}

      {/* HISTÓRICO RECENTE */}
      <div className={readOnly ? "" : "mt-8"}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Histórico {startDate || endDate ? '(Filtrado)' : 'Recente'}
            </h3>
          </div>
          
          <div className="space-y-3">
              {history.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">Nenhum registro comportamental encontrado.</p>
              ) : (
                  history.map(entry => {
                      const typeInfo = EVENT_TYPES.find(t => t.id === entry.type);
                      return (
                          <div key={entry.id} className="bg-white p-3 rounded-xl border-l-4 shadow-sm border-slate-100 flex gap-3 relative" style={{ borderLeftColor: typeInfo?.color.includes('red') ? '#ef4444' : '#cbd5e1' }}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeInfo?.color.split(' ')[0]} ${typeInfo?.color.split(' ')[1]}`}>
                                  {typeInfo?.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                      <p className="font-bold text-slate-800 text-sm">{typeInfo?.label}</p>
                                      <span className="text-[10px] text-slate-400">
                                          {new Date(entry.dateString).toLocaleDateString('pt-BR')} • {entry.period}
                                      </span>
                                  </div>
                                  
                                  {entry.intensity && (
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${INTENSITIES.find(i => i.id === entry.intensity)?.color}`}>
                                          {entry.intensity}
                                      </span>
                                  )}
                                  
                                  {entry.description && (
                                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">"{entry.description}"</p>
                                  )}
                                  
                                  {entry.duration && (
                                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {entry.duration}
                                      </p>
                                  )}
                              </div>
                              {!readOnly && (
                                <button onClick={() => handleDelete(entry.id)} className="absolute bottom-2 right-2 text-slate-300 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                          </div>
                      );
                  })
              )}
          </div>
      </div>
    </div>
  );
};

export default BehaviorDiary;
