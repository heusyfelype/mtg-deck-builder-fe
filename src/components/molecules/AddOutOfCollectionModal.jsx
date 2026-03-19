import React, { useState } from 'react';
import './AddOutOfCollectionModal.css';
import Button from '../../components/atoms/Button';
import { getCardImage } from '../../utils/cardImageUtils';

const AddOutOfCollectionModal = ({ isOpen, onClose, outOfCollectionCards, onSave, isSaving = false }) => {
    const [selectedCards, setSelectedCards] = useState({});

    // Initialize/Reset selection when modal opens
    React.useEffect(() => {
        if (isOpen) {
            const initial = {};
            outOfCollectionCards.forEach(item => {
                initial[item.card.id] = true;
            });
            setSelectedCards(initial);
        }
    }, [isOpen, outOfCollectionCards]);

    if (!isOpen) return null;

    const handleToggle = (cardId) => {
        setSelectedCards(prev => ({
            ...prev,
            [cardId]: !prev[cardId]
        }));
    };

    const handleSave = () => {
        const selected = outOfCollectionCards.filter(item => selectedCards[item.card.id]);
        onSave(selected);
    };

    return (
        <div className="add-to-collection-modal__backdrop" onClick={onClose}>
            <div className="add-to-collection-modal__content" onClick={(e) => e.stopPropagation()}>
                <div className="add-to-collection-modal__header">
                    <h2>Adicionar cards à coleção</h2>
                    <p>Selecione os cards que você deseja adicionar permanentemente à sua coleção.</p>
                </div>

                <div className="add-to-collection-modal__list">
                    {outOfCollectionCards.map((item) => (
                        <div key={item.card.id} className="add-to-collection-modal__item">
                            <label className="add-to-collection-modal__label">
                                <input
                                    type="checkbox"
                                    checked={!!selectedCards[item.card.id]}
                                    onChange={() => handleToggle(item.card.id)}
                                />
                                <div className="add-to-collection-modal__card-info">
                                    <img
                                        src={getCardImage(item.card, 'small')}
                                        alt={item.card.name}
                                        className="add-to-collection-modal__card-img"
                                    />
                                    <div className="add-to-collection-modal__text">
                                        <span className="add-to-collection-modal__name">{item.card.name}</span>
                                        <span className="add-to-collection-modal__qty">Quantidade no deck: {item.added}</span>
                                    </div>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>

                <div className="add-to-collection-modal__footer">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={Object.values(selectedCards).every(v => !v)}
                        isLoading={isSaving}
                    >
                        Adicionar selecionados
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddOutOfCollectionModal;
