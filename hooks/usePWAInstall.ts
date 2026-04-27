import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // ALWAYS show the install UI if not standalone, so the user doesn't think it's broken
        if (!standalone) {
            setIsInstallable(true);
        }

        const handler = (e: any) => {
            console.log('✅ PWA beforeinstallprompt event fired');
            e.preventDefault();
            setDeferredPrompt(e);
        };

        console.log('⏳ Listening for beforeinstallprompt...');
        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const installPWA = async () => {
        if (!deferredPrompt) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            const isWindows = /Win/i.test(navigator.userAgent);
            
            if (isIOS) {
                return;
            }

            if (isWindows) {
                alert("O navegador bloqueou a mensagem automática (provavelmente porque você já instalou ou fechou a janela antes).\n\nPara instalar agora no Windows:\n1. Clique no ícone de instalação (monitor com seta) na barra de endereços do navegador.\n2. Ou clique nos 'Três Pontos' do menu e escolha 'Salvar e Compartilhar' -> 'Instalar Aplicativo'.");
            } else {
                alert("O navegador bloqueou a mensagem automática (pode ser cache ou você já fechou o aviso antes).\n\nPara forçar a instalação no Android/Chrome:\nClique nos TRÊS PONTOS do navegador no canto superior direito e escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
            }
            return;
        }

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    return { isInstallable, isStandalone, installPWA };
}
