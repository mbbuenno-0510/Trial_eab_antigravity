import React from 'react';
import { MoodType } from '../types';

// Mapeamento de cores interno para o mascote
const MOOD_COLORS = {
  [MoodType.HAPPY]: '#34D399',
  [MoodType.CALM]: '#93C5FD',
  [MoodType.TIRED]: '#FDE047',
  [MoodType.SAD]: '#94A3B8',
  [MoodType.ANGRY]: '#FCA5A5',
  [MoodType.ANXIOUS]: '#F9A8D4',
};

interface RobotMascotProps {
  mood: MoodType | null;
  onSpeakerClick?: () => void;
  isSpeaking?: boolean;
  isLoading?: boolean;
  onInstallClick?: () => void;
  isInstallable?: boolean;
}

const RobotMascot: React.FC<RobotMascotProps> = ({ 
  mood, 
  onSpeakerClick, 
  isSpeaking, 
  isLoading,
  onInstallClick,
  isInstallable
}) => {
  const getExpression = () => {
    switch (mood) {
      case MoodType.HAPPY:
        return {
          eye: <path d="M-5 2 Q 0 -5 5 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
          mouth: <path d="M-15 5 Q 0 15 15 5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        };
      case MoodType.TIRED:
        return {
          eye: <path d="M-5 0 L 5 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
          mouth: <path d="M-15 5 L 15 5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        };
      case MoodType.SAD:
        return {
          eye: <path d="M-5 2 Q 0 8 5 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
          mouth: <path d="M-15 8 Q 0 0 15 8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        };
      case MoodType.ANGRY:
        return {
          eye: <><path d="M-6 -2 L 0 2" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M6 -2 L 0 2" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" /></>,
          mouth: <path d="M-12 8 L 12 8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        };
      case MoodType.ANXIOUS:
        return {
          eye: <circle cx="0" cy="0" r="4" stroke="currentColor" strokeWidth="2" fill="none" />,
          mouth: <path d="M-10 8 C -5 0, 5 0, 10 8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        };
      case MoodType.CALM:
        return {
          eye: <path d="M-5 2 Q 0 -2 5 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
          mouth: <path d="M-12 5 C -5 10, 5 10, 12 5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        };
      default:
        // Default expression (Happy/Neutral)
        return {
          eye: <path d="M-5 2 Q 0 -5 5 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
          mouth: <path d="M-15 5 Q 0 15 15 5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        };
    }
  };

  const { eye, mouth } = getExpression();
  // Se mood for null (ex: tela de login sem seleção), usa uma cor neutra ou padrão (Happy)
  const moodColor = mood ? MOOD_COLORS[mood] : '#34D399'; 

  return (
    <div className="robot-container flex-shrink-0 relative z-10" aria-label={`Mascote com humor: ${mood || 'Neutro'}`} role="img">
      <style>{`
        .robot-container { animation: float 3s ease-in-out infinite; transition: transform 0.3s ease; }
        .robot-container:hover { transform: scale(1.05); }
        .robot-eye-left, .robot-eye-right { animation: blink 4s infinite ease-in-out; }
        .robot-eye-right { animation-delay: 0.15s; }
        .robot-expression { transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
        .robot-speaker-dot { transition: transform 0.3s ease, fill 0.3s ease; }
        .robot-speaker-dot.speaking { animation: pulse 1.5s infinite cubic-bezier(0.66, 0, 0, 1); }
        .robot-speaker-dot.loading { animation: pulse-loading 1s infinite ease-in-out; fill: #FBBF24; }
        .robot-arm-left { animation: swing-left 3s ease-in-out infinite; transform-origin: 20px 80px; }
        .robot-arm-right { animation: swing-right 3s ease-in-out infinite; transform-origin: 100px 80px; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
        @keyframes blink { 0%, 95%, 100% { transform: scaleY(1); } 97.5% { transform: scaleY(0.1); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); fill: #10B981; } 10% { transform: scale(1.3); fill: #34D399; } 20% { transform: scale(1); fill: #10B981; } }
        @keyframes pulse-loading { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.8); opacity: 0.7; } }
        @keyframes swing-left { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(5deg); } }
        @keyframes swing-right { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-5deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; transform-origin: 60px 100px; }
      `}</style>
      <svg width="120" height="150" viewBox="0 0 120 150">
        <defs>
          <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#F1F5F9' }} />
            <stop offset="50%" style={{ stopColor: '#CBD5E1' }} />
            <stop offset="100%" style={{ stopColor: '#F1F5F9' }} />
          </linearGradient>
        </defs>
        
        <g className="antenna">
          <line x1="60" y1="5" x2="60" y2="20" stroke="#94A3B8" strokeWidth="3" />
          <circle cx="60" cy="5" r="5" fill="#FBBF24" />
        </g>
        <g className="head">
          <rect x="30" y="20" width="60" height="50" rx="15" fill="url(#metallicGradient)" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="35" y="25" width="50" height="40" rx="10" fill="#F9FAFB" />
        </g>
        <g className="robot-expression" transform="translate(48, 45)" stroke="#1F2937">
          <g className="robot-eye-left">{eye}</g>
        </g>
        <g className="robot-expression" transform="translate(72, 45)" stroke="#1F2937">
          <g className="robot-eye-right">{eye}</g>
        </g>
        <g className="robot-expression" transform="translate(60, 58)" stroke="#1F2937">
          {mouth}
        </g>
        <g className="arms">
          <rect x="10" y="80" width="20" height="45" rx="10" fill="url(#metallicGradient)" className="robot-arm-left"/>
          <rect x="90" y="80" width="20" height="45" rx="10" fill="url(#metallicGradient)" className="robot-arm-right"/>
        </g>
        <g className="body" onClick={isInstallable ? onInstallClick : onSpeakerClick} style={{ cursor: (onSpeakerClick || onInstallClick) ? 'pointer' : 'default' }}>
          {(onSpeakerClick || onInstallClick) && <title>{isInstallable ? "Instalar Aplicativo" : "Ouvir explicação"}</title>}
          <rect x="20" y="70" width="80" height="60" rx="20" fill="url(#metallicGradient)" />
          <rect x="20" y="70" width="80" height="60" rx="20" fill={moodColor} fillOpacity="0.5" style={{ transition: 'fill 0.5s ease-in-out' }} />
          
          <circle cx="60" cy="100" r="22" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1" strokeDasharray="2 2" className={isInstallable ? "animate-spin-slow" : ""} />
          <circle cx="60" cy="100" r="18" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="2" className="transition-all group-hover:scale-110" />
          
          {isInstallable ? (
            <g transform="translate(52, 92) scale(0.65)" stroke="#4F46E5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <path d="M12 18h.01" />
              <path d="M12 12l0 3" />
              <path d="M10 14l2 2 2-2" />
            </g>
          ) : (
            <>
              <circle cx="60" cy="100" r="8" fill="#10B981" className={`robot-speaker-dot ${isSpeaking ? 'speaking' : ''} ${isLoading ? 'loading' : ''}`} />
              {!isSpeaking && !isLoading && onSpeakerClick && (
                <path d="M58 96 L 65 100 L 58 104 Z" fill="white" style={{ pointerEvents: 'none' }} />
              )}
            </>
          )}
        </g>
        <g className="legs">
          <rect x="35" y="130" width="20" height="15" rx="8" fill="url(#metallicGradient)" />
          <rect x="65" y="130" width="20" height="15" rx="8" fill="url(#metallicGradient)" />
        </g>

        {/* Instrução de instalação - Movida para o final para ficar sempre no topo */}
        {isInstallable && (
          <text x="60" y="148" textAnchor="middle" className="text-[9px] font-black fill-indigo-600 animate-pulse uppercase tracking-tighter" style={{ pointerEvents: 'none' }}>Clique para instalar</text>
        )}
      </svg>
    </div>
  );
};

export default RobotMascot;