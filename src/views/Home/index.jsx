import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button';
import DeckBox from '../../components/molecules/DeckBox';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [userDecks, setUserDecks] = useState([]);
    const [loadingDecks, setLoadingDecks] = useState(false);

    const fetchDecks = useCallback(async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;
        const token = localStorage.getItem('mtg_token');

        if (!userId) return;

        setLoadingDecks(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiBase}/decks-by-user/${userId}`, {
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
                                    key={deck._id || index}
                                    deck={deck}
                                    onClick={() => navigate(`/deck-editor/${deck._id || index}`)}
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
        </div>
    );
};

export default Home;
