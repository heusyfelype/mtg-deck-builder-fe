import React from 'react';
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
    // Priority: large > png > normal > small
    const getImageUri = (imageUris) => {
        if (!imageUris) return '/not-found-image.png'; // Placeholder
        return imageUris.large || imageUris.png || imageUris.normal || imageUris.small;
    };

    const imageUrl = getImageUri(card.image_uris);
    const isSelected = addedCount > 0;

    return (
        <div className={`card-item ${isSelected ? 'card-item--selected' : ''} ${isFriendCard ? 'card-item--friend' : ''} ${isOutOfCollection ? 'card-item--out-of-collection' : ''}`}>
            <div
                className="card-item__image-container"
                onClick={() => onImageClick && onImageClick(card)}
                style={{ cursor: onImageClick ? 'pointer' : 'default' }}
            >
                <img src={imageUrl} alt={card.printed_name || card.name} className="card-item__image" />

                {(addedCount > 0 || sideboardCount > 0) && (
                    <div className="card-item__overlay">
                        {addedCount > 0 && (
                            <span className="card-item__added-badge">+{addedCount}</span>
                        )}
                        {sideboardCount > 0 && (
                            <span className="card-item__sideboard-badge">SB: {sideboardCount}</span>
                        )}
                    </div>
                )}

                {typeof stock === 'number' && (
                    <div className="card-item__stock-badge">
                        Disp: {stock}
                    </div>
                )}

                {isOutOfCollection && (
                    <div className="card-item__out-of-collection-badge">
                        Fora da coleção
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

export default CardItem;
