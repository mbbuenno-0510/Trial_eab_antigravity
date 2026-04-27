import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // No iOS, mostramos como instalável imediatamente pois não existe evento nativo.
        // No Android/Windows, só mostraremos como instalável DEPOIS que o evento disparar.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS && !standalone) {
            setIsInstallable(true);
        }
        const handler = (e: any) => {
            console.log('✅ PWA beforeinstallprompt event fired');
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
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
                // No iOS o onInstallClick já chama o modal bonito, mas deixamos aqui por segurança
                return;
            }

            // Removidas as instruções manuais para Android e Windows a pedido do usuário.
            // O objetivo é ter apenas a mensagem nativa "Deseja instalar?".
            // Se chegou aqui e não tem deferredPrompt, o navegador ainda não liberou a instalação
            // (ex: ainda carregando, falta de HTTPS, ou já está instalado).
            console.log("Aguardando o navegador liberar a instalação nativa...");
            return;
        }

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, isStandalone, installPWA };
}
