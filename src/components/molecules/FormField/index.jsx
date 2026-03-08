import React from 'react';
import Label from '../../atoms/Label';
import Input from '../../atoms/Input';
import './FormField.css';

const FormField = ({ label, id, error, required, ...inputProps }) => {
    return (
        <div className="molecule-form-field">
            {label && <Label htmlFor={id} required={required}>{label}</Label>}
            <Input id={id} error={!!error} {...inputProps} />
            {error && <span className="molecule-form-field__error">{error}</span>}
        </div>
    );
};

export default FormField;
