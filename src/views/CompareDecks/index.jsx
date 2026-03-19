import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button';
import CardPreviewModal from '../../components/molecules/CardPreviewModal';
import './CompareDecks.css';

const CompareDecks = () => {
    const navigate = useNavigate();
    
    // States for User
    const [userDecks, setUserDecks] = useState([]);
    const [loadingUserDecks, setLoadingUserDecks] = useState(false);
    const [selectedUserDecks, setSelectedUserDecks] = useState([]); 
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // States for Friends
    const [friends, setFriends] = useState([]);
    const [selectedFriendId, setSelectedFriendId] = useState('');
    const [friendDecks, setFriendDecks] = useState([]);
    const [loadingFriendDecks, setLoadingFriendDecks] = useState(false);
    const [selectedFriendDecks, setSelectedFriendDecks] = useState([]); 
    const [friendSearchQuery, setFriendSearchQuery] = useState('');

    // States for Results
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonResults, setComparisonResults] = useState([]);
    const [zoomedCard, setZoomedCard] = useState(null);

    const [user] = useState(() => {
        const savedUser = localStorage.getItem('mtg_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const token = localStorage.getItem('mtg_token');
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

    // 1. Fetch User Decks
    const fetchUserDecks = useCallback(async () => {
        if (!user) return;
        setLoadingUserDecks(true);
        try {
            const response = await fetch(`${apiBase}/decks-by-user/simplified/${user.id || user._id}`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const result = await response.json();
            if (result.success && result.data) {
                setUserDecks(result.data);
            }
        } catch (error) {
            console.error('Error fetching user decks:', error);
        } finally {
            setLoadingUserDecks(false);
        }
    }, [user, token, apiBase]);

    // 2. Fetch Friends
    const fetchFriends = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`${apiBase}/friends/${user.id || user._id}`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const result = await response.json();
            if (result.success && result.data) {
                // Ordenar por ordem alfabética de name
                const sortedFriends = result.data.sort((a, b) => a.name.localeCompare(b.name));
                setFriends(sortedFriends);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    }, [user, token, apiBase]);

    // 3. Fetch Friend Decks when selected
    const fetchFriendDecks = useCallback(async (friendId) => {
        if (!friendId) {
            setFriendDecks([]);
            return;
        }
        setLoadingFriendDecks(true);
        try {
            const response = await fetch(`${apiBase}/decks-by-user/simplified/${friendId}`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const result = await response.json();
            if (result.success && result.data) {
                setFriendDecks(result.data);
            }
        } catch (error) {
            console.error('Error fetching friend decks:', error);
        } finally {
            setLoadingFriendDecks(false);
        }
    }, [token, apiBase]);

    useEffect(() => {
        fetchUserDecks();
        fetchFriends();
    }, [fetchUserDecks, fetchFriends]);

    const handleFriendChange = (e) => {
        const newFriendId = e.target.value;
        setSelectedFriendId(newFriendId);
        // Reset selections related to previous friend
        setSelectedFriendDecks([]);
        fetchFriendDecks(newFriendId);
    };

    const toggleUserDeck = (deckId) => {
        setSelectedUserDecks(prev => {
            if (prev.includes(deckId)) {
                return prev.filter(id => id !== deckId);
            }
            return [...prev, deckId];
        });
    };

    const toggleFriendDeck = (deckId) => {
        setSelectedFriendDecks(prev => {
            if (prev.includes(deckId)) {
                return prev.filter(id => id !== deckId);
            }
            return [...prev, deckId];
        });
    };

    const handleCompare = () => {
        if (!user) return;

        // Persist localStorage as required:
        localStorage.setItem('mtg_compare_user_id', user.id || user._id);
        localStorage.setItem('mtg_compare_user_decks', JSON.stringify(selectedUserDecks));
        
        if (selectedFriendId) {
            localStorage.setItem('mtg_compare_friend_id', selectedFriendId);
            localStorage.setItem('mtg_compare_friend_decks', JSON.stringify(selectedFriendDecks));
        } else {
            localStorage.removeItem('mtg_compare_friend_id');
            localStorage.removeItem('mtg_compare_friend_decks');
        }

        // Just existing, placeholder for future redirection
        console.log('Dados salvos no localStorage prontos para comparação:');
        console.log('user_id:', localStorage.getItem('mtg_compare_user_id'));
        console.log('user_decks:', localStorage.getItem('mtg_compare_user_decks'));
        console.log('friend_id:', localStorage.getItem('mtg_compare_friend_id'));
        console.log('friend_decks:', localStorage.getItem('mtg_compare_friend_decks'));
        
        alert('Dados salvos no localStorage! (Botão Curinga preparado)');
    };

    const handleCompareAction = async () => {
        if (!user) return;
        
        const allSelectedIds = [...selectedUserDecks, ...selectedFriendDecks];
        if (allSelectedIds.length < 2) {
            alert('Por favor, selecione pelo menos 2 decks (seus ou de seus amigos) para comparar.');
            return;
        }

        setIsComparing(true);
        setComparisonResults([]); // Limpa resultados anteriores

        try {
            // Promisify all deck fetches
            const fetches = allSelectedIds.map(id => 
                fetch(`${apiBase}/decks-by-user/single/${id}`, {
                    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                }).then(res => res.json())
            );

            const responses = await Promise.all(fetches);
            
            // O(N) HashMap Engine
            const sharedCardsMap = new Map();

            for (const res of responses) {
                if (!res.success || !res.data) continue;
                const deck = res.data;
                const currentUserId = user.id || user._id;

                const isMine = deck.userId === currentUserId;
                const ownerName = isMine 
                    ? 'Você' 
                    : (friends.find(f => f.user_id === deck.userId)?.name || 'Amigo');
                
                const deckDisplayName = deck.deck_name || deck.deckName || 'Deck sem Nome';

                // Reduce deck cards combining quantities locally per deck, including sideboard
                const deckQuantities = new Map();
                const allCards = [...(deck.cards || []), ...(deck.sideboard || [])];

                for (const item of allCards) {
                    if (!item.card) continue;
                    const cardName = item.card.name;

                    if (!deckQuantities.has(cardName)) {
                        deckQuantities.set(cardName, {
                            quantity: 0,
                            art: item.card.image_uris?.small || item.card.image_uris?.normal || '',
                            cardObject: item.card
                        });
                    }
                    deckQuantities.get(cardName).quantity += (item.quantity || 1);
                }

                // Add to global shared cards map
                for (const [cardName, data] of deckQuantities.entries()) {
                    if (!sharedCardsMap.has(cardName)) {
                        sharedCardsMap.set(cardName, {
                            name: cardName,
                            art: data.art,
                            cardObject: data.cardObject,
                            appearances: []
                        });
                    }
                    sharedCardsMap.get(cardName).appearances.push({
                        ownerName,
                        deckName: deckDisplayName,
                        quantity: data.quantity
                    });
                }
            }

            // Filtragem das Instribuições (Apenas em mais de 1 Baralho)
            const intersections = Array.from(sharedCardsMap.values()).filter(c => c.appearances.length > 1);
            
            // Opcional: Ordenar alfabeticamente
            intersections.sort((a, b) => a.name.localeCompare(b.name));
            
            setComparisonResults(intersections);

        } catch (err) {
            console.error('Erro na engine de comparação:', err);
            alert('Falha ao comparar os decks. Tente novamente mais tarde.');
        } finally {
            setIsComparing(false);
        }
    };

    const handleClearSelection = () => {
        setSelectedUserDecks([]);
        setSelectedFriendDecks([]);
    };

    const filteredUserDecks = userDecks.filter(deck => 
        (deck.deck_name || deck.deckName || '').toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const filteredFriendDecks = friendDecks.filter(deck => 
        (deck.deck_name || deck.deckName || '').toLowerCase().includes(friendSearchQuery.toLowerCase())
    );

    const colorMap = {
        'W': 'white',
        'U': 'blue',
        'B': 'black',
        'R': 'red',
        'G': 'green'
    };

    const renderDeckItem = (deck, isSelected, toggleFn) => {
        const coverImage = deck.deck_cover_image || ''; 
        const colors = deck.color_identity || [];

        return (
            <label 
                key={deck.deck_by_user_id} 
                className={`view-compare__list-item ${isSelected ? 'view-compare__list-item--selected' : ''}`}
            >
                <input 
                    type="checkbox" 
                    className="view-compare__checkbox"
                    checked={isSelected}
                    onChange={() => toggleFn(deck.deck_by_user_id)}
                />
                
                {coverImage && (
                    <div 
                        className="view-compare__deck-box-mini" 
                        style={{ backgroundImage: `url(${coverImage})` }} 
                    />
                )}
                
                <div className="view-compare__deck-info">
                    <span className="view-compare__deck-name">{deck.deck_name || deck.deckName || 'Deck sem Nome'}</span>
                </div>

                <div className="view-compare__deck-colors">
                    {colors.sort().map(color => (
                        <span key={color} className={`mana-symbol mana-symbol--${colorMap[color] || color.toLowerCase()}`}>
                            {color}
                        </span>
                    ))}
                </div>
            </label>
        );
    };

    return (
        <div className="view-compare">
            <div className="view-compare__content">
                <header className="view-compare__header">
                    <Button variant="secondary" onClick={() => navigate('/home')} className="view-compare__back">
                        Voltar para Home
                    </Button>
                    <h1 className="view-compare__title">Comparar Decks</h1>
                </header>

                <div className="view-compare__columns">
                {/* Coluna 1: Meus Decks */}
                <div className="view-compare__column">
                    <h2 className="view-compare__column-title">Meus Decks</h2>
                    <input 
                        type="text" 
                        className="view-compare__search-input" 
                        placeholder="Pesquisar em Meus Decks..." 
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                    />
                    
                    {loadingUserDecks ? (
                        <div className="view-compare-loading">
                            <div>Carregando seus decks...</div>
                            <div className="global-spinner-container">
                                <div className="global-spinner"></div>
                            </div>
                        </div>
                    ) : userDecks.length === 0 ? (
                        <div className="view-compare-empty">Você não possui decks salvos.</div>
                    ) : filteredUserDecks.length === 0 ? (
                        <div className="view-compare-empty">Nenhum deck encontrado com este nome.</div>
                    ) : (
                        <div className="view-compare__list">
                            {filteredUserDecks.map(deck => {
                                const isSelected = selectedUserDecks.includes(deck.deck_by_user_id);
                                return renderDeckItem(deck, isSelected, toggleUserDeck);
                            })}
                        </div>
                    )}
                </div>

                {/* Coluna 2: Decks de Amigos */}
                <div className="view-compare__column">
                    <h2 className="view-compare__column-title">Decks de Meus amigos</h2>
                    {friends.length === 0 ? (
                        <div className="view-compare-empty">Você ainda não tem amigos adicionados.</div>
                    ) : (
                        <>
                            <select 
                                className="view-compare__friend-select"
                                value={selectedFriendId}
                                onChange={handleFriendChange}
                            >
                                <option value="">--- Selecione um amigo ---</option>
                                {friends.map(friend => (
                                    <option key={friend.user_id} value={friend.user_id}>
                                        {friend.name}
                                    </option>
                                ))}
                            </select>

                            {selectedFriendId && (
                                loadingFriendDecks ? (
                                    <div className="view-compare-loading">
                                        <div>Carregando decks do amigo...</div>
                                        <div className="global-spinner-container">
                                            <div className="global-spinner"></div>
                                        </div>
                                    </div>
                                ) : friendDecks.length === 0 ? (
                                    <div className="view-compare-empty">Este amigo não possui decks.</div>
                                ) : (
                                    <>
                                        <input 
                                            type="text" 
                                            className="view-compare__search-input" 
                                            placeholder="Pesquisar nos decks do amigo..." 
                                            value={friendSearchQuery}
                                            onChange={e => setFriendSearchQuery(e.target.value)}
                                        />
                                        {filteredFriendDecks.length === 0 ? (
                                            <div className="view-compare-empty">Nenhum deck encontrado com este nome.</div>
                                        ) : (
                                            <div className="view-compare__list">
                                                {filteredFriendDecks.map(deck => {
                                                    const isSelected = selectedFriendDecks.includes(deck.deck_by_user_id);
                                                    return renderDeckItem(deck, isSelected, toggleFriendDeck);
                                                })}
                                            </div>
                                        )}
                                    </>
                                )
                            )}
                        </>
                    )}
                </div>
            </div>

                <div className="view-compare__footer">
                    <Button variant="secondary" onClick={handleClearSelection} disabled={isComparing}>
                        Limpar seleção
                    </Button>
                    <Button variant="primary" onClick={handleCompareAction} isLoading={isComparing} disabled={isComparing}>
                        Comparar
                    </Button>
                </div>
            </div>

            {/* AREA DE RESULTADOS */}
            {comparisonResults && comparisonResults.length > 0 && (
                <div className="view-compare__results-section">
                    <h2 className="view-compare__results-title">
                        Cartas Compartilhadas ({comparisonResults.length})
                    </h2>
                    
                    <div className="view-compare__results-grid">
                        {comparisonResults.map(shared => (
                            <div key={shared.name} className="view-compare__shared-card">
                                <div 
                                    className="view-compare__shared-art" 
                                    style={{ backgroundImage: `url(${shared.art})` }}
                                    title={shared.name}
                                    onClick={() => setZoomedCard(shared.cardObject)}
                                />
                                <div className="view-compare__shared-info">
                                    <h3 className="view-compare__shared-name">{shared.name}</h3>
                                    <div className="view-compare__shared-appearances">
                                        {shared.appearances.map((app, idx) => (
                                            <div key={idx} className="view-compare__badge">
                                                <span className={`view-compare__badge-owner ${app.ownerName === 'Você' ? 'view-compare__badge-owner--you' : ''}`}>
                                                    {app.ownerName}
                                                </span>
                                                <span className="view-compare__badge-deck">{app.deckName}</span>
                                                <span className="view-compare__badge-qty">{app.quantity}x</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Mensagem quando comparar e não tiver colisão */}
            {!isComparing && (selectedUserDecks.length + selectedFriendDecks.length) >= 2 && comparisonResults.length === 0 && (
                null
            )}

            <CardPreviewModal 
                isOpen={!!zoomedCard} 
                card={zoomedCard} 
                onClose={() => setZoomedCard(null)} 
            />
        </div>
    );
};

export default CompareDecks;
