import React, { useState, useEffect, useRef } from 'react';
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
    // If API provides a quantity > 0, initialize local editable count from it
    const apiQuantity = card && card.quantity ? Number(card.quantity) : 0;
    // Prefer the draft `addedCount` (from localStorage) over API quantity so user edits persist
    const [localCount, setLocalCount] = useState(addedCount > 0 ? addedCount : apiQuantity);
    const dirtyRef = useRef(false);
    const prevApiQuantityRef = useRef(apiQuantity);
    const prevAddedCountRef = useRef(addedCount);

    // derive a stable key for the card so we can reset when a different card is rendered
    const cardKey = card?.id || card?._id || card?.oracle_id || card?.name || '';

    // initialize/reset when the card changes
    useEffect(() => {
        const initial = addedCount > 0 ? addedCount : apiQuantity;
        setLocalCount(initial);
        dirtyRef.current = false;
        prevApiQuantityRef.current = apiQuantity;
        prevAddedCountRef.current = addedCount;
    }, [cardKey]);

    // sync props -> localCount only when not manually edited (dirty)
    useEffect(() => {
        if (dirtyRef.current) {
            // user has edited; don't overwrite
            prevApiQuantityRef.current = apiQuantity;
            prevAddedCountRef.current = addedCount;
            return;
        }

        if (prevApiQuantityRef.current !== apiQuantity || prevAddedCountRef.current !== addedCount) {
            const newInitial = addedCount > 0 ? addedCount : apiQuantity;
            setLocalCount(newInitial);
            prevApiQuantityRef.current = apiQuantity;
            prevAddedCountRef.current = addedCount;
        }
    }, [apiQuantity, addedCount]);

    const effectiveCount = localCount;
    const isSelected = effectiveCount > 0;

    return (
        <div className={`collection-card-item ${isSelected ? 'collection-card-item--selected' : ''}`}>
            <div
                className="collection-card-item__image-container"
                onClick={() => onImageClick && onImageClick(card)}
                style={{ cursor: onImageClick ? 'pointer' : 'default' }}
            >
                <img src={imageUrl} alt={card.printed_name || card.name} className="collection-card-item__image" />

                {effectiveCount > 0 && (
                    <div className="collection-card-item__overlay">
                        <span className="collection-card-item__added-badge">+{effectiveCount}</span>
                    </div>
                )}
            </div>

            <div className="collection-card-item__controls">
                <div className="collection-card-item__control-group">
                    <button
                        className="collection-card-item__btn collection-card-item__btn--remove"
                        onClick={() => {
                            // mark as manually edited and update local state, then notify parent
                            dirtyRef.current = true;
                            const next = Math.max(0, localCount - 1);
                            setLocalCount(next);
                            onRemove && onRemove(card);
                        }}
                        disabled={effectiveCount <= 0}
                    >
                        -
                    </button>
                    <div className="collection-card-item__info">
                        <span className="collection-card-item__total">Coleção: {effectiveCount}</span>
                    </div>
                    <button
                        className="collection-card-item__btn collection-card-item__btn--add"
                        onClick={() => {
                            dirtyRef.current = true;
                            const next = localCount + 1;
                            setLocalCount(next);
                            onAdd && onAdd(card);
                        }}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CollectionCardItem;
