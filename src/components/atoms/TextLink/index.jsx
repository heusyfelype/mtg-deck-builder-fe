import React from 'react';
import { Link } from 'react-router-dom';
import './TextLink.css';

const TextLink = ({ children, to, className = '', ...props }) => {
    return (
        <Link to={to} className={`atom-text-link ${className}`} {...props}>
            {children}
        </Link>
    );
};

export default TextLink;
