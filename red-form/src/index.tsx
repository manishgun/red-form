import { Errors, FormContextProps, FormInstance, FormProps, InputProps, ModalProps, Schema, Touched, Values, FormOptions, FormSX } from "./declarations";
import React, { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

// function injectCss(path: string) {
//   if (typeof document !== "undefined") {
//     const link = document.createElement("link");
//     link.rel = "stylesheet";
//     link.href = path;
//     document.head.appendChild(link);
//   }
// }

// injectCss(new URL("./index.css", import.meta.url).toString());

const isPromise = (result: any) => {
  if (typeof result === "object" && typeof result.then === "function" && typeof result.catch === "function" && typeof result.finally === "function") return true;
  else return false;
};

const FormContext = createContext<FormContextProps>({
  open: () => 0,
  close: () => {},
  validate_now: 0,
  validate: reset => {}
});

export function useForm<T extends Schema>(schema: T, onSubmit: (values: Values<T>) => void | Promise<void>, options?: FormOptions): FormInstance<T> {
  const ref = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<Values<T>>({} as Values<T>);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [touched, setTouched] = useState<Touched<T>>({});
  const [activeField, set_active_field] = useState<keyof T>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  const context = useContext(FormContext);

  const initialValues = useMemo(() => {
    const values = {} as Values<T>;
    (Object.entries(schema) as [keyof T, T[keyof T]][]).forEach(([key, props]) => {
      values[key] = props.value as Values<T>[keyof T];
    });
    return values;
  }, [schema]);

  useEffect(() => {
    if ((options && options.reInitialization === true) || Object.keys(values).length === 0) {
      const val = { ...values };
      (Object.keys(initialValues) as (keyof T)[]).forEach(key => {
        if (touched[key] !== true) val[key] = initialValues[key];
      });
      setValues(val);
    }
  }, [initialValues]);

  const setFieldValue = <K extends keyof T>(field: K, value: Values<T>[K]) => {
    // if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (!touched[field] && value !== "") setFieldTouched(field, true);
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const setFieldError = <K extends keyof T>(field: K, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), message]
    }));
  };

  const setFieldTouched = <K extends keyof T>(field: K, value: boolean) => {
    if (options && options.validateOn && options.validateOn.includes("blur") && !options.validateOn.includes("change")) validateField(field, true);
    setTouched(prev => ({ ...prev, [field]: value }));
  };

  const setFieldActive = <K extends keyof T>(field: K | undefined) => {
    if (field !== activeField) set_active_field(field as string);
  };

  const handleBlur = <K extends keyof T>(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.target.name) {
      setFieldTouched(event.target.name, true);
      set_active_field(undefined);
      ref.current = null;
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.target.name) set_active_field(event.target.name);
  };

  const handleChange = <K extends keyof T>(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.target.name) setFieldValue(event.target.name as K, event.target.value);
  };

  const getFieldProps = <K extends keyof T>(key: K) => ({
    name: key,
    id: key,
    // value: typeof values[key] === "number" ? values[key] : values[key] ? values[key].toString() : "",
    value: values[key] === undefined || values[key] === null ? "" : values[key],
    required: false, //schema[key]["required"] ? true : false,
    disabled: schema[key]["disabled"] ? true : false,
    placeholder: schema[key]["placeholder"],
    autoComplete: schema[key]["component"] === "text" ? (schema[key]["autoFill"] ? schema[key]["autoFill"] : undefined) : undefined,
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onMouseDown: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.stopPropagation();
    },
    ref: key === activeField ? ref : undefined
  });

  const validateField = <K extends keyof T>(key: K, updateState: boolean): string[] => {
    const value = values[key];
    const field = schema[key];
    const fieldErrors: string[] = [];

    if (updateState) {
      if (validating === false) setValidating(true);
    }

    if (field.disabled) return fieldErrors;
    if (field.validate) field.validate({ field: key as string, props: field, form }).forEach(error => fieldErrors.push(error));
    else {
      if (field.required && (value === undefined || value === "" || (Array.isArray(value) && value.length === 0))) {
        fieldErrors.push(`filed is required.`);
      } else {
        if (field.component === "text" || field.component === "textarea") {
          if (field.max !== undefined && (value as string).length > field.max) fieldErrors.push(`Field Length must be less than ${field.max}.`);
          if (field.min !== undefined && (value as string).length < field.min) fieldErrors.push(`Field Lenght must be more than ${field.min}.`);
        }

        if (field.component === "range") {
          if ((value as number) > field.max) fieldErrors.push(`Field value must be less than ${field.max}.`);
          if ((value as number) < field.min) fieldErrors.push(`Field value must be more than ${field.min}`);
        }
      }
    }

    if (updateState) {
      if (fieldErrors.length > 0) setErrors({ ...errors, [key]: fieldErrors });
      else setErrors({ ...errors, [key]: undefined });
      if (validating === true) setValidating(false);
    }

    return fieldErrors;
  };

  const validate = useCallback(() => {
    if (options && options.onValidate && typeof options.onValidate === "function") options.onValidate();
    if (context && context.validate && typeof context.validate === "function") context.validate();
    if (validating === false) setValidating(true);

    const newErrors: Errors<T> = {};
    (Object.keys(schema) as (keyof T)[]).forEach(key => {
      const fieldErrors = validateField(key, false);
      if (fieldErrors.length > 0) newErrors[key] = fieldErrors;
    });

    setErrors(newErrors);
    if (validating === true) setValidating(false);

    return Object.keys(newErrors).length === 0;
  }, [values, schema]);

  const submit = useCallback(async () => {
    let result: any;

    if (options && options.validateOn && options.validateOn.includes("submit")) {
      const no_error = form.validate();
      if (no_error) result = onSubmit(values);
    } else result = onSubmit(values);

    if (isPromise(result)) {
      setSubmitting(true);
      // @ts-ignore
      result.finally(() => {
        if (context && typeof context.validate === "function") context.validate(false);

        setSubmitting(false);
      });
    }
  }, [validate, onSubmit, values]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      submit();
    },
    [submit]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setErrors({});
  }, [initialValues]);

  useEffect(() => {
    if (options && options.validateOn && options.validateOn.includes("active") && !options.validateOn.includes("change") && activeField) validateField(activeField, true);
  }, [values, activeField]);

  useEffect(() => {
    if (context.validate_now && typeof context.validate_now === "number" && context.validate_now > 0) {
      validate();
    }
  }, [context.validate]);

  const form = {
    submitting,
    setSubmitting,

    values,
    setFieldValue,
    setValues,

    errors,
    setFieldError,
    setErrors,

    touched,
    setFieldTouched,
    setTouched,
    handleBlur,

    setFieldActive,
    activeField,
    handleFocus,

    handleChange,

    handleSubmit,
    resetForm,
    validate,
    getFieldProps,
    submit
  };

  useEffect(() => {
    if (ref && ref.current && activeField === ref.current.name) ref.current.focus();
  }, [ref, activeField]);

  return form;
}

const Form = <T extends Schema>({
  schema,
  title,
  description,
  disabled,
  onSubmit,
  onDelete,
  onChange,
  onError,
  onBlur,
  sx = {},
  options
}: Omit<FormProps<T>, "open" | "close" | "minHeight" | "width" | "height" | "onClose">) => {
  const form = useForm(
    schema,
    async values => {
      if (onSubmit) {
        await onSubmit(values, form);
      }
    },
    options
  );

  useEffect(() => {
    if (onError) onError(form.errors, form);
  }, [form.errors]);
  useEffect(() => {
    if (onChange) onChange(form.values, form);
    if (!disabled && options && options.validateOn && options.validateOn.includes("change")) form.validate();
  }, [form.values]);
  useEffect(() => {
    if (onBlur) onBlur(form.touched, form);
  }, [form.touched]);

  const disable_submittion = useMemo(() => {
    return Object.values(form.errors).filter(val => val).length > 0 || form.submitting;
  }, [form.errors, form.submitting]);

  return (
    <div
      className="red-form-container"
      onMouseDown={() => {
        form.setFieldActive(undefined);
      }}
      style={{ ...sx.conteiner }}
    >
      {title && (
        <div className="red-form-title" style={{ ...sx.title }}>
          {title}
        </div>
      )}
      {description && (
        <p className="red-form-description" style={{ ...sx.description }}>
          {description}
        </p>
      )}
      <div className="red-form" style={{ ...sx.form }}>
        {(Object.entries(schema) as [string, T[keyof T]][]).map(([field, props]) => {
          props.disabled = Boolean(disabled) || Boolean(props.disabled) || Boolean(props.hidden);
          return <Fragment key={field as string}>{!props.hidden && <InputContainer field={field} props={props} form={form} sx={sx} />}</Fragment>;
        })}
        {disabled && <div style={{ width: "100%", height: "100%", position: "absolute", cursor: "default", pointerEvents: "all", zIndex: 999, inset: 0 }}></div>}
        {onSubmit && !disabled && (
          <div className="red-form-action-area" style={{ ...sx.actionArea }}>
            <button
              className={"red-form-button red-form-reset-button"}
              onClick={e => {
                e.preventDefault();
                form.resetForm();
              }}
              style={{ ...sx.resetButton }}
            >
              {options?.buttons?.reset || "Reset"}
            </button>
            <button
              onClick={() => {
                form.submit();
              }}
              disabled={disable_submittion}
              className={`red-form-button ${disable_submittion ? "red-form-submit-button-disabled red-form-error-shadow" : "red-form-submit-button"}`}
              type="submit"
              style={{ ...sx.submitButton }}
            >
              {options?.buttons?.submit || "Submit"}
            </button>
            {onDelete && (
              <button
                className={"red-form-button red-form-delete-button"}
                onClick={e => {
                  e.preventDefault();
                  onDelete(form);
                }}
                style={{ ...sx.deleteButton }}
              >
                {options?.buttons?.delete || "Delete"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InputContainer = <T extends Schema, K extends keyof T>({ field, props, form, sx }: { field: string; props: T[K]; form: FormInstance<T>; sx: FormSX }) => {
  const error = form.errors[field];
  const style = useMemo(() => {
    return { gridColumn: props.span ? `span ${props.span}` : undefined, cursor: props.disabled ? "not-allowed" : undefined, ...sx.inputContainer };
  }, [props.span, props.disabled]);

  if (props.component === "custom" && !props.inputBase) {
    return (
      <div style={{ ...style }} className={`${error ? "red-form-error" : ""}`}>
        <CustomField {...{ field, props, form, error, sx }} />
      </div>
    );
  }

  // if (props.disabled && !props.information) props.information = "Disabled!";

  return (
    <div className={`red-form-input-container ${error ? "red-form-error" : ""}`} style={style}>
      <div className="red-form-input-label-container" style={{ ...sx.inputLabelContainer }}>
        <label className={`red-form-input-label ${error ? "red-form-error" : ""}`} htmlFor={field as string} style={{ ...sx.inputLabel }}>
          {props.label} <span className="red-form-error">{props.required && "*"}</span>
        </label>
        {props.information && (
          <div className="red-form-tooltip-container" style={{ ...sx.tooltipContainer }}>
            <div className="red-form-info-icon" style={{ ...sx.tooltipInfoIcon }}>
              i
            </div>
            <div className="red-form-tooltip" style={{ ...sx.tooltip }}>
              {props.information}
            </div>
          </div>
        )}
      </div>
      <Input field={field} props={props} form={form} error={error} sx={sx} />
      {error && !props.disabled ? (
        <ul className={`red-form-error-list ${error ? "red-form-error" : ""}`} style={{ ...sx.errorList }}>
          {error.map(content => {
            return (
              <li key={content} style={{ ...sx.errorItem }}>
                {content}
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          {props.helperText !== undefined && (
            <p className={`red-form-helper-text ${error ? "red-form-error" : ""}`} style={{ ...sx.helperText }}>
              {props.helperText}
            </p>
          )}
        </>
      )}
    </div>
  );
};

const Input = <T extends Schema, K extends keyof T>(properties: InputProps<T, K>) => {
  switch (properties.props.component) {
    case "radio":
      return <RadioField {...properties} />;
    case "checkbox":
      return <CheckBoxField {...properties} />;
    case "switch":
      return <SwitchField {...properties} />;
    case "image":
      return <ImageField {...properties} />;
    default:
      return <InputBase {...properties} />;
  }
};

const InputBase = <T extends Schema, K extends keyof T>(properties: InputProps<T, K>) => {
  // console.log(properties.field, properties.props.disabled);

  return (
    <div
      className={`red-form-input-base ${properties.props.disabled ? "" : `${properties.error ? "red-form-error red-form-error-shadow" : "red-form-input-base-shadow"}`}`}
      style={{ ...properties.sx.inputBase }}
    >
      {/* @ts-ignore */}
      {properties.props.adorment && properties.props.adorment.start && <>{properties.props.adorment.start}</>}
      <InputField {...properties} />
      {/* @ts-ignore */}
      {properties.props.adorment && properties.props.adorment.end && <>{properties.props.adorment.end}</>}
    </div>
  );
};

const InputField = <T extends Schema, K extends keyof T>(properties: InputProps<T, K>) => {
  // if (["text", "email", "tel", "password", "number", "date", "datetime-local"].includes(props.component))
  switch (properties.props.component) {
    case "text":
      return <TextField {...properties} />;
    case "textarea":
      return <TextAreaField {...properties} />;
    case "search":
      return <SearchField {...properties} />;
    case "email":
      return <EmailField {...properties} />;
    case "telephone":
      return <TelephoneField {...properties} />;
    case "password":
      return <PasswordField {...properties} />;
    case "number":
      return <NumberField {...properties} />;
    case "date":
      return <DateField {...properties} />;
    case "datetime":
      return <DateTimeField {...properties} />;
    case "time":
      return <TimeField {...properties} />;
    case "month":
      return <MonthField {...properties} />;
    case "week":
      return <WeekField {...properties} />;
    case "range":
      return <RangeField {...properties} />;
    case "color":
      return <ColorField {...properties} />;
    case "select":
      return <SelectField {...properties} />;
    case "multi-select":
      return <MultiSelectField {...properties} />;
    case "tags":
      return <TagsField {...properties} />;
    case "custom":
      return <CustomField {...properties} />;
    default:
      return <div>Nothing To Render</div>;
  }
};

const CustomField = <T extends Schema, K extends keyof T>({ field, props, form, error, sx }: InputProps<T, K>) => {
  if (props.component !== "custom") return null;
  return <Fragment>{props.render({ field, props, form, error, sx })}</Fragment>;
};

const TextField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "text") return null;
  return <input type="text" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const EmailField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "email") return null;
  return <input type="email" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const TelephoneField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "telephone") return null;

  return <input type="tel" {...form.getFieldProps(field as string)} className={`red-form-input ${error ? "red-form-error" : ""}`} />;
};

const PasswordField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "password") return null;
  return <input type="password" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const NumberField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "number") return null;
  return (
    <input type="number" min={props.min} max={props.max} step={props.step} className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />
  );
};

const DateField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "date") return null;
  return <input type="date" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const TimeField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "time") return null;
  return <input type="time" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const WeekField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "week") return null;
  return <input type="week" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const MonthField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "month") return null;
  return <input type="month" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const RangeField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "range") return null;
  return (
    <div className="red-form-range-field-container">
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        className={`red-form-input red-form-range-field ${error ? "red-form-error" : ""}`}
        {...form.getFieldProps(field as string)}
      />
      <div className="red-form-range-field-value">{form["values"][field]}</div>
    </div>
  );
};

const DateTimeField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "datetime") return null;
  return <input type="datetime-local" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const TextAreaField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "textarea") return null;
  // @ts-ignore
  return <textarea className={`red-form-input red-form-textarea ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const ColorField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "color") return null;
  return (
    <label htmlFor={field as string} className="red-form-color-field-container">
      <input type="color" className="red-form-color-field" {...form.getFieldProps(field as string)} />
      <div style={{ background: form.values[field] as string }} className="red-form-color-field-dot"></div>
      <div className={`red-form-color-field-value ${error ? "red-form-error" : ""}`}>{form.values[field]}</div>
    </label>
  );
};

const SelectField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "select") return null;
  return (
    <select
      id={field as string}
      value={(form.values[field] as string) || ""}
      onChange={e => form.setFieldValue(field, e.target.value)}
      className={`red-form-select-field ${props.disabled ? "red-form-select-field-disabled" : ""} ${error ? "red-form-error" : ""}`}
    >
      <option value={""} className="red-form-select-option">
        Select {props.label}
      </option>

      {props.options.map(item => {
        const label = typeof item === "string" ? item : item.label;
        const value = typeof item === "string" ? item : item.value;
        return (
          <option value={value} key={value} className="red-form-select-option">
            {label}
          </option>
        );
      })}
    </select>
  );
};

const CheckBoxField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "checkbox") return null;
  return (
    <div className={`${props.direction === "column" ? "red-form-checkbox-base-column" : "red-form-checkbox-base-row"} ${error ? "red-form-error" : ""}`}>
      {props.options.map((item, index) => {
        const label = typeof item === "string" ? item : item.label;
        const value = typeof item === "string" ? item : item.value;
        return (
          <div className="red-form-checkbox-field-item" key={value}>
            <input
              type="checkbox"
              className="red-form-checkbox-field-input"
              readOnly
              name={field as string}
              checked={Array.isArray(form.values[field]) ? form.values[field].includes(value as string) : form.values[field] === value}
              onClick={() => {
                if (Array.isArray(form.values[field])) {
                  if (form.values[field].includes(value)) {
                    form.setFieldValue(
                      field,
                      form.values[field].filter(_value => value !== _value)
                    );
                  } else {
                    form.setFieldValue(field, [...form.values[field], value]);
                  }
                } else {
                  if (form.values[field] === value) {
                    form.setFieldValue(field, undefined);
                  } else {
                    form.setFieldValue(field, value);
                  }
                }
              }}
            />
            <div className="red-form-checkbox-field-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
};

const RadioField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "radio") return null;
  return (
    <div className={`${props.direction === "column" ? "red-form-radio-base-column" : "red-form-radio-base-row"} ${error ? "red-form-error" : ""}`}>
      {props.options.map((item, index) => {
        const label = typeof item === "string" ? item : item.label;
        const value = typeof item === "string" ? item : item.value;

        const toggle = () => {
          if (form.activeField !== field) form.setFieldActive(field);
          if (form["values"][field] === value) form.setFieldValue(field, "");
          else form.setFieldValue(field, value);
        };

        return (
          <div className="red-form-radio-field-item" key={value}>
            <input
              type="radio"
              readOnly
              className="red-form-radio-field-input"
              name={field as string}
              checked={value === form["values"][field]}
              value={value || ""}
              onClick={toggle}
              disabled={props.disabled}
              onKeyUp={e => {
                e.preventDefault();
                if (e.key === " ") toggle();
              }}
            />
            <div className="red-form-radio-field-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
};

const SwitchField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "switch") return null;

  return (
    <label className="red-form-switch-base">
      <input
        type="checkbox"
        {...form.getFieldProps(field as string)}
        value={""}
        checked={Boolean(form.values[field])}
        disabled={props.disabled}
        onChange={e => {
          form.setFieldValue(field, e.target.checked);
        }}
      />
      <span className="red-form-switch">
        <span className="red-form-slider"></span>
      </span>
    </label>
  );
};

const SearchField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "search") return null;
  const [selected_index, set_selected_index] = useState(0);
  const [input, setInput] = useState("");
  const [show_suggestions, set_show_suggestions] = useState(false);

  const value = form.values[field];

  const reInitialization = () => {
    if ((value !== null || value !== "") && input === "") {
      const match = props.options.find(option => {
        if (typeof option === "string") {
          return option === value;
        } else {
          return option.value === value;
        }
      });
      if (match) {
        if (typeof match === "string") {
          setInput(match);
        } else {
          setInput(match.label);
        }
      }
    }
  };

  const exactMatch = () => {
    const match = props.options.find(option => {
      if (typeof option === "string") {
        return option === input;
      } else {
        return option.label === input;
      }
    });

    if (match) {
      if (typeof match === "string") {
        if (match !== value) {
          form.setFieldValue(field, match);
        }
      } else {
        if (match.value !== value) {
          form.setFieldValue(field, match.value);
        }
      }
      set_show_suggestions(false);
    } else if (value !== "") form.setFieldValue(field, "");
  };

  useEffect(reInitialization, [value]);

  useEffect(() => {
    if (form.touched[field]) exactMatch();
  }, [input]);

  useEffect(() => {
    if (props.reloadOptions !== false) reInitialization();
  }, [props.options]);

  const filterd = useMemo(() => {
    return props.options
      .filter(option => {
        const value = input.toLowerCase();
        if (typeof option === "string") {
          return option !== input && option.toLowerCase().includes(value);
        } else {
          return option.label !== input && option.label.toLowerCase().includes(value);
        }
      })
      .slice(0, 10);
  }, [input, form.values[field], props.options]);

  const show = Boolean(form.activeField === field && filterd.length > 0 && show_suggestions);

  return (
    <Fragment>
      <input
        type="search"
        {...form.getFieldProps(field)}
        autoComplete="off"
        placeholder={props.placeholder || `Select ${props.label}`}
        value={input}
        className={`red-form-input ${error ? "red-form-error" : ""}`}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (filterd[selected_index]) {
              if (typeof filterd[selected_index] === "string") {
                setInput(filterd[selected_index]);
              } else {
                setInput(filterd[selected_index]["label"]);
              }
            }
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (filterd.length - 1 === selected_index) set_selected_index(0);
            else set_selected_index(selected_index + 1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (selected_index === 0) set_selected_index(filterd.length - 1);
            else set_selected_index(selected_index - 1);
          }
        }}
        onChange={e => {
          setInput(e.target.value);
          if (show_suggestions === false) set_show_suggestions(true);
        }}
        onClick={() => {
          set_show_suggestions(true);
          if (!form.touched[field]) form.setFieldTouched(field, true);
        }}
      />
      {form.activeField !== field && !props.disabled && <div className="red-form-search-field-nav-arrow">⏷</div>}
      {show && (
        <ul className="red-form-search-field-suggestion-container" style={{}}>
          {filterd.map((item, index) => {
            const label = typeof item === "string" ? item : item.label;
            const value = typeof item === "string" ? item : item.value;
            return (
              <li
                key={value}
                className={`suggestion-item ${selected_index === index ? "active" : ""}`}
                onMouseDown={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  setInput(label);
                  // form.setFieldValue(field, value);
                }}
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </Fragment>
  );
};

const MultiSelectField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "multi-select") return null;
  const [input, setInput] = useState("");
  const [selected_index, set_selected_index] = useState(0);

  const map = useMemo(() => {
    return props.options.reduce((previous, current) => {
      if (typeof current === "string") {
        previous[current] = current;
      } else {
        previous[current.value] = current.label;
      }
      return previous;
    }, {} as Record<string, string>);
  }, [props.options]);

  const values = useMemo(() => Object.keys(map), [map]);
  const filterd = useMemo(() => {
    return values
      .filter(item => {
        if (((form.values[field] as string[]) || []).includes(item)) return false;
        return item.toLowerCase().includes(input.toLowerCase());
      })
      .slice(0, 3);
  }, [input, values, form.values[field]]);

  useEffect(() => {
    set_selected_index(0);
  }, [input, filterd]);

  return (
    <div className="red-form-multi-select-wrapper">
      <div className="red-form-multi-select-container">
        {((form.values[field] as string[]) || []).map(item => {
          return (
            <div key={item} className="red-form-multi-select-item">
              <span>{map[item]}</span>
              <span
                className="red-form-multi-select-item-cross"
                onMouseDown={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  form.setFieldValue(
                    field,
                    ((form.values[field] as string[]) || []).filter((_item: string) => {
                      return _item !== item;
                    })
                  );
                  // form.setFieldActive(field);
                }}
              >
                ×
              </span>
            </div>
          );
        })}
        <input
          {...form.getFieldProps(field as string)}
          value={input}
          onChange={e => {
            setInput(e.target.value);
          }}
          onBlur={() => {}}
          required={false}
          autoComplete="off"
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filterd[selected_index]) {
                form.setFieldValue(field, [...(form.values[field] as string[]), filterd[selected_index]]);
                setInput("");
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              if (filterd.length - 1 === selected_index) set_selected_index(0);
              else set_selected_index(selected_index + 1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (selected_index === 0) set_selected_index(filterd.length - 1);
              else set_selected_index(selected_index - 1);
            } else if (e.key === "Backspace" && input === "") {
              form.setFieldValue(field, [...(form.values[field] as string[])].slice(0, -1));
            }
          }}
          type="text"
          className="red-form-input red-form-multi-select-input"
        />
      </div>
      {form.activeField === field && filterd.length > 0 && (
        <div className="red-form-multi-select-suggestion-container">
          {filterd.map((item, index) => (
            <div
              key={item}
              className={`suggestion-item ${selected_index === index ? "active" : ""}`}
              onMouseDown={e => {
                e.stopPropagation();
                e.preventDefault();
                form.setFieldValue(field, [...(form.values[field] as string[]), item]);
                setInput("");
              }}
            >
              {map[item]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TagsField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "tags") return null;
  const [input, setInput] = useState<string>("");
  return (
    <div className="red-form-tags-container">
      {(form.values[field] as string[]).map(item => {
        return (
          <div key={item} className="red-form-tags-item">
            <span>{item}</span>
            <span
              className="red-form-tags-item-cross"
              onClick={() => {
                form.setFieldValue(
                  field,
                  (form.values[field] as string[]).filter((_item: string) => {
                    return _item !== item;
                  })
                );
              }}
            >
              ×
            </span>
          </div>
        );
      })}
      <input
        value={input}
        onChange={e => {
          if (e.target.value.endsWith(",")) {
            form.setFieldValue(field, [...(form.values[field] as string[]), input.trim()]);
            setInput("");
          } else setInput(e.target.value);
        }}
        placeholder={props.placeholder}
        disabled={props.disabled}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            form.setFieldValue(field, [...(form.values[field] as string[]), input.trim()]);
            setInput("");
          } else if (e.key === "Backspace" && input === "") {
            form.setFieldValue(field, [...(form.values[field] as string[])].slice(0, -1));
          }
        }}
        name={field as string}
        id={field as string}
        type="text"
        className="red-form-input red-form-tags-input"
      />
    </div>
  );
};

const ImageField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "image") return null;

  return (
    <div className={`red-form-image-base ${error ? "red-form-error red-form-error-shadow" : ""}`}>
      {form.values[field] ? (
        <>
          <div className="red-form-image-remove-base" />
          <div
            className="red-form-image-remove-button"
            onClick={() => {
              form.setFieldValue(field, "");
            }}
          >
            ×
          </div>

          <img className="red-form-image-view" src={form.values[field] as string} />
        </>
      ) : (
        <label htmlFor={field as string} className="red-form-image-input">
          +
          <input
            type="file"
            {...form.getFieldProps(field as string)}
            disabled={props.disabled}
            value={""}
            onChange={e => {
              if (e.target.files && e.target.files.length === 1) {
                const file = e.target.files.item(0);
                if (file && props.onSelect)
                  props.onSelect(file).then(url => {
                    form.setFieldValue(field, url);
                  });
                e.target.files = null;
              }
            }}
            style={{ display: "none" }}
          />
        </label>
      )}
    </div>
  );
};

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [forms, setForms] = useState<Record<number, FormProps<any>>>({});
  const [_validate_now, _set_validate_now] = useState<number>(0);

  const formValues = useMemo(() => Object.entries(forms), [forms]);

  const open = <T extends Schema>(props: FormProps<T>) => {
    const id = Date.now();
    setForms(prev => ({ ...prev, [id]: props }));
    return id;
  };

  const close = (id: number) => {
    setForms(prev => {
      const updated = { ...prev };
      const onClose = updated[id].onClose;
      setTimeout(() => {
        onClose();
      }, 50);
      delete updated[id];
      return updated;
    });
  };

  return (
    <FormContext.Provider
      value={{
        open,
        close,
        validate_now: _validate_now,
        validate: reset => {
          if (reset === undefined) _set_validate_now(_validate_now + 1);
          else if (reset === false) _set_validate_now(0);
        }
      }}
    >
      {formValues.map(([key, props]) => {
        const id = Number(key);
        return (
          <Modal
            key={id}
            isOpen={true}
            height={props.height}
            width={props.width}
            minHeight={props.minHeight}
            onClose={
              props.close !== false
                ? () => {
                    close(id);
                  }
                : undefined
            }
          >
            <Form
              schema={props.schema}
              onSubmit={props.onSubmit}
              onBlur={props.onBlur}
              onChange={props.onChange}
              onError={props.onError}
              title={props.title}
              description={props.description}
            />
          </Modal>
        );
      })}
      {children}
    </FormContext.Provider>
  );
};

export const useModalForm = <T extends Schema>(schema: T, options: Omit<FormProps<T>, "schema" | "onClose">) => {
  const [remember, setRemember] = useState<{ id?: number; props?: FormProps<T> }>({});
  const { open, close } = useContext(FormContext);

  const utils = {
    open: () => {
      if (!remember.id) {
        const value = {
          ...options,
          schema,
          onClose: () => {
            setRemember({});
          }
        };
        const id = open(value);
        setRemember({ id, props: value });
      }
    },
    close: () => {
      if (remember.id && options.close !== false) {
        close(remember.id);
        setRemember({});
      }
    }
  };

  useEffect(() => {
    if (options.open && JSON.stringify(remember.props) !== JSON.stringify(options)) utils.open();
  }, []);

  return utils;
};

export const Modal = (props: ModalProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [props.isOpen]);

  // Close on "Escape" key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && props.onClose) props.onClose();
    };
    if (props.isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props.isOpen, props.onClose]);

  // Close when clicking outside
  const handleClickOutside = (event: React.MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      if (props.onClose) props.onClose();
    }
  };

  if (!props.isOpen) return null;

  return (
    <div onClick={handleClickOutside} className="red-form-modal-background">
      <div
        className="red-form-modal"
        ref={ref}
        style={{
          width: props.width,
          minHeight: props.minHeight,
          height: props.height
        }}
      >
        <div className="red-form-modal-header">
          <div className="red-form-modal-title">{props.title}</div>
          {props.onClose && (
            <button onClick={props.onClose} className="red-form-modal-close-button" aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div style={{ flex: 1 }} className="red-form-modal-container">
          {props.children}
        </div>
      </div>
    </div>
  );
};

export const create = <T extends Schema>(schema: T) => {
  return schema;
};

export default Form;
export type { Schema, FormSX };
