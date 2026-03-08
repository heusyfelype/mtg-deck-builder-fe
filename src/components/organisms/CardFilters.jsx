import React, { useState } from 'react';
import './CardFilters.css';
import Button from '../atoms/Button';

const CardFilters = ({ onSearch }) => {
    const [filters, setFilters] = useState({
        printed_name: '',
        cmc: '',
        color_identity: '',
        type_line: '',
        set_name: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Clean empty filters before sending and trim values
        const activeFilters = Object.fromEntries(
            Object.entries(filters)
                .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
                .filter(([_, v]) => v !== '')
        );
        onSearch(activeFilters);
    };

    const handleClear = () => {
        const emptyFilters = {
            printed_name: '',
            cmc: '',
            color_identity: '',
            type_line: '',
            set_name: ''
        };
        setFilters(emptyFilters);
        onSearch({});
    };

    return (
        <form className="card-filters" onSubmit={handleSubmit}>
            <div className="card-filters__group">
                <input
                    type="text"
                    name="printed_name"
                    placeholder="Nome do card"
                    value={filters.printed_name}
                    onChange={handleChange}
                    className="card-filters__input"
                />
                <input
                    type="text"
                    name="type_line"
                    placeholder="Tipo (Ex: Criatura)"
                    value={filters.type_line}
                    onChange={handleChange}
                    className="card-filters__input"
                />
                <input
                    type="number"
                    name="cmc"
                    placeholder="Custo (CMC)"
                    value={filters.cmc}
                    onChange={handleChange}
                    className="card-filters__input card-filters__input--small"
                />
                <input
                    type="text"
                    name="color_identity"
                    placeholder="Cores (Ex: R,U)"
                    value={filters.color_identity}
                    onChange={handleChange}
                    className="card-filters__input card-filters__input--small"
                />
                <input
                    type="text"
                    name="set_name"
                    placeholder="Coleção (Ex: Ice Age)"
                    value={filters.set_name}
                    onChange={handleChange}
                    className="card-filters__input"
                />
            </div>
            <div className="card-filters__actions">
                <Button type="submit" variant="primary">Buscar</Button>
                <Button type="button" variant="secondary" onClick={handleClear}>Limpar</Button>
            </div>
        </form>
    );
};

export default CardFilters;
