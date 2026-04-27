import React from 'react';
// Assumindo que RoutineItem, RoutineFrequency, Period são definidos em '../types'
import { RoutineItem, RoutineFrequency, Period } from '../types'; 

interface RoutineListItemProps {
    routine: RoutineItem;
    today: string;
    executionBlocked: boolean;
    canManage: boolean;
    toggleRoutine: (id: string) => void;
    openDeleteConfirmation: (id: string) => void;
}

// Lógica de mapeamento de classes para as tags de frequência
const getFrequencyClasses = (frequency: RoutineFrequency | undefined) => {
    switch (frequency) {
        case 'Diário':
            return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'Semanal':
            return 'bg-purple-50 text-purple-600 border-purple-100';
        case 'Mensal':
            return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'Ocasional':
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200';
    }
}

const RoutineListItem: React.FC<RoutineListItemProps> = ({
    routine,
    today,
    executionBlocked,
    canManage,
    toggleRoutine,
    openDeleteConfirmation
}) => {
    
    const completed = routine.lastCompletedDate === today;
    const frequencyClasses = getFrequencyClasses(routine.frequency);
    
    // Classes CSS de estado (concluída vs. pendente)
    const containerClasses = completed 
        ? 'bg-slate-50 border-slate-100 opacity-60' 
        : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100';

    const completionButtonClasses = completed
        ? 'bg-green-500 border-green-500 text-white' 
        : 'border-slate-300 hover:border-indigo-500';

    const disabledClasses = executionBlocked ? 'cursor-not-allowed opacity-50' : '';

    return (
        <div 
            key={routine.id} 
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${containerClasses}`}
        >
            
            {/* 1. Botão de Conclusão/Check */}
            <button 
                onClick={() => toggleRoutine(routine.id)}
                disabled={executionBlocked} 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${completionButtonClasses} ${disabledClasses}`}
            >
                {completed && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>
            
            {/* 2. Ícone */}
            <div className="w-8 h-8 flex items-center justify-center text-xl bg-slate-100 rounded-lg flex-shrink-0">
                {routine.icon || '📝'}
            </div>
            
            {/* 3. Título e Tags */}
            <div className="flex-1 min-w-0">
                <p className={`font-medium text-slate-800 truncate ${completed ? 'line-through text-slate-500' : ''}`}>
                    {routine.title}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    {/* Tag de Frequência */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${frequencyClasses}`}>
                        {routine.frequency || 'Diário'}
                    </span>
                    {/* Tag de Período */}
                    {routine.period && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-sky-50 text-sky-600 border-sky-100">
                            {routine.period}
                        </span>
                    )}
                </p>
            </div>
            
            {/* 4. Botão de Excluir Rotina (Apenas para Gerenciadores) */}
            {canManage && (
                <button 
                    onClick={() => openDeleteConfirmation(routine.id)} 
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 cursor-pointer flex-shrink-0"
                    title="Excluir Rotina"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export default RoutineListItem;