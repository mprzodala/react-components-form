import React, { Component } from "react";
import Schema from "form-schema-validation";
import {
  Form,
  TextField,
  SubmitField
} from "../../components/styled/Bootstrap";
import FormController from "../../components/FormController";

const loginSchema = new Schema({
  login: {
    type: Number,
    required: false
  },
  password: {
    type: String,
    required: true
  }
});

class LoginForm extends Component {
  constructor(props) {
    super(props);

    this.controller = new FormController();
    this.state = { model: {}, errors: {} };
  }

  componentDidMount() {
    this.controller.model$.subscribe(model => {
      this.setState({ model });
    });
    this.controller.errors$.subscribe(errors => {
      this.setState({ errors });
    });
  }

  render() {
    const { model, errors } = this.state;
    return (
      <div>
        <Form
          schema={loginSchema}
          onSubmit={data => console.log(data)}
          controller={this.controller}
          onError={(validationErrors, data) =>
            console.log("error", validationErrors, data)
          }
        >
          <h4>LOGIN FORM</h4>
          <TextField name="login" label="Login" type="text" />
          <TextField name="password" label="Password" type="text" />
          <SubmitField value="Login" />
        </Form>
        <div>
          <strong>model:</strong>
          <pre>{JSON.stringify(model)}</pre>
          <strong>errors:</strong>
          <pre>{JSON.stringify(errors)}</pre>
          <strong>hasError:</strong>{" "}
          {JSON.stringify(this.controller.hasError())}
        </div>
      </div>
    );
  }
}

export default LoginForm;
