import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // We want to show the install option if not already installed
        setIsInstallable(!standalone);

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
            const ua = navigator.userAgent;
            const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
            const isAndroid = /Android/i.test(ua);
            
            if (isIOS) return 'ios';
            if (isAndroid) return 'android';
            return 'windows'; // Fallback for desktop/windows
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
