import React from 'react';
import FieldConnect from './FieldConnect';
import ErrorField from './ErrorField';

const getDateString = (date = new Date()) => {
    const day = date.getDate();
    let month = date.getMonth();
    const year = date.getFullYear();
    if (month < 10) {
        if(month === 0) month += 1;
        month = `0${month}`;
    }
    return `${year}-${month}-${day}`;
};

const TextField = ({
    wrapperClassName,
    className,
    onChange,
    name,
    type = 'text',
    errors,
    error,
    value,
    label,
    placeholder,
    errorStyles = {}
}) => (
    <div className={wrapperClassName}>
        {label && <label>{label}</label>}
        <input
            type='date'
            name={name}
            onChange={(e) => onChange(new Date(e.target.value))}
            value={getDateString(value)}
            placeholder={placeholder}
            className={className}
        />
        {error && <ErrorField errors={errors} {...errorStyles} />}
    </div>
);

export default FieldConnect(TextField);