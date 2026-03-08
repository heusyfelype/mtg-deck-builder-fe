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

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

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
                        <div className="view-home__decks-loading">Carregando seus decks...</div>
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
