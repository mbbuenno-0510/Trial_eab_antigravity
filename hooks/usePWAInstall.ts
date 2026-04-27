import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detect if already installed/standalone
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Check if on mobile (iOS or Android)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // If it's mobile and not yet installed, mark as installable (for the UI)
        if (isMobile && !standalone) {
            setIsInstallable(true);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true); // Redundant for mobile but keep for desktop Chrome
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const installPWA = async () => {
        if (!deferredPrompt) {
            // Fallback for browsers that don't support beforeinstallprompt (like iOS)
            alert("Para instalar:\n\nNo iPhone/iPad: Toque no ícone de compartilhar (seta para cima) e escolha 'Adicionar à Tela de Início'.\n\nNo Android/Chrome: Clique nos três pontos do navegador e escolha 'Instalar aplicativo'.");
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
