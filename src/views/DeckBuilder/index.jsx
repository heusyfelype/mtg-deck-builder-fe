import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button';
import CardFilters from '../../components/organisms/CardFilters';
import CardHorizontalList from '../../components/organisms/CardHorizontalList';
import CardPreviewModal from '../../components/molecules/CardPreviewModal';
import DeckVisualizer from '../../components/organisms/DeckVisualizer';
import './DeckBuilder.css';

const DeckBuilder = () => {
    const navigate = useNavigate();

    // The user's full collection fetched from the API
    const [userCollection, setUserCollection] = useState([]);
    const [loading, setLoading] = useState(false);

    // Manage current filters applied by user (client-side in this view)
    const [currentFilters, setCurrentFilters] = useState({});

    // State for zoomed card modal
    const [zoomedCard, setZoomedCard] = useState(null);

    // Manage the deck draft state (could use a different key in localStorage)
    const [deckDraft, setDeckDraft] = useState(() => {
        const savedDraft = localStorage.getItem('mtg_deck_draft');
        return savedDraft ? JSON.parse(savedDraft) : {};
    });

    const [sideboardDraft, setSideboardDraft] = useState(() => {
        const savedDraft = localStorage.getItem('mtg_sideboard_draft');
        return savedDraft ? JSON.parse(savedDraft) : {};
    });

    const [deckName, setDeckName] = useState(() => {
        return localStorage.getItem('mtg_deck_name') || '';
    });

    // Save to local storage whenever deck draft state changes
    useEffect(() => {
        localStorage.setItem('mtg_deck_draft', JSON.stringify(deckDraft));
    }, [deckDraft]);

    useEffect(() => {
        localStorage.setItem('mtg_sideboard_draft', JSON.stringify(sideboardDraft));
    }, [sideboardDraft]);

    useEffect(() => {
        localStorage.setItem('mtg_deck_name', deckName);
    }, [deckName]);

    const handleClearDeck = () => {
        setDeckDraft({});
        setSideboardDraft({});
        setDeckName('');
        localStorage.removeItem('mtg_deck_draft');
        localStorage.removeItem('mtg_sideboard_draft');
        localStorage.removeItem('mtg_deck_name');
    };

    const fetchUserCollection = useCallback(async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;

        if (!userId) {
            alert('Você precisa estar logado para acessar seus cards.');
            navigate('/login');
            return;
        }

        setLoading(true);
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
                // Backend returns [{ userId, quantity, card: Card }]
                // We extract the card objects but keep the available quantity info if needed
                const cardsWithStock = result.data.cards.map(item => ({
                    ...item.card,
                    maxQuantity: item.quantity // stock available in user collection
                }));
                setUserCollection(cardsWithStock);
            }
        } catch (error) {
            console.error('Error fetching user collection:', error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUserCollection();
    }, [fetchUserCollection]);

    // Client-side filtering logic
    const filteredCards = useMemo(() => {
        return userCollection.filter(card => {
            // Filter by printed_name (exact or partial)
            if (currentFilters.printed_name && !card.name?.toLowerCase().includes(currentFilters.printed_name.toLowerCase())) {
                // Also check printed_name if available
                if (!card.printed_name?.toLowerCase().includes(currentFilters.printed_name.toLowerCase())) {
                    return false;
                }
            }

            // Filter by color_identity
            if (currentFilters.colors && currentFilters.colors.length > 0) {
                const colorsArr = Array.isArray(currentFilters.colors) ? currentFilters.colors : [currentFilters.colors];
                if (!colorsArr.every(c => card.color_identity?.includes(c))) {
                    return false;
                }
            }

            // Filter by type_line
            if (currentFilters.type_line && !card.type_line?.toLowerCase().includes(currentFilters.type_line.toLowerCase())) {
                return false;
            }

            // Filter by set_name
            if (currentFilters.set_name && !card.set_name?.toLowerCase().includes(currentFilters.set_name.toLowerCase())) {
                return false;
            }

            // Filter by cmc
            if (currentFilters.cmc && card.cmc !== Number(currentFilters.cmc)) {
                return false;
            }

            return true;
        });
    }, [userCollection, currentFilters]);

    const handleSearch = (filters) => {
        setCurrentFilters(filters);
    };

    const handleAddCard = (card) => {
        setDeckDraft(prev => {
            const existing = prev[card.id] || { added: 0, current: 0, card };
            const inSideboard = sideboardDraft[card.id]?.added || 0;

            // Shared stock check
            if (existing.added + inSideboard >= card.maxQuantity) {
                alert(`Você só possui ${card.maxQuantity} cópias deste card na sua coleção.`);
                return prev;
            }

            return {
                ...prev,
                [card.id]: {
                    ...existing,
                    added: existing.added + 1,
                    card
                }
            };
        });
    };

    const handleRemoveCard = (card) => {
        setDeckDraft(prev => {
            const existing = prev[card.id];
            if (!existing || existing.added <= 0) return prev;
            const newAdded = existing.added - 1;
            if (newAdded === 0) {
                const newDraft = { ...prev };
                delete newDraft[card.id];
                return newDraft;
            }
            return {
                ...prev,
                [card.id]: { ...existing, added: newAdded }
            };
        });
    };

    const handleAddSideboard = (card) => {
        setSideboardDraft(prev => {
            const existing = prev[card.id] || { added: 0, current: 0, card };
            const inMainDeck = deckDraft[card.id]?.added || 0;

            // Shared stock check
            if (existing.added + inMainDeck >= card.maxQuantity) {
                alert(`Você só possui ${card.maxQuantity} cópias deste card na sua coleção.`);
                return prev;
            }

            return {
                ...prev,
                [card.id]: {
                    ...existing,
                    added: existing.added + 1,
                    card
                }
            };
        });
    };

    const handleRemoveSideboard = (card) => {
        setSideboardDraft(prev => {
            const existing = prev[card.id];
            if (!existing || existing.added <= 0) return prev;
            const newAdded = existing.added - 1;
            if (newAdded === 0) {
                const newDraft = { ...prev };
                delete newDraft[card.id];
                return newDraft;
            }
            return {
                ...prev,
                [card.id]: { ...existing, added: newAdded }
            };
        });
    };

    const handleSaveDeck = async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;
        const token = localStorage.getItem('mtg_token');

        if (!userId || !token) {
            alert('Você precisa estar logado para salvar seu deck.');
            return;
        }

        if (!deckName.trim()) {
            alert('Por favor, dê um nome ao seu deck antes de salvar.');
            return;
        }

        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

        // Format cards for payload
        const formattedCards = Object.values(deckDraft).map(item => ({
            quantity: item.added.toString(),
            cardId: item.card.id
        }));

        const formattedSideboard = Object.values(sideboardDraft).map(item => ({
            quantity: item.added.toString(),
            cardId: item.card.id
        }));

        // Construct the payload as requested (array containing one deck object)
        const payload = [
            {
                userId,
                deckName,
                cards: formattedCards,
                sideborad: formattedSideboard // Keeping the requested typo
            }
        ];

        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/decks-by-user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                alert('Deck salvo com sucesso!');
                // Optional: Clear or navigate
                handleClearDeck();
                navigate('/home');
            } else {
                alert(`Erro ao salvar deck: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saving deck:', error);
            alert('Erro de conexão ao salvar deck.');
        } finally {
            setLoading(false);
        }
    };

    const totalMain = Object.values(deckDraft).reduce((acc, curr) => acc + curr.added, 0);
    const totalSideboard = Object.values(sideboardDraft).reduce((acc, curr) => acc + curr.added, 0);
    const totalAdded = totalMain + totalSideboard;

    return (
        <div className="view-deck-builder">
            <div className="view-deck-builder__header">
                <div>
                    <h1>Construtor de Decks</h1>
                    <p>Monte seu deck usando as cartas da sua coleção.</p>
                </div>
                <div className="view-deck-builder__header-actions">
                    <Button variant="secondary" onClick={() => navigate('/home')}>
                        Voltar para Home
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveDeck}
                        disabled={totalAdded === 0}
                    >
                        Salvar Deck {totalAdded > 0 ? `(${totalMain} + ${totalSideboard})` : ''}
                    </Button>
                </div>
            </div>

            <div className="view-deck-builder__filters">
                <CardFilters onSearch={handleSearch} />
            </div>

            <div className="view-deck-builder__content">
                {loading ? (
                    <div className="deck-builder-loading">Carregando sua coleção...</div>
                ) : (
                    <CardHorizontalList
                        cards={filteredCards}
                        collectionDraft={deckDraft}
                        sideboardDraft={sideboardDraft}
                        onAddCard={handleAddCard}
                        onRemoveCard={handleRemoveCard}
                        onAddSideboard={handleAddSideboard}
                        onRemoveSideboard={handleRemoveSideboard}
                        loading={false} // No lazy loading for local collection yet
                        hasMore={false}
                        onLoadMore={() => { }}
                        onImageClick={setZoomedCard}
                    />
                )}
            </div>

            <DeckVisualizer
                deckDraft={deckDraft}
                sideboardDraft={sideboardDraft}
                deckName={deckName}
                setDeckName={setDeckName}
                onAddCard={handleAddCard}
                onRemoveCard={handleRemoveCard}
                onAddSideboard={handleAddSideboard}
                onRemoveSideboard={handleRemoveSideboard}
                onImageClick={setZoomedCard}
                onClear={handleClearDeck}
            />

            {/* Modal for Card Previews */}
            <CardPreviewModal
                isOpen={!!zoomedCard}
                card={zoomedCard}
                onClose={() => setZoomedCard(null)}
            />
        </div>
    );
};

export default DeckBuilder;
