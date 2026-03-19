import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'medium', fullWidth, className = '', isLoading = false, ...props }) => {
    const classes = [
        'atom-button',
        `atom-button--${variant}`,
        `atom-button--${size}`,
        fullWidth ? 'atom-button--full-width' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} disabled={isLoading || props.disabled} {...props}>
            {isLoading ? (
                <div className="button-spinner-wrapper">
                    <div className="global-spinner button-spinner"></div>
                    {children}
                </div>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
