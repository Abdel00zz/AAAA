import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    chapterTitle: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, chapterTitle }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Prêt à finaliser votre travail ?">
            <div className="mt-4 text-center">
                <div className="mx-auto w-16 h-16 flex items-center justify-center bg-primary-light rounded-full text-primary mb-4">
                    <span className="material-symbols-outlined text-4xl">upload_file</span>
                </div>
                <p className="text-lg text-secondary">
                    Vous allez soumettre votre travail pour le chapitre :
                </p>
                <p className="font-bold text-xl my-2 text-text">{chapterTitle}</p>
                <p className="text-sm text-secondary">Cette action est définitive et ne pourra pas être modifiée.</p>
            </div>

            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-4">
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="font-button w-full sm:w-auto mt-2 sm:mt-0 px-6 py-2 font-semibold text-secondary bg-background border border-border rounded-lg hover:bg-border-hover active:scale-95 disabled:opacity-50"
                >
                    Revenir en arrière
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="font-button w-full sm:w-auto flex items-center justify-center px-6 py-3 font-semibold text-white bg-primary rounded-lg transition-transform transform hover:-translate-y-px active:scale-95 disabled:bg-primary/70 disabled:cursor-wait"
                >
                    {isSubmitting ? (
                        <>
                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white -ml-1 mr-3"></div>
                            <span>Envoi en cours...</span>
                        </>
                    ) : (
                        'Oui, envoyer mon travail'
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;