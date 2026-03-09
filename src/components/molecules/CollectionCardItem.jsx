import React from 'react';
import './CollectionCardItem.css';

const CollectionCardItem = ({
    card,
    addedCount = 0,
    onAdd,
    onRemove,
    onImageClick
}) => {
    // Priority: large > png > normal > small
    const getImageUri = (imageUris) => {
        if (!imageUris) return '/not-found-image.png'; // Placeholder
        return imageUris.large || imageUris.png || imageUris.normal || imageUris.small;
    };

    const imageUrl = getImageUri(card.image_uris);
    const isSelected = addedCount > 0;

    return (
        <div className={`collection-card-item ${isSelected ? 'collection-card-item--selected' : ''}`}>
            <div
                className="collection-card-item__image-container"
                onClick={() => onImageClick && onImageClick(card)}
                style={{ cursor: onImageClick ? 'pointer' : 'default' }}
            >
                <img src={imageUrl} alt={card.printed_name || card.name} className="collection-card-item__image" />

                {addedCount > 0 && (
                    <div className="collection-card-item__overlay">
                        <span className="collection-card-item__added-badge">+{addedCount}</span>
                    </div>
                )}
            </div>

            <div className="collection-card-item__controls">
                <div className="collection-card-item__control-group">
                    <button
                        className="collection-card-item__btn collection-card-item__btn--remove"
                        onClick={() => onRemove(card)}
                        disabled={addedCount <= 0}
                    >
                        -
                    </button>
                    <div className="collection-card-item__info">
                        <span className="collection-card-item__total">Coleção: {addedCount}</span>
                    </div>
                    <button
                        className="collection-card-item__btn collection-card-item__btn--add"
                        onClick={() => onAdd(card)}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CollectionCardItem;
