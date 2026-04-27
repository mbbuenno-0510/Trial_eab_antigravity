import React from 'react';

// 🛠️ CORREÇÃO DE TIPAGEM: Adicionando 'label' e 'total'
interface StarProgressBarHorizontalProps {
    progress: number; // Valor de 0 a 100
    label: string;    // Ex: "Meditação"
    total: number;    // Ex: 7
    currentValue: number; // Ex: 4 (Opcional, mas útil para mostrar X/Y)
}

/**
 * Componente de barra de progresso horizontal com estrela fixa na ponta.
 * A estrela é branca (apagada) e só acende em cor vibrante e brilho ao atingir 100%,
 * adicionando um efeito de pulso contínuo (animação).
 */
const StarProgressBarHorizontal: React.FC<StarProgressBarHorizontalProps> = ({ 
    progress, 
    label, 
    total, 
    currentValue 
}) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    const isCompleted = clampedProgress === 100;

    // --- 1. Definição da Animação CSS ---
    const pulseAnimation = `
        @keyframes star-pulse {
            0%, 100% { transform: scale(1.3); }
            50% { transform: scale(1.4); }
        }
    `;

    // --- 2. Lógica de Estilo da Estrela ---

    const completedStarStyle: React.CSSProperties = {
        color: '#FF9800', 
        filter: 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
        opacity: 1,
        animation: 'star-pulse 1.5s infinite ease-in-out', 
    };

    const partialStarStyle: React.CSSProperties = {
        color: '#E0E0E0', 
        opacity: 1, 
        transform: 'scale(1.2)', 
        filter: 'none',
        animation: 'none',
    };

    const starStyle = isCompleted ? completedStarStyle : partialStarStyle;
    const baseTransform = isCompleted ? {} : { transform: 'scale(1.2)' }; 

    return (
        <div className="flex flex-col items-start w-full max-w-lg mx-auto py-2">
            
            {/* INJEÇÃO DO KEYFRAMES */}
            {isCompleted && (
                <style dangerouslySetInnerHTML={{ __html: pulseAnimation }} />
            )}
            
            {/* 🔑 NOVO BLOCO: Rótulo e Texto de Progresso */}
            <div className="flex justify-between w-full items-baseline mb-1">
                <span className="text-sm font-semibold text-slate-700 truncate">
                    {label}
                </span>
                <span className={`text-xs font-bold ${isCompleted ? 'text-orange-600' : 'text-slate-500'}`}>
                    {isCompleted ? 'OBJETIVO CONCLUÍDO!' : `${currentValue || 0}/${total} vezes (${clampedProgress.toFixed(0)}%)`}
                </span>
            </div>
            
            {/* Container da Barra de Progresso e Estrela */}
            <div className="flex items-center w-full">
                {/* 1. Área do Bar: Container e Barra Base (Cinza/Branca) */}
                <div className="relative flex-grow h-4 bg-slate-100 rounded-full overflow-hidden">
                    
                    {/* A Barra Preenchida (Laranja Sólido) */}
                    <div 
                        className="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
                        style={{
                            width: `${clampedProgress}%`, 
                            background: '#FF9800', 
                            borderRadius: '999px',
                        }}
                    />
                </div>

                {/* 2. A Estrela Focada e Fixa no Final */}
                <div 
                    className={`flex-shrink-0 w-10 h-10 transition-all duration-700 ease-out`} 
                    style={{
                        marginLeft: '-12px', // Ajustado de -18px para o w-10
                        
                        ...baseTransform, 
                        ...starStyle, 
                        zIndex: 10, 
                    }}
                >
                    {/* Ícone de Estrela (5 pontas) */}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default StarProgressBarHorizontal;