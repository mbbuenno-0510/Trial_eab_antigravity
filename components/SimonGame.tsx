import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw } from 'lucide-react';

// Interface compatível com a classe SoundGenerator definida no SensoryView
interface SoundGeneratorType {
    ctx: AudioContext | null;
    init: () => void;
    stop: () => void;
    playTibetanBell: (time?: number) => void;
    masterGainNode: GainNode | null;
}

interface SimonGameProps {
    soundGen: SoundGeneratorType;
}

// Definição das Cores e Frequências do Jogo
const SIMON_PADS = [
    { color: 'bg-green-500', activeColor: 'bg-green-300', freq: 440, id: 0, text: 'text-green-800' }, // Lá
    { color: 'bg-red-500', activeColor: 'bg-red-300', freq: 392, id: 1, text: 'text-red-800' },     // Sol
    { color: 'bg-yellow-500', activeColor: 'bg-yellow-300', freq: 329.63, id: 2, text: 'text-yellow-800' }, // Mi
    { color: 'bg-blue-500', activeColor: 'bg-blue-300', freq: 293.66, id: 3, text: 'text-blue-800' },   // Ré
];

const SimonGame: React.FC<SimonGameProps> = ({ soundGen }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [level, setLevel] = useState(1);
    const [gameStatus, setGameStatus] = useState<'idle' | 'showing' | 'playing' | 'lose'>('idle');
    const [activePad, setActivePad] = useState<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    // Efeito para Limpeza ao desmontar
    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
            soundGen.stop();
        };
    }, [soundGen]);

    // Função de reprodução de som otimizada
    const playSimonSound = (freq: number, duration: number = 0.3) => {
        soundGen.init();
        if (!soundGen.ctx) return;
        
        // Pequena variação para não cortar abruptamente se chamado rápido
        const osc = soundGen.ctx.createOscillator();
        const gain = soundGen.ctx.createGain();
        const time = soundGen.ctx.currentTime;

        osc.frequency.setValueAtTime(freq, time);
        osc.type = 'triangle'; // Timbre mais suave que square, mas distinto
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.02); 
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration); 

        osc.connect(gain);
        gain.connect(soundGen.ctx.destination);
        
        osc.start(time);
        osc.stop(time + duration + 0.1);
    };
    
    // Reproduz a sequência atual para o jogador assistir
    const playSequence = (currentSeq: number[]) => {
        setGameStatus('showing');
        setIsPlayerTurn(false);
        let i = 0;
        
        // A velocidade aumenta conforme o nível (mínimo de 250ms)
        const speed = Math.max(250, 800 - (level * 40)); 

        const playNext = () => {
            if (i < currentSeq.length) {
                const padId = currentSeq[i];
                const freq = SIMON_PADS[padId].freq;
                
                setActivePad(padId);
                playSimonSound(freq, speed / 1500); // Duração do som proporcional à velocidade
                
                i++;
                
                // Timeout para desligar a luz do pad antes do próximo
                timeoutRef.current = setTimeout(() => {
                    setActivePad(null);
                    // Pequena pausa entre notas (20% do tempo)
                    timeoutRef.current = setTimeout(playNext, speed * 0.2) as unknown as number; 
                }, speed * 0.8) as unknown as number;

            } else {
                // Fim da sequência: Vez do Jogador
                setActivePad(null);
                setGameStatus('playing');
                setIsPlayerTurn(true);
            }
        };

        playNext();
    };

    // Inicia o jogo do zero
    const startGame = () => {
        setSequence([]);
        setPlayerSequence([]);
        setLevel(1);
        // IMPORTANTE: Define 'showing' imediatamente para esconder o botão "Jogar"
        setGameStatus('showing'); 
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            nextRound(1, []);
        }, 800) as unknown as number;
    };

    // Prepara a próxima rodada (adiciona um passo)
    const nextRound = (newLevel: number, currentSequence: number[]) => {
        // IMPORTANTE: Mantém 'showing' para não mostrar o botão de Play no meio do jogo
        setGameStatus('showing'); 
        setPlayerSequence([]);
        setLevel(newLevel);

        const newPad = Math.floor(Math.random() * SIMON_PADS.length);
        const nextSequence = [...currentSequence, newPad];
        setSequence(nextSequence);

        // Delay antes de começar a tocar a nova sequência
        timeoutRef.current = setTimeout(() => {
            playSequence(nextSequence);
        }, 1000) as unknown as number;
    };

    // Clique do Jogador nos Pads
    const handlePadClick = (padId: number) => {
        if (!isPlayerTurn || gameStatus !== 'playing') return;

        // Feedback Visual e Sonoro Imediato
        setActivePad(padId);
        playSimonSound(SIMON_PADS[padId].freq, 0.2);
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // Desliga a luz rapidamente
        timeoutRef.current = setTimeout(() => setActivePad(null), 250) as unknown as number;

        // Lógica do Jogo
        const newPlayerSequence = [...playerSequence, padId];
        setPlayerSequence(newPlayerSequence);

        const currentIndex = newPlayerSequence.length - 1;
        const expectedId = sequence[currentIndex];

        if (padId !== expectedId) {
            // ERROU
            soundGen.stop();
            setTimeout(() => playSimonSound(150, 0.8), 100); // Som grave de erro
            setGameStatus('lose');
            setIsPlayerTurn(false);
        } else if (newPlayerSequence.length === sequence.length) {
            // ACERTOU A SEQUÊNCIA COMPLETA
            setIsPlayerTurn(false);
            setGameStatus('showing'); // Bloqueia cliques imediatamente e esconde Play
            
            timeoutRef.current = setTimeout(() => {
                // soundGen.playTibetanBell(); <-- LINHA REMOVIDA
                nextRound(level + 1, sequence);
            }, 800) as unknown as number;
        }
    };

    // Renderiza a grade de botões
    const renderPads = () => (
        <div className="relative w-72 h-72 md:w-96 md:h-96 shrink-0">
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full rounded-full shadow-2xl overflow-hidden bg-slate-800 border-[12px] border-slate-900">
                {SIMON_PADS.map((pad) => {
                    const isActive = activePad === pad.id;
                    const isClickable = gameStatus === 'playing';
                    
                    const borderRadiusMap: { [key: number]: string } = {
                        0: 'rounded-tl-[100%]',
                        1: 'rounded-tr-[100%]',
                        2: 'rounded-bl-[100%]',
                        3: 'rounded-br-[100%]',
                    };

                    return (
                        <button
                            key={pad.id}
                            onClick={() => handlePadClick(pad.id)}
                            disabled={!isClickable}
                            className={`
                                relative border-[4px] border-slate-900 transition-all duration-75
                                ${isActive ? pad.activeColor : pad.color}
                                ${isActive ? 'brightness-125 scale-[0.98]' : 'brightness-100'}
                                ${!isClickable && !isActive ? 'opacity-90' : 'opacity-100'}
                                ${borderRadiusMap[pad.id]}
                                active:scale-[0.96]
                            `}
                            style={{
                                zIndex: isActive ? 10 : 1
                            }}
                            aria-label={`Botão ${pad.id}`}
                        />
                    );
                })}
            </div>
            
            {/* Console Central */}
            <div className="absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-44 md:h-44 rounded-full bg-slate-800 border-[8px] border-slate-900 flex flex-col items-center justify-center shadow-2xl z-20 overflow-hidden">
                
                {gameStatus === 'idle' && (
                    <button onClick={startGame} className="bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center animate-pulse">
                        <Play className="w-6 h-6 inline-block mr-1 fill-current" /> Jogar
                    </button>
                )}

                {gameStatus === 'showing' && (
                    <div className="text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Nível {level}</p>
                        <p className="text-white text-lg font-black animate-pulse">Observe...</p>
                    </div>
                )}

                {gameStatus === 'playing' && (
                    <div className="text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Nível {level}</p>
                        <p className="text-yellow-400 text-lg font-black">Sua Vez!</p>
                    </div>
                )}

                {gameStatus === 'lose' && (
                    <div className="text-center">
                         <p className="text-red-500 text-xl font-black mb-2">Ah não!</p>
                         <p className="text-slate-400 text-xs mb-3">Chegou no Nível {level}</p>
                         <button onClick={startGame} className="bg-white/10 text-white font-bold py-2 px-4 text-xs rounded-full hover:bg-white/20 transition-all flex items-center mx-auto">
                            <RefreshCw className="w-3 h-3 mr-2" /> Tentar de novo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-bold text-slate-700 mb-8 flex items-center gap-2">
                <Square className="w-6 h-6 text-indigo-500 fill-current" /> Jogo da Memória
            </h3>
            
            {renderPads()}
            
            <p className="mt-10 text-sm text-slate-500 text-center max-w-xs font-medium">
                {gameStatus === 'idle' ? 'Toque em Jogar para começar' : 'Repita a sequência de luzes e sons.'}
            </p>
        </div>
    );
};

export default SimonGame;