import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone, ArrowDown } from 'lucide-react';

interface PWAInstallHintProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const PWAInstallHint: React.FC<PWAInstallHintProps> = ({ isOpen, onClose }) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isOpen !== undefined) {
      setShowHint(isOpen);
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isIOS && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa_hint_dismissed');
      if (!dismissed) setShowHint(true);
    }
  }, [isOpen]);

  const handleDismiss = () => {
    setShowHint(false);
    if (onClose) onClose();
    sessionStorage.setItem('pwa_hint_dismissed', 'true');
  };

  if (!showHint) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-20 sm:pb-8 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500 border-4 border-white">
        {/* Header Decor */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl mb-4 shadow-inner">
              <Smartphone className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="font-black text-slate-800 text-xl tracking-tight">Instalar no seu iPhone</h3>
            <p className="text-sm text-slate-500 mt-1">Siga estes 2 passos rápidos para usar como aplicativo nativo.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <Share className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-slate-400 uppercase">Passo 1</p>
                <p className="text-[15px] font-bold text-slate-700">Toque no botão <span className="text-blue-600">Compartilhar</span></p>
                <p className="text-xs text-slate-500">Localizado na barra inferior do Safari.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <PlusSquare className="w-6 h-6 text-slate-700" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-slate-400 uppercase">Passo 2</p>
                <p className="text-[15px] font-bold text-slate-700">Toque em <span className="text-slate-900">Tela de Início</span></p>
                <p className="text-xs text-slate-500">Role para baixo para encontrar esta opção.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleDismiss}
            className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl text-base font-black shadow-xl shadow-slate-200 active:scale-95 transition-all"
          >
            ENTENDI
          </button>
        </div>

        {/* Floating Arrow Animation (Only for iOS) */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
           <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold mb-1 shadow-lg animate-bounce">CLIQUE ABAIXO</div>
           <ArrowDown className="w-8 h-8 text-indigo-600 animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default PWAInstallHint;
