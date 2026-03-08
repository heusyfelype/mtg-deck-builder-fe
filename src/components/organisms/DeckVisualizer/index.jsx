import React, { useMemo, useState } from 'react';
import './DeckVisualizer.css';

const DeckVisualizer = ({
    deckDraft,
    sideboardDraft = {},
    deckName,
    setDeckName,
    onAddCard,
    onRemoveCard,
    onAddSideboard,
    onRemoveSideboard,
    onImageClick,
    onClear,
    onCancelEdit
}) => {
    const [modalConfig, setModalConfig] = useState(null); // { type: 'clear' | 'cancel', message: string, onConfirm: () => void }

    // Helper to group cards by CMC
    const getGroupedCards = (draft) => {
        const groups = {};
        Object.values(draft).forEach(item => {
            const cmc = item.card.cmc || 0;
            if (!groups[cmc]) {
                groups[cmc] = [];
            }
            for (let i = 0; i < item.added; i++) {
                groups[cmc].push(item.card);
            }
        });
        return groups;
    };

    const groupedMain = useMemo(() => getGroupedCards(deckDraft), [deckDraft]);
    const groupedSideboard = useMemo(() => getGroupedCards(sideboardDraft), [sideboardDraft]);

    const getSortedCMCs = (groups) => {
        return Object.keys(groups)
            .map(Number)
            .sort((a, b) => a - b);
    };

    const sortedMainCMCs = useMemo(() => getSortedCMCs(groupedMain), [groupedMain]);
    const sortedSideboardCMCs = useMemo(() => getSortedCMCs(groupedSideboard), [groupedSideboard]);

    if (Object.keys(deckDraft).length === 0 && Object.keys(sideboardDraft).length === 0) {
        return (
            <div className="deck-visualizer-empty">
                <p>Seu deck está vazio. Adicione cards da sua coleção acima.</p>
            </div>
        );
    }

    const renderColumns = (sortedCMCs, groupedCards, onAdd, onRemove) => (
        <div className="deck-visualizer__columns">
            {sortedCMCs.map(cmc => (
                <div key={cmc} className="deck-visualizer__column">
                    <div className="deck-visualizer__cmc-header">
                        CMC {cmc} ({groupedCards[cmc].length})
                    </div>
                    <div className="deck-visualizer__stack">
                        {groupedCards[cmc].map((card, index) => (
                            <div
                                key={`${card.id}-${index}`}
                                className="deck-visualizer__card-tile"
                                onDoubleClick={() => onImageClick && onImageClick(card)}
                                style={{
                                    top: `${index * 30}px`,
                                    zIndex: index,
                                    cursor: 'pointer'
                                }}
                            >
                                <div className="deck-visualizer__card-content">
                                    <img
                                        src={card.image_uris?.small || card.image_uris?.normal}
                                        alt={card.name}
                                        className="deck-visualizer__card-image"
                                    />
                                    <div className="deck-visualizer__card-overlay">
                                        <span className="deck-visualizer__card-name">{card.name}</span>
                                        <div className="deck-visualizer__card-actions">
                                            <button onClick={() => onRemove(card)}>-</button>
                                            <button onClick={() => onAdd(card)}>+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="deck-visualizer">
            <div className="deck-visualizer__header">
                <input
                    type="text"
                    className="deck-visualizer__name-input"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Seu deck"
                />
                <div className="deck-visualizer__header-actions">
                    <button
                        className="deck-visualizer__clear-btn"
                        onClick={() => setModalConfig({
                            type: 'clear',
                            message: 'Todos os cards deste deck serão removidos, deseja continuar?',
                            onConfirm: onClear
                        })}
                    >
                        Limpar Seleção
                    </button>
                    {onCancelEdit && (
                        <button
                            className="deck-visualizer__cancel-edit-btn"
                            onClick={() => setModalConfig({
                                type: 'cancel',
                                message: 'A edição será cancelada. Deseja continuar?',
                                onConfirm: onCancelEdit
                            })}
                        >
                            Cancelar Edição
                        </button>
                    )}
                </div>
            </div>

            <section className="deck-visualizer__section">
                <h3 className="deck-visualizer__section-title">Main Deck</h3>
                {sortedMainCMCs.length > 0 ? (
                    renderColumns(sortedMainCMCs, groupedMain, onAddCard, onRemoveCard)
                ) : (
                    <p className="deck-visualizer__section-empty">Nenhum card no deck principal.</p>
                )}
            </section>

            <section className="deck-visualizer__section deck-visualizer__section--sideboard">
                <h3 className="deck-visualizer__section-title">SideBoard</h3>
                {sortedSideboardCMCs.length > 0 ? (
                    renderColumns(sortedSideboardCMCs, groupedSideboard, onAddSideboard, onRemoveSideboard)
                ) : (
                    <p className="deck-visualizer__section-empty">Nenhum card no sideboard.</p>
                )}
            </section>

            {modalConfig && (
                <div className="deck-visualizer__modal-backdrop" onClick={() => setModalConfig(null)}>
                    <div className="deck-visualizer__modal" onClick={(e) => e.stopPropagation()}>
                        <p>{modalConfig.message}</p>
                        <div className="deck-visualizer__modal-actions">
                            <button
                                className="deck-visualizer__modal-btn deck-visualizer__modal-btn--cancel"
                                onClick={() => setModalConfig(null)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="deck-visualizer__modal-btn deck-visualizer__modal-btn--confirm"
                                onClick={() => {
                                    modalConfig.onConfirm();
                                    setModalConfig(null);
                                }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeckVisualizer;
