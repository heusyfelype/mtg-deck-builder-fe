import React, { useState, useRef, useCallback, useMemo } from 'react';
import { getCardImage, isFlipCard } from '../../../utils/cardImageUtils';
import './CardFlip.css';

/**
 * CardFlip — Renders a card image with a 3D flip animation for double-faced cards.
 *
 * - Single-faced cards: renders a plain <img>, zero overhead.
 * - DFCs (transform / modal_dfc): flips on mouse position (left=front, right=back).
 *
 * Performance notes:
 * - Image URLs are computed once via useMemo and never recalculated on re-renders.
 * - handleMouseMove uses a ref to track the current side and only calls setFlipped
 *   when the side actually changes, preventing unnecessary state updates.
 */
const CardFlip = ({ card, altText, className = '', onClick, imgClassName = '' }) => {
    const isDFC = isFlipCard(card);

    // Memoize image resolution — only recalculates if card reference changes
    const frontImage = useMemo(
        () => isDFC
            ? getCardImage({ image_uris: card.card_faces[0].image_uris }, 'large')
            : getCardImage(card, 'large'),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [card?.id, isDFC]
    );

    const backImage = useMemo(
        () => isDFC
            ? getCardImage({ image_uris: card.card_faces[1].image_uris }, 'large')
            : null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [card?.id, isDFC]
    );

    const [flipped, setFlipped] = useState(false);
    const containerRef = useRef(null);
    // Track current side without triggering re-renders
    const currentSideRef = useRef(false);

    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const { left, width } = containerRef.current.getBoundingClientRect();
        const shouldFlip = (e.clientX - left) > width / 2;
        // Only update state when the side actually changes
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

    // Single-faced card: plain img, no event listeners, no extra DOM nodes
    if (!isDFC) {
        return (
            <img
                src={frontImage}
                alt={altText}
                className={`${imgClassName} ${className}`}
                onClick={onClick}
                style={{ cursor: onClick ? 'pointer' : 'default' }}
            />
        );
    }

    return (
        <div
            ref={containerRef}
            className={`card-flip ${flipped ? 'card-flip--flipped' : ''} ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="card-flip__inner">
                <div className="card-flip__face card-flip__face--front">
                    <img src={frontImage} alt={altText} className={`card-flip__img ${imgClassName}`} />
                    <div className="card-flip__indicator card-flip__indicator--df">2F</div>
                </div>
                <div className="card-flip__face card-flip__face--back">
                    <img src={backImage} alt={`${altText} (verso)`} className={`card-flip__img ${imgClassName}`} />
                </div>
            </div>
        </div>
    );
};

export default CardFlip;
