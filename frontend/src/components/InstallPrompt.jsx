import { useEffect, useState } from 'react';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', '1');
  };

  if (!showPrompt || !deferredPrompt) return null;

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
