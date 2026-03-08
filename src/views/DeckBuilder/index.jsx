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
                const cardsWithStock = result.data.cards.map(item => ({
                    ...item.card,
                    maxQuantity: item.quantity,
                    ownerId: userId // Track who owns the card
                }));
                setUserCollection(cardsWithStock);
            }
        } catch (error) {
            console.error('Error fetching user collection:', error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Friend Collection Logic
    const [showFriends, setShowFriends] = useState(false);
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendCollection, setFriendCollection] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [loadingFriendCollection, setLoadingFriendCollection] = useState(false);

    const [friendsPage, setFriendsPage] = useState(1);
    const friendsPerPage = 6;

    // All Cards (Out of Collection) states
    const [showAllCards, setShowAllCards] = useState(false);
    const [allCards, setAllCards] = useState([]);
    const [loadingAllCards, setLoadingAllCards] = useState(false);
    const [allCardsPage, setAllCardsPage] = useState(1);
    const [hasMoreAllCards, setHasMoreAllCards] = useState(true);
    const allCardsPerPage = 20; // More cards for global search

    const fetchFriends = useCallback(async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;
        if (!userId) return;

        setLoadingFriends(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const token = localStorage.getItem('mtg_token');
            const response = await fetch(`${apiBase}/friends/${userId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();
            if (result.success && result.data) {
                setFriends(result.data || []);
                setFriendsPage(1);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoadingFriends(false);
        }
    }, []);

    const fetchFriendCollection = async (friendId) => {
        setLoadingFriendCollection(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const token = localStorage.getItem('mtg_token');
            const response = await fetch(`${apiBase}/cards-by-user/${friendId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();
            if (result.success && result.data && result.data.cards) {
                const cardsWithStock = result.data.cards.map(item => ({
                    ...item.card,
                    maxQuantity: item.quantity,
                    ownerId: friendId
                }));
                setFriendCollection(cardsWithStock);
            }
        } catch (error) {
            console.error('Error fetching friend collection:', error);
        } finally {
            setLoadingFriendCollection(false);
        }
    };

    useEffect(() => {
        fetchUserCollection();
    }, [fetchUserCollection]);

    useEffect(() => {
        if (friends.length === 0) {
            fetchFriends();
        }
    }, [friends.length, fetchFriends]);

    const handleFriendClick = (friend) => {
        if (selectedFriend?._id === friend.user_id || selectedFriend?.user_id === friend.user_id) {
            setSelectedFriend(null);
            setFriendCollection([]);
        } else {
            setSelectedFriend(friend);
            fetchFriendCollection(friend.user_id);
        }
    };

    const fetchAllCards = useCallback(async (filters = currentFilters, page = 1) => {
        setLoadingAllCards(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: allCardsPerPage.toString()
            });

            // Add other filters
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    if (key === 'colors') {
                        if (filters.colors.length > 0) {
                            queryParams.append('color_identity', filters.colors.join(','));
                        }
                    } else {
                        queryParams.append(key, filters[key]);
                    }
                }
            });

            const response = await fetch(`${apiBase}/cards?${queryParams.toString()}`);
            const result = await response.json();
            if (result.success && result.data && result.data.cards) {
                const cardsWithOwner = result.data.cards.map(card => ({
                    ...card,
                    maxQuantity: 4,
                    ownerId: 'out_of_collection'
                }));

                if (page === 1) {
                    setAllCards(cardsWithOwner);
                } else {
                    setAllCards(prev => [...prev, ...cardsWithOwner]);
                }

                // If we got fewer results than the page size, we're at the end
                if (cardsWithOwner.length < allCardsPerPage) {
                    setHasMoreAllCards(false);
                } else {
                    setHasMoreAllCards(true);
                }
            } else {
                setHasMoreAllCards(false);
            }
        } catch (error) {
            console.error('Error fetching all cards:', error);
        } finally {
            setLoadingAllCards(false);
        }
    }, [currentFilters, allCardsPerPage]);

    useEffect(() => {
        if (showAllCards) {
            fetchAllCards(currentFilters, 1);
            setAllCardsPage(1);
        }
    }, [showAllCards, currentFilters, fetchAllCards]);

    // Client-side filtering logic
    const filteredCards = useMemo(() => {
        return userCollection.filter(card => {
            if (currentFilters.printed_name && !card.name?.toLowerCase().includes(currentFilters.printed_name.toLowerCase())) {
                if (!card.printed_name?.toLowerCase().includes(currentFilters.printed_name.toLowerCase())) {
                    return false;
                }
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

    const handleSearch = (filters) => {
        setCurrentFilters(filters);
    };

    const handleAddCard = (card) => {
        const ownerId = card.ownerId || JSON.parse(localStorage.getItem('mtg_user'))?.id || JSON.parse(localStorage.getItem('mtg_user'))?._id;
        const compositeKey = `${card.id}_${ownerId}`;
        setDeckDraft(prev => {
            const currentDraft = prev || {};
            const existing = currentDraft[compositeKey] || { added: 0, card, ownerId };
            const inSideboard = (sideboardDraft && sideboardDraft[compositeKey]?.added) || 0;
            if (existing.added + inSideboard >= (card.maxQuantity || 4)) {
                alert(ownerId === 'out_of_collection'
                    ? `Limite de 4 cópias atingido para este card.`
                    : `Este proprietário só possui ${card.maxQuantity} cópias deste card.`);
                return currentDraft;
            }
            return { ...currentDraft, [compositeKey]: { ...existing, added: existing.added + 1 } };
        });
    };

    const handleRemoveCard = (card) => {
        const ownerId = card.ownerId || JSON.parse(localStorage.getItem('mtg_user'))?.id || JSON.parse(localStorage.getItem('mtg_user'))?._id;
        const compositeKey = `${card.id}_${ownerId}`;
        setDeckDraft(prev => {
            if (!prev) return {};
            const existing = prev[compositeKey];
            if (!existing || existing.added <= 0) return prev;
            const newAdded = existing.added - 1;
            if (newAdded === 0) {
                const newState = { ...prev };
                delete newState[compositeKey];
                return newState;
            }
            return { ...prev, [compositeKey]: { ...existing, added: newAdded } };
        });
    };

    const handleAddSideboard = (card) => {
        const ownerId = card.ownerId || JSON.parse(localStorage.getItem('mtg_user'))?.id || JSON.parse(localStorage.getItem('mtg_user'))?._id;
        const compositeKey = `${card.id}_${ownerId}`;
        setSideboardDraft(prev => {
            const currentSideboard = prev || {};
            const existing = currentSideboard[compositeKey] || { added: 0, card, ownerId };
            const inMain = (deckDraft && deckDraft[compositeKey]?.added) || 0;
            if (existing.added + inMain >= (card.maxQuantity || 4)) {
                alert(ownerId === 'out_of_collection'
                    ? `Limite de 4 cópias atingido para este card.`
                    : `Este proprietário só possui ${card.maxQuantity} cópias deste card.`);
                return currentSideboard;
            }
            return { ...currentSideboard, [compositeKey]: { ...existing, added: existing.added + 1 } };
        });
    };

    const handleRemoveSideboard = (card) => {
        const ownerId = card.ownerId || JSON.parse(localStorage.getItem('mtg_user'))?.id || JSON.parse(localStorage.getItem('mtg_user'))?._id;
        const compositeKey = `${card.id}_${ownerId}`;
        setSideboardDraft(prev => {
            if (!prev) return {};
            const existing = prev[compositeKey];
            if (!existing || existing.added <= 0) return prev;
            const newAdded = existing.added - 1;
            if (newAdded === 0) {
                const newState = { ...prev };
                delete newState[compositeKey];
                return newState;
            }
            return { ...prev, [compositeKey]: { ...existing, added: newAdded } };
        });
    };


    const handleAddToCollection = async (selectedItems) => {
        const savedUser = localStorage.getItem('mtg_user');
        const token = localStorage.getItem('mtg_token');
        if (!savedUser || !token) return;

        const user = JSON.parse(savedUser);
        const userId = user.id || user._id;

        // 1. Prepare backend payload
        const updates = selectedItems.map(item => {
            const existing = userCollection.find(c => c.id === item.card.id);
            const currentQty = existing ? existing.maxQuantity : 0;
            return {
                cardId: item.card.id,
                quantity: currentQty + item.added
            };
        });

        const payload = [
            {
                userId,
                cards: updates
            }
        ];

        setLoading(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/cards-by-user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                // 2. Update local deck state migration
                setDeckDraft(prev => {
                    const next = { ...prev };
                    selectedItems.forEach(item => {
                        const oldKey = `${item.card.id}_out_of_collection`;
                        if (next[oldKey]) {
                            const newKey = `${item.card.id}_${userId}`;
                            if (next[newKey]) {
                                next[newKey] = {
                                    ...next[newKey],
                                    added: next[newKey].added + next[oldKey].added
                                };
                            } else {
                                next[newKey] = {
                                    ...next[oldKey],
                                    ownerId: userId
                                };
                            }
                            delete next[oldKey];
                        }
                    });
                    return next;
                });

                setSideboardDraft(prev => {
                    const next = { ...prev };
                    selectedItems.forEach(item => {
                        const oldKey = `${item.card.id}_out_of_collection`;
                        if (next[oldKey]) {
                            const newKey = `${item.card.id}_${userId}`;
                            if (next[newKey]) {
                                next[newKey] = {
                                    ...next[newKey],
                                    added: next[newKey].added + next[oldKey].added
                                };
                            } else {
                                next[newKey] = {
                                    ...next[oldKey],
                                    ownerId: userId
                                };
                            }
                            delete next[oldKey];
                        }
                    });
                    return next;
                });

                // 3. Refetch collection to sync everything
                fetchUserCollection();
                alert('Cards adicionados à sua coleção com sucesso!');
            } else {
                alert(`Erro ao adicionar à coleção: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding to collection:', error);
            alert('Erro de conexão ao adicionar à coleção.');
        } finally {
            setLoading(false);
        }
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
            cardId: item.card.id,
            ownerId: item.ownerId // Add ownerId to persist borrowed status
        }));

        const formattedSideboard = Object.values(sideboardDraft).map(item => ({
            quantity: item.added.toString(),
            cardId: item.card.id,
            ownerId: item.ownerId
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
                <section className="deck-builder-section">
                    <h3>Minha Coleção</h3>
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
                            loading={false}
                            hasMore={false}
                            onLoadMore={() => { }}
                            onImageClick={setZoomedCard}
                            ownerId={JSON.parse(localStorage.getItem('mtg_user'))?.id || JSON.parse(localStorage.getItem('mtg_user'))?._id}
                        />
                    )}
                </section>

                <div className="view-deck-builder__toggles">
                    <div className="view-home__friends-toggle view-deck-builder__friends-toggle">
                        <label>
                            <input
                                type="checkbox"
                                checked={showFriends}
                                onChange={(e) => setShowFriends(e.target.checked)}
                            />
                            Ver cards de meus amigos
                        </label>

                        {showFriends && (
                            <div className="friends-list">
                                {loadingFriends ? (
                                    <div className="friends-list__loading">Carregando amigos...</div>
                                ) : friends.length > 0 ? (
                                    <>
                                        <div className="friends-list__container">
                                            {friends.slice((friendsPage - 1) * friendsPerPage, friendsPage * friendsPerPage).map(f => (
                                                <div
                                                    key={f.user_id}
                                                    className="friends-list__item"
                                                    onClick={() => handleFriendClick(f)}
                                                >
                                                    <span className={`friends-list__friend-badge ${selectedFriend?.user_id === f.user_id ? 'active' : ''}`}>
                                                        {f.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="friends-list__pager">
                                            <button
                                                className="friends-list__pager-btn"
                                                onClick={() => setFriendsPage(p => Math.max(1, p - 1))}
                                                disabled={friendsPage === 1}
                                            >
                                                ◀
                                            </button>
                                            <span className="friends-list__pager-info">
                                                {friendsPage} / {Math.max(1, Math.ceil(friends.length / friendsPerPage))}
                                            </span>
                                            <button
                                                className="friends-list__pager-btn"
                                                onClick={() => setFriendsPage(p => Math.min(Math.ceil(friends.length / friendsPerPage), p + 1))}
                                                disabled={friendsPage >= Math.ceil(friends.length / friendsPerPage)}
                                            >
                                                ▶
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="friends-list__empty">Nenhum amigo encontrado.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {showFriends && selectedFriend && (
                    <section className="deck-builder-section deck-builder-section--friend">
                        <h3>Coleção de {selectedFriend.name}</h3>
                        {loadingFriendCollection ? (
                            <div className="deck-builder-loading">Carregando coleção de {selectedFriend.name}...</div>
                        ) : friendCollection.length === 0 ? (
                            <div className="deck-builder-empty">Este amigo não possui cards na coleção.</div>
                        ) : (
                            <CardHorizontalList
                                cards={friendCollection.filter(card => {
                                    // Apply same filters to friend collection
                                    if (currentFilters.printed_name && !card.name?.toLowerCase().includes(currentFilters.printed_name.toLowerCase())) return false;
                                    if (currentFilters.colors && currentFilters.colors.length > 0) {
                                        const colorsArr = Array.isArray(currentFilters.colors) ? currentFilters.colors : [currentFilters.colors];
                                        if (!colorsArr.every(c => card.color_identity?.includes(c))) return false;
                                    }
                                    if (currentFilters.type_line && !card.type_line?.toLowerCase().includes(currentFilters.type_line.toLowerCase())) return false;
                                    if (currentFilters.set_name && !card.set_name?.toLowerCase().includes(currentFilters.set_name.toLowerCase())) return false;
                                    if (currentFilters.cmc && card.cmc !== Number(currentFilters.cmc)) return false;
                                    return true;
                                })}
                                collectionDraft={deckDraft}
                                sideboardDraft={sideboardDraft}
                                onAddCard={handleAddCard}
                                onRemoveCard={handleRemoveCard}
                                onAddSideboard={handleAddSideboard}
                                onRemoveSideboard={handleRemoveSideboard}
                                loading={false}
                                hasMore={false}
                                onLoadMore={() => { }}
                                onImageClick={setZoomedCard}
                                ownerId={selectedFriend.user_id}
                                isFriendList={true}
                            />
                        )}
                    </section>
                )}

                <div className="view-home__friends-toggle view-deck-builder__all-cards-toggle">
                    <label className="view-deck-builder__all-cards-checkbox">
                        <input
                            type="checkbox"
                            checked={showAllCards}
                            onChange={(e) => setShowAllCards(e.target.checked)}
                        />
                        Adicionar cards que não estão na coleção
                    </label>
                </div>

                {showAllCards && (
                    <section className="deck-builder-section deck-builder-section--all-cards">
                        <h3>Cards fora da coleção</h3>
                        {loadingAllCards && allCards.length === 0 ? (
                            <div className="deck-builder-loading">Buscando cards na base global...</div>
                        ) : allCards.length === 0 ? (
                            <div className="deck-builder-empty">Nenhum card encontrado na base global com estes filtros.</div>
                        ) : (
                            <CardHorizontalList
                                cards={allCards}
                                collectionDraft={deckDraft}
                                sideboardDraft={sideboardDraft}
                                onAddCard={handleAddCard}
                                onRemoveCard={handleRemoveCard}
                                onAddSideboard={handleAddSideboard}
                                onRemoveSideboard={handleRemoveSideboard}
                                loading={loadingAllCards}
                                hasMore={hasMoreAllCards}
                                onLoadMore={() => {
                                    if (loadingAllCards || !hasMoreAllCards) return;
                                    const nextPage = allCardsPage + 1;
                                    setAllCardsPage(nextPage);
                                    fetchAllCards(currentFilters, nextPage);
                                }}
                                onImageClick={setZoomedCard}
                                ownerId="out_of_collection"
                            />
                        )}
                    </section>
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
                onAddToCollection={handleAddToCollection}
                friends={friends}
            />

            {/* Modal for Card Previews */}
            <CardPreviewModal
                isOpen={!!zoomedCard}
                card={zoomedCard}
                onClose={() => setZoomedCard(null)}
            />
        </div >
    );
};

export default DeckBuilder;
