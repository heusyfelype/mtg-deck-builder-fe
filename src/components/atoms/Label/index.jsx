import React from 'react';
import './Label.css';

const Label = ({ children, htmlFor, className = '', required }) => {
    return (
        <label htmlFor={htmlFor} className={`atom-label ${className}`}>
            {children}
            {required && <span className="atom-label__required">*</span>}
        </label>
    );
};

export default Label;
