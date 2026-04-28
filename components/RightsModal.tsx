import React from 'react';
import { Scale, X, Shield, Activity, Users, BookOpen } from 'lucide-react';

interface RightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RightsModal: React.FC<RightsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-500 border-4 border-white">
        
        {/* Header Decor */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shrink-0"></div>

        {/* Header Content */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-4 shrink-0">
          <div className="bg-indigo-100 p-3 rounded-2xl">
            <Scale className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Direitos e Prerrogativas</h2>
            <p className="text-sm text-slate-500 font-medium">Guia Rápido de Inclusão e Acesso</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* 1. Escola */}
          <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-black text-blue-900">1. No Ambiente Escolar</h3>
              <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded-full ml-auto">O escudo contra a exclusão</span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                  LBI (Lei 13.146/2015)
                </h4>
                <p className="text-sm text-slate-600 mb-2">A Lei Brasileira de Inclusão é a bíblia. O Artigo 28, inciso V, proíbe a exclusão e obriga a escola a oferecer "medidas de adaptação razoáveis".</p>
                <div className="bg-red-50 text-red-800 text-xs font-bold p-2 rounded-lg flex items-start gap-2">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <p>Ponto Chave: A escola NÃO pode cobrar taxa extra nem isolar o aluno sob pretexto de segurança.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h4 className="font-bold text-slate-800 mb-1">Lei Berenice Piana (Lei 12.764/2012)</h4>
                <p className="text-sm text-slate-600 mb-2">Institui a Política Nacional de Proteção dos Direitos da Pessoa com TEA.</p>
                <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-2 rounded-lg flex items-start gap-2">
                  <Users className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <p>Ponto Chave: Garante o direito ao Acompanhante Especializado (AT/mediador) dentro da sala de aula, pago pela escola (pública ou privada).</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-indigo-400">
                <h4 className="font-bold text-slate-800 mb-1">Nota Técnica 24/2013 do MEC</h4>
                <p className="text-sm text-slate-600">Deixa claro que o apoio deve ocorrer dentro da classe regular, nunca em salas separadas de forma permanente.</p>
              </div>
            </div>
          </div>

          {/* 2. Saúde */}
          <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-100">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-black text-teal-900">2. Na Saúde</h3>
              <span className="text-xs font-bold bg-teal-200 text-teal-800 px-2 py-1 rounded-full ml-auto">Suporte para o tratamento</span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h4 className="font-bold text-slate-800 mb-1">Súmula 102 do TJ-SP</h4>
                <p className="text-sm text-slate-600">Muito importante! Ela diz que, se houver indicação médica, o plano de saúde não pode negar o tratamento (incluindo o AT em domicílio ou escola).</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-teal-400">
                <h4 className="font-bold text-slate-800 mb-1">RN 469/2021 da ANS</h4>
                <p className="text-sm text-slate-600">Garante que o atendimento para TEA tem número ILIMITADO de sessões de fonoaudiologia, psicologia e terapia ocupacional.</p>
              </div>
            </div>
          </div>

          {/* 3. Sociedade e Lazer */}
          <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-black text-purple-900">3. Na Sociedade e Lazer</h3>
              <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-1 rounded-full ml-auto">Proteção contra preconceito</span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h4 className="font-bold text-slate-800 mb-1">Lei 13.977/2020 (Lei Romeo Mion)</h4>
                <p className="text-sm text-slate-600">Cria a CIPTEA (Carteira de Identificação da Pessoa com Transtorno do Espectro Autista).</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-400">
                <h4 className="font-bold text-slate-800 mb-1">Lei 10.048/2000</h4>
                <p className="text-sm text-slate-600">Garante o atendimento prioritário em qualquer lugar (filas, bancos, hospitais, etc).</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-black shadow-lg transition-colors"
          >
            ENTENDI MEUS DIREITOS
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightsModal;
