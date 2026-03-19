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

    const [userCollectionPage, setUserCollectionPage] = useState(1);
    const [hasMoreUserCollection, setHasMoreUserCollection] = useState(true);
    const [loadingUserCollection, setLoadingUserCollection] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isCloning, setIsCloning] = useState(false);

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

                const currentUserId = JSON.parse(localStorage.getItem('mtg_user'))?.id || JSON.parse(localStorage.getItem('mtg_user'))?._id;

                // If no local draft exists, initialize from backend
                if (deckDraft === null) {
                    const initialDraft = {};
                    deck.cards.forEach(item => {
                        const ownerId = item.ownerId || deck.userId;
                        const compositeKey = `${item.card.id}_${ownerId}`;
                        initialDraft[compositeKey] = {
                            added: item.quantity,
                            card: item.card,
                            ownerId
                        };
                    });
                    setDeckDraft(initialDraft);
                }

                if (sideboardDraft === null) {
                    const initialSideboard = {};
                    if (deck.sideboard) {
                        deck.sideboard.forEach(item => {
                            const ownerId = item.ownerId || deck.userId;
                            const compositeKey = `${item.card.id}_${ownerId}`;
                            initialSideboard[compositeKey] = {
                                added: item.quantity,
                                card: item.card,
                                ownerId
                            };
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

    const fetchUserCollection = useCallback(async (filters = currentFilters, page = 1) => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;

        if (!userId) {
            alert('Você precisa estar logado para acessar seus cards.');
            navigate('/login');
            return;
        }

        setLoadingUserCollection(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const token = localStorage.getItem('mtg_token');
            const queryParams = new URLSearchParams({ page: page.toString(), limit: '30' });

            Object.keys(filters || {}).forEach(key => {
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

            const response = await fetch(`${apiBase}/cards-by-user/${userId}?${queryParams.toString()}`, {
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
                
                if (page === 1) {
                    setUserCollection(cardsWithStock);
                } else {
                    setUserCollection(prev => [...prev, ...cardsWithStock]);
                }

                if (cardsWithStock.length < 30) {
                    setHasMoreUserCollection(false);
                } else {
                    setHasMoreUserCollection(true);
                }
            } else {
                setHasMoreUserCollection(false);
            }
        } catch (error) {
            console.error('Error fetching user collection:', error);
        } finally {
            setLoadingUserCollection(false);
        }
    }, [navigate]);

    // Friends list and collection logic
    const [showFriends, setShowFriends] = useState(false);
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendCollection, setFriendCollection] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [loadingFriendCollection, setLoadingFriendCollection] = useState(false);
    const [friendsPage, setFriendsPage] = useState(1);
    const friendsPerPage = 6;

    // All Cards (Out of Collection) state
    const [showAllCards, setShowAllCards] = useState(false);
    const [allCards, setAllCards] = useState([]);
    const [loadingAllCards, setLoadingAllCards] = useState(false);
    const [allCardsPage, setAllCardsPage] = useState(1);
    const [hasMoreAllCards, setHasMoreAllCards] = useState(true);
    const allCardsPerPage = 20;

    const fetchAllCards = useCallback(async (filters, page = 1) => {
        setLoadingAllCards(true);
        try {
                       const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: allCardsPerPage.toString()
            });

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
    }, [allCardsPerPage]);

    useEffect(() => {
        if (showAllCards) {
            fetchAllCards(currentFilters, 1);
            setAllCardsPage(1);
        }
    }, [showAllCards, currentFilters, fetchAllCards]);

    const fetchFriends = useCallback(async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;
        const token = localStorage.getItem('mtg_token');

        if (!userId) return;

        setLoadingFriends(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
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

    const fetchFriendCollection = async (friendId, filters = currentFilters, page = 1) => {
        setLoadingFriendCollection(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const token = localStorage.getItem('mtg_token');
            const queryParams = new URLSearchParams({ page: page.toString(), limit: '100' });

            Object.keys(filters || {}).forEach(key => {
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

            const response = await fetch(`${apiBase}/cards-by-user/${friendId}?${queryParams.toString()}`, {
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
        fetchDeckData();
        fetchUserCollection();
    }, [fetchDeckData, fetchUserCollection]);

    useEffect(() => {
        setUserCollectionPage(1);
        fetchUserCollection(currentFilters, 1);
        if (selectedFriend) {
            fetchFriendCollection(selectedFriend.user_id, currentFilters, 1);
        }
    }, [currentFilters, selectedFriend, fetchUserCollection]);

    useEffect(() => {
        if (friends.length === 0) {
            fetchFriends();
        }
    }, [friends.length, fetchFriends]);

    const handleFriendClick = (friend) => {
        if (selectedFriend?.user_id === friend.user_id) {
            setSelectedFriend(null);
            setFriendCollection([]);
        } else {
            setSelectedFriend(friend);
            fetchFriendCollection(friend.user_id);
        }
    };

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
        const ownerId = card.ownerId || JSON.parse(localStorage.getItem('mtg_user'))?.id || JSON.parse(localStorage.getItem('mtg_user'))?._id;
        const compositeKey = `${card.id}_${ownerId}`;
        setDeckDraft(prev => {
            const currentDraft = prev || {};
            const existing = currentDraft[compositeKey] || { added: 0, card, ownerId };
            const inSideboard = (sideboardDraft && sideboardDraft[compositeKey]?.added) || 0;
            const maxQ = card.maxQuantity || 4;
            if (existing.added + inSideboard >= maxQ) {
                alert(ownerId === 'out_of_collection'
                    ? `Limite de 4 cópias atingido para este card.`
                    : `Este proprietário só possui ${maxQ} cópias deste card.`);
                return currentDraft;
            }
            return { ...currentDraft, [compositeKey]: { ...existing, added: existing.added + 1 } };
        });
    };

    const handleRemoveCard = (card) => {
        const ownerId = card.ownerId;
        const compositeKey = `${card.id}_${ownerId}`;
        setDeckDraft(prev => {
            if (!prev) return null;
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
            const maxQ = card.maxQuantity || 4;
            if (existing.added + inMain >= maxQ) {
                alert(ownerId === 'out_of_collection'
                    ? `Limite de 4 cópias atingido para este card.`
                    : `Este proprietário só possui ${maxQ} cópias deste card.`);
                return currentSideboard;
            }
            return { ...currentSideboard, [compositeKey]: { ...existing, added: existing.added + 1 } };
        });
    };

    const handleRemoveSideboard = (card) => {
        const ownerId = card.ownerId;
        const compositeKey = `${card.id}_${ownerId}`;
        setSideboardDraft(prev => {
            if (!prev) return null;
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

                // 3. Refetch collection
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
            cards: Object.values(deckDraft || {}).map(i => ({
                quantity: i.added.toString(),
                cardId: i.card.id,
                ownerId: i.ownerId
            })),
            sideborad: Object.values(sideboardDraft || {}).map(i => ({
                quantity: i.added.toString(),
                cardId: i.card.id,
                ownerId: i.ownerId
            }))
        }];

        setIsSaving(true);
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
        } finally {
            setIsSaving(false);
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

    const isReadOnly = useMemo(() => {
        if (!originalDeck) return false;
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const currentUserId = user?.id || user?._id;
        return originalDeck.userId !== currentUserId;
    }, [originalDeck]);

    const handleCloneDeck = async () => {
        const token = localStorage.getItem('mtg_token');
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;

        if (!deckName || !deckName.trim()) return alert('Dê um nome ao seu deck.');

        const payload = [{
            userId,
            deckName: `${deckName} (Cópia)`,
            cards: Object.values(deckDraft || {}).map(i => ({
                quantity: i.added.toString(),
                cardId: i.card.id,
                ownerId: i.ownerId
            })),
            sideborad: Object.values(sideboardDraft || {}).map(i => ({
                quantity: i.added.toString(),
                cardId: i.card.id,
                ownerId: i.ownerId
            }))
        }];

        setIsCloning(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/decks-by-user`, {
                method: 'PUT', // The user uses PUT for saving new decks as well in DeckBuilder.jsx
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                alert('Deck clonado com sucesso!');
                handleCancelEdit(true);
            }
        } catch (error) {
            console.error('Error cloning deck:', error);
            alert('Erro ao clonar deck.');
        } finally {
            setIsCloning(false);
        }
    };

    const totalMain = Object.values(deckDraft || {}).reduce((acc, curr) => acc + curr.added, 0);
    const totalSide = Object.values(sideboardDraft || {}).reduce((acc, curr) => acc + curr.added, 0);
    const totalAdded = totalMain + totalSide;

    return (

        <div className="view-deck-editor">

            <div className="view-deck-editor__header">
                <div>
                    <h1>{isReadOnly ? `Visualizando Deck: ${originalDeck?.deckName}` : `Editando Deck: ${originalDeck?.deckName}`}</h1>
                    <p>{isReadOnly ? 'Você está visualizando o deck de um amigo. Você pode criar uma cópia para você.' : 'Faça as alterações desejadas e salve seu deck.'}</p>
                </div>
                <div className="view-deck-editor__header-actions">
                    <Button variant="secondary" onClick={() => navigate('/home')}>Voltar</Button>
                    {isReadOnly ? (
                        <Button variant="primary" onClick={handleCloneDeck} isLoading={isCloning}>
                            Clonar para Meus Decks
                        </Button>
                    ) : (
                        <>
                            <Button variant="secondary" onClick={handleCloneDeck} isLoading={isCloning}>
                                Criar Cópia
                            </Button>
                            <Button variant="primary" onClick={handleSaveEdits} disabled={totalAdded === 0} isLoading={isSaving}>
                                Salvar Alterações ({totalMain} + {totalSide})
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {!isReadOnly && (
                <div className="view-deck-editor__filters">
                    <CardFilters onSearch={handleSearch} />
                </div>
            )}

            <div className="view-deck-editor__content">
                {!isReadOnly && (
                    <section className="deck-editor-section">
                        <h3>Minha Coleção</h3>
                        {loading && userCollection.length === 0 ? (
                            <div className="deck-editor-loading">
                                <div>Carregando sua coleção...</div>
                                <div className="global-spinner-container">
                                    <div className="global-spinner"></div>
                                </div>
                            </div>
                        ) : (
                            <CardHorizontalList
                                cards={filteredCards}
                                collectionDraft={deckDraft || {}}
                                sideboardDraft={sideboardDraft || {}}
                                onAddCard={handleAddCard}
                                onRemoveCard={handleRemoveCard}
                                onAddSideboard={handleAddSideboard}
                                onRemoveSideboard={handleRemoveSideboard}
                                loading={loadingUserCollection}
                                hasMore={hasMoreUserCollection}
                                onLoadMore={() => {
                                    if (loadingUserCollection || !hasMoreUserCollection) return;
                                    const nextPage = userCollectionPage + 1;
                                    setUserCollectionPage(nextPage);
                                    fetchUserCollection(currentFilters, nextPage);
                                }}
                                onImageClick={setZoomedCard}
                                ownerId={JSON.parse(localStorage.getItem('mtg_user'))?.id || JSON.parse(localStorage.getItem('mtg_user'))?._id}
                            />
                        )}
                    </section>
                )}

                {!isReadOnly && (
                    <div className="view-home__friends-toggle view-deck-editor__friends-toggle">
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
                                    <div className="friends-list__loading">
                                        <div>Carregando amigos...</div>
                                        <div className="global-spinner-container">
                                            <div className="global-spinner"></div>
                                        </div>
                                    </div>
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
                )}

                {showFriends && selectedFriend && !isReadOnly && (
                    <section className="deck-editor-section deck-editor-section--friend">
                        <h3>Coleção de {selectedFriend.name}</h3>
                        {loadingFriendCollection ? (
                            <div className="deck-editor-loading">
                                <div>Carregando coleção de {selectedFriend.name}...</div>
                                <div className="global-spinner-container">
                                    <div className="global-spinner"></div>
                                </div>
                            </div>
                        ) : friendCollection.length === 0 ? (
                            <div className="deck-editor-empty">Este amigo não possui cards na coleção.</div>
                        ) : (
                            <CardHorizontalList
                                cards={friendCollection.filter(card => {
                                    // Apply same filters to friend collection
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
                                })}
                                collectionDraft={deckDraft || {}}
                                sideboardDraft={sideboardDraft || {}}
                                onAddCard={handleAddCard}
                                onRemoveCard={handleRemoveCard}
                                onAddSideboard={handleAddSideboard}
                                onRemoveSideboard={handleRemoveSideboard}
                                onImageClick={setZoomedCard}
                                loading={false}
                                hasMore={false}
                                onLoadMore={() => { }}
                                ownerId={selectedFriend.user_id}
                                isFriendList={true}
                            />
                        )}
                    </section>
                )}

                {!isReadOnly && (<div className="view-home__friends-toggle view-deck-editor__all-cards-toggle" style={{ marginTop: '10px' }}>
                    <label className="view-deck-builder__all-cards-checkbox">
                        <input
                            type="checkbox"
                            checked={showAllCards}
                            onChange={(e) => setShowAllCards(e.target.checked)}
                        />
                        Adicionar cards que não estão na coleção
                    </label>
                </div>)}

                {showAllCards && !isReadOnly && (
                    <section className="deck-editor-section deck-editor-section--all-cards">
                        <h3>Cards fora da coleção</h3>
                        {loadingAllCards && allCards.length === 0 ? (
                            <div className="deck-editor-loading">
                                <div>Carregando cards...</div>
                                <div className="global-spinner-container">
                                    <div className="global-spinner"></div>
                                </div>
                            </div>
                        ) : allCards.length === 0 ? (
                            <div className="deck-editor-empty">Nenhum card encontrado na base global com estes filtros.</div>
                        ) : (
                            <CardHorizontalList
                                cards={allCards}
                                collectionDraft={deckDraft || {}}
                                sideboardDraft={sideboardDraft || {}}
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
                onAddToCollection={handleAddToCollection}
                readOnly={isReadOnly}
                friends={friends}
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
