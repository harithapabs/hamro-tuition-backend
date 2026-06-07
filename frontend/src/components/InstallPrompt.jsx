import { useEffect, useState } from 'react';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setInstalled(true);
      setShowPrompt(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (!dismissed && !deferredPrompt) {
      setTimeout(() => {
        if (!deferredPrompt) setShowPrompt(true);
      }, 8000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstalled(true);
          setDeferredPrompt(null);
        }
        setShowPrompt(false);
        return;
      } catch {}
    }
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isIOS) {
      alert('To install:\n1. Tap the Share button (square with arrow)\n2. Scroll and tap "Add to Home Screen"\n3. Tap "Add"');
    } else if (isAndroid) {
      alert('To install:\n1. Tap the menu (⋮) in Chrome\n2. Tap "Install app" or "Add to Home screen"\n3. Tap "Install"');
    } else {
      alert('To install:\n1. Click the install icon (⊕) in the address bar\n2. Click "Install"');
    }
  };

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', '1');
  };

  if (installed || (!showPrompt)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <FiSmartphone className="text-white text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Install Hamro Tuition</p>
          <p className="text-xs text-gray-500 mt-0.5">Add to home screen for offline access</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <FiDownload className="text-xs" /> Install
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600">
          <FiX />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
