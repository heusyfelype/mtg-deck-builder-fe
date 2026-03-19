import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button';
import DeckBox from '../../components/molecules/DeckBox';
import ConfirmModal from '../../components/molecules/ConfirmModal';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [userDecks, setUserDecks] = useState([]);
    const [loadingDecks, setLoadingDecks] = useState(false);

    // Delete states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deckToDelete, setDeckToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDecks = useCallback(async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;
        const token = localStorage.getItem('mtg_token');

        if (!userId) return;

        setLoadingDecks(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/decks-by-user/simplified/${userId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();

            if (result.success && result.data) {
                setUserDecks(result.data);
            }
        } catch (error) {
            console.error('Error fetching decks:', error);
        } finally {
            setLoadingDecks(false);
        }
    }, []);

    // Friends list (for checkbox)
    const [showFriends, setShowFriends] = useState(false);
    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [friendsPage, setFriendsPage] = useState(1);
    const friendsPageSize = 6;

    // Friend decks states
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendDecks, setFriendDecks] = useState([]);
    const [loadingFriendDecks, setLoadingFriendDecks] = useState(false);

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
                setFriends(result.data);
                setFriendsPage(1);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoadingFriends(false);
        }
    }, []);

    const fetchFriendDecks = async (friendId) => {
        const token = localStorage.getItem('mtg_token');
        setLoadingFriendDecks(true);

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/decks-by-user/simplified/${friendId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
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
    };

    const handleFriendClick = (friend) => {
        if (selectedFriend?.user_id === friend.user_id) {
            setSelectedFriend(null);
            setFriendDecks([]);
            return;
        }

        setSelectedFriend(friend);
        fetchFriendDecks(friend.user_id);
    };

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

    useEffect(() => {
        if (showFriends) {
            fetchFriends();
        }
    }, [showFriends, fetchFriends]);

    const handleLogout = () => {
        localStorage.removeItem('mtg_token');
        localStorage.removeItem('mtg_user');
        navigate('/login');
    };

    const openDeleteModal = (deck) => {
        setDeckToDelete(deck);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeckToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deckToDelete) return;

        const token = localStorage.getItem('mtg_token');
        setIsDeleting(true);

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/decks-by-user`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ ids: deckToDelete.deck_by_user_id })
            });

            const result = await response.json();

            if (result.success) {
                // Refresh decks after deletion
                await fetchDecks();
                closeDeleteModal();
            } else {
                alert('Erro ao excluir deck: ' + (result.message || 'Desconhecido'));
            }
        } catch (error) {
            console.error('Error deleting deck:', error);
            alert('Erro de conexão ao excluir deck');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="view-home">
            <div className="view-home__content">
                <header className="view-home__header">
                    <h1 className="view-home__title">Bem vindo ao seu deck builder</h1>
                    <p className="view-home__subtitle">Sua jornada mágica começa aqui.</p>
                </header>

                <div className="view-home__actions">
                    <Button variant="primary" onClick={() => navigate('/collection')}>
                        Adicione cards à sua coleção
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/deck-builder')}>
                        Criar Novo Deck
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/compare-decks')}>
                        Comparar Decks
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/friends')}>
                        Gerenciar Amizades
                    </Button>
                    <Button variant="secondary" onClick={handleLogout}>
                        Sair
                    </Button>
                </div>

                <section className="view-home__decks-section">

                    <div className="view-home__section-header">
                        <h2 className="view-home__section-title">Seus Decks</h2>
                        <span className="view-home__deck-count">{userDecks.length} Decks</span>
                    </div>

                    {loadingDecks ? (
                        <div className="view-home__decks-loading">
                            <div>Carregando seus decks...</div>
                            <div className="global-spinner-container">
                                <div className="global-spinner"></div>
                            </div>
                        </div>
                    ) : userDecks.length > 0 ? (
                        <div className="view-home__decks-grid">
                            {userDecks.map((deck, index) => (
                                <DeckBox
                                    key={deck.deck_by_user_id || index}
                                    deck={deck}
                                    onClick={() => navigate(`/deck-editor/${deck.deck_by_user_id || index}`)}
                                    onDelete={openDeleteModal}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="view-home__decks-empty">
                            Você ainda não possui nenhum deck salvo. Comece agora!
                        </div>
                    )}
                </section>

                <div className="view-home__friends-toggle">
                    <label>
                        <input
                            type="checkbox"
                            checked={showFriends}
                            onChange={(e) => setShowFriends(e.target.checked)}
                        />{' '}
                        Ver decks de meus amigos
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
                                        {friends.slice((friendsPage - 1) * friendsPageSize, friendsPage * friendsPageSize).map(f => (
                                            <div
                                                key={f.user_id}
                                                className="friends-list__item"
                                                onClick={() => handleFriendClick(f)}
                                            >
                                                <span className={`friends-list__friend-badge ${selectedFriend?.user_id === f.user_id ? 'active' : ''}`}>{f.name}</span>
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
                                        <span className="friends-list__pager-info">{friendsPage} / {Math.max(1, Math.ceil(friends.length / friendsPageSize))}</span>
                                        <button
                                            className="friends-list__pager-btn"
                                            onClick={() => setFriendsPage(p => Math.min(Math.ceil(friends.length / friendsPageSize), p + 1))}
                                            disabled={friendsPage >= Math.ceil(friends.length / friendsPageSize)}
                                        >
                                            ▶
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="friends-list__empty">Você não possui amigos para mostrar.</div>
                            )}
                        </div>
                    )}
                </div>

                {showFriends && selectedFriend && (
                    <section className="view-home__decks-section view-home__decks-section--friends">
                        <div className="view-home__section-header">
                            <h2 className="view-home__section-title">Decks de {selectedFriend.name}</h2>
                            <span className="view-home__deck-count">{friendDecks.length} Decks</span>
                        </div>


                        {loadingFriendDecks ? (
                            <div className="view-home__decks-loading">
                                <div>Carregando decks de {selectedFriend.name}...</div>
                                <div className="global-spinner-container">
                                    <div className="global-spinner"></div>
                                </div>
                            </div>
                        ) : friendDecks.length > 0 ? (
                            <div className="view-home__decks-grid">
                                {friendDecks.map((deck, index) => (
                                    <DeckBox
                                        key={deck.deck_by_user_id || index}
                                        deck={deck}
                                        onClick={() => navigate(`/deck-editor/${deck.deck_by_user_id || index}`)}
                                        readOnly={true}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="view-home__decks-empty">
                                {selectedFriend.name} ainda não possui nenhum deck publicado.
                            </div>
                        )}
                    </section>
                )}
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteConfirm}
                title="Excluir Deck"
                message={`O deck ${deckToDelete?.deck_name || deckToDelete?.deckName} será excluído. Deseja continuar?`}
            />
        </div>
    );
};

export default Home;
