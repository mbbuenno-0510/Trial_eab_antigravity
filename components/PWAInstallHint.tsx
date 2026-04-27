import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';

interface PWAInstallHintProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const PWAInstallHint: React.FC<PWAInstallHintProps> = ({ isOpen, onClose }) => {
  const [showHint, setShowHint] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'other'>('other');

  useEffect(() => {
    if (isOpen !== undefined) {
      setShowHint(isOpen);
      return;
    }

    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isIOS) {
      setPlatform('ios');
      // Show hint if not installed and not dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_hint_dismissed');
      if (!isStandalone && !dismissed) {
        setShowHint(true);
      }
    }
  }, [isOpen]);

  const handleDismiss = () => {
    setShowHint(false);
    if (onClose) onClose();
    sessionStorage.setItem('pwa_hint_dismissed', 'true');
  };

  if (!showHint) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-80 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 relative overflow-hidden">
        {/* Progress bar effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-100">
          <div className="h-full bg-blue-500 w-full animate-pulse"></div>
        </div>

        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4 mt-2">
          <div className="bg-blue-50 p-3 rounded-2xl">
            <Smartphone className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Instalar EAB Master</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use como um aplicativo nativo para acesso rápido e notificações.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <p className="text-[13px] font-medium text-slate-700 flex items-center gap-2">
            No seu iPhone/iPad:
          </p>
          
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <Share className="w-4 h-4 text-blue-500" />
            </div>
            <span>1. Toque no botão <b>Compartilhar</b> abaixo</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <PlusSquare className="w-4 h-4 text-slate-700" />
            </div>
            <span>2. Role e toque em <b>Adicionar à Tela de Início</b></span>
          </div>
        </div>

        <button 
          onClick={handleDismiss}
          className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 active:scale-95 transition-transform"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};

export default PWAInstallHint;
