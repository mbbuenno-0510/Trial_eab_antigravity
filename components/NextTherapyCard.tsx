// src/components/NextTherapyCard.tsx

import React from 'react';
import { Appointment } from '../types'; // Importando o tipo unificado Appointment

// Assumindo que a interface Appointment tem 'title: string' e 'time: string'
interface NextTherapyCardProps {
    nextTherapy: Appointment;
}

const NextTherapyCard: React.FC<NextTherapyCardProps> = ({ nextTherapy }) => {
    
    // ✅ CORREÇÃO: Priorizar a propriedade 'title' que foi unificada no useDashboardData.ts.
    // 'name' é mantido como fallback, caso o objeto Appointment original o contenha.
    const therapyName = nextTherapy.title || (nextTherapy as any).name || "Compromisso não Definido"; 
    
    // Formata a hora para exibição (ex: "10:00")
    const therapyTime = nextTherapy.time || 'N/A'; 

    // Formata a data para exibição (ex: "Segunda-feira, 28/Nov")
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString || dateString.length < 10) return 'Data Indefinida';
        
        // A data vem em formato YYYY-MM-DD. Adicionar a hora "T00:00:00" evita problemas de fuso horário.
        const date = new Date(`${dateString}T00:00:00`); 
        
        if (isNaN(date.getTime())) return 'Data Inválida';

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        if (isToday) return 'Hoje';
        if (isTomorrow) return 'Amanhã';

        return date.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'short' 
        });
    };
    
    // nextTherapy.date é a data calculada (ou a data única)
    const formattedDate = formatDate(nextTherapy.date);

    return (
        <div className="p-4 bg-white border border-slate-100 shadow-lg rounded-xl">
            <h3 className="text-sm font-semibold text-blue-600 mb-1 flex items-center">
                📅 Próximo Compromisso
            </h3>
            
            <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 text-xl font-extrabold text-slate-800">
                    {therapyTime}
                </div>
                
                <div>
                    {/* Exibe o nome corrigido da terapia/consulta */}
                    <p className="text-lg font-bold text-slate-900 leading-tight">
                        {therapyName}
                    </p>
                    
                    {/* Exibe a data formatada */}
                    <p className="text-sm text-slate-500 capitalize">
                        {formattedDate}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NextTherapyCard;