import React from 'react';
import {
    Form,
    TextField,
    CheckboxField,
    SelectField,
    ObjectField,
    ListField,
    SubmitField,
} from '../../components/styled/Bootstrap';
import Schema from 'form-schema-validation';
import { listWrapper, objectFormField, objectFieldClassName } from '../demo.css';
import { FormEventsEmitter } from '../../components';

const options = [
    {
        label: 'Sci fi',
        value: 'scifi'
    },
    {
        label: 'Horror',
        value: 'horror'
    },
    {
        label: 'Romans',
        value: 'romans'
    }
];

const personSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    surname: {
        type: String
    },
    age: {
        type: String,
        options: [
            {
                label: 'Select age range',
                value: ''
            },
            {
                label: '18-21',
                value: '18-21'
            },
            {
                label: '22-28',
                value: '22-28'
            },
            {
                label: '29-40',
                value: '29-40'
            }
        ]
    }
});

const postSchema = new Schema({
    title:{
        type: String,
        label: 'Title',
        required: true
    },
    category:{
        type: String,
        label: 'Category',
        options: options
    },
    authors:{
        type: [personSchema],
        label: 'Authors'
    },
    published:{
        type: Boolean,
        label: 'Published'
    },
    createdAt:{
        type: Date,
        defaultValue: new Date()
    },
    languages:{
        type: [String]
    },
    status:{
        type: Boolean
    }
});
const resetModel = {
    title: 'test',
    category: 'horror',
    authors: [
        {
            name: 'Tester',
            surname: 'Testowy',
            age: '18-21'
        }
    ],
    published: false,
    languages: ['test'],
    status: true
};

const newModel = {
    title: 'test',
    category: 'horror',
    authors: [
        {
            name: 'Tester',
            surname: 'Testowy',
            age: '18-21'
        },
        {
            name: 'Tester',
            surname: 'Testowy',
            age: '18-21'
        }
    ],
    published: false,
    languages: ['test'],
    status: true
};

const eventsEmitter = new FormEventsEmitter();
const BookForm = () => (
    <Form
        schema={postSchema}
        onSubmit={data => console.log(data)}
        onError={(validationErrors, data) => console.log('error', validationErrors, data)}
        eventsEmitter={eventsEmitter}
    >
        <h4>BOOK FORM</h4>
        <TextField name="title" type="text" />
        <SelectField name="category" />
        <ListField
            name="authors"
            className={listWrapper}
            minLength={1}
        >
            <ObjectField wrapperClassName={objectFieldClassName}>
                <div className={objectFormField}>
                    <TextField name="name" placeholder="name"/>
                </div>
                <div className={objectFormField}>
                    <TextField name="surname" placeholder="surname"/>
                </div>
                <div>
                    <SelectField name="age" />
                </div>
            </ObjectField>
        </ListField>
        <ListField name="languages" label="Languages" className={listWrapper}>
            <TextField placeholder="language" />
        </ListField>
        <CheckboxField name="status" label="Published" />
        <SubmitField value="Submit" />
        <div>
            <a onClick={() => {eventsEmitter.emit('reset', resetModel)}} >RESET</a>
            <a onClick={() => {eventsEmitter.emit('setModel', newModel)}} >NEW MODEL</a>
        </div>
    </Form>
);

export default BookForm;