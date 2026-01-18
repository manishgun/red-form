import type {
  Errors,
  FormContextProps,
  FormInstance,
  FormProps,
  InputProps,
  ModalProps,
  Schema,
  Touched,
  Values,
  FormOptions,
  FormSX,
  StepConfig,
  StepperFormProps,
  TextFieldProps,
  TextAreaFieldProps,
  EmailFieldProps,
  PasswordFieldProps,
  NumberFieldProps,
  TelephoneFieldProps
} from "./declarations";
import React, { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

const isPromise = (result: any): result is Promise<any> => {
  return !!result && typeof result.then === "function";
};

const val = <T,>(value: T | ((form: any) => T), form: any): T => {
  return typeof value === "function" ? (value as (form: any) => T)(form) : value;
};

const FormContext = createContext<FormContextProps>({
  open: () => 0,
  close: () => {},
  validate_now: 0,
  validate: reset => {}
});

export function useForm<T extends Schema>(s: T, onSubmit: (values: Values<T>) => void | Promise<void>, options?: FormOptions): FormInstance<T> {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [values, setValues] = useState<Values<T>>({} as Values<T>);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [schema, setSchema] = useState<T>(s);
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
    if (activeField !== field) set_active_field(field);
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
    required: val(schema[key]["required"], form) ? true : false,
    disabled: val(schema[key]["disabled"], form) ? true : false,
    placeholder: val(schema[key]["placeholder"], form),
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

    if (val(field.disabled, form) || val(field.hidden, form)) return fieldErrors;
    if (field.validate) field.validate({ field: key as string, props: field, form }).forEach(error => fieldErrors.push(error));
    else {
      if (val(field.required, form) && (value === undefined || value === "" || (Array.isArray(value) && value.length === 0))) {
        fieldErrors.push(`Field is required.`);
      } else if (!(value === undefined || value === "" || (Array.isArray(value) && value.length === 0))) {
        // Text and Textarea validation
        if (field.component === "text" || field.component === "textarea") {
          const props = field as TextFieldProps | TextAreaFieldProps;
          const max = val(props.max, form);
          const min = val(props.min, form);
          if (max !== undefined && (value as string).length > max) fieldErrors.push(`Field length must be less than or equal to ${max}.`);
          if (min !== undefined && (value as string).length < min) fieldErrors.push(`Field length must be more than or equal to ${min}.`);
        }

        // Email validation
        if (field.component === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value as string)) {
            fieldErrors.push(`Please enter a valid email address.`);
          }
        }

        // Password validation
        if (field.component === "password") {
          const props = field as PasswordFieldProps;
          const max = val(props.max, form);
          const min = val(props.min, form);
          if (max !== undefined && (value as string).length > max) fieldErrors.push(`Password length must be less than or equal to ${max}.`);
          if (min !== undefined && (value as string).length < min) fieldErrors.push(`Password must be at least ${min} characters.`);
        }

        // Number and Range validation
        if (field.component === "range" || field.component === "number") {
          const props = field as NumberFieldProps;
          const max = val(props.max, form);
          const min = val(props.min, form);
          if (max !== undefined && (value as number) > max) fieldErrors.push(`Field value must be less than or equal to ${max}.`);
          if (min !== undefined && (value as number) < min) fieldErrors.push(`Field value must be more than or equal to ${min}.`);
        }

        // Telephone validation
        if (field.component === "telephone") {
          const props = field as TelephoneFieldProps;
          const phoneStr = String(value);
          const max = val(props.max, form);
          const min = val(props.min, form);
          if (max !== undefined && phoneStr.length > max) fieldErrors.push(`Phone number must be less than or equal to ${max} digits.`);
          if (min !== undefined && phoneStr.length < min) fieldErrors.push(`Phone number must be at least ${min} digits.`);
        }

        // Date validation
        if (field.component === "date" || field.component === "datetime" || field.component === "time") {
          const props = field as any;
          const max = val(props.max, form);
          const min = val(props.min, form);
          if (min !== undefined && value < min) fieldErrors.push(`Date must be after ${min}.`);
          if (max !== undefined && value > max) fieldErrors.push(`Date must be before ${max}.`);
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
      const no_error = validate();
      if (no_error) result = onSubmit(values);
    } else result = onSubmit(values);

    if (isPromise(result)) {
      setSubmitting(true);
      (result as Promise<void>).finally(() => {
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
    if (context && context.validate) context.validate(true);
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
    initialValues,

    schema,
    setSchema,

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

  useEffect(() => {
    return () => {
      resetForm();
    };
  }, []);

  useEffect(() => {
    setSchema(s);
  }, [s]);

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
    const has_errors = Object.values(form.errors).some(e => e && e.length > 0);
    if (!disabled && (options?.validateOn?.includes("change") || has_errors)) {
      form.validate();
    }
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
      style={{ ...sx.container }}
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
          const is_disabled = Boolean(disabled) || Boolean(val(props.disabled, form)) || Boolean(val(props.hidden, form));
          return (
            <Fragment key={field as string}>
              {!val(props.hidden, form) && <InputContainer field={field} props={{ ...props, disabled: is_disabled }} form={form} sx={sx} options={options} />}
            </Fragment>
          );
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

const InputContainer = <T extends Schema, K extends keyof T>({
  field,
  props,
  form,
  sx,
  options
}: {
  field: string;
  props: T[K];
  form: FormInstance<T>;
  sx: FormSX;
  options: FormProps<T>["options"];
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>();
  const error = form.errors[field];
  const evaluatedSpan = val(props.span, form);
  const evaluatedLabel = val(props.label, form);
  const evaluatedRequired = val(props.required, form);
  const evaluatedInformation = val(props.information, form);
  const evaluatedHelperText = val(props.helperText, form);

  const style = useMemo(() => {
    return { gridColumn: evaluatedSpan ? `span ${evaluatedSpan}` : undefined, cursor: props.disabled ? "not-allowed" : undefined, ...sx.inputContainer };
  }, [evaluatedSpan, props.disabled]);

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
          {evaluatedLabel} <span className="red-form-error">{evaluatedRequired && !props.disabled && "*"}</span>
        </label>
        {evaluatedInformation && !props.disabled && (
          <div
            className="red-form-tooltip-container"
            style={{ ...sx.tooltipContainer }}
            onMouseEnter={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPosition({ x: rect.left, y: rect.top });
            }}
            onMouseLeave={e => {
              setPosition(undefined);
            }}
          >
            {options && options.infoIcon ? (
              options.infoIcon
            ) : (
              <div className="red-form-info-icon" style={{ ...sx.tooltipInfoIcon }}>
                ?
              </div>
            )}
            {position && (
              <div className="red-form-tooltip" style={{ ...sx.tooltip, top: position.y, left: position.x }}>
                {evaluatedInformation}
              </div>
            )}
          </div>
        )}
      </div>
      <Input field={field} props={props} form={form} error={error} sx={sx} />
      <div className="red-form-helper-area">
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
            {evaluatedHelperText !== undefined && (
              <p className={`red-form-helper-text ${error ? "red-form-error" : ""}`} style={{ ...sx.helperText }}>
                {evaluatedHelperText}
              </p>
            )}
          </>
        )}
      </div>
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
      {(properties.props as any).adornment && (properties.props as any).adornment.start && <>{(properties.props as any).adornment.start}</>}
      <InputField {...properties} />
      {(properties.props as any).adornment && (properties.props as any).adornment.end && <>{(properties.props as any).adornment.end}</>}
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
  return (
    <input
      type="text"
      className={`red-form-input ${error ? "red-form-error" : ""}`}
      {...form.getFieldProps(field as string)}
      minLength={val(props.min, form)}
      maxLength={val(props.max, form)}
    />
  );
};

const EmailField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "email") return null;
  return <input type="email" className={`red-form-input ${error ? "red-form-error" : ""}`} {...form.getFieldProps(field as string)} />;
};

const TelephoneField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "telephone") return null;

  return (
    <input
      type="tel"
      {...form.getFieldProps(field as string)}
      className={`red-form-input ${error ? "red-form-error" : ""}`}
      minLength={val(props.min, form)}
      maxLength={val(props.max, form)}
    />
  );
};

const PasswordField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "password") return null;
  const [show, setShow] = useState(false);
  return (
    <div className="red-form-password-container">
      <input
        {...form.getFieldProps(field as string)}
        id={`visible-${field}`}
        autoComplete="current-password"
        type={show && !form.submitting ? "text" : "password"}
        className={`red-form-input ${error ? "red-form-error" : ""}`}
        minLength={val(props.min, form)}
        maxLength={val(props.max, form)}
      />
      <input
        name="password"
        id="password"
        type="password"
        value={form["values"][field] as string}
        style={{ position: "absolute", opacity: 0, top: "-30px", pointerEvents: "none", cursor: "none" }}
      />
      <div
        className="red-form-password-eye-icon"
        onClick={() => {
          setShow(pre => !pre);
        }}
      >
        {show ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M10.584 10.587C10.2087 10.962 9.99778 11.4708 9.99756 12.0013C9.99734 12.5319 10.2078 13.0408 10.5828 13.4162C10.9578 13.7915 11.4666 14.0024 11.9971 14.0027C12.5277 14.0029 13.0366 13.7924 13.412 13.4174"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.363 5.365C10.2204 5.11972 11.1082 4.99684 12 5C18.364 5 22 12 22 12C21.6761 12.6456 21.2942 13.2574 20.859 13.829M14.12 14.12C13.7596 14.4822 13.3297 14.7662 12.8564 14.9551C12.3831 15.1439 11.876 15.2338 11.3664 15.2191C10.8567 15.2044 10.3554 15.0854 9.89372 14.8695C9.43206 14.6536 9.01971 14.3453 8.68233 13.9623C8.34495 13.5793 8.09004 13.1294 7.93217 12.6408C7.7743 12.1523 7.71686 11.6354 7.76375 11.1232C7.81064 10.611 7.96088 10.1143 8.20546 9.66311C8.45004 9.21193 8.78382 8.81689 9.188 8.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.61 6.61C4.62125 7.96462 3.02987 9.82526 2 12C2 12 5.636 19 12 19C13.6975 19.0032 15.3683 18.5945 16.88 17.81"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
};

const NumberField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "number") return null;

  const min = val(props.min, form);
  const max = val(props.max, form);
  const step = val(props.step, form);
  const fraction = val(props.fraction, form);

  return (
    <input
      type="number"
      {...form.getFieldProps(field as string)}
      min={min}
      max={max}
      step={step}
      className={`red-form-input ${error ? "red-form-error" : ""}`}
      onChange={e => {
        let val_num = parseFloat(e.target.value);
        if (isNaN(val_num)) form.setFieldValue(field, "");
        else {
          if (typeof fraction === "number") val_num = Number(val_num.toFixed(fraction));
          form.setFieldValue(field, val_num);
        }
      }}
    />
  );
};

const DateField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "date") return null;
  return (
    <input
      type="date"
      className={`red-form-input ${error ? "red-form-error" : ""}`}
      {...form.getFieldProps(field as string)}
      min={val(props.min, form)}
      max={val(props.max, form)}
    />
  );
};

const TimeField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "time") return null;
  return (
    <input
      type="time"
      className={`red-form-input ${error ? "red-form-error" : ""}`}
      {...form.getFieldProps(field as string)}
      min={val(props.min, form)}
      max={val(props.max, form)}
    />
  );
};

const WeekField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "week") return null;
  return (
    <input
      type="week"
      className={`red-form-input ${error ? "red-form-error" : ""}`}
      {...form.getFieldProps(field as string)}
      min={val(props.min, form)}
      max={val(props.max, form)}
    />
  );
};

const MonthField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "month") return null;
  return (
    <input
      type="month"
      className={`red-form-input ${error ? "red-form-error" : ""}`}
      {...form.getFieldProps(field as string)}
      min={val(props.min, form)}
      max={val(props.max, form)}
    />
  );
};

const RangeField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "range") return null;

  const min = val(props.min, form);
  const max = val(props.max, form);
  const step = val(props.step, form);

  return (
    <div className="red-form-range-field-container">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        className={`red-form-input red-form-range-field ${error ? "red-form-error" : ""}`}
        {...form.getFieldProps(field as string)}
      />
      <div className="red-form-range-field-value">{form["values"][field]}</div>
    </div>
  );
};

const DateTimeField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "datetime") return null;
  return (
    <input
      type="datetime-local"
      className={`red-form-input ${error ? "red-form-error" : ""}`}
      {...form.getFieldProps(field as string)}
      min={val(props.min, form)}
      max={val(props.max, form)}
    />
  );
};

const TextAreaField = <T extends Schema, K extends keyof T>({ field, props, form, error }: InputProps<T, K>) => {
  if (props.component !== "textarea") return null;
  return (
    <textarea
      className={`red-form-input red-form-textarea ${error ? "red-form-error" : ""}`}
      {...form.getFieldProps(field as string)}
      minLength={val(props.min, form)}
      maxLength={val(props.max, form)}
    />
  );
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

  const options = val(props.options, form);

  const map = useMemo(() => {
    return options.reduce(
      (previous, current) => {
        if (typeof current === "string") {
          previous[current] = current;
        } else {
          previous[String(current.value)] = current.value;
        }

        return previous;
      },
      {} as Record<string, string | number>
    );
  }, [options]);

  return (
    <select
      id={field as string}
      value={(form.values[field] as string) || ""}
      onChange={e => form.setFieldValue(field, map[e.target.value])}
      className={`red-form-select-field ${val(props.disabled, form) ? "red-form-select-field-disabled" : ""} ${error ? "red-form-error" : ""}`}
      onClick={() => {
        form.setFieldActive(field);
      }}
    >
      <option value={""} className="red-form-select-option">
        Select {val(props.label, form)}
      </option>

      {options.map(item => {
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

  const options = val(props.options, form);

  return (
    <div className={`red-form-checkbox-field-container ${props.direction === "row" ? "red-form-checkbox-field-container-row" : ""}`}>
      {options.map((item, index) => {
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

  const options = val(props.options, form);

  return (
    <div className={`${props.direction === "column" ? "red-form-radio-base-column" : "red-form-radio-base-row"} ${error ? "red-form-error" : ""}`}>
      {options.map((item, index) => {
        const label = typeof item === "string" ? item : item.label;
        const value = typeof item === "string" ? item : item.value;

        const toggle = () => {
          if (form.activeField !== field) form.setFieldActive(field);
          if (form["values"][field] === value) form.setFieldValue(field, "");
          else form.setFieldValue(field, value);
        };

        return (
          <div className="red-form-radio-field-item" key={value}>
            {props.disabled && <div style={{ width: "40px", height: "40px", position: "absolute" }} />}

            <input
              type="radio"
              readOnly
              className="red-form-radio-field-input"
              name={field as string}
              checked={value === form["values"][field]}
              value={value || ""}
              onClick={toggle}
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
        disabled={val(props.disabled, form)}
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
  const [input, setInput] = useState<string>("");
  const [previous_label, set_previous_label] = useState<string>("");
  const [is_dirty, set_is_dirty] = useState<boolean>(false);
  const [selected_index, set_selected_index] = useState<number>(0);
  const [show_suggestions, set_show_suggestions] = useState<boolean>(false);

  const value = form.values[field];
  const options = val(props.options, form);

  const reInitialization = () => {
    if (value !== null && value !== undefined && value !== "" && input === "") {
      const match = options.find(option => {
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
    const match = options.find(option => {
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

  useEffect(reInitialization, [value, options]);

  useEffect(() => {
    if (props.reloadOptions !== false) reInitialization();
  }, [options]);

  const filterd = useMemo(() => {
    return options
      .filter(option => {
        const value = input.toLowerCase();
        if (typeof option === "string") {
          return option !== input && option.toLowerCase().includes(value);
        } else {
          return option.label !== input && option.label.toLowerCase().includes(value);
        }
      })
      .slice(0, 10);
  }, [input, form.values[field], options]);

  const show = Boolean(form.activeField === field && filterd.length > 0 && show_suggestions);

  return (
    <Fragment>
      <input
        type="search"
        {...form.getFieldProps(field)}
        autoComplete="off"
        placeholder={val(props.placeholder, form) || `Select ${val(props.label, form)}`}
        value={input}
        className={`red-form-input ${error ? "red-form-error" : ""}`}
        onBlur={() => {
          if (!is_dirty && previous_label !== "") {
            setInput(previous_label);
          } else {
            exactMatch();
          }
          setTimeout(() => set_show_suggestions(false), 200);
        }}
        onKeyDown={e => {
          if (!["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) {
            set_is_dirty(true);
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (filterd[selected_index]) {
              const item = filterd[selected_index];
              const label = typeof item === "string" ? item : item.label;
              const value = typeof item === "string" ? item : item.value;
              setInput(label);
              form.setFieldValue(field, value);
              set_show_suggestions(false);
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
          set_is_dirty(true);
          if (show_suggestions === false) set_show_suggestions(true);
        }}
        onClick={() => {
          set_previous_label(input);
          setInput("");
          set_is_dirty(false);
          set_show_suggestions(true);
          if (!form.touched[field]) form.setFieldTouched(field, true);
        }}
      />
      {!props.disabled && (
        <div
          className="red-form-search-field-nav-arrow"
          onClick={() => {
            if (form.activeField !== field) {
              form.setFieldActive(field);
            }
            set_show_suggestions(!show_suggestions);
          }}
          style={{ cursor: "pointer", pointerEvents: "auto" }}
        >
          ⏷
        </div>
      )}
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
                  form.setFieldValue(field, value);
                  set_show_suggestions(false);
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

const MultiSelectField = <T extends Schema, K extends keyof T>({ field, props, form, error, sx }: InputProps<T, K>) => {
  if (props.component !== "multi-select") return null;
  const [input, setInput] = useState("");
  const [selected_index, set_selected_index] = useState(0);

  const options = val(props.options, form);

  const map = useMemo(() => {
    return options.reduce(
      (previous, current) => {
        if (typeof current === "string") {
          previous[current] = current;
        } else {
          previous[current.value] = current.label;
        }
        return previous;
      },
      {} as Record<string, string>
    );
  }, [options]);

  const values = useMemo(() => Object.keys(map), [map]);

  const filterd = useMemo(() => {
    return values
      .filter(item => {
        if (((form.values[field] as string[]) || []).includes(item)) return false;
        // Search by label instead of value
        return map[item].toLowerCase().includes(input.toLowerCase());
      })
      .slice(0, 3);
  }, [input, values, form.values[field], map]);

  useEffect(() => {
    set_selected_index(0);
  }, [input, filterd]);

  return (
    <div className="red-form-multi-select-wrapper">
      <div className="red-form-multi-select-container">
        {((form.values[field] as string[]) || []).map(item => {
          return (
            <div
              key={item}
              onClick={() => {
                if (typeof props.onClick === "function") {
                  props.onClick({ field, props, form, error, item, sx });
                }
              }}
              style={{ cursor: typeof props.onClick === "function" ? "pointer" : "default" }}
              className="red-form-multi-select-item"
            >
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
                form.setFieldValue(field, [...((form.values[field] as string[]) || []), filterd[selected_index]]);
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
              form.setFieldValue(field, [...((form.values[field] as string[]) || [])].slice(0, -1));
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
                form.setFieldValue(field, [...((form.values[field] as string[]) || []), item]);
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
      {((form.values[field] as string[]) || []).map(item => {
        return (
          <div key={item} className="red-form-tags-item">
            <span>{item}</span>
            <span
              className="red-form-tags-item-cross"
              onClick={() => {
                form.setFieldValue(
                  field,
                  ((form.values[field] as string[]) || []).filter((_item: string) => {
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
            const trimmedInput = input.trim();
            const currentTags = (form.values[field] as string[]) || [];
            // Prevent duplicate tags
            if (trimmedInput && !currentTags.includes(trimmedInput)) {
              form.setFieldValue(field, [...currentTags, trimmedInput]);
            }
            setInput("");
          } else setInput(e.target.value);
        }}
        placeholder={val(props.placeholder, form)}
        disabled={val(props.disabled, form)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            const trimmedInput = input.trim();
            const currentTags = (form.values[field] as string[]) || [];
            // Prevent duplicate tags
            if (trimmedInput && !currentTags.includes(trimmedInput)) {
              form.setFieldValue(field, [...currentTags, trimmedInput]);
            }
            setInput("");
          } else if (e.key === "Backspace" && input === "") {
            form.setFieldValue(field, [...((form.values[field] as string[]) || [])].slice(0, -1));
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
            disabled={val(props.disabled, form)}
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
          else if (reset === true) _set_validate_now(0);
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

// --- StepperForm Component ---

export const StepperForm = <T extends Schema[]>({ steps, title, description, onComplete, onStepChange, options = {}, sx = {} }: StepperFormProps<T>) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<any[]>(steps.map(() => ({})));
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(steps.map(() => false));

  const currentStepConfig = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async (values: any) => {
    // Save current step data
    const newStepData = [...stepData];
    newStepData[currentStep] = values;
    setStepData(newStepData);

    // Mark step as completed
    const newCompletedSteps = [...completedSteps];
    newCompletedSteps[currentStep] = true;
    setCompletedSteps(newCompletedSteps);

    if (isLastStep) {
      // All steps completed, call onComplete
      await onComplete(newStepData as any);
    } else {
      // Move to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (onStepChange) onStepChange(nextStep);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (onStepChange) onStepChange(prevStep);
    }
  };

  const handleSkip = () => {
    if (currentStepConfig.optional && !isLastStep) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (onStepChange) onStepChange(nextStep);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
      if (onStepChange) onStepChange(step);
    }
  };

  // Merge saved data with schema defaults for current step
  const schemaWithSavedData = useMemo(() => {
    const schema = { ...currentStepConfig.schema };
    const savedData = stepData[currentStep];

    if (savedData && Object.keys(savedData).length > 0) {
      Object.keys(schema).forEach(key => {
        if (savedData[key] !== undefined) {
          (schema as any)[key] = { ...schema[key], value: savedData[key] };
        }
      });
    }

    return schema;
  }, [currentStep, currentStepConfig.schema, stepData]);

  return (
    <div className="red-form-stepper-container" style={{ ...sx.container }}>
      {/* Header */}
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

      {/* Step Indicator */}
      <div className="red-form-stepper-indicator">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps[index];
          const isClickable = index < currentStep || isCompleted;

          return (
            <div
              key={index}
              className={`red-form-stepper-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
              onClick={() => isClickable && goToStep(index)}
              style={{ cursor: isClickable ? "pointer" : "default" }}
            >
              <div className="red-form-stepper-step-circle">
                {isCompleted ? <span className="red-form-stepper-check">✓</span> : options.showStepNumbers !== false ? index + 1 : <span className="red-form-stepper-dot" />}
              </div>
              <div className="red-form-stepper-step-label">
                <div className="red-form-stepper-step-title">{step.label}</div>
                {step.description && <div className="red-form-stepper-step-description">{step.description}</div>}
              </div>
              {index < steps.length - 1 && <div className="red-form-stepper-connector" />}
            </div>
          );
        })}
      </div>

      {/* Current Step Form */}
      <div className="red-form-stepper-content">
        <Form
          key={`step-${currentStep}`}
          schema={schemaWithSavedData}
          onSubmit={handleNext}
          options={{
            validateOn: options.validateOnNext ? ["submit"] : undefined,
            buttons: {
              submit: isLastStep ? options.buttons?.complete || "Complete" : options.buttons?.next || "Next"
            }
          }}
          sx={sx}
        />

        {/* Custom Navigation */}
        <div className="red-form-stepper-navigation">
          {!isFirstStep && (
            <button type="button" onClick={handlePrevious} className="red-form-button red-form-reset-button">
              {options.buttons?.previous || "← Previous"}
            </button>
          )}
          {currentStepConfig.optional && options.allowSkip && !isLastStep && (
            <button type="button" onClick={handleSkip} className="red-form-button red-form-reset-button" style={{ marginLeft: "auto" }}>
              {options.buttons?.skip || "Skip →"}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="red-form-stepper-progress-bar">
        <div className="red-form-stepper-progress-fill" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
};

export default Form;
export type { Schema, FormSX, StepConfig, StepperFormProps };
