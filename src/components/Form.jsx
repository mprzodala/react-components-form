import React from 'react';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import Storage from './Storage';
import eventsEmitterEvents from '../constants/eventsEmitterEvents';

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            schema: props.schema,
            model: props.model || Form.getDefaultModelValue(props.schema),
            validationErrors: {},
            validateOnChange: props.validateOnChange,
            touchedFields: {},
            isFormSubmitted: false,
        };
        if (props.controller) {
            props.controller.setForm(this);
        }
        this.fieldsValidators = [];
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
        this.markFieldAsTouched = this.markFieldAsTouched.bind(this);
        this.hasBeenTouched = this.hasBeenTouched.bind(this);
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
            markFieldAsTouched: this.markFieldAsTouched,
            hasBeenTouched: this.hasBeenTouched,
            validateOnChange: this.state.validateOnChange,
            isFormSubmitted: this.state.isFormSubmitted,
            setValidator: this.setValidator,
            removeValidator: this.removeValidator,
        };
    }

    componentWillMount() {
        this.storage.listen(this.setStateModel);
        if (this.eventsEmitter) {
            this.eventsEmitter.listen(eventsEmitterEvents.SUBMIT, this.submitListener);
            this.eventsEmitter.listen(eventsEmitterEvents.VALIDATE, this.validateListener);
            this.eventsEmitter.listen(eventsEmitterEvents.RESET, this.resetListener);
        }
    }

    componentWillUnmount() {
        this.storage.unlisten(this.setStateModel);
        this.storage.setModel({});
        if (this.eventsEmitter) {
            this.eventsEmitter.unlisten(eventsEmitterEvents.SUBMIT, this.submitListener);
            this.eventsEmitter.unlisten(eventsEmitterEvents.VALIDATE, this.validateListener);
            this.eventsEmitter.unlisten(eventsEmitterEvents.RESET, this.resetListener);
        }
    }

    static getDefaultModelValue(schema) {
        if (schema && typeof schema.getDefaultValues === 'function') return schema.getDefaultValues();
        return {};
    }

    setStateModel(model, callback) {
        this.setState({ model }, callback);
    }

    setModel(name, value, callback) {
        const model = Object.assign({}, this.state.model);
        model[name] = value;
        this.storage.set(name, value, callback);
        if (this.state.validateOnChange) this.validateModel(model, this.state.schema);
    }

    getModel(name) {
        return this.state.model[name];
    }

    getSchema(name) {
        if (typeof this.state.schema.getField !== 'function') return {};
        return this.state.schema.getField(name);
    }

    setValidator = (path, validator) => {
        const index = this.findValidatorIndex(validator);
        if (index < 0) {
            const schemaValidator = (model, schema) => {
                const fieldValue = get(model, path);
                const validationResults = validator(model, fieldValue);
                if (validationResults && typeof validationResults === 'boolean') {
                    return;
                }
                schema.setModelError(path, validationResults);
            };
            this.fieldsValidators.push({ path, validator, schemaValidator });
            if (typeof this.state.schema.validate === 'function') {
                this.state.schema.addValidator(schemaValidator);
            }
        }
    };

    getValidationErrors(name) {
        return this.state.validationErrors[name] || {};
    }

    getAllValidationErrors() {
        return this.state.validationErrors;
    }

    getPath() {
        return this.props.id;
    }

    removeValidator = (validator) => {
        const index = this.findValidatorIndex(validator);
        if (index > -1) {
            const fieldValidator = this.fieldsValidators[index];
            if (typeof this.state.schema.validate === 'function') {
                this.state.schema.removeValidator(fieldValidator.schemaValidator);
            }
            this.fieldsValidators.splice(index, 1);
        }
    };

    findValidatorIndex = validator =>
        this.fieldsValidators.findIndex(fieldValidator => fieldValidator.validator === validator);

    submitListener() {
        return this.submitForm();
    }

    validateListener(schema) {
        return this.validateModel(this.storage.getModel(), schema || this.state.schema);
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
        this.setState({ validationErrors: validationResults, validateOnChange: true });
        return validationResults;
    }

    handleCustomValidation(validator, model) {
        const validationResults = validator(model);
        if (validationResults instanceof Promise) {
            return this.handlePromiseValidation(validationResults);
        }
        this.setState({ validationErrors: validationResults, validateOnChange: true });
        return validationResults;
    }

    handlePromiseValidation(validationResults) {
        return validationResults.then((validationErrors) => {
            this.setState({ validationErrors, validateOnChange: true });
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
        this.setState({ isFormSubmitted: true });
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
        const model = cloneDeep(modelData);
        if (Object.keys(validationErrors).length > 0) {
            if (this.eventsEmitter) {
                this.eventsEmitter.emit(
                    eventsEmitterEvents.ON_SUBMIT_ERROR,
                    { validationErrors, model },
                );
            }
            if (this.props.onError) this.props.onError(validationErrors, model);
            return undefined;
        }
        this.setState({ validateOnChange: false });
        if (this.eventsEmitter) {
            this.eventsEmitter.emit(eventsEmitterEvents.ON_SUBMIT_SUCCESS, model);
        }
        this.props.onSubmit(model);
        return model;
    }

    markFieldAsTouched(fieldPath) {
        if (!this.state.touchedFields[fieldPath]) {
            const touchedFields = Object.assign(
                {},
                this.state.touchedFields,
                { [fieldPath]: true },
            );
            this.setState({ touchedFields });
        }
    }

    hasBeenTouched(fieldPath) {
        if (!this.state.touchedFields[fieldPath]) {
            const keys = Object.keys(this.state.touchedFields);
            const matchedKey = keys.find(key => key.indexOf(fieldPath) > -1);
            return this.state.touchedFields[matchedKey];
        }
        return true;
    }

    render() {
        const { children, className, subform, id } = this.props;

        if (subform) {
            return (
                <div className={className}>
                    {children}
                </div>
            );
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
    markFieldAsTouched: PropTypes.func,
    hasBeenTouched: PropTypes.func,
    validateOnChange: PropTypes.bool,
    isFormSubmitted: PropTypes.bool,
    setValidator: PropTypes.func,
    removeValidator: PropTypes.func,
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
