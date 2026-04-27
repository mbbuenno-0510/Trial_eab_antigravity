// src/components/DashboardSummaryCard.tsx

import React from 'react';
import { Card } from './ui'; // Assumindo o componente Card de sua biblioteca de UI
import { BookOpen, Calendar, FileText, CheckSquare, Heart } from 'lucide-react'; // Ícones comuns de resumo

// Mapeamento de strings para ícones reais (ajuste conforme necessário)
const iconMap: { [key: string]: React.ElementType } = {
    Diary: BookOpen,
    Calendar: Calendar,
    Document: FileText,
    Task: CheckSquare,
    Default: Heart,
};

interface DashboardSummaryCardProps {
    title: string;
    value: number;
    icon: 'Diary' | 'Calendar' | 'Document' | 'Task' | string;
}

const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({ title, value, icon }) => {
    
    // Seleciona o ícone com base na string fornecida (fazendo fallback para Heart se não mapeado)
    const IconComponent = iconMap[icon] || iconMap.Default;

    return (
        <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-lg flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
                
                {/* Ícone */}
                <IconComponent className="w-6 h-6 text-blue-500" />
                
                {/* Valor/Contagem */}
                <span className="text-3xl font-bold text-slate-800">
                    {value}
                </span>
            </div>
            
            {/* Título */}
            <p className="text-sm text-slate-500 mt-2 leading-tight">
                {title}
            </p>
        </Card>
    );
};

export default DashboardSummaryCard;