import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="fixed inset-0 bg-modal-backdrop backdrop-blur-sm animate-fadeIn" aria-hidden="true"></div>
            <div 
                className={`relative w-full max-w-full sm:max-w-lg p-6 bg-surface border border-border rounded-xl shadow-claude animate-slideInUp ${className}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between">
                    <h2 id="modal-title" className="text-xl font-bold text-text pr-4 font-title">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="font-button p-1 -m-1 text-text-secondary hover:text-text transition rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label="Fermer"
                    >
                         <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;