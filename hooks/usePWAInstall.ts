import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        // No iOS, como o evento nunca dispara, forçamos a interface de instalação a aparecer para podermos mostrar as instruções manuais.
        // Nos outros (Android/Windows), só mostramos a interface de instalação QUANDO o navegador de fato disparar o evento, garantindo que o prompt nativo vai funcionar.
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

            if (isWindows) {
                alert("Para instalar no Windows:\n\n1. Clique no ícone de instalação (monitor com seta) na barra de endereços do navegador.\n2. Ou clique nos 'Três Pontos' do menu e escolha 'Salvar e Compartilhar' -> 'Instalar Aplicativo'.");
            } else {
                alert("Para instalar:\n\nNo Android/Chrome: Clique nos três pontos do navegador e escolha 'Instalar aplicativo'.");
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
        setIsInstallable(false);
    };

    return { isInstallable, isStandalone, installPWA };
}
