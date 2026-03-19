import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getCardImage, isFlipCard } from '../../utils/cardImageUtils';
import './CardPreviewModal.css';

const CardPreviewModal = ({ isOpen, onClose, card }) => {
    // Prevent scrolling on the body when modal is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Flip state for DFC cards (controlled by mouse position)
    const [flipped, setFlipped] = useState(false);
    const currentSideRef = useRef(false);
    const wrapperRef = useRef(null);

    // Reset flip when a new card is opened
    useEffect(() => {
        setFlipped(false);
        currentSideRef.current = false;
    }, [card]);

    const handleMouseMove = useCallback((e) => {
        if (!wrapperRef.current) return;
        const { left, width } = wrapperRef.current.getBoundingClientRect();
        const shouldFlip = (e.clientX - left) > width / 2;
        if (shouldFlip !== currentSideRef.current) {
            currentSideRef.current = shouldFlip;
            setFlipped(shouldFlip);
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (currentSideRef.current) {
            currentSideRef.current = false;
            setFlipped(false);
        }
    }, []);

    if (!isOpen || !card) return null;

    const isDFC = isFlipCard(card);
    const frontImage = isDFC
        ? getCardImage({ image_uris: card.card_faces[0].image_uris }, 'large')
        : getCardImage(card, 'large');
    const backImage = isDFC
        ? getCardImage({ image_uris: card.card_faces[1].image_uris }, 'large')
        : null;

    return (
        <div className="card-preview-modal__backdrop" onClick={onClose}>
            <div className="card-preview-modal__content" onClick={(e) => e.stopPropagation()}>
                <button className="card-preview-modal__close" onClick={onClose}>
                    &times;
                </button>

                {isDFC ? (
                    /* DFC: flip container with mouse tracking */
                    <div
                        ref={wrapperRef}
                        className={`card-preview-modal__flip-wrapper ${flipped ? 'card-preview-modal__flip-wrapper--flipped' : ''}`}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="card-preview-modal__flip-inner">
                            <div className="card-preview-modal__flip-face card-preview-modal__flip-face--front">
                                <img
                                    src={frontImage}
                                    alt={card.printed_name || card.name}
                                    className="card-preview-modal__image"
                                />
                                <span className="card-preview-modal__dfc-hint">← frente | verso →</span>
                            </div>
                            <div className="card-preview-modal__flip-face card-preview-modal__flip-face--back">
                                <img
                                    src={backImage}
                                    alt={`${card.printed_name || card.name} (verso)`}
                                    className="card-preview-modal__image"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Single face: plain image */
                    <div className="card-preview-modal__image-wrapper">
                        <img
                            src={frontImage}
                            alt={card.printed_name || card.name}
                            className="card-preview-modal__image"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardPreviewModal;
