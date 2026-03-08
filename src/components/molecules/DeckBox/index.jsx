import React from 'react';
import './DeckBox.css';

const DeckBox = ({ deck, onClick, onDelete }) => {
    const {
        deckName,
        deck_name,
        cards = [],
        sideboard = [],
        deck_cover_image,
        color_identity
    } = deck;

    const displayName = deck_name || deckName;

    // Use pre-calculated cover image or fall back to CMC logic
    let coverImage = deck_cover_image;
    let colors = color_identity;

    if (!coverImage || !colors) {
        // Fallback logic for full deck objects (if still used elsewhere)
        const allCards = [...cards, ...sideboard].map(item => item.card);

        if (!coverImage) {
            const coverCard = allCards.reduce((prev, current) => {
                return (prev.cmc || 0) > (current.cmc || 0) ? prev : current;
            }, allCards[0] || {});
            coverImage = coverCard.image_uris?.art_crop || coverCard.image_uris?.normal || '';
        }

        if (!colors) {
            colors = Array.from(new Set(allCards.flatMap(card => card.color_identity || [])));
        }
    }

    // Mapping colors to mana symbols (Arena style)
    const colorMap = {
        'W': 'white',
        'U': 'blue',
        'B': 'black',
        'R': 'red',
        'G': 'green'
    };

    return (
        <div className="deck-box" onClick={onClick}>
            <div
                className="deck-box__art"
                style={{ backgroundImage: `url(${coverImage})` }}
            >
                <button
                    className="deck-box__delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(deck);
                    }}
                    title="Excluir deck"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z" />
                    </svg>
                </button>
                <div className="deck-box__overlay">
                    <div className="deck-box__colors">
                        {colors.sort().map(color => (
                            <span key={color} className={`mana-symbol mana-symbol--${colorMap[color] || color.toLowerCase()}`}>
                                {color}
                            </span>
                        ))}
                    </div>
                    <div className="deck-box__footer">
                        <span className="deck-box__name">{displayName}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeckBox;
