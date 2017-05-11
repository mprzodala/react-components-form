import React, { PropTypes } from 'react';
import FieldConnect from './FieldConnect';
import ErrorField from './ErrorField';
import classnames from 'classnames';

export class CheckboxField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            checked: props.value || false,
            value: props.checkboxValue || true
        };
        this.toggleValue = this.toggleValue.bind(this);
    }

    toggleValue() {
        let value = !this.state.checked ? this.state.value : undefined;
        if (!value && this.props.type.name === 'Boolean') value = false;
        this.setState({
            checked: !this.state.checked
        });
        this.props.onChange(value);
    }

    render() {
        const {
            wrapperClassName,
            className,
            labelClassName,
            name,
            errors,
            error,
            label,
            errorStyles = {},
            fieldAttributes = {}
        } = this.props;
        return (
            <div className={classnames(wrapperClassName, error && errorStyles.fieldClassName)}>
                <label className={labelClassName}>
                    <input
                        type="checkbox"
                        checked={this.state.checked}
                        name={name}
                        onChange={this.toggleValue}
                        className={className}
                        {...fieldAttributes}
                    />
                    {label}
                </label>
                {error && <ErrorField errors={errors} {...errorStyles} />}
            </div>
        );
    }
}

CheckboxField.propTypes = {
    wrapperClassName: PropTypes.string,
    className: PropTypes.string,
    labelClassName: PropTypes.string,
    name: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    errors: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
        PropTypes.string,
        PropTypes.shape({})
    ]),
    error: PropTypes.bool,
    value: PropTypes.any,
    checkboxValue: PropTypes.any,
    label: PropTypes.string,
    errorStyles: PropTypes.shape({
        className: PropTypes.string,
        itemClassName: PropTypes.string
    }),
    fieldAttributes: PropTypes.shape({})
};

export default FieldConnect(CheckboxField);