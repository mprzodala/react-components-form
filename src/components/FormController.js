import { BehaviorSubject } from "rxjs";

class FormController {
  form = undefined;
  model$ = new BehaviorSubject();
  errors$ = new BehaviorSubject();

  init(form) {
    this.setForm(form);
    this.model$.next(form.state.model);
    this.errors$.next(form.state.validationErrors);
  }

  isInitialized() {
    return !!this.form;
  }

  hasError() {
    const errors = this.errors$.getValue();
    return typeof errors === "object" && Object.keys(errors).length > 0;
  }

  setForm(form) {
    this.form = form;
  }
  getForm() {
    return this.form;
  }
  setSchema(schema) {
    this.getForm().setState({ schema });
  }
  getSchema() {
    return this.getForm().state.schema;
  }
  getErrors() {
    return this.getForm().getAllValidationErrors();
  }
  setFieldValue(name, value) {
    this.getForm().setModel(name, value);
  }
  getFieldValue(name) {
    return this.getForm().getModel(name);
  }
}

export default FormController;
