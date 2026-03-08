import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button';
import CardFilters from '../../components/organisms/CardFilters';
import CardHorizontalList from '../../components/organisms/CardHorizontalList';
import CardPreviewModal from '../../components/molecules/CardPreviewModal';
import DeckVisualizer from '../../components/organisms/DeckVisualizer';
import './DeckEditor.css';

const DeckEditor = () => {
    const { deckId } = useParams();
    const navigate = useNavigate();

    const [userCollection, setUserCollection] = useState([]);
    const [loading, setLoading] = useState(false);
    const [originalDeck, setOriginalDeck] = useState(null);
    const [currentFilters, setCurrentFilters] = useState({});
    const [zoomedCard, setZoomedCard] = useState(null);

    // Isolated localStorage keys for each deck being edited
    const draftKey = `mtg_edit_draft_${deckId}`;
    const sideboardDraftKey = `mtg_edit_sideboard_draft_${deckId}`;
    const nameKey = `mtg_edit_name_${deckId}`;

    const [deckDraft, setDeckDraft] = useState(() => {
        const savedDraft = localStorage.getItem(draftKey);
        return savedDraft ? JSON.parse(savedDraft) : null;
    });

    const [sideboardDraft, setSideboardDraft] = useState(() => {
        const savedDraft = localStorage.getItem(sideboardDraftKey);
        return savedDraft ? JSON.parse(savedDraft) : null;
    });

    const [deckName, setDeckName] = useState(() => {
        return localStorage.getItem(nameKey) || null;
    });

    useEffect(() => {
        if (deckDraft !== null) {
            localStorage.setItem(draftKey, JSON.stringify(deckDraft));
        }
    }, [deckDraft, draftKey]);

    useEffect(() => {
        if (sideboardDraft !== null) {
            localStorage.setItem(sideboardDraftKey, JSON.stringify(sideboardDraft));
        }
    }, [sideboardDraft, sideboardDraftKey]);

    useEffect(() => {
        if (deckName !== null) {
            localStorage.setItem(nameKey, deckName);
        }
    }, [deckName, nameKey]);

    const fetchDeckData = useCallback(async () => {
        setLoading(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const token = localStorage.getItem('mtg_token');
            const response = await fetch(`${apiBase}/decks-by-user/single/${deckId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();

            if (result.success && result.data) {
                const deck = result.data;
                setOriginalDeck(deck);

                // If no local draft exists, initialize from backend
                if (deckDraft === null) {
                    const initialDraft = {};
                    deck.cards.forEach(item => {
                        initialDraft[item.card.id] = { added: item.quantity, card: item.card };
                    });
                    setDeckDraft(initialDraft);
                }

                if (sideboardDraft === null) {
                    const initialSideboard = {};
                    if (deck.sideboard) {
                        deck.sideboard.forEach(item => {
                            initialSideboard[item.card.id] = { added: item.quantity, card: item.card };
                        });
                    }
                    setSideboardDraft(initialSideboard);
                }

                if (deckName === null) {
                    setDeckName(deck.deckName);
                }
            }
        } catch (error) {
            console.error('Error fetching deck data:', error);
        } finally {
            setLoading(false);
        }
    }, [deckId, deckDraft, sideboardDraft, deckName]);

    const fetchUserCollection = useCallback(async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;

        if (!userId) {
            alert('Você precisa estar logado para acessar seus cards.');
            navigate('/login');
            return;
        }

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const token = localStorage.getItem('mtg_token');
            const response = await fetch(`${apiBase}/cards-by-user/${userId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();

            if (result.success && result.data && result.data.cards) {
                const cardsWithStock = result.data.cards.map(item => ({
                    ...item.card,
                    maxQuantity: item.quantity
                }));
                setUserCollection(cardsWithStock);
            }
        } catch (error) {
            console.error('Error fetching user collection:', error);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDeckData();
        fetchUserCollection();
    }, [fetchDeckData, fetchUserCollection]);

    // Same filter and handle logic as DeckBuilder
    const filteredCards = useMemo(() => {
        return userCollection.filter(card => {
            if (currentFilters.printed_name && !card.name?.toLowerCase().includes(currentFilters.printed_name.toLowerCase())) {
                if (!card.printed_name?.toLowerCase().includes(currentFilters.printed_name.toLowerCase())) return false;
            }
            if (currentFilters.colors && currentFilters.colors.length > 0) {
                const colorsArr = Array.isArray(currentFilters.colors) ? currentFilters.colors : [currentFilters.colors];
                if (!colorsArr.every(c => card.color_identity?.includes(c))) return false;
            }
            if (currentFilters.type_line && !card.type_line?.toLowerCase().includes(currentFilters.type_line.toLowerCase())) return false;
            if (currentFilters.set_name && !card.set_name?.toLowerCase().includes(currentFilters.set_name.toLowerCase())) return false;
            if (currentFilters.cmc && card.cmc !== Number(currentFilters.cmc)) return false;
            return true;
        });
    }, [userCollection, currentFilters]);

    const handleSearch = (filters) => setCurrentFilters(filters);

    const handleAddCard = (card) => {
        setDeckDraft(prev => {
            const currentDraft = prev || {};
            const existing = currentDraft[card.id] || { added: 0, card };
            const inSideboard = (sideboardDraft && sideboardDraft[card.id]?.added) || 0;
            if (existing.added + inSideboard >= card.maxQuantity) {
                alert(`Você só possui ${card.maxQuantity} cópias deste card na sua coleção.`);
                return currentDraft;
            }
            return { ...currentDraft, [card.id]: { ...existing, added: existing.added + 1 } };
        });
    };

    const handleRemoveCard = (card) => {
        setDeckDraft(prev => {
            if (!prev) return null;
            const existing = prev[card.id];
            if (!existing || existing.added <= 0) return prev;
            const newAdded = existing.added - 1;
            if (newAdded === 0) {
                const newState = { ...prev };
                delete newState[card.id];
                return newState;
            }
            return { ...prev, [card.id]: { ...existing, added: newAdded } };
        });
    };

    const handleAddSideboard = (card) => {
        setSideboardDraft(prev => {
            const currentSideboard = prev || {};
            const existing = currentSideboard[card.id] || { added: 0, card };
            const inMain = (deckDraft && deckDraft[card.id]?.added) || 0;
            if (existing.added + inMain >= card.maxQuantity) {
                alert(`Você só possui ${card.maxQuantity} cópias deste card na sua coleção.`);
                return currentSideboard;
            }
            return { ...currentSideboard, [card.id]: { ...existing, added: existing.added + 1 } };
        });
    };

    const handleRemoveSideboard = (card) => {
        setSideboardDraft(prev => {
            if (!prev) return null;
            const existing = prev[card.id];
            if (!existing || existing.added <= 0) return prev;
            const newAdded = existing.added - 1;
            if (newAdded === 0) {
                const newState = { ...prev };
                delete newState[card.id];
                return newState;
            }
            return { ...prev, [card.id]: { ...existing, added: newAdded } };
        });
    };

    const handleSaveEdits = async () => {
        const token = localStorage.getItem('mtg_token');
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;

        if (!deckName || !deckName.trim()) return alert('Dê um nome ao seu deck.');

        const payload = [{
            _id: deckId, // Include deckId for updates
            userId,
            deckName,
            cards: Object.values(deckDraft || {}).map(i => ({ quantity: i.added.toString(), cardId: i.card.id })),
            sideborad: Object.values(sideboardDraft || {}).map(i => ({ quantity: i.added.toString(), cardId: i.card.id }))
        }];

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/decks-by-user`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                alert('Alterações salvas!');
                handleCancelEdit(true); // Clear local storage and go home
            }
        } catch (error) {
            console.error('Error updating deck:', error);
        }
    };

    const handleCancelEdit = (skipConfirm = false) => {
        localStorage.removeItem(draftKey);
        localStorage.removeItem(sideboardDraftKey);
        localStorage.removeItem(nameKey);
        navigate('/home');
    };

    const handleClearDeck = () => {
        setDeckDraft({});
        setSideboardDraft({});
    };

    const totalMain = Object.values(deckDraft || {}).reduce((acc, curr) => acc + curr.added, 0);
    const totalSide = Object.values(sideboardDraft || {}).reduce((acc, curr) => acc + curr.added, 0);
    const totalAdded = totalMain + totalSide;

    return (
        <div className="view-deck-editor">
            <div className="view-deck-editor__header">
                <div>
                    <h1>Editando Deck: {originalDeck?.deckName}</h1>
                    <p>Faça as alterações desejadas e salve seu deck.</p>
                </div>
                <div className="view-deck-editor__header-actions">
                    <Button variant="secondary" onClick={() => navigate('/home')}>Voltar</Button>
                    <Button variant="primary" onClick={handleSaveEdits} disabled={totalAdded === 0}>
                        Salvar Alterações ({totalMain} + {totalSide})
                    </Button>
                </div>
            </div>

            <div className="view-deck-editor__filters">
                <CardFilters onSearch={handleSearch} />
            </div>

            <div className="view-deck-editor__content">
                {loading && userCollection.length === 0 ? (
                    <div className="deck-editor-loading">Carregando dados...</div>
                ) : (
                    <CardHorizontalList
                        cards={filteredCards}
                        collectionDraft={deckDraft || {}}
                        sideboardDraft={sideboardDraft || {}}
                        onAddCard={handleAddCard}
                        onRemoveCard={handleRemoveCard}
                        onAddSideboard={handleAddSideboard}
                        onRemoveSideboard={handleRemoveSideboard}
                        onImageClick={setZoomedCard}
                        loading={loading}
                        hasMore={false}
                        onLoadMore={() => { }}
                    />
                )}
            </div>

            <DeckVisualizer
                deckDraft={deckDraft || {}}
                sideboardDraft={sideboardDraft || {}}
                deckName={deckName || ''}
                setDeckName={setDeckName}
                onAddCard={handleAddCard}
                onRemoveCard={handleRemoveCard}
                onAddSideboard={handleAddSideboard}
                onRemoveSideboard={handleRemoveSideboard}
                onImageClick={setZoomedCard}
                onClear={handleClearDeck}
                onCancelEdit={() => handleCancelEdit(false)}
            />

            <CardPreviewModal
                isOpen={!!zoomedCard}
                card={zoomedCard}
                onClose={() => setZoomedCard(null)}
            />
        </div>
    );
};

export default DeckEditor;
