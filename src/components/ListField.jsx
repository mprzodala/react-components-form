import React from 'react';
import PropTypes from 'prop-types';
import Storage from './Storage';
import FieldConnect from './FieldConnect';

export class ListField extends React.Component {
    static defaultProps = {
        value: [],
    };

    static generateItemId() {
        return Math.random().toString(36).substring(7);
    }
    constructor(props, { getSchema }) {
        super(props);
        this.state = {
            schema: getSchema(props.name),
            model: this.getModelFromProps(props),
            validationErrors: {}
        };

        this.storage = new Storage(this.state.model);
        this.setModel = this.setModel.bind(this);
        this.getModel = this.getModel.bind(this);
        this.getList = this.getList.bind(this);
        this.addListElement = this.addListElement.bind(this);
        this.removeListElement = this.removeListElement.bind(this);
        this.getSchema = this.getSchema.bind(this);
        this.getValidationErrors = this.getValidationErrors.bind(this);
        this.setStateModel = this.setStateModel.bind(this);
    }

    componentWillReceiveProps({ value }) {
        let shouldSetState = false;
        value.forEach((item, key) => {
            if (!this.state.model[key] || item !== this.state.model[key].value) shouldSetState = true;
        });
        if (shouldSetState) this.storage.setModel(this.getModelFromProps({ value }));
    }

    componentWillMount() {
        this.storage.listen(this.setStateModel);
    }

    componentWillUnmount() {
        this.storage.unlisten(this.setStateModel);
    }

    setStateModel(model, callback) {
        this.setState({ model }, callback);
        this.props.onChange(model.map(item => item.value));
    }

    getModelFromProps(props) {
        if (props.value.length > 0) {
            return props.value.map(item => ({
                id: ListField.generateItemId(),
                value: item
            }));
        }
        return [];
    }

    setModel(name, value, callback) {
        const key = name.split('-')[1];
        const model = Array.from(this.state.model);
        model[parseInt(key)].value = value;
        this.storage.setModel(model, callback);
    }

    getModel(name) {
        const key = name.split('-')[1];
        return this.state.model[key].value;
    }

    getSchema() {
        return this.state.schema;
    }

    getValidationErrors(name) {
        const [fieldName, key] = name.split('-');
        const { getValidationErrors } = this.context;
        const validationErrors = getValidationErrors(fieldName);
        return validationErrors[parseInt(key)] || [];
    }

    getDefaultValueForListItem() {
        if (
            this.state.schema &&
            this.state.schema.type &&
            this.state.schema.type[0] &&
            typeof this.state.schema.type[0] === 'object' &&
            typeof this.state.schema.type[0].getDefaultValues === 'function'
        ) {
            return this.state.schema.type[0].getDefaultValues();
        }
        return undefined;
    }

    addListElement() {
        const model = Array.from(this.state.model);
        model.push({
            id: ListField.generateItemId(),
            value: this.getDefaultValueForListItem()
        });
        this.setState({ model });
    }

    removeListElement(key) {
        const model = Array.from(this.state.model);
        model.splice(key, 1);
        this.setState({ model });
        this.props.onChange(model.map(item => item.value));
    }

    isAddAllowed() {
        const { maxLength } = this.props;
        const { model } = this.state;
        if (typeof maxLength === 'number') return model.length < maxLength;
        return true;
    }

    isRemoveAllowed() {
        const { minLength } = this.props;
        const { model } = this.state;
        if (typeof minLength === 'number') return model.length > minLength;
        return true;
    }

    getChildContext() {
        return {
            setModel: this.setModel,
            getModel: this.getModel,
            getSchema: this.getSchema,
            getValidationErrors: this.getValidationErrors
        };
    }

    getList(children) {
        const {
            name,
            removeButton: {
                wrapperClassName,
                className,
                value
            } = {},
            hideRemoveButton,
            itemWrapperClassName,
        } = this.props;

        const isRemoveAllowed = this.isRemoveAllowed();

        return this.state.model.map((item, key) => {
            const child = React.cloneElement(children, {
                name: `${name}-${key}`,
                value: item.value,
                key: item.id
            });

            return (
                <div key={item.id} className={itemWrapperClassName}>
                    {child}
                    {!hideRemoveButton && isRemoveAllowed && <div className={wrapperClassName}>
                        <span
                            onClick={() => this.removeListElement(key)}
                            className={className}
                        >
                            {value || 'Remove'}
                        </span>
                    </div>}
                </div>
            );
        });
    }

    render() {
        const {
            children,
            className,
            wrapperClassName,
            label,
            addButton = {},
            hideAddButton,
            fieldAttributes
        } = this.props;

        const isAddAllowed = this.isAddAllowed();

        return (
            <div className={wrapperClassName}>
                {label && <label>{label}</label>}
                <div className={className} {...fieldAttributes}>{this.getList(children)}</div>
                {!hideAddButton && isAddAllowed && <span
                    onClick={this.addListElement}
                    className={addButton.className}
                >
                    {addButton.value || 'Add'}
                </span>}
            </div>
        );
    }
}

ListField.contextTypes = {
    getSchema: PropTypes.func,
    getValidationErrors: PropTypes.func
};

ListField.childContextTypes = {
    setModel: PropTypes.func,
    getModel: PropTypes.func,
    getSchema: PropTypes.func,
    getValidationErrors: PropTypes.func
};

ListField.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    itemWrapperClassName: PropTypes.string,
    label: PropTypes.string,
    addButton: PropTypes.shape({
        className: PropTypes.string,
        value: PropTypes.node
    }),
    removeButton: PropTypes.shape({
        wrapperClassName: PropTypes.string,
        className: PropTypes.string,
        value: PropTypes.node
    }),
    hideAddButton: PropTypes.bool,
    hideRemoveButton: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string,
    value: PropTypes.any,
    fieldAttributes: PropTypes.shape({}),
    minLength: PropTypes.number,
    maxLength: PropTypes.number,
};

export default FieldConnect(ListField);
