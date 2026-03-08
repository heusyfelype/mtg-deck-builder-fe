import React, { useEffect } from 'react';
import Button from '../../atoms/Button';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    // Prevent scrolling on the body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="confirm-modal__backdrop" onClick={onClose}>
            <div className="confirm-modal__content" onClick={(e) => e.stopPropagation()}>
                <header className="confirm-modal__header">
                    <h3 className="confirm-modal__title">{title || 'Confirmação'}</h3>
                    <button className="confirm-modal__close" onClick={onClose}>
                        &times;
                    </button>
                </header>
                <div className="confirm-modal__body">
                    <p className="confirm-modal__message">{message}</p>
                </div>
                <footer className="confirm-modal__footer">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={onConfirm}>
                        Confirmar
                    </Button>
                </footer>
            </div>
        </div>
    );
};

export default ConfirmModal;
