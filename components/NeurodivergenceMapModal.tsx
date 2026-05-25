import React, { useState } from 'react';
import { X, Brain, Zap, Lightbulb, Eye, Heart, HelpCircle, Layers, CheckCircle2, Sparkles, Smile, Info } from 'lucide-react';

interface NeurodivergenceMapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'AUTISMO' | 'TDAH' | 'ALTAS_CAPACIDADES' | 'TPS' | 'EM_COMUM' | 'APOIAR';

const NeurodivergenceMapModal: React.FC<NeurodivergenceMapModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('EM_COMUM');

    if (!isOpen) return null;

    // Paleta de Cores Pastel combinando com o app EAB
    const colors = {
        autismo: {
            border: 'border-blue-200',
            bg: 'bg-blue-50',
            badgeBg: 'bg-blue-100',
            text: 'text-blue-800',
            accent: '#A9CCE3',
            hover: 'hover:border-blue-300 hover:bg-blue-50/50'
        },
        tdah: {
            border: 'border-amber-200',
            bg: 'bg-amber-50',
            badgeBg: 'bg-amber-100',
            text: 'text-amber-800',
            accent: '#F9E79F',
            hover: 'hover:border-amber-300 hover:bg-amber-50/50'
        },
        altasCapacidades: {
            border: 'border-rose-200',
            bg: 'bg-rose-50',
            badgeBg: 'bg-rose-100',
            text: 'text-rose-800',
            accent: '#F1948A',
            hover: 'hover:border-rose-300 hover:bg-rose-50/50'
        },
        tps: {
            border: 'border-teal-200',
            bg: 'bg-teal-50',
            badgeBg: 'bg-teal-100',
            text: 'text-teal-800',
            accent: '#76D7C4',
            hover: 'hover:border-teal-300 hover:bg-teal-50/50'
        },
        emComum: {
            border: 'border-purple-200',
            bg: 'bg-purple-50',
            badgeBg: 'bg-purple-100',
            text: 'text-purple-800',
            accent: '#D7BDE2',
            hover: 'hover:border-purple-300 hover:bg-purple-50/50'
        },
        apoiar: {
            border: 'border-emerald-200',
            bg: 'bg-emerald-50',
            badgeBg: 'bg-emerald-100',
            text: 'text-emerald-800',
            accent: '#A3E4D7',
            hover: 'hover:border-emerald-300 hover:bg-emerald-50/50'
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border-[6px] border-slate-100">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-6 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md animate-pulse">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">O Mapa da Neurodivergência</h2>
                            <p className="text-blue-100 text-xs md:text-sm font-medium">Entendendo as conexões, sensibilidades e formas únicas de aprender</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                        aria-label="Fechar modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Sub-Header Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2 text-slate-700 shrink-0">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-xs font-semibold leading-tight">
                        Clique nos cartões ou abas abaixo para interagir e detalhar cada condição, as conexões mútuas e como apoiar no dia a dia.
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
                    
                    {/* Interactive Grid Map (Venn-like representation) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Autismo Card */}
                        <button 
                            onClick={() => setActiveTab('AUTISMO')}
                            className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 ${
                                activeTab === 'AUTISMO' 
                                ? 'bg-blue-100/90 border-blue-400 shadow-md translate-y-[-2px]' 
                                : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm active:scale-98'
                            }`}
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-3xl flex items-center justify-center font-bold text-lg">🧩</div>
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Eixo 1</span>
                            <span className="text-sm md:text-base font-black text-slate-800 tracking-tight">AUTISMO</span>
                            <span className="text-[10px] text-slate-500 font-bold leading-none mt-1">Previsibilidade & Foco</span>
                        </button>

                        {/* TDAH Card */}
                        <button 
                            onClick={() => setActiveTab('TDAH')}
                            className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 ${
                                activeTab === 'TDAH' 
                                ? 'bg-amber-100/90 border-amber-400 shadow-md translate-y-[-2px]' 
                                : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm active:scale-98'
                            }`}
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-3xl flex items-center justify-center font-bold text-lg">⚡</div>
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Eixo 2</span>
                            <span className="text-sm md:text-base font-black text-slate-800 tracking-tight">TDAH</span>
                            <span className="text-[10px] text-slate-500 font-bold leading-none mt-1">Movimento & Estímulo</span>
                        </button>

                        {/* Altas Capacidades Card */}
                        <button 
                            onClick={() => setActiveTab('ALTAS_CAPACIDADES')}
                            className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 ${
                                activeTab === 'ALTAS_CAPACIDADES' 
                                ? 'bg-rose-100/90 border-rose-400 shadow-md translate-y-[-2px]' 
                                : 'bg-white border-slate-200 hover:border-rose-300 shadow-sm active:scale-98'
                            }`}
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 rounded-bl-3xl flex items-center justify-center font-bold text-lg">💡</div>
                            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Eixo 3</span>
                            <span className="text-sm md:text-base font-black text-slate-800 tracking-tight">ALTAS CAPACIDADES</span>
                            <span className="text-[10px] text-slate-500 font-bold leading-none mt-1">Pensamento Abstrato</span>
                        </button>

                        {/* TPS Card */}
                        <button 
                            onClick={() => setActiveTab('TPS')}
                            className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 ${
                                activeTab === 'TPS' 
                                ? 'bg-teal-100/90 border-teal-400 shadow-md translate-y-[-2px]' 
                                : 'bg-white border-slate-200 hover:border-teal-300 shadow-sm active:scale-98'
                            }`}
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-teal-500/10 rounded-bl-3xl flex items-center justify-center font-bold text-lg">👁️</div>
                            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Eixo 4</span>
                            <span className="text-sm md:text-base font-black text-slate-800 tracking-tight">TPS (Sensorial)</span>
                            <span className="text-[10px] text-slate-500 font-bold leading-none mt-1">Filtro de Estímulos</span>
                        </button>
                    </div>

                    {/* Quick navigation for intersections / support */}
                    <div className="flex gap-2 justify-center">
                        <button 
                            onClick={() => setActiveTab('EM_COMUM')}
                            className={`px-5 py-2.5 rounded-full font-black text-xs transition-all flex items-center gap-2 border shadow-sm ${
                                activeTab === 'EM_COMUM' 
                                ? 'bg-purple-600 text-white border-purple-600 scale-102 shadow-md' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-purple-600'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" /> EM COMUM (INTERSEÇÕES)
                        </button>
                        <button 
                            onClick={() => setActiveTab('APOIAR')}
                            className={`px-5 py-2.5 rounded-full font-black text-xs transition-all flex items-center gap-2 border shadow-sm ${
                                activeTab === 'APOIAR' 
                                ? 'bg-emerald-600 text-white border-emerald-600 scale-102 shadow-md' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                            }`}
                        >
                            <Heart className="w-3.5 h-3.5" /> COMO APOIAR (AÇÕES)
                        </button>
                    </div>

                    {/* Detailed Interactive Panel based on Active Tab */}
                    <div className="animate-in fade-in-50 duration-300">
                        {activeTab === 'AUTISMO' && (
                            <div className="bg-white rounded-3xl border-[3px] border-blue-200 p-6 shadow-md space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                                        <Brain className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <span className="badge bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">Eixo 1</span>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">AUTISMO</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    O Autismo (TEA) caracteriza-se por particularidades na comunicação, interação social, processamento sensorial e preferência por padrões de comportamento e interesses mais focados.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                        <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">Características Principais</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 text-xs font-bold">✓</div>
                                                <span><strong>Prefere rotina e previsibilidade:</strong> Reduz ansiedade e traz estabilidade.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 text-xs font-bold">✓</div>
                                                <span><strong>Comunicação direta e clara:</strong> Facilita a compreensão lógica.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 text-xs font-bold">✓</div>
                                                <span><strong>Interesses intensos e profundos:</strong> Foco concentrado em temas específicos.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                        <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">Processamento & Cognição</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 text-xs font-bold">✓</div>
                                                <span><strong>Pensamento mais concreto:</strong> Entende melhor referências diretas do que metáforas abstratas.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 text-xs font-bold">✓</div>
                                                <span><strong>Sensibilidade sensorial (hiper ou hipo):</strong> Respostas intensas ou atenuadas a luzes, sons e texturas.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-blue-800 bg-blue-100/50 p-2.5 rounded-xl border border-blue-200 mt-2 font-medium">
                                                <span className="text-base leading-none">🤝</span>
                                                <span><strong>Interseção com TDAH:</strong> Necessidade comum de autorregulação física e movimento corporal.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'TDAH' && (
                            <div className="bg-white rounded-3xl border-[3px] border-amber-200 p-6 shadow-md space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                                        <Zap className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <span className="badge bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">Eixo 2</span>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">TDAH</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    O Transtorno do Déficit de Atenção com Hiperatividade envolve diferenças no sistema de regulação de dopamina, impactando as funções executivas, atenção e o controle de impulsos.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3">
                                        <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Características Principais</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 text-xs font-bold">✓</div>
                                                <span><strong>Dificuldade para manter o foco:</strong> A mente busca constantemente novos estímulos interessantes.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 text-xs font-bold">✓</div>
                                                <span><strong>Impulsividade:</strong> Ação imediata precedendo a análise analítica de consequências.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 text-xs font-bold">✓</div>
                                                <span><strong>Necessidade de movimento (fidgeting):</strong> O movimento físico auxilia a focar a mente.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3">
                                        <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Funções Executivas</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 text-xs font-bold">✓</div>
                                                <span><strong>Memória de trabalho afetada:</strong> Dificuldade para guardar instruções sequenciais de curto prazo.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 text-xs font-bold">✓</div>
                                                <span><strong>Busca por novidade e estímulos:</strong> Atividades novas ativam o foco e a motivação.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-amber-800 bg-amber-100/50 p-2.5 rounded-xl border border-amber-200 mt-2 font-medium">
                                                <span className="text-base leading-none">🧠</span>
                                                <span><strong>Interseção com TPS:</strong> Desafios constantes com autorregulação física e filtros de estímulo externo.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ALTAS_CAPACIDADES' && (
                            <div className="bg-white rounded-3xl border-[3px] border-rose-200 p-6 shadow-md space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-rose-100 p-3 rounded-2xl text-rose-600">
                                        <Lightbulb className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <span className="badge bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">Eixo 3</span>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">ALTAS CAPACIDADES (Superdotação)</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    Caracteriza-se por um desenvolvimento cognitivo acelerado, habilidade superior em resolver problemas complexos e uma curiosidade intensa por compreender o mundo com profundidade.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-3">
                                        <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest">Processamento Rápido</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 text-xs font-bold">✓</div>
                                                <span><strong>Pensamento rápido e abstrato:</strong> Conexões mentais rápidas e facilidade com conceitos complexos.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 text-xs font-bold">✓</div>
                                                <span><strong>Aprende com facilidade e profundidade:</strong> Exige menos repetições para fixar um conteúdo.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 text-xs font-bold">✓</div>
                                                <span><strong>Muitos interesses e curiosidade intensa:</strong> Busca entender os "porquês" das coisas.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-3">
                                        <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest">Intensidade & Desafio</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 text-xs font-bold">✓</div>
                                                <span><strong>Sensibilidade emocional e intelectual:</strong> Reações intensas, forte empatia e senso de justiça.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 text-xs font-bold">✓</div>
                                                <span><strong>Precisa de desafios e estímulos:</strong> Se desmotiva ou se entedia facilmente com tarefas repetitivas.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-rose-800 bg-rose-100/50 p-2.5 rounded-xl border border-rose-200 mt-2 font-medium">
                                                <span className="text-base leading-none">🌈</span>
                                                <span><strong>Interseção com Autismo:</strong> Foco absoluto em interesses específicos de extrema complexidade.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'TPS' && (
                            <div className="bg-white rounded-3xl border-[3px] border-teal-200 p-6 shadow-md space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-teal-100 p-3 rounded-2xl text-teal-600">
                                        <Eye className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <span className="badge bg-teal-100 text-teal-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">Eixo 4</span>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">TPS (Transtorno do Processamento Sensorial)</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    Ocorre quando o cérebro apresenta desafios ao receber, processar e organizar as informações vindas dos sentidos (tato, audição, visão, paladar, olfato, vestibular e propriocepção).
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 space-y-3">
                                        <h4 className="text-xs font-black text-teal-800 uppercase tracking-widest">Integração Sensorial</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 text-teal-600 text-xs font-bold">✓</div>
                                                <span><strong>Hiper ou hipo sensibilidade sensorial:</strong> Reações extremadas a ruídos ou falta de percepção de perigo/temperatura.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 text-teal-600 text-xs font-bold">✓</div>
                                                <span><strong>Busca ou evita estímulos sensoriais:</strong> Buscar texturas e movimentos constantes ou fugir de aglomerações.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 text-teal-600 text-xs font-bold">✓</div>
                                                <span><strong>Dificuldade em filtrar estímulos:</strong> Impossibilidade de focar quando há ruído de fundo (sala barulhenta).</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 space-y-3">
                                        <h4 className="text-xs font-black text-teal-800 uppercase tracking-widest">Impacto Prático</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 text-teal-600 text-xs font-bold">✓</div>
                                                <span><strong>Sobrecarga sensorial pode acontecer:</strong> Quando os estímulos excedem a capacidade de filtragem do cérebro.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 text-teal-600 text-xs font-bold">✓</div>
                                                <span><strong>Impacta no dia a dia e na autorregulação:</strong> Desafios na alimentação (seletividade), vestuário (etiquetas) e foco.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-teal-800 bg-teal-100/50 p-2.5 rounded-xl border border-teal-200 mt-2 font-medium">
                                                <span className="text-base leading-none">🧠</span>
                                                <span><strong>Interseção com Altas Capacidades:</strong> Sensibilidade emocional e sensorial intensa, processada com alta intensidade.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'EM_COMUM' && (
                            <div className="bg-white rounded-3xl border-[3px] border-purple-200 p-6 shadow-md space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-3 rounded-2xl text-purple-600 animate-bounce">
                                        <Layers className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <span className="badge bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">O Coração do Mapa</span>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">O QUE ELES TÊM EM COMUM?</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-bold">
                                    A neurodivergência compartilha eixos centrais de conexão. Compreender esses pontos comuns ajuda a criar intervenções mais empáticas e eficazes, unindo pais, terapeutas e escolas.
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Pontos em Comum centrais */}
                                    <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 space-y-4">
                                        <h4 className="text-xs font-black text-purple-800 uppercase tracking-widest flex items-center gap-2">
                                            <Smile className="w-4 h-4" /> Traços Compartilhados (Interseção Geral)
                                        </h4>
                                        <ul className="space-y-3">
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                                                <span><strong>Sensibilidade Acentuada:</strong> Sentem e reagem de forma única e intensa aos ambientes e sentimentos.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                                                <span><strong>Interesses Intensos:</strong> Foco absoluto em temas que geram profunda motivação e curiosidade.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                                                <span><strong>Formas Únicas de Pensar:</strong> Soluções criativas, lógicas alternativas e aprendizado não linear.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                                                <span><strong>Necessidade de Compreensão e Adaptação:</strong> O ambiente e as pessoas precisam adaptar-se para apoiar o seu pleno desenvolvimento.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Interseções de Pares */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interseções Específicas</h4>
                                        
                                        <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
                                            <span className="font-extrabold text-blue-800 block mb-0.5">Autismo + Altas Capacidades</span>
                                            <p className="text-slate-600">Foco extremo em hiperfocos e interesses profundos e específicos; necessidade de rotina lógica.</p>
                                        </div>

                                        <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100">
                                            <span className="font-extrabold text-amber-800 block mb-0.5">TDAH + Autismo</span>
                                            <p className="text-slate-600">Necessidade constante de movimento (fidgeting) e regulação motora para controle de estresse.</p>
                                        </div>

                                        <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-100">
                                            <span className="font-extrabold text-teal-800 block mb-0.5">TDAH + TPS</span>
                                            <p className="text-slate-600">Desafios severos com funções executivas (planejar, organizar) e busca/evitação de estímulo sensorial.</p>
                                        </div>

                                        <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100">
                                            <span className="font-extrabold text-rose-800 block mb-0.5">Altas Capacidades + TPS</span>
                                            <p className="text-slate-600">Sensibilidade emocional e intelectual profunda; forte carga perceptiva.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'APOIAR' && (
                            <div className="bg-white rounded-3xl border-[3px] border-emerald-200 p-6 shadow-md space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                                        <Heart className="w-8 h-8 text-emerald-600 fill-current" />
                                    </div>
                                    <div>
                                        <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">Ações de Inclusão</span>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">PARA APOIAR: ESTRATÉGIAS PRÁTICAS</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    Criar pontes de empatia exige pequenas atitudes diárias que garantem segurança física, emocional e social para as crianças se sentirem acolhidas.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-2">
                                    {/* 1. Respeito */}
                                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-between space-y-2">
                                        <span className="text-2xl">💜</span>
                                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">Respeito e Aceitação</h4>
                                        <p className="text-[10px] text-slate-500 font-bold leading-tight">Valorizar a singularidade de cada mente sem tentar moldá-la aos padrões típicos.</p>
                                    </div>

                                    {/* 2. Rotina */}
                                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-between space-y-2">
                                        <span className="text-2xl">📅</span>
                                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">Rotina e Previsibilidade</h4>
                                        <p className="text-[10px] text-slate-500 font-bold leading-tight">Agendas visuais e avisos prévios reduzem a ansiedade de antecipação.</p>
                                    </div>

                                    {/* 3. Ambiente */}
                                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-between space-y-2">
                                        <span className="text-2xl">🎧</span>
                                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">Ambiente Acolhedor</h4>
                                        <p className="text-[10px] text-slate-500 font-bold leading-tight">Controlar ruídos excessivos, luzes muito fortes e oferecer cantinho de calma.</p>
                                    </div>

                                    {/* 4. Estímulo */}
                                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-between space-y-2">
                                        <span className="text-2xl">⭐</span>
                                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">Estímulo na Medida Certa</h4>
                                        <p className="text-[10px] text-slate-500 font-bold leading-tight">Oferecer desafios cognitivos sem gerar sobrecarga sensorial ou cansaço extremo.</p>
                                    </div>

                                    {/* 5. Conexão */}
                                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-between space-y-2">
                                        <span className="text-2xl">👥</span>
                                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">Conexão e Compreensão</h4>
                                        <p className="text-[10px] text-slate-500 font-bold leading-tight">Escutar ativamente, validar sentimentos e construir laços de segurança afetiva.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom message */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 shadow-sm text-center">
                        <div className="flex items-center justify-center gap-2 text-indigo-800 font-bold text-xs md:text-sm italic">
                            <span>💜</span>
                            <span>Cada mente é única. Quando compreendemos as conexões, promovemos inclusão, bem-estar e desenvolvimento.</span>
                            <span>💜</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-100 border-t border-slate-200 shrink-0 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider hidden sm:block">Easy Autism Bridge • Mapeamento 360°</span>
                    <button 
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-black rounded-xl transition-all shadow-md active:scale-95 uppercase tracking-tight text-xs"
                    >
                        Entendi o Mapa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NeurodivergenceMapModal;
