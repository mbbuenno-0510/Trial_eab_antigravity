import React from 'react';
import { TherapeuticGuideline } from '../types';
import { Card, Button } from './ui';
import { AlertCircle, CheckCircle, XCircle, Brain, BookOpen, Users, Utensils, MessageCircle, Check } from 'lucide-react';

interface GuidelineCardProps {
  guideline: TherapeuticGuideline;
  userRole: 'Parent' | 'School';
  onMarkAsRead?: (guidelineId: string) => void;
  onProvideFeedback?: (guidelineId: string, workedWell: boolean, notes?: string) => void;
}

export const GuidelineCard: React.FC<GuidelineCardProps> = ({ 
  guideline, 
  userRole, 
  onMarkAsRead, 
  onProvideFeedback 
}) => {
  const isRead = userRole === 'Parent' ? guideline.readByParents : guideline.readBySchool;
  const todayDateString = new Date().toISOString().split('T')[0];
  const hasFeedbackToday = guideline.effectivenessFeedback?.some(
    f => f.role === userRole && f.date === todayDateString
  );

  const getCategoryIcon = () => {
    switch (guideline.category) {
      case 'Behavior': return <Brain className="w-5 h-5 text-purple-500" />;
      case 'Sensory': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'Academic': return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'Social': return <Users className="w-5 h-5 text-green-500" />;
      case 'Food': return <Utensils className="w-5 h-5 text-red-500" />;
      default: return <Brain className="w-5 h-5 text-slate-500" />;
    }
  };

  const getCategoryName = () => {
    switch (guideline.category) {
      case 'Behavior': return 'Comportamento';
      case 'Sensory': return 'Sensorial';
      case 'Academic': return 'Pedagógico';
      case 'Social': return 'Social';
      case 'Food': return 'Alimentação';
      default: return 'Geral';
    }
  };

  return (
    <div>
      <Card className="overflow-hidden border-2 border-transparent hover:border-slate-200 transition-all duration-300">
        {/* Header */}
        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {getCategoryIcon()}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getCategoryName()}</span>
              <h4 className="font-bold text-slate-800 leading-tight">{guideline.title}</h4>
            </div>
          </div>
          {isRead && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Check className="w-3 h-3" /> Lida
            </span>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Gatilho */}
          <div className="flex gap-3">
            <div className="mt-0.5">
              <AlertCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-0.5">Quando acontecer (Gatilho)</p>
              <p className="text-sm text-slate-700">{guideline.trigger}</p>
            </div>
          </div>

          {/* Ação */}
          <div className="flex gap-3 bg-green-50/50 p-3 rounded-xl border border-green-100">
            <div className="mt-0.5">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-green-700 uppercase mb-0.5">O que fazer (Ação)</p>
              <p className="text-sm text-green-800">{guideline.actionPlan}</p>
            </div>
          </div>

          {/* Evitar */}
          <div className="flex gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100">
            <div className="mt-0.5">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-700 uppercase mb-0.5">O que EVITAR</p>
              <p className="text-sm text-red-800">{guideline.avoid}</p>
            </div>
          </div>
          
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-400">
            <span>Criado por: {guideline.professionalName}</span>
          </div>
        </div>

        {/* Ações / Feedback */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between">
          {!isRead ? (
            <Button 
              variant="primary" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={() => onMarkAsRead && onMarkAsRead(guideline.id)}
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar como Entendido
            </Button>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">Feedback de eficácia (Hoje)</span>
              
              {!hasFeedbackToday ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 sm:flex-none text-red-600 bg-red-50 hover:bg-red-100"
                    onClick={() => onProvideFeedback && onProvideFeedback(guideline.id, false)}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Não ajudou
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 sm:flex-none text-green-600 bg-green-50 hover:bg-green-100"
                    onClick={() => onProvideFeedback && onProvideFeedback(guideline.id, true)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Funcionou bem
                  </Button>
                </div>
              ) : (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Feedback enviado hoje
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
