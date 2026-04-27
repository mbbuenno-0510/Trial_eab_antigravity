
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
    Download, ArrowLeft, Network, Wind, ShieldCheck, Trophy, Sparkles, 
    Pill, Activity, School, Monitor, LockKeyhole, CloudCog, BrainCircuit, 
    Music, FileText, GraduationCap, CheckCircle2, MessageCircle, AlertTriangle,
    Stethoscope, Database, Zap, LayoutDashboard, Copy, BarChart3, Smartphone,
    HeartPulse, Target, Users, BookHeart, Fingerprint, CalendarCheck, FileBarChart,
    Search, Lightbulb, Shield, Globe, Star, ArrowRight, Eye, ShieldAlert,
    Palette, PenTool, MousePointer2, Brain, Gamepad2, Map, Heart, BellRing, BookOpenCheck,
    Settings
} from 'lucide-react';
import { Card } from './ui';

interface LandingPageProps {
    onBack: () => void;
    onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onBack, onRegister }) => {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const margin = 40; 
            const a4Width = 794; 
            const availableWidth = window.innerWidth - margin;
            const newScale = availableWidth < a4Width ? availableWidth / a4Width : 1;
            setScale(newScale);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('print-container');
        if (!element) return;
        downloadGenericPDF(element, 'EAB_MASTER_Dossier_2026.pdf', 'btn-download', 'Gerando Dossier...');
    };

    const handleDownloadScreenshots = async () => {
        const element = document.getElementById('print-screens-container');
        if (!element) return;
        downloadGenericPDF(element, 'EAB_MASTER_Apresentacao_Telas.pdf', 'btn-download-screens', 'Gerando Telas...');
    };

    const downloadGenericPDF = async (element: HTMLElement, filename: string, btnId: string, loadingText: string) => {
        const btn = document.getElementById(btnId);
        const originalBtnContent = btn ? btn.innerHTML : '';
        
        if(btn) {
            btn.innerHTML = `<span class="flex items-center gap-2"><svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${loadingText}</span>`;
        }

        try {
            const doc = new jsPDF({
                unit: 'px',
                format: [794, 1122],
                orientation: 'portrait',
                compress: true
            });

            const sourcePages = Array.from(element.querySelectorAll('.a4-page')) as HTMLElement[];
            if (sourcePages.length === 0) throw new Error("Páginas não encontradas");

            for (let i = 0; i < sourcePages.length; i++) {
                // Snapshot each page in total isolation
                const pageClone = sourcePages[i].cloneNode(true) as HTMLElement;
                
                // Create a temporary isolated render zone
                const isolate = document.createElement('div');
                Object.assign(isolate.style, {
                    position: 'fixed',
                    left: '-9999px', // Safe zone
                    top: '0',
                    width: '794px',
                    height: '1122px',
                    zIndex: '999999',
                    backgroundColor: '#FFFFFF',
                    padding: '0',
                    margin: '0',
                    overflow: 'hidden',
                    display: 'block',
                    opacity: '1',
                    visibility: 'visible'
                });

                // Apply correct page styles to the clone
                Object.assign(pageClone.style, {
                    display: 'flex',
                    flexDirection: 'column',
                    width: '794px',
                    height: '1122px',
                    minHeight: '1122px',
                    maxHeight: '1122px',
                    margin: '0',
                    padding: '60px 70px',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: '1',
                    visibility: 'visible',
                    boxShadow: 'none'
                });

                isolate.appendChild(pageClone);
                document.body.appendChild(isolate);

                // Wait for styles and images within this specific page
                const images = Array.from(isolate.getElementsByTagName('img'));
                await Promise.all(images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                }));

                // Short settle time per page for fonts and layout
                await new Promise(resolve => setTimeout(resolve, 500));

                const canvas = await html2canvas(pageClone, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#FFFFFF',
                    width: 794,
                    height: 1122,
                    windowWidth: 794,
                    windowHeight: 1122,
                    scrollY: 0,
                    x: 0,
                    y: 0
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                doc.addImage(imgData, 'JPEG', 0, 0, 794, 1122, undefined, 'FAST');
                
                if (i < sourcePages.length - 1) {
                    doc.addPage();
                }

                // Cleanup isolation zone
                document.body.removeChild(isolate);
            }

            doc.save(filename);
        } catch (err) {
            console.error("PDF Error:", err);
            alert("Erro ao gerar PDF. Verifique se a página carregou completamente.");
        } finally {
            if(btn) btn.innerHTML = originalBtnContent;
        }
    };

    const VISUAL_CONTENT_HEIGHT = 10 * (1122 + 50); 

    return (
        <div className="bg-slate-950 text-slate-800 font-sans w-full h-full fixed inset-0 z-[200] flex flex-col overflow-hidden">
            
            {/* ESTILOS GLOBAIS DE PDF (Compartilhados por ambos documentos) */}
            <style>{`
                .pdf-common-styles .a4-page { width: 794px; height: 1122px; background: #FFFFFF; position: relative; overflow: hidden; display: flex; flex-direction: column; padding: 60px 70px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid-page; margin: 0; }
                #viewport-container .a4-page { margin-bottom: 50px; box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.7); }
                .pdf-common-styles .page-content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; }
                .pdf-common-styles .pdf-footer { position: absolute; bottom: 40px; left: 70px; right: 70px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94A3B8; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border-top: 2px solid #F1F5F9; padding-top: 20px; pointer-events: none; }
                .pdf-common-styles .section-header { font-size: 32px; font-weight: 900; color: #0F172A; tracking-tighter; margin-bottom: 24px; border-left: 8px solid #3B82F6; padding-left: 20px; line-height: 1; page-break-after: avoid; break-after: avoid; }
                .pdf-common-styles .badge { padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: 900; text-transform: uppercase; background: #F1F5F9; color: #475569; display: inline-block; width: fit-content; }
                .pdf-common-styles .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 24px; page-break-inside: avoid; break-inside: avoid-page; }
                .pdf-common-styles .highlight-card { padding: 24px; border-radius: 32px; background: #F8FAFC; border: 1px solid #E2E8F0; page-break-inside: avoid; break-inside: avoid-page; position: relative; }
                .pdf-common-styles h1, .pdf-common-styles h2, .pdf-common-styles h3, .pdf-common-styles h4 { page-break-after: avoid; break-after: avoid-page; pointer-events: none; -webkit-font-smoothing: antialiased; }
                .pdf-common-styles p { orphans: 3; widows: 3; -webkit-font-smoothing: antialiased; }
                
                .screen-preview-styles .screen-mock { width: 320px; height: 640px; background: #0F172A; border: 8px solid #1E293B; border-radius: 40px; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5); position: relative; margin: 0 auto; }
                .screen-preview-styles .screen-content { padding: 15px; background: #F8FAFC; height: 100%; display: flex; flex-direction: column; }
                .screen-preview-styles .nav-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: white; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-around; align-items: center; }
                
                .pdf-hidden-source { position: absolute; left: -99999px; top: 0; width: 794px; pointer-events: none; background: white; }
            `}</style>

            {/* BARRA DE COMANDO SUPERIOR */}
            <div className="bg-slate-900 text-white p-4 z-[250] flex justify-between items-center shadow-2xl border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-inner">🤖</div>
                    <div className="leading-tight">
                        <span className="font-black text-lg block uppercase tracking-tighter text-blue-400">EAB MASTER 2026</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold italic">Dossier de Inteligência e Cuidado</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button id="btn-download" onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 border border-blue-400">
                        <Download className="w-4 h-4" /> BAIXAR DOSSIER
                    </button>
                    <button id="btn-download-screens" onClick={handleDownloadScreenshots} className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 border border-indigo-400">
                        <Monitor className="w-4 h-4" /> APRESENTAÇÃO DE TELAS
                    </button>
                    <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all border border-slate-700">
                        <ArrowLeft className="w-4 h-4" /> SAIR
                    </button>
                </div>
            </div>

            {/* VIEWER ENGINE */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center bg-slate-950 py-12 no-scrollbar scroll-smooth">
                
                <div 
                    id="viewport-container"
                    style={{ 
                        transform: `scale(${scale})`, 
                        transformOrigin: 'top center',
                        width: '794px',
                        marginBottom: `-${VISUAL_CONTENT_HEIGHT * (1 - scale)}px` 
                    }}
                >
                    <div id="print-container" className="pdf-common-styles">
                        {/* PÁGINA 1: COVER E MANIFESTO */}
                        <div className="a4-page">
                            <div className="absolute top-0 right-0 opacity-10"><svg width="600" height="600" viewBox="0 0 500 500"><circle cx="500" cy="0" r="500" fill="#3B82F6" /></svg></div>
                            <div className="page-content justify-center text-center">
                                <div className="mb-20 flex justify-center">
                                    <div className="w-44 h-44 bg-slate-900 rounded-[4rem] flex items-center justify-center text-[90px] text-white shadow-2xl border-4 border-white/10">🤖</div>
                                </div>
                                <h1 className="text-[115px] font-black text-slate-900 leading-[0.75] mb-10 uppercase tracking-tighter">
                                    EAB<br/>
                                    <span className="text-blue-600">MASTER</span>
                                </h1>
                                <div className="w-32 h-4 bg-blue-600 mx-auto mb-12 rounded-full shadow-lg shadow-blue-500/30"></div>
                                <p className="text-3xl text-slate-500 font-bold uppercase tracking-[0.35em] mb-20 leading-tight italic">O Ecossistema Definitivo<br/>para o TEA 2026</p>
                                
                                <div className="grid grid-cols-4 gap-6 mb-20 px-10">
                                    <div className="text-center"><span className="text-3xl block mb-2">🧸</span><span className="text-[10px] font-black uppercase text-slate-400">Autonomia</span></div>
                                    <div className="text-center"><span className="text-3xl block mb-2">🩺</span><span className="text-[10px] font-black uppercase text-slate-400">Ciência</span></div>
                                    <div className="text-center"><span className="text-3xl block mb-2">🎓</span><span className="text-[10px] font-black uppercase text-slate-400">Inclusão</span></div>
                                    <div className="text-center"><span className="text-3xl block mb-2">🏠</span><span className="text-[10px] font-black uppercase text-slate-400">Família</span></div>
                                </div>

                                <div className="mt-auto pt-16 border-t-2 border-slate-100 flex justify-between items-end text-left">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável pelo Projeto</p>
                                        <p className="text-3xl font-black text-slate-800 tracking-tight">MichelBB <span className="font-light text-slate-400">| Pai e Desenvolvedor</span></p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex gap-3">
                                            <span className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl">FIREBASE</span>
                                            <span className="px-5 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl">GEMINI AI</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER PROJECT • 2026 EDITION</span><span>PÁGINA 01</span></div>
                        </div>

                        {/* PÁGINA 2: A ARQUITETURA DA VERDADE */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">A Arquitetura da Verdade</h2>
                                <p className="text-lg text-slate-600 mb-12 leading-relaxed">Atualmente, o cuidado com o indivíduo autista sofre com o <strong>"Silenciamento de Dados"</strong>. Médicos, escolas e pais vivem em silos de informação. O EAB Master rompe essa barreira através de uma infraestrutura serverless sincronizada em tempo real.</p>
                                
                                <div className="info-grid flex-1">
                                    <div className="highlight-card space-y-6">
                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><Database /></div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Núcleo Central Firestore</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed font-medium">Sincronização instantânea multi-dispositivo. Cada registro escolar ou doméstico reflete instantaneamente no painel clínico, permitindo ajustes ágeis nos protocolos de cuidado e intervenção.</p>
                                    </div>
                                    <div className="highlight-card space-y-6 border-blue-200 bg-blue-50/50">
                                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><BrainCircuit /></div>
                                        <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight">Motor Analítico Gemini</h3>
                                        <p className="text-sm text-blue-700/70 leading-relaxed font-medium">Processamento de Linguagem Natural (NLP) para transformar diários subjetivos em dados técnicos estruturados. A IA identifica correlações entre alimentação, sono, ambiente e picos de desregulação.</p>
                                    </div>
                                </div>

                                <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                                    <Globe className="absolute -top-10 -right-10 w-64 h-64 opacity-10" />
                                    <h3 className="text-3xl font-black mb-4 tracking-tighter">Conexão Orbital 360°</h3>
                                    <p className="text-slate-400 text-lg leading-relaxed font-medium italic">"Garantimos que o histórico de crises de uma segunda-feira na escola seja o ponto de partida estratégico da terapia na terça-feira de manhã."</p>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>CONCEITO E INFRAESTRUTURA</span><span>PÁGINA 02</span></div>
                        </div>

                        {/* PÁGINA 3: MÓDULO CRIANÇA - REGULAÇÃO */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Módulo Criança: Sala da Calma</h2>
                                <p className="text-lg text-slate-600 mb-10">Projetada com UX de <strong>"Ruído Zero"</strong>, a interface infantil oculta elementos complexos para evitar sobrecarga sensorial, focando apenas no suporte necessário.</p>
                                
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[4rem] p-12 text-white mb-10 shadow-2xl relative overflow-hidden">
                                    <Wind className="absolute top-10 right-10 w-32 h-32 opacity-20 animate-pulse" />
                                    <h3 className="text-4xl font-black mb-8 tracking-tighter">O Santuário Sensorial</h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="bg-white/10 p-6 rounded-3xl border border-white/20 backdrop-blur-md">
                                            <h4 className="font-black uppercase text-xs mb-3 tracking-widest text-blue-200">Biofeedback Visual</h4>
                                            <p className="text-sm leading-relaxed opacity-90 font-medium">Protocolos de respiração guiada (4-2-6) desenhados para desaceleração cardíaca em picos de ansiedade e estresse.</p>
                                        </div>
                                        <div className="bg-white/10 p-6 rounded-3xl border border-white/20 backdrop-blur-md">
                                            <h4 className="font-black uppercase text-xs mb-3 tracking-widest text-blue-200">Painéis AAC</h4>
                                            <p className="text-sm leading-relaxed opacity-90 font-medium">Comunicação Alternativa e Aumentativa integrada para que crianças não verbais expressem necessidades básicas sob pressão.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 flex-1">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                                        <div className="relative">
                                            <Music className="w-10 h-10 text-purple-500 mb-4" />
                                            <Sparkles className="w-4 h-4 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
                                        </div>
                                        <h4 className="font-black text-sm uppercase mb-2">Laboratório ASMR</h4>
                                        <p className="text-[11px] text-slate-500 font-bold leading-tight">Gatilhos sensoriais (Tapping, Whispers) para combate à insônia, ansiedade e foco cognitivo.</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                                        <PenTool className="w-10 h-10 text-emerald-500 mb-4" />
                                        <h4 className="font-black text-sm uppercase mb-2">Desenho Zen</h4>
                                        <p className="text-[11px] text-slate-500 font-bold">Canvas de traço suave para descarga motora e relaxamento cognitivo.</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                                        <Brain className="w-10 h-10 text-cyan-500 mb-4" />
                                        <h4 className="font-black text-sm uppercase mb-2">Meditação IA</h4>
                                        <p className="text-[11px] text-slate-500 font-bold">Histórias sociais personalizadas pela IA para indução à calma.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>USER EXPERIENCE INFANTIL</span><span>PÁGINA 03</span></div>
                        </div>

                        {/* PÁGINA 4: MÓDULO CRIANÇA - GAMIFICAÇÃO */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Módulo Criança: Gamificação</h2>
                                <div className="space-y-10 flex-1 flex flex-col justify-center">
                                    <div className="flex gap-8 items-start">
                                        <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center shrink-0 shadow-xl text-white border-b-8 border-yellow-600"><Trophy className="w-10 h-10" /></div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">A JORNADA DO HERÓI</h3>
                                            <p className="text-xl text-slate-500 font-medium leading-relaxed italic">"Transformamos o escovar de dentes em uma conquista lendária."</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="highlight-card border-l-8 border-l-blue-500">
                                            <h4 className="font-black text-lg text-slate-800 mb-3 flex items-center gap-3"><Star className="text-yellow-500 fill-current" /> Sistema de XP</h4>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">Acúmulo de pontos por tarefas concluídas, alimentando uma barra de progresso visual que estimula a dopamina positiva e o senso de dever cumprido.</p>
                                        </div>
                                        <div className="highlight-card border-l-8 border-l-indigo-500">
                                            <h4 className="font-black text-lg text-slate-800 mb-3 flex items-center gap-3"><CheckCircle2 className="text-green-500" /> Previsibilidade</h4>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">Checklists visuais com ícones representativos que reduzem drasticamente a ansiedade de antecipação do que virá a seguir.</p>
                                        </div>
                                    </div>

                                    <div className="p-10 bg-indigo-50 rounded-[4rem] border-4 border-dashed border-indigo-200">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="font-black text-indigo-900 text-xl">Atividades Cognitivas</h4>
                                            <span className="badge bg-indigo-200 text-indigo-800">+150 XP</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="bg-white p-4 rounded-2xl flex-1 shadow-sm flex items-center gap-3 font-black text-indigo-700 text-xs uppercase"><Gamepad2 className="w-4 h-4"/> Simon (Foco)</div>
                                            <div className="bg-white p-4 rounded-2xl flex-1 shadow-sm flex items-center gap-3 font-black text-indigo-700 text-xs uppercase"><Music className="w-4 h-4"/> Piano Zen</div>
                                            <div className="bg-white p-4 rounded-2xl flex-1 shadow-sm flex items-center gap-3 font-black text-indigo-700 text-xs uppercase"><Palette className="w-4 h-4"/> Cromoterapia</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>AUTONOMIA E REFORÇO POSITIVO</span><span>PÁGINA 04</span></div>
                        </div>

                        {/* PÁGINA 5: MÓDULO PAIS - GESTÃO DE SAÚDE */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Módulo Família: Gestão de Saúde</h2>
                                <p className="text-lg text-slate-600 mb-12">Um centro de comando robusto focado na segurança operacional do tratamento e na manutenção da rotina médica.</p>
                                
                                <div className="info-grid">
                                    <div className="p-10 bg-rose-50 border-2 border-rose-100 rounded-[3.5rem] shadow-sm relative overflow-hidden">
                                        <Pill className="absolute -right-8 -bottom-8 w-40 h-40 text-rose-500 opacity-10 rotate-12" />
                                        <h3 className="font-black text-rose-900 text-2xl mb-4 tracking-tighter uppercase">Estoque Preditivo</h3>
                                        <p className="text-3xl font-black text-rose-600 mb-4 italic leading-none">"Restam 5 dias."</p>
                                        <p className="text-sm text-slate-600 font-bold leading-relaxed">Cálculo algorítmico baseado na dosagem diária. O sistema prevê a ruptura de estoque antes que ela ocorra, evitando atrasos.</p>
                                    </div>
                                    <div className="p-10 bg-teal-50 border-2 border-teal-100 rounded-[3.5rem] shadow-sm flex flex-col justify-center text-center">
                                        <CalendarCheck className="w-20 h-20 text-teal-600 mx-auto mb-6" />
                                        <h4 className="font-black text-teal-900 uppercase text-xs tracking-widest mb-2">Timeline Unificada</h4>
                                        <p className="text-lg text-slate-700 font-bold leading-tight">Consultas, terapias e logs de administração escolar sincronizados em uma visão cronológica única e imutável.</p>
                                    </div>
                                </div>

                                <Card title="Cofre Digital de Documentos" className="flex-1 bg-slate-900 border-none shadow-2xl rounded-[3.5rem] overflow-hidden">
                                    <div className="grid grid-cols-2 gap-10 text-white p-2">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-blue-400 font-black uppercase text-xs"><LockKeyhole className="w-4 h-4"/> Blindagem AES-256</div>
                                            <p className="text-slate-400 text-sm leading-relaxed">Repositório de laudos, PEIs e receitas de alto custo com criptografia de nível militar em repouso.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-amber-400 font-black uppercase text-xs"><BellRing className="w-4 h-4"/> Lembretes de Renovação</div>
                                            <p className="text-slate-400 text-sm leading-relaxed">Controle de validade para retirada de medicação em farmácias estaduais com alertas automáticos.</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Soberania dos Dados: O Pai controla cada acesso</span>
                                        <ShieldCheck className="text-green-500 w-6 h-6" />
                                    </div>
                                </Card>
                            </div>
                            <div className="pdf-footer"><span>SEGURANÇA MEDICAMENTOSA</span><span>PÁGINA 05</span></div>
                        </div>

                        {/* PÁGINA 6: MÓDULO PAIS - MONITORAMENTO COMPORTAMENTAL */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Ciência Comportamental em Casa</h2>
                                <p className="text-lg text-slate-600 mb-8">Ferramentas de coleta de dados qualitativos para fundamentar decisões clínicas e identificar padrões de estabilidade.</p>
                                <div className="space-y-6 flex-1">
                                    <div className="flex gap-8 items-center p-8 bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
                                        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center shrink-0 text-rose-600"><AlertTriangle className="w-10 h-10" /></div>
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-800 uppercase mb-1 tracking-tighter">MAPEAMENTO DE CRISES</h4>
                                            <p className="text-sm text-slate-500 font-bold leading-relaxed italic">Registro granular de intensidade (Leve, Moderada, Intensa) e duração para análise estatística de progressão.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 items-center p-8 bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
                                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center shrink-0 text-purple-600"><Zap className="w-10 h-10" /></div>
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-800 uppercase mb-1 tracking-tighter">LOG DE HIPERFOCOS</h4>
                                            <p className="text-sm text-slate-500 font-bold leading-relaxed italic">Mapeamento de interesses específicos para uso estratégico como reforçadores positivos em terapias.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 items-center p-8 bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600"><MessageCircle className="w-10 h-10" /></div>
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-800 uppercase mb-1 tracking-tighter">DIÁRIO ALIMENTAR & SONO</h4>
                                            <p className="text-sm text-slate-500 font-bold leading-relaxed italic">Identificação de gatilhos gástricos ou privação de sono que podem preceder comportamentos disruptivos.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-900 rounded-[3rem] text-center mt-8">
                                    <p className="text-blue-400 font-black uppercase text-xs tracking-widest mb-4">Conectividade Crítica</p>
                                    <h4 className="text-white text-2xl font-black leading-tight italic">"Ao acionar o Botão de Pânico na Sala da Calma, o sistema dispara um Alerta Push imediato aos pais."</h4>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>ANÁLISE DE COMPORTAMENTO APLICADA</span><span>PÁGINA 06</span></div>
                        </div>

                        {/* PÁGINA 7: MÓDULO ESCOLA - INCLUSÃO */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Módulo Escola: Inclusão Real</h2>
                                <p className="text-lg text-slate-600 mb-12">Eliminamos o retrabalho burocrático para que o <strong>Professor Mediador</strong> possa focar 100% no suporte individualizado.</p>
                                
                                <div className="grid grid-cols-12 gap-8 items-center flex-1">
                                    <div className="col-span-7 space-y-10">
                                        <div className="highlight-card border-purple-200">
                                            <span className="badge bg-purple-100 text-purple-700 mb-3">Monitor de Interação</span>
                                            <h3 className="text-2xl font-black text-slate-800 mb-2">Socialização & Participação</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Registro diário do nível de engajamento pedagógico e social, gerando indicadores de inclusão escolar efetiva.</p>
                                        </div>
                                        <div className="highlight-card border-pink-200">
                                            <span className="badge bg-pink-100 text-pink-700 mb-3">Segurança Institucional</span>
                                            <h3 className="text-2xl font-black text-slate-800 mb-2">Medicação Escolar</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"Log imutável com assinatura digital do responsável, horário real e observações imediatas."</p>
                                        </div>
                                    </div>
                                    <div className="col-span-5 h-full">
                                        <div className="bg-slate-900 h-full rounded-[4rem] p-10 flex flex-col justify-center border-b-[20px] border-purple-500 shadow-2xl">
                                            <GraduationCap className="w-20 h-20 text-purple-400 mb-8" />
                                            <h4 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter leading-none">Portal do<br/>Mediador</h4>
                                            <ul className="space-y-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400"/> Guia de Estratégias</li>
                                                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400"/> Log de Ocorrências</li>
                                                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400"/> Cadastro via RA</li>
                                                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400"/> Histórico Digital</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>DIÁRIO ESCOLAR DIGITAL</span><span>PÁGINA 07</span></div>
                        </div>

                        {/* PÁGINA 8: MÓDULO PROFISSIONAL - INTELIGÊNCIA */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Inteligência Clínica e Multidisciplinar</h2>
                                <div className="grid grid-cols-2 gap-8 mb-10">
                                    <Card title="Analytics Terapêutico" className="border-4 border-teal-100 shadow-xl overflow-hidden">
                                        <div className="h-40 bg-slate-50 flex items-end gap-2 p-6 border-b border-slate-100">
                                            {[35, 55, 40, 75, 90, 65, 88, 80].map((h, i) => (
                                                <div key={i} className="flex-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg shadow-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                        <p className="p-4 text-[10px] text-slate-400 font-black uppercase text-center tracking-[0.2em]">Índice de Estabilidade Emocional - 30 Dias</p>
                                    </Card>
                                    <div className="space-y-4">
                                        <div className="p-6 bg-teal-50 border-2 border-teal-200 rounded-[2.5rem] shadow-sm">
                                            <div className="flex items-center gap-3 mb-2"><Stethoscope className="text-teal-600 w-6 h-6"/><h4 className="font-black text-teal-900 uppercase text-xs">Registro SOAP / ABA</h4></div>
                                            <p className="text-[11px] text-teal-800 font-medium">Notas estruturadas que permitem a recuperação veloz da evolução técnica entre sessões.</p>
                                        </div>
                                        <div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-[2.5rem] shadow-sm">
                                            <div className="flex items-center gap-3 mb-2"><Network className="text-indigo-600 w-6 h-6"/><h4 className="font-black text-indigo-900 uppercase text-xs">Rede Multidisciplinar</h4></div>
                                            <p className="text-[11px] text-indigo-800 font-medium">Compartilhamento ético de registros entre fono, psicólogo e T.O, eliminando redundâncias.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-900 rounded-[4rem] p-12 text-white flex-1 border-l-[20px] border-teal-500 shadow-2xl relative overflow-hidden">
                                    <Brain className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5" />
                                    <h3 className="text-3xl font-black mb-8 text-teal-400 tracking-tighter">Gerador de Relatórios Assistido (IA)</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 text-white font-bold">1</div>
                                            <p className="text-slate-300 font-medium leading-relaxed">O sistema cruza 30 dias de diários de humor, comportamento doméstico e log escolar.</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 text-white font-bold">2</div>
                                            <p className="text-slate-300 font-medium leading-relaxed">A IA Gemini redige um esboço técnico de evolução em segundos para validação do profissional.</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 text-white font-bold">3</div>
                                            <p className="text-slate-300 font-medium leading-relaxed">Economia de 80% do tempo administrativo, liberando mais tempo para o atendimento direto.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>PAINEL CLÍNICO ANALÍTICO</span><span>PÁGINA 08</span></div>
                        </div>

                        {/* PÁGINA 9: INTELIGÊNCIA ARTIFICIAL - MOTOR */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Inteligência Artificial: O Cérebro do EAB</h2>
                                <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 rounded-[5rem] p-20 text-white relative overflow-hidden flex-1 flex flex-col justify-center border-t-[12px] border-blue-500 shadow-[0_50px_100px_-20px_rgba(30,58,138,0.5)]">
                                    <BrainCircuit className="absolute -top-10 -right-10 w-[500px] h-[500px] text-blue-400 opacity-10 animate-pulse" />
                                    <h3 className="text-6xl font-black mb-16 leading-[0.85] tracking-tighter">Correlacionando o<br/><span className="text-blue-400 italic">Complexo.</span></h3>
                                    
                                    <div className="grid grid-cols-2 gap-12 relative z-10">
                                        <div className="space-y-6">
                                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg border border-blue-400"><FileBarChart className="w-7 h-7 text-white"/></div>
                                            <h4 className="text-2xl font-black text-blue-200 tracking-tight">Síntese Evolutiva</h4>
                                            <p className="text-blue-100/70 text-base leading-relaxed font-medium">Transforma centenas de registros heterogêneos em insights precisos sobre regressões ou picos de desenvolvimento.</p>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg border border-purple-400"><Activity className="w-7 h-7 text-white"/></div>
                                            <h4 className="text-2xl font-black text-purple-200 tracking-tight">Análise de Sentimento</h4>
                                            <p className="text-blue-100/70 text-base leading-relaxed font-medium">Identifica nuances em notas de voz ou texto que indicam fadiga sensorial antes mesmo da ocorrência física.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 p-10 bg-blue-50 border-4 border-dashed border-blue-200 rounded-[4rem] text-center">
                                    <p className="text-2xl text-blue-900 font-black italic tracking-tight leading-relaxed">"A IA no EAB não toma decisões; ela liberta o profissional humano para ser mais empático através de dados cristalinos."</p>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>MOTOR DE IA GEMINI 2.5</span><span>PÁGINA 09</span></div>
                        </div>

                        {/* PÁGINA 10: SEGURANÇA E LANÇAMENTO */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Confidencialidade e Futuro</h2>
                                <div className="grid grid-cols-2 gap-12 mb-16 flex-1 items-center">
                                    <div className="p-12 bg-slate-50 border-4 border-slate-100 rounded-[4rem] shadow-xl flex flex-col justify-center">
                                        <LockKeyhole className="text-slate-900 w-16 h-16 mb-8" />
                                        <h3 className="font-black text-3xl text-slate-900 mb-6 uppercase tracking-tighter">Compliance LGPD</h3>
                                        <p className="text-lg text-slate-500 leading-relaxed font-bold">Criptografia AES-256 em repouso e TLS 1.3 em trânsito. O pai detém o controle master sobre quem vê cada fragmento da vida da criança.</p>
                                    </div>
                                    <div className="p-12 bg-slate-50 border-4 border-slate-100 rounded-[4rem] shadow-xl flex flex-col justify-center">
                                        <CloudCog className="text-slate-900 w-16 h-16 mb-8" />
                                        <h3 className="font-black text-3xl text-slate-900 mb-6 uppercase tracking-tighter">Edge Computing</h3>
                                        <p className="text-lg text-slate-500 leading-relaxed font-bold">Arquitetura Serverless via Firebase com sincronização offline nativa para ambientes com conectividade instável.</p>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[5rem] p-20 text-white text-center shadow-[0_40px_100px_-20px_rgba(37,99,235,0.4)] relative overflow-hidden border-4 border-blue-400">
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_2px,_transparent_2px)] bg-[size:30px_30px]"></div>
                                    <h3 className="text-8xl font-black mb-8 tracking-tighter leading-none">MASTER RELEASE<br/><span className="text-blue-200 italic text-6xl">Q1 2026</span></h3>
                                    <div className="flex justify-center gap-12 mt-16">
                                        <div className="px-10 py-5 bg-white/20 rounded-[2rem] text-sm font-black uppercase border border-white/30 tracking-widest backdrop-blur-md">iOS / Android</div>
                                        <div className="px-10 py-5 bg-white/20 rounded-[2rem] text-sm font-black uppercase border border-white/30 tracking-widest backdrop-blur-md">Web App 2.0</div>
                                    </div>
                                    <p className="mt-20 text-blue-100 font-bold uppercase tracking-[0.5em] text-xs opacity-60">Tecnologia, Amor e Ciência a serviço da Autonomia Humana.</p>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>ESTRATÉGIA DE LANÇAMENTO</span><span>PÁGINA 10</span></div>
                        </div>
                    </div>

                    {/* SEGUNDO DOCUMENTO: APRESENTAÇÃO DE TELAS */}
                    <div id="print-screens-container" className="pdf-hidden-source pdf-common-styles screen-preview-styles">
                        {/* PÁGINA 1: CAPA DA APRESENTAÇÃO */}
                        <div className="a4-page">
                            <div className="absolute top-0 left-0 w-full h-full bg-slate-900 overflow-hidden">
                                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
                            </div>
                            <div className="page-content justify-center items-center text-center relative z-20">
                                <div className="mb-16">
                                    <div className="w-48 h-48 bg-white/5 backdrop-blur-xl rounded-[4rem] mx-auto flex items-center justify-center text-8xl shadow-2xl border border-white/10 mb-10">🤖</div>
                                    <h3 className="text-8xl font-black text-white tracking-tighter uppercase leading-[0.75] mb-4">EAB<br/><span className="text-blue-500">MASTER</span></h3>
                                    <p className="text-xl text-blue-400 font-black uppercase tracking-[0.4em]">Visual Ecosystem</p>
                                </div>
                                <div className="max-w-md">
                                    <div className="h-1.5 w-24 bg-blue-500 mx-auto rounded-full mb-10"></div>
                                    <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-6">APRESENTAÇÃO DE INTERFACES<br/><span className="text-blue-500 italic"> DESIGN PREVIEW 2026</span></h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed tracking-widest max-w-[280px] mx-auto">UMA JORNADA VISUAL PELA TECNOLOGIA A SERVIÇO DA AUTONOMIA NO ESPECTRO AUTISTA.</p>
                                </div>
                            </div>
                            <div className="pdf-footer !border-white/10 !text-white/20"><span>EAB MASTER • DESIGN SYSTEM</span><span>COVER</span></div>
                        </div>

                        {/* PÁGINA 2: TECH STACK VISUAL */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Infraestrutura e Design System</h2>
                                <div className="flex-1 flex flex-col justify-center gap-12">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="highlight-card !bg-white border-2 border-slate-100 flex flex-col items-center text-center p-10">
                                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600"><Database className="w-8 h-8"/></div>
                                            <h4 className="text-xl font-black text-slate-800 mb-2 uppercase">Firebase Cloud</h4>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Banco de dados NoSQL com sincronização em tempo real para sincronia multi-perfil instantânea.</p>
                                        </div>
                                        <div className="highlight-card !bg-white border-2 border-slate-100 flex flex-col items-center text-center p-10">
                                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600"><BrainCircuit className="w-8 h-8"/></div>
                                            <h4 className="text-xl font-black text-slate-800 mb-2 uppercase">IA Analítica</h4>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Processamento via Gemini AI para detecção de padrões de humor e recomendações de regulação.</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
                                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6">Paleta de Cores & Elementos</h4>
                                        <div className="grid grid-cols-3 gap-6 mb-10">
                                            <div className="space-y-4">
                                                <div className="h-4 w-full bg-blue-500 rounded-lg"></div>
                                                <p className="text-[10px] font-black uppercase text-slate-400">Primary Blue</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="h-4 w-full bg-slate-800 rounded-lg"></div>
                                                <p className="text-[10px] font-black uppercase text-slate-400">Deep Slate</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="h-4 w-full bg-rose-500 rounded-lg"></div>
                                                <p className="text-[10px] font-black uppercase text-slate-400">Alert Rose</p>
                                            </div>
                                        </div>
                                        <div className="h-[1px] w-full bg-white/10 mb-8"></div>
                                        <div className="flex justify-between items-center opacity-60">
                                            <div className="flex gap-4">
                                                <LayoutDashboard className="w-6 h-6" /><Activity className="w-6 h-6" /><Fingerprint className="w-6 h-6" />
                                            </div>
                                            <p className="text-[10px] font-black">Interação UX Fluída • 60 FPS</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • DESIGN SYSTEM</span><span>PÁGINA 02</span></div>
                        </div>

                        {/* PÁGINA 3: LOGIN - PORTAL DE ACESSO */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Portal de Acesso Inteligente</h2>
                                <div className="flex-1 flex items-center justify-around gap-10">
                                    <div className="space-y-8 max-w-xs">
                                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-[0.9]">AUTH<br/><span className="text-blue-600 italic">GATEWAY</span></h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Autenticação centralizada com SSO Google e verificação de perfil multi-nível. O sistema identifica automaticamente o tipo de usuário (Pai, Escola, Clínico) e personaliza o ecossistema.</p>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest"><CheckCircle2 className="text-blue-500 w-5 h-5"/> Segurança de Dados AES-256</div>
                                            <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest"><CheckCircle2 className="text-blue-500 w-5 h-5"/> Sincronização Biométrica</div>
                                        </div>
                                    </div>
                                    <div className="screen-mock shadow-[0_60px_120px_-20px_rgba(59,130,246,0.3)] border-slate-200">
                                        <div className="screen-content bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-50 to-white -z-0"></div>
                                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-2xl mb-10 border border-slate-100 relative z-10">🤖</div>
                                            <div className="w-full space-y-4 relative z-10">
                                                <div className="h-14 bg-white rounded-2xl border-2 border-slate-100 flex items-center px-4 gap-4 shadow-sm text-slate-300 font-bold text-sm">usuário@email.com</div>
                                                <div className="h-14 bg-blue-600 rounded-2xl shadow-xl flex items-center justify-center text-white font-black text-xs uppercase tracking-[0.2em]">Entrar com Google</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • LOGIN FLOW</span><span>PÁGINA 03</span></div>
                        </div>

                        {/* PÁGINA 4: DASHBOARD PAIS - VISÃO 360 */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Dashboard: Gestão Familiar</h2>
                                <div className="flex-1 flex items-center justify-around gap-10">
                                    <div className="screen-mock shadow-[0_60px_120px_-20px_rgba(79,70,229,0.3)] border-slate-200">
                                        <div className="screen-content bg-slate-50 flex flex-col p-5">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"><Users className="w-5 h-5 text-indigo-500"/></div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400">Olá, Michel!</p>
                                                    <p className="text-xs font-black text-slate-800 italic">21 de Março</p>
                                                </div>
                                            </div>
                                            <div className="h-28 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] mb-6 p-6 text-white shadow-lg flex items-center">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase text-indigo-200 mb-1">Status de Hoje</p>
                                                    <p className="text-xl font-black tracking-tighter">Estabilidade Geral</p>
                                                </div>
                                                <div className="text-3xl font-black text-indigo-200">92%</div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500"><HeartPulse/></div>
                                                    <div><p className="text-[10px] font-black text-slate-800">SAÚDE</p><p className="text-[8px] font-bold text-slate-400 uppercase">Administrado: 08:30</p></div>
                                                </div>
                                                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><GraduationCap/></div>
                                                    <div><p className="text-[10px] font-black text-slate-800">ESCOLA</p><p className="text-[8px] font-bold text-slate-400 uppercase">3 Interações em Grupo</p></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8 max-w-xs text-right">
                                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-[0.9]">VISÃO<br/><span className="text-indigo-600 italic">360 GRAUS</span></h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Centralização absoluta. O dashboard dos pais cruza dados de escola, terapias e biometria residencial, detectando precocemente padrões de fadiga sensorial através de algoritmos preditivos.</p>
                                        <div className="flex gap-4 justify-end">
                                            <div className="p-3 bg-slate-50 rounded-2xl"><BarChart3 className="w-6 h-6 text-slate-400" /></div>
                                            <div className="p-3 bg-slate-50 rounded-2xl"><CalendarCheck className="w-6 h-6 text-slate-400" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • PARENT DASHBOARD</span><span>PÁGINA 04</span></div>
                        </div>

                        {/* PÁGINA 5: MÓDULO CRIANÇA - O UNIVERSO DO HERÓI */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Módulo Criança: Gamificação</h2>
                                <div className="flex-1 flex items-center justify-around gap-10">
                                    <div className="space-y-8 max-w-xs">
                                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-[0.9]">GAMIFICAÇÃO<br/><span className="text-amber-500 italic">POSITIVE</span></h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Design de "Ruído Visual Zero". Transformamos o cotidiano em uma missão épica através de checklists visuais e reforço visual positivo imediato, reduzindo a ansiedade de transição.</p>
                                        <div className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                                            <p className="text-xs font-black text-amber-900 mb-2 uppercase">Prêmio do Dia: Sorvete</p>
                                            <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-amber-200">
                                                <div className="h-full w-[70%] bg-amber-500"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="screen-mock shadow-[0_60px_120px_-20px_rgba(245,158,11,0.2)] border-slate-200 bg-indigo-950">
                                        <div className="screen-content bg-indigo-900 flex flex-col p-5">
                                            <div className="w-16 h-16 bg-white rounded-3xl mx-auto mb-8 flex items-center justify-center text-4xl shadow-2xl">🤖</div>
                                            <div className="space-y-6">
                                                <div className="bg-indigo-950/50 p-6 rounded-[2rem] border border-indigo-700 flex items-center gap-6">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl">🦷</div>
                                                    <p className="text-lg font-black text-white italic uppercase tracking-tighter">Escovar Dentes</p>
                                                </div>
                                                <div className="bg-indigo-950/50 p-6 rounded-[2rem] border border-indigo-700 flex items-center gap-6">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl">🎒</div>
                                                    <p className="text-lg font-black text-white italic uppercase tracking-tighter">Mochila Escolar</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="nav-bar bg-indigo-950 border-indigo-800 h-24 px-8">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-800 flex items-center justify-center">🏹</div>
                                            <div className="w-16 h-16 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 flex items-center justify-center text-2xl -translate-y-4">🚀</div>
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-800 flex items-center justify-center">🛡️</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • CHILD INTERFACE</span><span>PÁGINA 05</span></div>
                        </div>

                        {/* PÁGINA 6: SALA DA CALMA - LABORATÓRIO ASMR */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header text-emerald-600 border-emerald-600">Sala da Calma: Laboratório ASMR</h2>
                                <div className="flex-1 flex items-center justify-around gap-10">
                                    <div className="screen-mock shadow-[0_60px_120px_-20px_rgba(16,185,129,0.2)] border-slate-200">
                                        <div className="screen-content bg-slate-50 flex flex-col p-6 items-center">
                                            <div className="w-full flex justify-between items-center mb-6">
                                                <Sparkles className="text-emerald-500 w-5 h-5"/>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ASMR SENSORY LAB</p>
                                                <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
                                            </div>
                                            
                                            <div className="w-full space-y-4">
                                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-3">Gatilhos (Triggers)</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="p-3 bg-emerald-50 rounded-2xl flex items-center gap-2 border border-emerald-100">
                                                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px]">👂</div>
                                                            <span className="text-[8px] font-black uppercase text-emerald-900">Sussurros</span>
                                                        </div>
                                                        <div className="p-3 bg-blue-50 rounded-2xl flex items-center gap-2 border border-blue-100">
                                                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px]">💅</div>
                                                            <span className="text-[8px] font-black uppercase text-blue-900">Tapping</span>
                                                        </div>
                                                        <div className="p-3 bg-amber-50 rounded-2xl flex items-center gap-2 border border-amber-100">
                                                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px]">🖌️</div>
                                                            <span className="text-[8px] font-black uppercase text-amber-900">Fricção</span>
                                                        </div>
                                                        <div className="p-3 bg-purple-50 rounded-2xl flex items-center gap-2 border border-purple-100">
                                                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px]">📖</div>
                                                            <span className="text-[8px] font-black uppercase text-purple-900">Objetos</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-900 p-5 rounded-[2.5rem] shadow-xl">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <p className="text-[8px] font-black text-emerald-400 uppercase">Mixer Ativo</p>
                                                        <div className="flex gap-1">
                                                            <div className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                                                            <div className="w-1 h-5 bg-emerald-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                                            <div className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                                        </div>
                                                    </div>
                                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full w-[65%] bg-emerald-500"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8 max-w-xs text-right">
                                        <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Tecnologia Sensorial</div>
                                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-[0.9]">RELAXAMENTO<br/><span className="text-emerald-500 italic">PROFUNDO</span></h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                            Integração de gatilhos <strong>ASMR (Autonomous Sensory Meridian Response)</strong> para indução de calma biológica. O sistema oferece sons modulados de sussurros, tapping e fricção, desenhados para reduzir a frequência cardíaca e auxiliar no combate à insônia e ansiedade sensorial.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                                <p className="text-[10px] font-black text-emerald-600 mb-1 leading-none uppercase">Objetivo 01</p>
                                                <p className="text-xs font-bold text-slate-800">Combate à Insônia</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                                <p className="text-[10px] font-black text-blue-600 mb-1 leading-none uppercase">Objetivo 02</p>
                                                <p className="text-xs font-bold text-slate-800">Foco Cognitivo</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • ASMR SENSORY LAB</span><span>PÁGINA 06</span></div>
                        </div>

                        {/* PÁGINA 7: ESCOLA - DIÁRIO DE INCLUSÃO */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Escola: Diário de Inclusão</h2>
                                <div className="flex-1 flex items-center justify-around gap-10">
                                    <div className="space-y-8 max-w-xs">
                                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-[0.9]">DIÁRIO DO<br/><span className="text-purple-600 italic">MEDIADOR</span></h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Interface otimizada para o professor mediador. Registro em 3 cliques de interações sociais e pedagógicas, garantindo que o plano de ensino individualizado (PEI) seja alimentado com dados reais da sala de aula.</p>
                                        <div className="flex gap-3">
                                            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-lg">Socialização</span>
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg">Foco</span>
                                        </div>
                                    </div>
                                    <div className="screen-mock shadow-[0_60px_120px_-20px_rgba(147,51,234,0.2)] border-slate-200">
                                        <div className="screen-content bg-white flex flex-col p-6">
                                            <div className="h-14 bg-purple-600 rounded-2xl mb-8 p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"><GraduationCap className="w-5 h-5"/></div>
                                                <p className="text-[10px] font-black text-white uppercase">Módulo Escolar</p>
                                            </div>
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interação com Pares</p>
                                                    <div className="flex gap-2">
                                                        <div className="h-10 flex-1 bg-slate-50 rounded-xl border-2 border-slate-100 italic font-black text-[10px] flex items-center justify-center text-slate-300">Baixa</div>
                                                        <div className="h-10 flex-1 bg-purple-600 rounded-xl font-black text-[10px] flex items-center justify-center text-white shadow-lg">Alta</div>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <p className="text-[10px] font-black uppercase text-purple-400">Desregulação</p>
                                                        <span className="text-xl font-black">0</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="h-8 flex-1 bg-white/10 rounded-lg"></div>
                                                        <div className="h-8 flex-1 bg-purple-500 rounded-lg"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • SCHOOL PORTAL</span><span>PÁGINA 07</span></div>
                        </div>

                        {/* PÁGINA 8: SAÚDE - BIOMETRIA E LOGS */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Saúde e Biometria Integrada</h2>
                                <div className="flex-1 flex items-center justify-around gap-10">
                                    <div className="screen-mock shadow-[0_60px_120px_-20px_rgba(244,63,94,0.2)] border-slate-200">
                                        <div className="screen-content bg-white p-6">
                                            <div className="h-14 bg-rose-500 rounded-2xl mb-8 p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"><HeartPulse className="w-5 h-5"/></div>
                                                <p className="text-[10px] font-black text-white uppercase">Vinais e Medicinas</p>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="bg-rose-50 p-5 rounded-[2rem] border border-rose-100">
                                                    <p className="text-[10px] font-black text-rose-900 mb-2 uppercase">Qualidade do Sono</p>
                                                    <div className="h-20 flex items-end gap-1">
                                                        {[30, 45, 80, 60, 40, 90, 70, 55].map((h, i) => (
                                                            <div key={i} className="flex-1 bg-rose-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 mb-3 uppercase">Administração</p>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3"><Pill className="text-rose-500 w-5 h-5"/><span className="text-xs font-black text-slate-800">Canabidiol</span></div>
                                                        <span className="text-[10px] font-black text-green-500 italic">08:00 OK</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8 max-w-xs text-right">
                                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-[0.9]">PRECISÃO<br/><span className="text-rose-600 italic">BIOMÉTRICA</span></h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Cruzamento de dados fisiológicos (sono, batimentos) com comportamentos disruptivos. O EAB Master ajuda a identificar se uma crise foi precedida por uma noite de sono ruim ou desequilíbrio metabólico.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • HEALTH ANALYTICS</span><span>PÁGINA 08</span></div>
                        </div>

                        {/* PÁGINA 9: PROFISSIONAL - INTELIGÊNCIA CLÍNICA */}
                        <div className="a4-page">
                            <div className="page-content">
                                <h2 className="section-header">Portal Clínico Profissional</h2>
                                <div className="flex-1 flex items-center justify-around gap-10">
                                    <div className="space-y-8 max-w-xs">
                                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-[0.9]">DATA-DRIVEN<br/><span className="text-teal-600 italic">THERAPY</span></h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Ambiente para Fonoaudiólogos, Psicólogos e T.O.s. Redução de 80% no tempo de preenchimento de relatórios através da automação inteligente que compila diários de pais e escola em resumos técnicos.</p>
                                    </div>
                                    <div className="screen-mock shadow-[0_60px_120px_-20px_rgba(20,184,166,0.2)] border-slate-200">
                                        <div className="screen-content bg-slate-50 p-6 flex flex-col">
                                            <div className="h-14 bg-teal-600 rounded-2xl mb-8 p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"><Stethoscope className="w-5 h-5"/></div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Painel Clínico</p>
                                            </div>
                                            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm mb-6 border border-slate-100 flex-1">
                                                <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600"><Target className="w-5 h-5"/></div><p className="text-[10px] font-black text-slate-800 uppercase">Evolução de Metas</p></div>
                                                <div className="space-y-4">
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[85%] bg-teal-500"></div></div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[40%] bg-teal-300"></div></div>
                                                </div>
                                            </div>
                                            <div className="h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-600/20">Gerar Relatório IA</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • CLINICAL INTELLIGENCE</span><span>PÁGINA 09</span></div>
                        </div>

                        {/* PÁGINA 10: MANIFESTO FINAL */}
                        <div className="a4-page">
                            <div className="page-content justify-center items-center text-center">
                                <div className="mb-20">
                                    <div className="w-32 h-32 bg-slate-950 rounded-[3rem] mx-auto flex items-center justify-center text-[70px] shadow-2xl mb-12">🤖</div>
                                    <h3 className="text-[100px] font-black text-slate-900 tracking-tighter uppercase leading-[0.7]">EAB<br/><span className="text-blue-600">MASTER</span></h3>
                                </div>
                                <div className="max-w-md space-y-10">
                                    <p className="text-3xl text-slate-400 font-bold uppercase tracking-[0.2em] italic leading-tight">Tecnologia, Amor e Ciência<br/>em perfeita convergência.</p>
                                    <div className="h-2 w-32 bg-blue-600 mx-auto rounded-full"></div>
                                    <div className="flex justify-center gap-16 pt-10">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Build Identifier</p>
                                            <p className="text-2xl font-black text-slate-800 tracking-tighter">2026.REL_01</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Designer</p>
                                            <p className="text-2xl font-black text-blue-600 tracking-tighter">MICHEL BUENO</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pdf-footer"><span>EAB MASTER • DESIGN PREVIEW</span><span>FINAL</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
