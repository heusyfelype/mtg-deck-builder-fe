import React from 'react';
import './Input.css';

const Input = ({ className = '', error, ...props }) => {
    const classes = [
        'atom-input',
        error ? 'atom-input--error' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <input className={classes} {...props} />
    );
};

export default Input;
