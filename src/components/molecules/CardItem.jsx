import React from 'react';
import { getCardImage, isFlipCard } from '../../utils/cardImageUtils';
import CardFlip from './CardFlip';
import './CardItem.css';

const CardItem = ({
    card,
    collectionCount = 0,
    addedCount = 0,
    sideboardCount = 0,
    stock,
    onAdd,
    onRemove,
    onAddSideboard,
    onRemoveSideboard,
    onImageClick,
    isFriendCard = false,
    isOutOfCollection = false
}) => {
    const imageUrl = getCardImage(card);
    const isSelected = addedCount > 0;
    const isDFC = isFlipCard(card);

    return (
        <div className={`card-item ${isSelected ? 'card-item--selected' : ''} ${isFriendCard ? 'card-item--friend' : ''} ${isOutOfCollection ? 'card-item--out-of-collection' : ''}`}>
            <div
                className="card-item__image-container"
                style={{ cursor: onImageClick ? 'pointer' : 'default' }}
            >
                {isDFC ? (
                    <CardFlip
                        card={card}
                        altText={card.printed_name || card.name}
                        imgClassName="card-item__image"
                        onClick={() => { console.log("CLICK DFC"); onImageClick && onImageClick(card) }}
                    />
                ) : (
                    <img
                        src={imageUrl}
                        alt={card.printed_name || card.name}
                        className="card-item__image"
                        onClick={() => onImageClick && onImageClick(card)}
                    />
                )}

                {typeof stock === 'number' && (
                    <div className="card-item__stock-badge">
                        Disp: {stock}
                    </div>
                )}

            </div>

            <div className="card-item__controls">
                <div className="card-item__control-group">
                    <button
                        className="card-item__btn card-item__btn--remove"
                        onClick={() => onRemove(card)}
                        disabled={addedCount <= 0}
                    >
                        -
                    </button>
                    <div className="card-item__info">
                        <span className="card-item__total">Deck: {addedCount}</span>
                    </div>
                    <button
                        className="card-item__btn card-item__btn--add"
                        onClick={() => onAdd(card)}
                        disabled={typeof stock === 'number' && stock <= 0}
                    >
                        +
                    </button>
                </div>

                <div className="card-item__control-group card-item__control-group--sideboard">
                    <button
                        className="card-item__btn card-item__btn--remove-sb"
                        onClick={() => onRemoveSideboard(card)}
                        disabled={sideboardCount <= 0}
                    >
                        -
                    </button>
                    <div className="card-item__info">
                        <span className="card-item__sideboard-label">SideBoard</span>
                    </div>
                    <button
                        className="card-item__btn card-item__btn--add-sb"
                        onClick={() => onAddSideboard(card)}
                        disabled={typeof stock === 'number' && stock <= 0}
                    >
                        +
                    </button>
                </div>

                <div className="card-item__footer">
                    <span className="card-item__collection-total">No Deck: {collectionCount + addedCount}</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CardItem);
