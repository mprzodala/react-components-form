import React from 'react';
import PropTypes from 'prop-types';
import Storage from './Storage';
import { cloneObject } from '../helpers';

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            schema: props.schema,
            model: props.model || Form.getDefaultModelValue(props.schema),
            validationErrors: {},
            validateOnChange: props.validateOnChange,
        };

        this.controller = props.controller;
        this.storage = new Storage(this.state.model);
        this.eventsEmitter = props.eventsEmitter;
        this.setModel = this.setModel.bind(this);
        this.setStateModel = this.setStateModel.bind(this);
        this.getModel = this.getModel.bind(this);
        this.getSchema = this.getSchema.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.runSubmit = this.runSubmit.bind(this);
        this.getValidationErrors = this.getValidationErrors.bind(this);
        this.getAllValidationErrors = this.getAllValidationErrors.bind(this);
        this.getPath = this.getPath.bind(this);
        this.validateModel = this.validateModel.bind(this);
        this.submitListener = this.submitListener.bind(this);
        this.validateListener = this.validateListener.bind(this);
        this.resetListener = this.resetListener.bind(this);
        this.handleSchemaValidation = this.handleSchemaValidation.bind(this);
        this.handleCustomValidation = this.handleCustomValidation.bind(this);
        this.handlePromiseValidation = this.handlePromiseValidation.bind(this);

        if (this.controller) {
            this.controller.init(this);
        }
    }

    getChildContext() {
        return {
            setModel: this.setModel,
            getModel: this.getModel,
            getSchema: this.getSchema,
            submitForm: this.submitForm,
            getValidationErrors: this.getValidationErrors,
            getAllValidationErrors: this.getAllValidationErrors,
            getPath: this.getPath,
            eventsEmitter: this.eventsEmitter,
        };
    }

    componentWillMount() {
        this.storage.listen(this.setStateModel);
        if (this.eventsEmitter) {
            this.eventsEmitter.listen('submit', this.submitListener);
            this.eventsEmitter.listen('validate', this.validateListener);
            this.eventsEmitter.listen('reset', this.resetListener);
        }
    }

    componentWillUnmount() {
        this.storage.unlisten(this.setStateModel);
        this.storage.setModel({});
        if (this.eventsEmitter) {
            this.eventsEmitter.unlisten('submit', this.submitListener);
            this.eventsEmitter.unlisten('validate', this.validateListener);
            this.eventsEmitter.unlisten('reset', this.resetListener);
        }
    }

    static getDefaultModelValue(schema) {
        if (schema && typeof schema.getDefaultValues === 'function') {
            return schema.getDefaultValues();
        }
        return {};
    }

    setStateModel(model, callback) {
        this.setState({ model }, callback);
    }

    setModel(name, value, callback) {
        const model = Object.assign({}, this.state.model);
        model[name] = value;
        this.storage.set(name, value, callback);
        if (this.controller) {
            this.controller.model$.next(JSON.parse(JSON.stringify(model)));
        }
        if (this.state.validateOnChange) {
            this.validateModel(model, this.state.schema);
        }
    }

    getModel(name) {
        return this.state.model[name];
    }

    getSchema(name) {
        if (typeof this.state.schema.getField !== 'function') return {};
        return this.state.schema.getField(name);
    }

    getValidationErrors(name) {
        return this.state.validationErrors[name] || {};
    }

    getAllValidationErrors() {
        return this.state.validationErrors;
    }

    getPath() {
        return this.props.id;
    }

    submitListener() {
        return this.submitForm();
    }

    validateListener(schema) {
        return this.validateModel(
            this.storage.getModel(),
            schema || this.state.schema,
        );
    }

    resetListener(model) {
        const newModel = model || Form.getDefaultModelValue(this.state.schema);
        this.storage.setModel(newModel);
    }

    handleSchemaValidation(schema, model) {
        const validationResults = schema.validate(model);
        if (validationResults instanceof Promise) {
            return this.handlePromiseValidation(validationResults);
        }
        this.setState({
            validationErrors: validationResults,
            validateOnChange: true,
        });

        if (this.controller) {
            this.controller.errors$.next(validationResults);
        }
        return validationResults;
    }

    handleCustomValidation(validator, model) {
        const validationResults = validator(model);
        if (validationResults instanceof Promise) {
            return this.handlePromiseValidation(validationResults);
        }
        this.setState({
            validationErrors: validationResults,
            validateOnChange: true,
        });

        if (this.controller) {
            this.controller.errors$.next(validationResults);
        }
        return validationResults;
    }

    handlePromiseValidation(validationResults) {
        return validationResults.then((validationErrors) => {
            this.setState({ validationErrors, validateOnChange: true });

            if (this.controller) {
                this.controller.errors$.next(validationResults);
            }
            return validationErrors;
        });
    }

    validateModel(model, schema) {
        const { customValidation } = this.props;
        if (typeof schema.validate === 'function') {
            return this.handleSchemaValidation(schema, model);
        }
        if (typeof customValidation === 'function') {
            return this.handleCustomValidation(customValidation, model);
        }
        return {};
    }

    submitForm(event) {
        const model = Object.assign({}, this.state.model);
        const validationErrors = this.validateModel(model, this.state.schema);
        if (event) {
            event.preventDefault();
        }
        if (validationErrors instanceof Promise) {
            return validationErrors.then((errors) => {
                this.runSubmit(errors, model);
                return errors;
            });
        }
        return this.runSubmit(validationErrors, model);
    }

    runSubmit(validationErrors, modelData) {
        const model = cloneObject(modelData);
        if (Object.keys(validationErrors).length > 0) {
            if (this.props.onError) this.props.onError(validationErrors, model);
            return undefined;
        }
        this.setState({ validateOnChange: false });
        this.props.onSubmit(model);
        return model;
    }

    render() {
        const { children, className, subform, id } = this.props;

        if (subform) {
            return <div className={className}>{children}</div>;
        }
        return (
            <form onSubmit={this.submitForm} id={id} className={className}>
                {children}
            </form>
        );
    }
}

Form.childContextTypes = {
    setModel: PropTypes.func,
    getModel: PropTypes.func,
    getSchema: PropTypes.func,
    submitForm: PropTypes.func,
    getValidationErrors: PropTypes.func,
    getAllValidationErrors: PropTypes.func,
    getPath: PropTypes.func,
    eventsEmitter: PropTypes.shape({
        emit: PropTypes.func,
        registerEvent: PropTypes.func,
        listen: PropTypes.func,
        unregisterEvent: PropTypes.func,
        unlisten: PropTypes.func,
    }),
};

Form.propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    model: PropTypes.shape({}),
    schema: PropTypes.shape({}),
    onError: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    validateOnChange: PropTypes.bool,
    customValidation: PropTypes.func,
    subform: PropTypes.bool,
    children: PropTypes.node,
    eventsEmitter: PropTypes.shape({
        emit: PropTypes.func,
        registerEvent: PropTypes.func,
        listen: PropTypes.func,
        unregisterEvent: PropTypes.func,
        unlisten: PropTypes.func,
    }),
    controller: PropTypes.shape({
        init: PropTypes.func,
        setForm: PropTypes.func,
        getFrom: PropTypes.func,
        getErrors: PropTypes.func,
        setSchema: PropTypes.func,
        getSchema: PropTypes.func,
        setFieldValue: PropTypes.func,
        getFieldValue: PropTypes.func,
    }),
};

Form.defaultProps = {
    id: 'form',
    className: '',
    model: undefined,
    schema: {},
    onError: undefined,
    validateOnChange: false,
    customValidation: undefined,
    subform: false,
    children: '',
    eventsEmitter: undefined,
    controller: undefined,
};

export default Form;
