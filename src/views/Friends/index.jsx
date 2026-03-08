import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button';
import './Friends.css';

const Friends = () => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [loadingPending, setLoadingPending] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);

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
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoadingFriends(false);
        }
    }, []);

    const fetchPendingInvites = useCallback(async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;
        const token = localStorage.getItem('mtg_token');

        if (!userId) return;

        setLoadingPending(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/friend-invites/pending/${userId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();

            if (result.success && result.data) {
                setPendingInvites(result.data);
            }
        } catch (error) {
            console.error('Error fetching pending invites:', error);
        } finally {
            setLoadingPending(false);
        }
    }, []);

    useEffect(() => {
        fetchFriends();
        fetchPendingInvites();
    }, [fetchFriends, fetchPendingInvites]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        const token = localStorage.getItem('mtg_token');
        setLoadingSearch(true);

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/users/search?filter=${searchQuery}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();

            if (result.success && result.data) {
                // Filter out current user and already friends
                const savedUser = localStorage.getItem('mtg_user');
                const currentUser = savedUser ? JSON.parse(savedUser) : null;
                const currentUserId = currentUser?.id || currentUser?._id;

                const filteredResults = result.data.users.filter(u =>
                    (u.id || u._id) !== currentUserId &&
                    !friends.some(f => f.user_id === (u.id || u._id))
                );
                setSearchResults(filteredResults);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleInvite = async (receiverId) => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const senderId = user?.id || user?._id;
        const token = localStorage.getItem('mtg_token');

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/friend-invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    invite_sender_id: senderId,
                    invite_receiver_id: receiverId
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Convite enviado com sucesso!');
                setSearchResults(prev => prev.filter(u => (u.id || u._id) !== receiverId));
            } else {
                alert(result.message || 'Erro ao enviar convite');
            }
        } catch (error) {
            console.error('Error sending invite:', error);
            alert('Erro ao enviar convite');
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (!window.confirm('Deseja realmente remover este amigo?')) return;

        const token = localStorage.getItem('mtg_token');

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/friends/${friendId}`, {
                method: 'DELETE',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            const result = await response.json();
            if (result.success) {
                setFriends(prev => prev.filter(f => f.user_id !== friendId));
            } else {
                alert(result.message || 'Erro ao remover amigo');
            }
        } catch (error) {
            console.error('Error removing friend:', error);
            alert('Erro ao remover amigo');
        }
    };

    const handleRespondInvite = async (inviteId, status) => {
        const token = localStorage.getItem('mtg_token');

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/friend-invites/respond`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ inviteId, status })
            });

            const result = await response.json();
            if (result.success) {
                // Refresh lists
                await fetchFriends();
                await fetchPendingInvites();
            } else {
                alert(result.message || 'Erro ao responder convite');
            }
        } catch (error) {
            console.error('Error responding to invite:', error);
            alert('Erro ao responder convite');
        }
    };

    return (
        <div className="view-friends">
            <div className="view-friends__content">
                <header className="view-friends__header">
                    <Button variant="secondary" onClick={() => navigate('/home')} className="view-friends__back">
                        Voltar para Home
                    </Button>
                    <h1 className="view-friends__title">Gerenciar Amizades</h1>
                    <p className="view-friends__subtitle">Conecte-se com outros jogadores.</p>
                </header>

                <div className="view-friends__sections">
                    <section className="view-friends__section">
                        <h2 className="view-friends__section-title">Seus Amigos</h2>

                        {pendingInvites.length > 0 && (
                            <div className="view-friends__pending-invites">
                                <h3 className="view-friends__subsection-title">Solicitações Pendentes</h3>
                                {pendingInvites.map(invite => (
                                    <div key={invite._id} className="view-friends__card view-friends__card--pending">
                                        <div className="view-friends__card-info">
                                            <span className="view-friends__card-name">{invite.sender_name || 'Usuário'}</span>
                                            <span className="view-friends__card-email">Quer ser seu amigo</span>
                                        </div>
                                        <div className="view-friends__card-actions">
                                            <Button variant="primary" onClick={() => handleRespondInvite(invite._id, 2)}>
                                                Aceitar
                                            </Button>
                                            <Button variant="secondary" onClick={() => handleRespondInvite(invite._id, 3)}>
                                                Recusar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {loadingFriends ? (
                            <div className="view-friends__loading">Carregando amigos...</div>
                        ) : friends.length > 0 ? (
                            <div className="view-friends__list">
                                {friends.map(friend => (
                                    <div key={friend.user_id} className="view-friends__card">
                                        <div className="view-friends__card-info">
                                            <span className="view-friends__card-name">{friend.name}</span>
                                        </div>
                                        <Button variant="secondary" onClick={() => handleRemoveFriend(friend.user_id)}>
                                            Remover
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="view-friends__empty">Você ainda não possui amigos.</div>
                        )}
                    </section>

                    <section className="view-friends__section">
                        <h2 className="view-friends__section-title">Adicionar Amigos</h2>
                        <form className="view-friends__search-form" onSubmit={handleSearch}>
                            <input
                                type="text"
                                className="view-friends__search-input"
                                placeholder="Buscar por nome ou e-mail..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button variant="primary" type="submit" disabled={loadingSearch}>
                                {loadingSearch ? 'Buscando...' : 'Buscar'}
                            </Button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="view-friends__results">
                                {searchResults.map(user => (
                                    <div key={user.id || user._id} className="view-friends__card">
                                        <div className="view-friends__card-info">
                                            <span className="view-friends__card-name">{user.name}</span>
                                            <span className="view-friends__card-email">{user.email}</span>
                                        </div>
                                        <Button variant="primary" onClick={() => handleInvite(user.id || user._id)}>
                                            Adicionar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!loadingSearch && searchQuery && searchResults.length === 0 && (
                            <div className="view-friends__empty">Nenhum usuário encontrado ou já são seus amigos.</div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Friends;
