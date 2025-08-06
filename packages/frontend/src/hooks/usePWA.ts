import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    isUpdateAvailable: false,
    installPrompt: null,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if app is installed
  const checkIfInstalled = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isInWebAppiOS;
    
    setPwaState(prev => ({ ...prev, isInstalled }));
  }, []);

  // Handle install prompt
  const handleBeforeInstallPrompt = useCallback((e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    setPwaState(prev => ({
      ...prev,
      isInstallable: true,
      installPrompt: e,
    }));
  }, []);

  // Handle app installed
  const handleAppInstalled = useCallback(() => {
    setPwaState(prev => ({
      ...prev,
      isInstallable: false,
      isInstalled: true,
      installPrompt: null,
    }));
  }, []);

  // Handle online/offline status
  const handleOnline = useCallback(() => {
    setPwaState(prev => ({ ...prev, isOffline: false }));
  }, []);

  const handleOffline = useCallback(() => {
    setPwaState(prev => ({ ...prev, isOffline: true }));
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!pwaState.installPrompt) return false;

    try {
      await pwaState.installPrompt.prompt();
      const choiceResult = await pwaState.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setPwaState(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }, [pwaState.installPrompt]);

  // Update PWA
  const updatePWA = useCallback(async () => {
    if (!registration || !registration.waiting) return false;

    try {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Error updating PWA:', error);
      return false;
    }
  }, [registration]);

  // Register service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setPwaState(prev => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });

          // Handle controller change (new SW activated)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });

          console.log('Service Worker registered successfully');
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Online/offline status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial states
    checkIfInstalled();
    setPwaState(prev => ({ ...prev, isOffline: !navigator.onLine }));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled, handleOnline, handleOffline, checkIfInstalled]);

  return {
    ...pwaState,
    installPWA,
    updatePWA,
    registration,
  };
};