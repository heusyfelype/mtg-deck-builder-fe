import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button';
import CardFilters from '../../components/organisms/CardFilters';
import CardHorizontalList from '../../components/organisms/CardHorizontalList';
import CardPreviewModal from '../../components/molecules/CardPreviewModal';
import './Collection.css';

const Collection = () => {
    const navigate = useNavigate();

    // Accumulated cards across all pages (infinite scroll)
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // To prevent fetching the same page twice (e.g. during re-renders)
    const currentFetchRef = useRef({ filters: {}, page: 0 });

    // Manage current filters applied by user
    const [currentFilters, setCurrentFilters] = useState({});

    // State for zoomed card modal
    const [zoomedCard, setZoomedCard] = useState(null);

    // Manage the draft state to save in localStorage
    const [draft, setDraft] = useState(() => {
        const savedDraft = localStorage.getItem('mtg_collection_draft');
        return savedDraft ? JSON.parse(savedDraft) : {};
    });

    // Save to local storage whenever draft state changes
    useEffect(() => {
        localStorage.setItem('mtg_collection_draft', JSON.stringify(draft));
    }, [draft]);

    const fetchCards = useCallback(async (filtersToApply, currentPage) => {
        // Prevent duplicate calls for the same page+filters
        const key = JSON.stringify(filtersToApply) + currentPage;
        if (currentFetchRef.current.key === key) return;
        currentFetchRef.current.key = key;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: limit,
                ...filtersToApply
            });

            const response = await fetch(`http://localhost:4000/api/cards?${params.toString()}`);
            const result = await response.json();

            if (result.success && result.data && result.data.cards) {
                if (currentPage === 1) {
                    // New search — replace cards
                    setCards(result.data.cards);
                } else {
                    // Infinite scroll — append cards
                    setCards(prev => [...prev, ...result.data.cards]);
                }
                setTotalPages(result.data.pagination.totalPages);
            } else if (currentPage === 1) {
                setCards([]);
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
            if (currentPage === 1) setCards([]);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Fetch every time page or filters change
    useEffect(() => {
        fetchCards(currentFilters, page);
    }, [fetchCards, currentFilters, page]);

    const handleSearch = (filters) => {
        currentFetchRef.current.key = null; // Allow re-fetch
        setCards([]);
        setPage(1);
        setCurrentFilters(filters);
    };

    // Called by CardHorizontalList sentinel
    const handleLoadMore = useCallback(() => {
        if (!loading && page < totalPages) {
            currentFetchRef.current.key = null; // Allow next page
            setPage(p => p + 1);
        }
    }, [loading, page, totalPages]);

    const handleAddCard = (card) => {
        setDraft(prev => {
            const existing = prev[card.id] || { added: 0, current: 0, card };
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
        setDraft(prev => {
            const existing = prev[card.id];
            if (!existing || existing.added <= 0) return prev;
            const newAdded = existing.added - 1;
            if (newAdded === 0 && existing.current === 0) {
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

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const savedUser = localStorage.getItem('mtg_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id || user?._id;

        if (!userId) {
            alert('Você precisa estar logado para salvar sua coleção.');
            return;
        }

        // Build the payload: one object per user with all their cards
        const cards = Object.entries(draft)
            .filter(([, item]) => item.added > 0)
            .map(([cardId, item]) => ({ cardId, quantity: item.added }));

        if (cards.length === 0) {
            alert('Nenhum card foi adicionado para salvar.');
            return;
        }

        const payload = [{ userId, cards }];

        setSaving(true);
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            const token = localStorage.getItem('mtg_token');
            const response = await fetch(`${apiBase}/cards-by-user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                // Only clear the session's card draft — keep user auth data intact
                localStorage.removeItem('mtg_collection_draft');
                setDraft({});
                navigate('/home');
            } else {
                alert(`Erro ao salvar: ${result.message || 'Tente novamente.'}`);
            }
        } catch (error) {
            console.error('Erro ao salvar coleção:', error);
            alert('Erro de comunicação com o servidor. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };


    const totalAdded = Object.values(draft).reduce((acc, curr) => acc + curr.added, 0);
    const hasMore = page < totalPages;

    return (
        <div className="view-collection">
            <div className="view-collection__header">
                <div>
                    <h1>Sua Coleção Geral</h1>
                    <p>Adicione cards à coleção buscando pelo nome, tipo, custo ou coleção.</p>
                </div>
                <div className="view-collection__header-actions">
                    <Button variant="secondary" onClick={() => navigate('/home')}>
                        Voltar para Home
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={totalAdded === 0 || saving}
                    >
                        {saving ? 'Salvando...' : `Salvar Alterações ${totalAdded > 0 ? `(+${totalAdded})` : ''}`}
                    </Button>
                </div>
            </div>

            <div className="view-collection__filters">
                <CardFilters onSearch={handleSearch} />
            </div>

            <div className="view-collection__content">
                <CardHorizontalList
                    cards={cards}
                    collectionDraft={draft}
                    onAddCard={handleAddCard}
                    onRemoveCard={handleRemoveCard}
                    loading={loading}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    onImageClick={setZoomedCard}
                />
            </div>

            {/* Modal for Card Previews */}
            <CardPreviewModal
                isOpen={!!zoomedCard}
                card={zoomedCard}
                onClose={() => setZoomedCard(null)}
            />
        </div>
    );
};

export default Collection;
