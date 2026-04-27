import React from 'react';
import { Sparkles } from 'lucide-react';

interface SoundGeneratorType {
    stop: () => void;
    playNote: (freq: number) => void;
    playTibetanBell: (time?: number) => void;
}

interface CalmPianoProps {
    soundGen: SoundGeneratorType;
}

const CalmPiano: React.FC<CalmPianoProps> = ({ soundGen }) => {
    // Frequências para uma escala musical simples (C4 a B4)
    // C4, D4, E4, F4, G4, A4, B4, C5
    const notes = [
        { freq: 261.63, label: "Dó 4", color: 'bg-red-300', text: 'text-red-800' },
        { freq: 293.66, label: "Ré 4", color: 'bg-orange-300', text: 'text-orange-800' },
        { freq: 329.63, label: "Mi 4", color: 'bg-yellow-300', text: 'text-yellow-800' },
        { freq: 349.23, label: "Fá 4", color: 'bg-green-300', text: 'text-green-800' },
        { freq: 392.00, label: "Sol 4", color: 'bg-blue-300', text: 'text-blue-800' },
        { freq: 440.00, label: "Lá 4", color: 'bg-indigo-300', text: 'text-indigo-800' },
        { freq: 493.88, label: "Si 4", color: 'bg-purple-300', text: 'text-purple-800' },
        { freq: 523.25, label: "Dó 5", color: 'bg-pink-300', text: 'text-pink-800' }
    ];

    const playTone = (freq: number) => {
        // Garantir que nenhum som contínuo esteja tocando antes
        soundGen.stop(); 
        soundGen.playNote(freq);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <h3 className="text-xl font-bold text-slate-700 mb-6">Tocar Piano da Calma 🎹</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">Crie a sua própria melodia relaxante tocando nas teclas coloridas.</p>

            <div className="flex flex-wrap justify-center gap-2 max-w-full">
                {notes.map(({ freq, label, color, text }) => (
                    <button
                        key={freq}
                        onClick={() => playTone(freq)}
                        className={`
                            w-12 h-32 rounded-b-lg flex flex-col items-center justify-end pb-2 
                            text-xs font-bold shadow-xl transition-all duration-100 ease-in-out
                            ${color} border-4 border-slate-100 ${text}
                            hover:scale-[1.02] active:scale-[0.95] active:shadow-inner
                        `}
                    >
                        {label.split(' ')[0]}
                    </button>
                ))}
            </div>
            
            <div className="mt-8">
                <button 
                    onClick={() => soundGen.playTibetanBell()}
                    className="px-6 py-3 bg-yellow-100 text-yellow-800 rounded-full font-bold shadow-md hover:bg-yellow-200"
                >
                    <Sparkles className="w-5 h-5 inline-block mr-2" /> Tocar Sino para Relaxar
                </button>
            </div>
        </div>
    );
};

export default CalmPiano;