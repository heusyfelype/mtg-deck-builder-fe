import React, { useRef, useCallback, useEffect } from 'react';
import CardItem from '../molecules/CardItem';
import CollectionCardItem from '../molecules/CollectionCardItem';
import './CardHorizontalList.css';

const CardHorizontalList = ({
    cards = [],
    collectionDraft = {},
    sideboardDraft = {},
    onAddCard,
    onRemoveCard,
    onAddSideboard,
    onRemoveSideboard,
    loading,
    hasMore,
    onLoadMore,
    onImageClick,
    ownerId,
    isFriendList = false,
    isCollectionMode = false
}) => {
    const [zoomLevel, setZoomLevel] = React.useState(() => {
        return localStorage.getItem('mtg_card_list_zoom') || 'normal';
    });

    useEffect(() => {
        localStorage.setItem('mtg_card_list_zoom', zoomLevel);
    }, [zoomLevel]);

    const handleZoomIn = () => setZoomLevel('normal');
    const handleZoomOut = () => setZoomLevel('small');

    // Ref for the scrollable list container (used for wheel-on-scrollbar detection)
    const listRef = useRef(null);

    // Sentinel ref at the end of the list, watched by IntersectionObserver
    const observerRef = useRef(null);

    // When the sentinel becomes visible, load more cards
    const sentinelRef = useCallback((node) => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    onLoadMore();
                }
            },
            {
                root: listRef.current,
                // Trigger slightly before the end for a smoother experience
                rootMargin: '0px 200px 0px 0px'
            }
        );

        if (node) observerRef.current.observe(node);
    }, [hasMore, loading, onLoadMore, zoomLevel]);

    // Translate vertical wheel events into horizontal scroll.
    // We use an overlay positioned exactly over the scrollbar strip.
    // The overlay captures wheel events before the browser scrollbar does.
    const scrollbarOverlayRef = useRef(null);

    useEffect(() => {
        const overlay = scrollbarOverlayRef.current;
        const list = listRef.current;
        if (!overlay || !list) return;

        const handleWheel = (e) => {
            e.preventDefault();
            list.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
        };

        overlay.addEventListener('wheel', handleWheel, { passive: false });
        return () => overlay.removeEventListener('wheel', handleWheel);
    }, []);

    if (cards.length === 0 && !loading) {
        return <div className="card-list-empty">Nenhuma carta encontrada. Tente outros filtros.</div>;
    }

    return (
        <div className="card-horizontal-wrapper">
            <div className="card-horizontal-list-header">
                <div className="card-horizontal-list-zoom-controls">
                    <button
                        className={`zoom-btn ${zoomLevel === 'small' ? 'active' : ''}`}
                        onClick={handleZoomOut}
                        title="Zoom Out (Visualização em 2 linhas)"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <button
                        className={`zoom-btn ${zoomLevel === 'normal' ? 'active' : ''}`}
                        onClick={handleZoomIn}
                        title="Zoom In (Visualização padrão)"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div className={`card-horizontal-list ${zoomLevel === 'small' ? 'card-horizontal-list--small' : ''}`} ref={listRef}>
                {cards.map((card) => {
                    const compositeKey = `${card.id}_${card.ownerId || ownerId}`;
                    const draftItem = collectionDraft[compositeKey] || (isCollectionMode ? collectionDraft[card.id] : null) || { added: 0, current: 0 };
                    const sideboardItem = sideboardDraft[compositeKey] || { added: 0 };
                    const stock = typeof card.maxQuantity === 'number'
                        ? card.maxQuantity - (draftItem.added + sideboardItem.added)
                        : undefined;

                    if (isCollectionMode) {
                        return (
                            <CollectionCardItem
                                key={card.id}
                                card={card}
                                addedCount={draftItem.added || 0}
                                onAdd={onAddCard}
                                onRemove={onRemoveCard}
                                onImageClick={onImageClick}
                            />
                        );
                    }

                    return (
                        <CardItem
                            key={card.id}
                            card={card}
                            collectionCount={draftItem.current || 0}
                            addedCount={draftItem.added || 0}
                            sideboardCount={sideboardItem.added || 0}
                            stock={stock}
                            onAdd={onAddCard}
                            onRemove={onRemoveCard}
                            onAddSideboard={onAddSideboard}
                            onRemoveSideboard={onRemoveSideboard}
                            onImageClick={onImageClick}
                            isFriendCard={isFriendList}
                            isOutOfCollection={card.ownerId === 'out_of_collection' || ownerId === 'out_of_collection'}
                        />
                    );
                })}

                {/* Sentinel element at the end — triggers next page load */}
                {hasMore && (
                    <div ref={sentinelRef} className="card-list-sentinel" />
                )}

                {/* Loading spinner at the tail of the list */}
                {loading && (
                    <div className="card-list-loading-inline">
                        <div className="card-list-spinner" />
                    </div>
                )}
            </div>
            {/* Transparent overlay on top of the scrollbar — captures wheel events */}
            <div ref={scrollbarOverlayRef} className="card-list-scrollbar-overlay" />
        </div>
    );
};

export default CardHorizontalList;
