import React, { useState, useEffect, useCallback } from 'react';
import { 
    Ghost, Zap, Moon, Sun, Cloud, Anchor, Apple, Axe, Baby, Bike, Bird, Bone, Book, Bot, Bug, Bus, 
    Cake, Camera, Car, Cat, Clock, Coffee, Compass, Crown, Dog, DoorOpen, Eye, Feather, Fish, 
    Flame, Flower, Footprints, Gift, Globe, Guitar, Hammer, Heart, Home, IceCream, Key, Lamp, 
    Leaf, Lightbulb, Lock, Magnet, Map, Mic, Mountain, Music, Palette, PawPrint, Pen, Phone, 
    Plane, Pizza, Puzzle, Rocket, Scissors, Ship, Smile, Snowflake, Star, Stethoscope, Sword, 
    Target, Tent, Ticket, Trees, Trophy, Truck, Umbrella, Watch, Wind, Wrench, RefreshCw, Play
} from 'lucide-react';

const ICON_POOL = [
    Ghost, Zap, Moon, Sun, Cloud, Anchor, Apple, Axe, Baby, Bike, Bird, Bone, Book, Bot, Bug, Bus, 
    Cake, Camera, Car, Cat, Clock, Coffee, Compass, Crown, Dog, DoorOpen, Eye, Feather, Fish, 
    Flame, Flower, Footprints, Gift, Globe, Guitar, Hammer, Heart, Home, IceCream, Key, Lamp, 
    Leaf, Lightbulb, Lock, Magnet, Map, Mic, Mountain, Music, Palette, PawPrint, Pen, Phone, 
    Plane, Pizza, Puzzle, Rocket, Scissors, Ship, Smile, Snowflake, Star, Stethoscope, Sword, 
    Target, Tent, Ticket, Trees, Trophy, Truck, Umbrella, Watch, Wind, Wrench
];

const getRandomUniqueIndices = (count: number, poolSize: number): number[] => {
    const indices = new Set<number>();
    while (indices.size < count) {
        indices.add(Math.floor(Math.random() * poolSize));
    }
    return Array.from(indices);
};

interface StoryCubesProps {
    soundGen: {
        init: () => void;
        playPop: () => void;
    };
}

const StoryCubes: React.FC<StoryCubesProps> = ({ soundGen }) => {
    const [dice, setDice] = useState<number[]>(getRandomUniqueIndices(9, ICON_POOL.length));
    const [selectedDice, setSelectedDice] = useState<boolean[]>(Array(9).fill(false));
    const [isRolling, setIsRolling] = useState(false);

    const rollDice = useCallback(() => {
        if (isRolling) return;
        
        soundGen.init();
        setIsRolling(true);
        // Não limpamos selectedDice aqui, permitindo "lock" de ícones já usados
        
        let rolls = 0;
        const maxRolls = 15;
        const interval = setInterval(() => {
            setDice(prevDice => {
                const newDice = [...prevDice];
                const currentlySelectedIndices = new Set<number>();
                
                // Coleta índices que estão selecionados para evitar duplicatas
                for (let i = 0; i < 9; i++) {
                    if (selectedDice[i]) currentlySelectedIndices.add(prevDice[i]);
                }

                // Decide novos ícones para slots não selecionados
                const usedInThisRoll = new Set<number>(currentlySelectedIndices);
                for (let i = 0; i < 9; i++) {
                    if (!selectedDice[i]) {
                        let nextIcon;
                        do {
                            nextIcon = Math.floor(Math.random() * ICON_POOL.length);
                        } while (usedInThisRoll.has(nextIcon));
                        newDice[i] = nextIcon;
                        usedInThisRoll.add(nextIcon);
                    }
                }
                return newDice;
            });
            soundGen.playPop();
            rolls++;
            
            if (rolls >= maxRolls) {
                clearInterval(interval);
                setIsRolling(false);
            }
        }, 80);
    }, [isRolling, soundGen, selectedDice]);

    const toggleSelect = (index: number) => {
        if (isRolling) return;
        soundGen.playPop();
        setSelectedDice(prev => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    };

    const resetGame = () => {
        if (isRolling) return;
        soundGen.playPop();
        setSelectedDice(Array(9).fill(false));
        setDice(getRandomUniqueIndices(9, ICON_POOL.length));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-4 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-700 flex items-center justify-center gap-2">
                    <RefreshCw className={`w-6 h-6 text-purple-500 ${isRolling ? 'animate-spin' : ''}`} /> Dados de Histórias
                </h3>
                <p className="text-sm text-slate-500 mt-1">Clique nos ícones usados na sua história para fixá-los.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-10">
                {dice.map((iconIdx, i) => {
                    const IconComponent = ICON_POOL[iconIdx];
                    const isSelected = selectedDice[i];
                    return (
                        <div 
                            key={i} 
                            onClick={() => toggleSelect(i)}
                            className={`
                                w-24 h-24 md:w-32 md:h-32 rounded-[2rem] flex items-center justify-center transition-all duration-300 cursor-pointer relative
                                overflow-hidden border-2
                                ${isRolling && !isSelected 
                                    ? 'animate-bounce border-slate-200 bg-slate-100 shadow-sm' 
                                    : 'shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] border-white bg-gradient-to-br from-white to-slate-50 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-1'
                                }
                                ${isSelected 
                                    ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-inner ring-4 ring-green-100' 
                                    : ''
                                }
                            `}
                            style={{
                                perspective: '1000px',
                            }}
                        >
                            {/* Inner Dice Shadow/3D effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
                            <div className={`absolute bottom-0 left-0 right-0 h-2 bg-slate-200/50 ${isSelected ? 'bg-green-200/50' : ''}`} />
                            
                            <IconComponent className={`
                                w-12 h-12 md:w-16 md:h-16 transition-all duration-300
                                ${isRolling && !isSelected ? 'opacity-30 scale-75 rotate-45' : 'opacity-100 scale-100 rotate-0'}
                                ${isSelected ? 'text-green-600 drop-shadow-md' : 'text-slate-700 drop-shadow-sm'}
                            `} />
                            
                            {isSelected && (
                                <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1 shadow-lg animate-in zoom-in duration-300 ring-2 ring-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={rollDice} 
                    disabled={isRolling}
                    className={`
                        group relative px-10 py-4 rounded-full font-black text-white text-lg shadow-xl transition-all active:scale-95
                        ${isRolling ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'}
                    `}
                >
                    <div className="flex items-center gap-2">
                        {isRolling ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                        {isRolling ? 'Rolando...' : 'Próximos Dados'}
                    </div>
                </button>

                <button 
                    onClick={resetGame}
                    disabled={isRolling}
                    className="px-8 py-4 rounded-full font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Reiniciar
                </button>
            </div>

            <p className="mt-8 text-xs text-slate-400 font-medium text-center max-w-xs leading-relaxed">
                {selectedDice.some(v => v) 
                    ? "Ícones marcados com verde não mudam na próxima rodada."
                    : "Dica: Tente conectar todos os 9 ícones em uma única história maluca!"}
            </p>
        </div>
    );
};

export default StoryCubes;
