import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'medium', fullWidth, className = '', ...props }) => {
    const classes = [
        'atom-button',
        `atom-button--${variant}`,
        `atom-button--${size}`,
        fullWidth ? 'atom-button--full-width' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
};

export default Button;
