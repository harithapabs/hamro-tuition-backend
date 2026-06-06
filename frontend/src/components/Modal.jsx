import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, children, title, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-4 border-b">
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-auto"
          >
            <FaTimes size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
