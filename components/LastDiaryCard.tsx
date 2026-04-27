import React from 'react';
import { MoodEntry, MoodType } from '../types'; 
import { Card } from './ui'; 

interface LastDiaryCardProps { 
    lastEntry: MoodEntry | null; 
}

const getMoodEmoji = (moodText: string): string => {
    const moodMap: { [key: string]: string } = {
        [MoodType.HAPPY]: '😊',
        [MoodType.SAD]: '😢',
        [MoodType.ANGRY]: '😠',
        [MoodType.ANXIOUS]: '😨',
        [MoodType.CALM]: '😌',
        [MoodType.TIRED]: '😐',
        'ALEGRIA': '😊', 'TRISTEZA': '😢', 'RAIVA': '😠', 'MEDO': '😨', 'CALMA': '😌', 'NORMAL': '😐',
        'DEFAULT': '🤔',
    };
    const key = moodText ? moodText.toUpperCase() : 'DEFAULT';
    return moodMap[key] || moodMap['DEFAULT'];
};

const formatDateFromEntry = (entry: MoodEntry): string => {
    let date: Date;
    let dateInput: any = entry.timestamp || entry.dateString;
    
    if (!dateInput) return 'Data Desconhecida';

    if (dateInput.seconds && typeof dateInput.seconds === 'number') {
        date = new Date(dateInput.seconds * 1000);
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        return 'Data Inválida';
    }
    
    if (isNaN(date.getTime())) return 'Data Inválida';

    const today = new Date();
    const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    
    if (entryDay.getTime() === todayDay.getTime()) {
        return `Hoje, ${date.toLocaleTimeString('pt-BR', timeOptions)}`;
    }

    const dateOptions: Intl.DateTimeFormatOptions = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    };

    const formattedDate = date.toLocaleDateString('pt-BR', dateOptions);
    const formattedTime = date.toLocaleTimeString('pt-BR', timeOptions);
    
    return `${formattedDate} às ${formattedTime}`;
};

const translateMood = (moodKey: string): string => {
    const translations: { [key: string]: string } = {
        [MoodType.HAPPY]: 'Alegria',
        [MoodType.SAD]: 'Tristeza',
        [MoodType.ANGRY]: 'Raiva',
        [MoodType.ANXIOUS]: 'Medo',
        [MoodType.CALM]: 'Calma',
        [MoodType.TIRED]: 'Normal',
    };
    return translations[moodKey] || moodKey;
};

const LastDiaryCard: React.FC<LastDiaryCardProps> = ({ lastEntry }) => {
    
    if (!lastEntry) {
        return (
             <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-lg">
                 <h3 className="text-lg font-semibold mb-2">Último Registro do Diário</h3>
                 <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                     <span className="text-4xl mb-2">📖</span> 
                     <p>Nenhum registro encontrado.</p>
                 </div>
             </Card>
        );
    }
    
    const displayMood = translateMood(lastEntry.mood); 
    const moodEmoji = getMoodEmoji(lastEntry.mood); 
    const formattedDate = formatDateFromEntry(lastEntry);
    
    const contentPreview = lastEntry.notes || lastEntry.aiFeedback || 'Nenhum conteúdo.';

    return (
        <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Último Registro do Diário</h3>
            
            <div className="flex items-start space-x-3">
                
                <div className="flex-shrink-0 text-3xl pt-1">
                    {moodEmoji}
                </div>
                
                <div className="flex flex-col">
                    <p className="text-base font-bold text-slate-800">
                        {displayMood} 
                    </p>
                    <p className="text-sm text-slate-500">
                        {formattedDate} 
                    </p>
                </div>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg mt-3 border border-slate-100">
                <p className="text-sm text-slate-700 italic line-clamp-3">
                    "{contentPreview}"
                </p>
            </div>
        </Card>
    );
};

export default LastDiaryCard;