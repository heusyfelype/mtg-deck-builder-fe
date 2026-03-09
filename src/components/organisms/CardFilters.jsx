import React, { useState } from 'react';
import './CardFilters.css';
import Button from '../atoms/Button';

const CardFilters = ({ onSearch }) => {
    const [filters, setFilters] = useState({
        printed_name: '',
        cmc: '',
        type_line: '',
        set_name: ''
    });

    const [selectedColors, setSelectedColors] = useState([]);

    const colorMap = {
        'W': 'white',
        'U': 'blue',
        'B': 'black',
        'R': 'red',
        'G': 'green',
        'C': 'colorless'
    };

    const toggleColor = (color) => {
        setSelectedColors(prev => {
            if (color === 'C') {
                return prev.includes('C') ? [] : ['C'];
            } else {
                const filtered = prev.filter(c => c !== 'C');
                return filtered.includes(color)
                    ? filtered.filter(c => c !== color)
                    : [...filtered, color];
            }
        });
    };

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

        if (selectedColors.length > 0) {
            activeFilters.color_identity = selectedColors.join(',');
        }

        onSearch(activeFilters);
    };

    const handleClear = () => {
        setFilters({
            printed_name: '',
            cmc: '',
            type_line: '',
            set_name: ''
        });
        setSelectedColors([]);
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

                <div className="card-filters__color-picker">
                    {Object.keys(colorMap).map(color => (
                        <button
                            key={color}
                            type="button"
                            className={`mana-symbol mana-symbol--${colorMap[color]} ${selectedColors.includes(color) ? 'mana-symbol--active' : ''}`}
                            onClick={() => toggleColor(color)}
                            title={colorMap[color]}
                        >
                            {color}
                        </button>
                    ))}
                </div>

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
