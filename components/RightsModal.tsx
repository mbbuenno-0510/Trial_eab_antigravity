import React from 'react';
import { X, Scale, Shield, Gavel, Heart, Info, ExternalLink } from 'lucide-react';

interface RightsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RightsModal: React.FC<RightsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border-[6px] border-slate-100">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Scale className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Direitos e Leis</h2>
                            <p className="text-blue-100 text-xs font-medium">Conheça os direitos da criança neurodivergente</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8 bg-slate-50">
                    
                    {/* Intro */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Este guia resume as principais legislações brasileiras que garantem proteção, 
                                inclusão e dignidade para crianças com TEA, TDAH e outras neurodivergências. 
                                Conhecer seus direitos é o primeiro passo para a inclusão plena.
                            </p>
                        </div>
                    </div>

                    {/* Section 1 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">1. Lei Berenice Piana (Lei nº 12.764/12)</h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-700 font-bold mb-3">Esta é a lei mais específica para o Autismo (TEA).</p>
                            <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                Ela instituiu a Política Nacional de Proteção dos Direitos da Pessoa com Transtorno do Espectro Autista.
                            </p>
                            <div className="bg-indigo-50 p-4 rounded-xl space-y-2">
                                <p className="text-xs font-black text-indigo-800 uppercase">O que diz:</p>
                                <p className="text-sm text-slate-700">Define que a pessoa com TEA é considerada pessoa com deficiência para todos os efeitos legais.</p>
                                <div className="pt-2">
                                    <p className="text-xs font-black text-indigo-800 uppercase mb-2">Direitos Chave:</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2 text-sm text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                            Acesso a ações e serviços de saúde de forma prioritária.
                                        </li>
                                        <li className="flex items-start gap-2 text-sm text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                            Inclusão em classes comuns de ensino regular.
                                        </li>
                                        <li className="flex items-start gap-2 text-sm text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                            Direito a acompanhante especializado em sala de aula (comprovada a necessidade).
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">2. Lei Brasileira de Inclusão - LBI (Lei nº 13.146/15)</h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-700 font-bold mb-3">Conhecida como o Estatuto da Pessoa com Deficiência.</p>
                            <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                É o "guarda-chuva" que protege crianças com TDAH, Autismo, Síndrome de Down e outras condições.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <p className="text-xs font-black text-blue-800 uppercase mb-2">Inclusão Digital</p>
                                    <p className="text-sm text-slate-700 leading-tight">Exige que sites e plataformas digitais mantenham recursos de acessibilidade.</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl">
                                    <p className="text-xs font-black text-red-800 uppercase mb-2">Combate à Discriminação</p>
                                    <p className="text-sm text-slate-700 leading-tight">Define como crime qualquer forma de discriminação, negligência ou violência.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-pink-600" />
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">3. Estatuto da Criança e do Adolescente - ECA (Lei nº 8.069/90)</h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-700 font-bold mb-3">O ECA é a base de toda a proteção infantil.</p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-pink-600 font-black">!</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Prioridade Absoluta</p>
                                        <p className="text-sm text-slate-600 leading-tight">O atendimento e a proteção da criança devem vir antes de qualquer outra demanda institucional.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-pink-600 font-black">🎨</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Direito ao Brincar e Aprender</p>
                                        <p className="text-sm text-slate-600 leading-tight">Garante que o desenvolvimento cultural e recreativo seja adaptado às condições da criança.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 pb-2">
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Easy Autism Bridge • Informação é Poder</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-100 border-t border-slate-200 shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 uppercase tracking-tighter text-sm"
                    >
                        Entendi meus Direitos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RightsModal;
