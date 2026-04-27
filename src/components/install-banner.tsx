'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-primary/20 p-6 flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-grow">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Install App</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Add to your home screen for a better experience</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleInstallClick}
            size="sm"
            className="rounded-xl bg-primary hover:bg-primary/90 text-black font-semibold"
          >
            Install
          </Button>
          <button 
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
