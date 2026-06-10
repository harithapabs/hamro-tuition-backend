import { useState, useEffect } from 'react';

const WhatsAppButton = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 10000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, []);

  const phoneNumber = '9779843684295';
  const message = encodeURIComponent('Hello, I am interested in your online tuition classes.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showTooltip && (
        <div className="whatsapp-tooltip mb-3 bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg text-sm font-medium relative">
          Chat with us!
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45 shadow-lg" />
        </div>
      )}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-btn flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.058 9.374L1.054 31.25l6.118-1.98A15.907 15.907 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.31 22.594c-.39 1.098-1.932 2.012-3.168 2.27-.84.176-1.936.316-5.614-1.204-4.712-1.94-7.742-6.71-7.976-7.026-.226-.316-1.896-2.524-1.896-4.816 0-2.292 1.2-3.42 1.628-3.88.39-.428.936-.534 1.248-.534.15 0 .284.008.406.014.424.018.636.042.912.706.35.84 1.196 2.92 1.3 3.132.104.212.208.508.062.802-.138.3-.258.428-.492.686-.234.258-.472.456-.706.734-.212.248-.448.516-.19.97.256.456 1.142 1.89 2.45 3.062 1.684 1.506 3.07 1.972 3.544 2.186.37.168.79.126 1.052-.212.264-.338 1.134-1.32 1.436-1.772.3-.456.6-.38 1.012-.228.414.152 2.624 1.24 3.074 1.468.45.228.75.34.858.528.108.188.108 1.09-.282 2.188z" />
        </svg>
      </a>
    </div>
  );
};

export default WhatsAppButton;
