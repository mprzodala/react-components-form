import React from 'react';
import { mount } from 'enzyme';
import Schema from 'form-schema-validation';
import {
    Form,
    TextField,
    NumberField,
    SubmitField,
    ObjectField,
    FormEventsEmitter
} from '../../src/components';
import { titleSchema, titleSchema2 } from '../data/schemas';


describe('Form', () => {
    jest.useFakeTimers();

    it('should run error method from props',() => {
        const loginSchema = new Schema({
            login:{
                type: String,
                required: true
            },
            password: {
                type: String,
                required: true
            }
        });

        const mockSubmit = jest.fn();
        const mockError = jest.fn();

        const wrapper = mount(
            <Form
                schema={loginSchema}
                onError={mockError}
                onSubmit={mockSubmit}
            >
                <TextField name="login" label="Login" type="text" />
                <TextField name="password" label="Password" type="text" />
                <SubmitField value="Login" />
            </Form>
        );
        const fieldSubmit = wrapper.find(SubmitField);
        fieldSubmit.find('button').simulate('click');
        expect(mockError.mock.calls.length).toBe(1);
    });

    it('return all validation errors from form', () => {
        const loginSchema = new Schema({
            login:{
                type: String,
                required: true
            },
            password: {
                type: String,
                required: true
            }
        });

        const mockSubmit = jest.fn();
        const mockError = jest.fn();

        const wrapper = mount(
            <Form
                schema={loginSchema}
                onError={mockError}
                onSubmit={mockSubmit}
            >
                <TextField name="login" label="Login" type="text" />
                <TextField name="password" label="Password" type="text" />
                <SubmitField value="Login" />
            </Form>
        );
        const fieldSubmit = wrapper.find(SubmitField);
        fieldSubmit.find('button').simulate('click');
        const errors = wrapper.instance().getAllValidationErrors();
        expect(Object.keys(errors).length).toBe(2);
    });

    it('should support schema promise validation', () => {
        const asyncValidator = () => ({
            validator(value) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(value === 'test');
                    }, 1000);
                });
            },
            errorMessage: `async validation failed`
        });


        const loginSchema = new Schema({
            login:{
                type: String,
                validators: [asyncValidator()]
            },
            password: {
                type: String
            }
        });

        const onSubmit = () => {};


        const wrapper = mount(
            <Form
                schema={loginSchema}
                onSubmit={onSubmit}
            >
                <TextField name="login" label="Login" type="text" />
                <TextField name="password" label="Password" type="text" />
                <SubmitField value="Login" />
            </Form>
        );
        const results = wrapper.instance().validateModel({ login: 'test2', password: ''}, loginSchema);
        jest.runOnlyPendingTimers();
        return results.then((errors) => {
            expect(errors).toEqual({login: ['async validation failed']});
        });

    });

    it('should support customValidation promise validation', () => {
        const validator = () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({login: ['async validation failed']});
                }, 1000);
            });
        };

        const onSubmit = () => {};

        const wrapper = mount(
            <Form
                customValidation={validator}
                onSubmit={onSubmit}
            >
                <TextField name="login" label="Login" type="text" />
                <TextField name="password" label="Password" type="text" />
                <SubmitField value="Login" />
            </Form>
        );
        const results = wrapper.instance().validateModel({ login: 'test2', password: ''}, {});
        jest.runOnlyPendingTimers();
        return results.then((errors) => {
            expect(errors).toEqual({login: ['async validation failed']});
        });
    });

    it('should support promise validation', () => {
        const validator = () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({login: ['async validation failed']});
                }, 1000);
            });
        };

        const onSubmit = () => {};

        const wrapper = mount(
            <Form
                customValidation={validator}
                onSubmit={onSubmit}
            >
                <TextField name="login" label="Login" type="text" />
                <TextField name="password" label="Password" type="text" />
                <SubmitField value="Login" />
            </Form>
        );
        const results = wrapper.instance().submitForm();
        jest.runOnlyPendingTimers();
        return results.then((errors) => {
            expect(errors).toEqual({login: ['async validation failed']});
        });
    });

    it('should have hasValidationError and return undefined if dont have onError method from props',() => {
        const loginSchema = new Schema({
            login:{
                type: String,
                required: true
            },
            password: {
                type: String,
                required: true
            }
        });

        const mockSubmit = jest.fn();

        const wrapper = mount(
            <Form
                schema={loginSchema}
                onSubmit={mockSubmit}
            >
                <TextField name="login" label="Login" type="text" />
                <TextField name="password" label="Password" type="text" />
                <SubmitField value="Login" />
            </Form>
        );
        const fieldSubmit = wrapper.find(SubmitField);
        fieldSubmit.find('button').simulate('click');
        expect(mockSubmit.mock.calls.length).toBe(0);
    });

    it('should run submit method from props',() => {
        const loginSchema = new Schema({
            login:{
                type: String,
                required: true
            },
            password: {
                type: String,
                required: true
            }
        });

        const mockSubmit = jest.fn();
        const model = {
            login: 'testLogin',
            password: 'testPassword'
        };

        const wrapper = mount(
            <Form
                schema={loginSchema}
                onSubmit={mockSubmit}
                model={model}
            >
                <TextField name="login" label="Login" type="text" />
                <TextField name="password" label="Password" type="text" />
                <SubmitField value="Login" />
            </Form>
        );
        const fieldSubmit = wrapper.find(SubmitField);
        fieldSubmit.find('button').simulate('click');
        expect(mockSubmit.mock.calls.length).toBe(1);

        mockSubmit.mockClear();

        const formComponent = wrapper.find(Form);
        formComponent.find('form').simulate('submit', { preventDefault: jest.fn() });
        expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    it('should update model on field value change',() => {
        const wrapper = mount(
            <Form
                onSubmit={({quantity}) => expect(quantity).toBe(12)}
            >
                <NumberField name="quantity" label="Quantity" />
                <SubmitField value="Submit" />
            </Form>
        );
        const fieldSubmit = wrapper.find(SubmitField);
        const fieldQuantity = wrapper.find(NumberField);
        fieldQuantity.find('input').simulate('change', {target: {value: 12}});
        fieldSubmit.find('button').simulate('click');
    });

    it('should validate model by custom validation',() => {
        const mockCustomValidation = jest.fn();
        const wrapper = mount(
            <Form
                onSubmit={({title}) => expect(title).toBe('test')}
                customValidation={model => {mockCustomValidation(model); return {}}}
                validateOnChange
            >
                <TextField name="title" label="Title" />
            </Form>
        );
        const fieldTitle = wrapper.find(TextField);
        fieldTitle.find('input').simulate('change', {target: {value: 'test'}});
        expect(mockCustomValidation.mock.calls.length).toBe(1);
    });

    it('should submit form from eventEmitter and run onModelChangeListeners',() => {
        const mockSubmit = jest.fn();
        const mockOnChangeModel = jest.fn();
        const onModelChange = ({ name, value }, componentInstance) => {
            expect(name).toBe('form.title');
            expect(value).toBe('test');
            expect(componentInstance.getPath()).toBe('form.description');
            mockOnChangeModel();
        };
        const eventsEmitter = new FormEventsEmitter();
        const TestComponent = () => {
            return (
                <div>
                    <Form
                        onSubmit={() => mockSubmit()}
                        eventsEmitter={eventsEmitter}
                    >
                        <TextField name="title" label="Title" />
                        <TextField
                            name="description"
                            label="Description"
                            onModelChange={onModelChange}
                        />
                    </Form>
                    <button className="testValidate" onClick={() => eventsEmitter.emit('validate')}>Outside validate</button>
                    <button className="testSubmit" onClick={() => eventsEmitter.emit('submit')}>Outside submit</button>
                </div>
            );
        };
        const wrapper = mount(<TestComponent />);
        const fieldTitle = wrapper.find(TextField);
        fieldTitle.find('input').first().simulate('change', {target: {value: 'test'}});
        wrapper.find('.testValidate').first().simulate('click');
        wrapper.find('.testSubmit').first().simulate('click');
        expect(mockSubmit.mock.calls.length).toBe(1);
        expect(mockOnChangeModel.mock.calls.length).toBe(1);
        wrapper.unmount();
        expect(eventsEmitter.listeners.modelChange.length).toBe(0);
    });

    it('should submit form by default form submit',() => {
        const mockSubmit = jest.fn();
        const wrapper = mount(
            <Form
                onSubmit={mockSubmit}
            >
                <TextField name="title" label="Title" />
            </Form>
        );
        const formElement = wrapper.find('form');
        formElement.simulate('submit');
        wrapper.unmount();
        expect(mockSubmit).toBeCalled();
    });

    it('should display subform without form tag',() => {
        const mockSubmit = jest.fn();
        const wrapper = mount(
            <Form
                onSubmit={mockSubmit}
                subform
            >
                <TextField name="title" label="Title" />
            </Form>
        );
        const formElement = wrapper.find('form');
        expect(formElement.length).toBe(0);
    });

    it('should reset form by FormEventsEmitter',() => {
        const mockSubmit = jest.fn();
        const eventEmitter = new FormEventsEmitter();
        const wrapper = mount(
            <Form
                onSubmit={mockSubmit}
                eventsEmitter={eventEmitter}
            >
                <TextField name="title" label="Title" />
            </Form>
        );
        const titleField = wrapper.find(TextField);
        titleField.find('input').first().simulate('change', {target: {value: 'test'}});
        eventEmitter.emit('reset');
        eventEmitter.emit('submit');
        wrapper.unmount();
        expect(mockSubmit).toBeCalledWith({});
    });

    it('should reset form by FormEventsEmitter with new model',() => {
        const mockSubmit = jest.fn();
        const eventEmitter = new FormEventsEmitter();
        const wrapper = mount(
            <Form
                onSubmit={mockSubmit}
                eventsEmitter={eventEmitter}
            >
                <TextField name="title" label="Title" />
            </Form>
        );
        const titleField = wrapper.find(TextField);
        titleField.find('input').first().simulate('change', {target: {value: 'test'}});
        eventEmitter.emit('reset', {title: 'new'});
        eventEmitter.emit('submit');
        expect(mockSubmit).toBeCalledWith({title: 'new'});
    });

    it('should set new form model by FormEventsEmitter setModel event',() => {
        const mockSubmit = jest.fn();
        const eventEmitter = new FormEventsEmitter();
        const wrapper = mount(
            <Form
                onSubmit={mockSubmit}
                eventsEmitter={eventEmitter}
            >
                <TextField name="title" label="Title" />
            </Form>
        );
        const titleField = wrapper.find(TextField);
        titleField.find('input').first().simulate('change', {target: {value: 'test'}});
        eventEmitter.emit('setModel', {title: 'new'});
        eventEmitter.emit('submit');
        expect(mockSubmit).toBeCalledWith({title: 'new'});
    });

    it('should register modelChange listener and call it on change model',() => {
        const mockListener = jest.fn();
        const eventEmitter = new FormEventsEmitter();
        const wrapper = mount(
            <Form
                onSubmit={()=>{}}
                eventsEmitter={eventEmitter}
            >
                <TextField
                    name="title"
                    label="Title"
                    onModelChange={mockListener}
                />
                <ObjectField name="testObjectField">
                    <TextField name="test"/>
                </ObjectField>
            </Form>
        );

        wrapper.find(ObjectField)
                .find(TextField)
                .find('input')
                .first()
                .simulate('change', {target: { value: 'test' } });

        expect(mockListener).toHaveBeenCalledTimes(2);
    });

    it('should register one listener of any type of event on field',() => {
        const mockSubmit = jest.fn();
        const mockListener = jest.fn();
        const eventEmitter = new FormEventsEmitter();
        const wrapper = mount(
            <Form
                onSubmit={mockSubmit}
                eventsEmitter={eventEmitter}
            >
                <TextField
                    name="title"
                    label="Title"
                    onEmitEvents={{name: 'test', method: mockListener}}
                />
            </Form>
        );
        eventEmitter.emit('test', {title: 'new'});
        wrapper.unmount();
        expect(mockListener).toBeCalled();
    });

    it('should register 3 listener of any type of event on field',() => {
        const mockSubmit = jest.fn();
        const mockListener = jest.fn();
        const mockListener2 = jest.fn();
        const mockListener3 = jest.fn();
        const eventEmitter = new FormEventsEmitter();
        const wrapper = mount(
            <Form
                onSubmit={mockSubmit}
                eventsEmitter={eventEmitter}
            >
                <TextField
                    name="title"
                    label="Title"
                    onEmitEvents={[
                        {name: 'test', method: mockListener},
                        {name: 'test2', method: mockListener2},
                        {name: 'test3', method: mockListener3}
                    ]}
                />
            </Form>
        );
        eventEmitter.emit('test', {title: 'new'});
        eventEmitter.emit('test2', {title: 'new2'});
        eventEmitter.emit('test3', {title: 'new3'});
        wrapper.unmount();
        expect(mockListener).toBeCalled();
        expect(mockListener2).toBeCalled();
        expect(mockListener3).toBeCalled();
    });

    it('should rerender field if validationErrors has changes but validationErrors length not changed',() => {
        const mockSubmit = jest.fn();
        const eventEmitter = new FormEventsEmitter();
        const wrapper = mount(
            <Form
                onSubmit={mockSubmit}
                schema={titleSchema}
                eventsEmitter={eventEmitter}
            >
                <TextField
                    name="title"
                    label="Title"
                />
                <TextField
                    name="title2"
                    label="Title"
                />
                <SubmitField value="Submit"/>
            </Form>
        );
        wrapper.find(SubmitField).find('button').first().simulate('click');
        const textFields = wrapper.find(TextField);
        expect(textFields.first().text().includes('is required')).toBeTruthy();
        textFields.last().find('input').first().simulate('change', {target: { value: 'te' } });
        expect(textFields.first().text().includes('test error')).toBeTruthy();
        textFields.last().find('input').first().simulate('change', {target: { value: 'te' } });
        wrapper.unmount();
    });

    it('should run callback onError on field if field has hasValidationError',() => {
        const onError = jest.fn();
        const wrapper = mount(
            <Form
                onSubmit={() => {}}
                schema={titleSchema}
            >
                <TextField
                    name="title"
                    label="Title"
                    callbacks={{onError}}
                />
                <TextField
                    name="title2"
                    label="Title"
                />
                <SubmitField value="Submit" />
            </Form>
        );
        wrapper.find(SubmitField).find('button').first().simulate('click');
        expect(onError).toBeCalled();
    });

    it('should run callback onChange on field if field has change',() => {
        const onChange = jest.fn();
        const wrapper = mount(
            <Form
                onSubmit={() => {}}
                schema={titleSchema}
            >
                <TextField
                    name="title"
                    label="Title"
                    callbacks={{onChange}}
                />
                <TextField
                    name="title2"
                    label="Title"
                />
                <SubmitField value="Submit" />
            </Form>
        );
        const textFields = wrapper.find(TextField);
        textFields.first().find('input').first().simulate('change', {target: { value: 'test' } });
        expect(onChange).toBeCalledWith('test');
    });
});
