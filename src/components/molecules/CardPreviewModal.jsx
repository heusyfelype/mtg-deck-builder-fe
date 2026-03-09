import React, { useEffect } from 'react';
import './CardPreviewModal.css';

const CardPreviewModal = ({ isOpen, onClose, card }) => {
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

    if (!isOpen || !card) return null;

    // Helper to get the best resolution image
    const getImageUri = (imageUris) => {
        if (!imageUris) return '/not-found-image.png'; // Placeholder
        return imageUris.large || imageUris.png || imageUris.normal || imageUris.small;
    };

    const imageUrl = getImageUri(card.image_uris);

    return (
        <div className="card-preview-modal__backdrop" onClick={onClose}>
            <div className="card-preview-modal__content" onClick={(e) => e.stopPropagation()}>
                <button className="card-preview-modal__close" onClick={onClose}>
                    &times;
                </button>
                <div className="card-preview-modal__image-wrapper">
                    <img
                        src={imageUrl}
                        alt={card.printed_name || card.name}
                        className="card-preview-modal__image"
                    />
                </div>
            </div>
        </div>
    );
};

export default CardPreviewModal;
