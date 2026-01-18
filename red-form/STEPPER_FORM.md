# StepperForm Component

The `StepperForm` is a built-in component in `red-form` that provides a production-grade multi-step form experience with visual progress indicators, step validation, and data persistence.

## Import

```tsx
import { StepperForm, create } from "red-form";
```

## Basic Usage

```tsx
const stepSchemas = [
  create({
    firstName: { label: "First Name", component: "text", value: "", required: true, span: 6 },
    lastName: { label: "Last Name", component: "text", value: "", required: true, span: 6 }
  }),
  create({
    email: { label: "Email", component: "email", value: "", required: true, span: 12 },
    phone: { label: "Phone", component: "telephone", value: 0, span: 12 }
  })
];

<StepperForm
  steps={[
    { label: "Personal Info", schema: stepSchemas[0] },
    { label: "Contact Details", schema: stepSchemas[1] }
  ]}
  onComplete={data => {
    console.log("All steps completed:", data);
  }}
/>;
```

## Props

### Required Props

| Prop         | Type                                | Description                                          |
| ------------ | ----------------------------------- | ---------------------------------------------------- |
| `steps`      | `StepConfig[]`                      | Array of step configurations with labels and schemas |
| `onComplete` | `(values) => void \| Promise<void>` | Callback when all steps are completed                |

### Optional Props

| Prop           | Type                     | Default | Description                            |
| -------------- | ------------------------ | ------- | -------------------------------------- |
| `title`        | `string`                 | -       | Main title displayed above the stepper |
| `description`  | `string`                 | -       | Description text below the title       |
| `onStepChange` | `(step: number) => void` | -       | Callback fired when step changes       |
| `options`      | `StepperOptions`         | `{}`    | Configuration options (see below)      |
| `sx`           | `FormSX`                 | `{}`    | Style overrides                        |

### StepConfig

Each step in the `steps` array should have:

```tsx
{
  label: string;           // Step name (e.g., "Personal Info")
  description?: string;    // Optional subtitle (e.g., "Basic details")
  schema: Schema;          // Form schema for this step
  optional?: boolean;      // If true, allows skipping this step
}
```

### StepperOptions

```tsx
{
  showStepNumbers?: boolean;      // Show numbers in step circles (default: true)
  allowSkip?: boolean;            // Enable skip button for optional steps (default: false)
  validateOnNext?: boolean;       // Validate before moving to next step (default: false)
  buttons?: {
    next?: string;                // Custom "Next" button text
    previous?: string;            // Custom "Previous" button text
    complete?: string;            // Custom "Complete" button text
    skip?: string;                // Custom "Skip" button text
  };
}
```

## Features

### 🎯 Visual Progress Indicator

- Horizontal step indicator with circles and connecting lines
- Active, completed, and pending states with distinct styling
- Checkmarks for completed steps
- Responsive design (vertical on mobile)

### 💾 Data Persistence

- Form data is automatically saved when moving between steps
- Previously entered values are restored when navigating back
- All step data is collected and passed to `onComplete`

### ✅ Step Validation

- Each step can have its own validation rules
- Set `validateOnNext: true` to validate before proceeding
- Prevents moving forward if current step has errors

### 🔄 Flexible Navigation

- Click on completed steps to jump back
- "Previous" button to go back one step
- "Skip" button for optional steps (when `allowSkip: true`)
- Progress bar at the bottom showing overall completion

### 📊 Progress Bar

- Visual progress bar showing percentage completion
- Smooth animated transitions
- Gradient fill for modern look

## Advanced Example

```tsx
<StepperForm
  steps={[
    {
      label: "Account Type",
      description: "Choose your plan",
      schema: create({
        accountType: {
          label: "Type",
          component: "radio",
          value: "",
          options: ["Personal", "Business"],
          required: true,
          span: 12
        }
      })
    },
    {
      label: "Personal Details",
      description: "Tell us about yourself",
      schema: create({
        fullName: { label: "Full Name", component: "text", value: "", required: true, span: 12 },
        email: { label: "Email", component: "email", value: "", required: true, span: 12 }
      })
    },
    {
      label: "Preferences",
      description: "Optional settings",
      schema: create({
        newsletter: { label: "Subscribe to Newsletter", component: "switch", value: false, span: 12 },
        notifications: {
          label: "Notification Preferences",
          component: "checkbox",
          value: [],
          options: ["Email", "SMS", "Push"],
          span: 12
        }
      }),
      optional: true
    }
  ]}
  title="Complete Registration"
  description="Fill out all required steps to create your account"
  onComplete={async data => {
    console.log("Step 1:", data[0]);
    console.log("Step 2:", data[1]);
    console.log("Step 3:", data[2]);

    // Submit to API
    await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }}
  onStepChange={step => {
    console.log(`User moved to step ${step + 1}`);
  }}
  options={{
    showStepNumbers: true,
    allowSkip: true,
    validateOnNext: true,
    buttons: {
      next: "Continue →",
      previous: "← Go Back",
      complete: "Finish Registration",
      skip: "Skip this step"
    }
  }}
/>
```

## Styling

The StepperForm uses the same CSS variables as the main Form component:

```css
:root {
  --red-form-color-primary: #2563eb;
  --red-form-color-primary-hover: #1d4ed8;
  --red-form-color-border: #e5e7eb;
  /* ... etc */
}
```

### Custom Styling

You can override styles using the `sx` prop:

```tsx
<StepperForm
  steps={...}
  onComplete={...}
  sx={{
    container: { maxWidth: "900px", margin: "0 auto" },
    title: { color: "#1e40af" },
  }}
/>
```

### CSS Classes

Available classes for custom styling:

- `.red-form-stepper-container` - Main container
- `.red-form-stepper-indicator` - Step indicator wrapper
- `.red-form-stepper-step` - Individual step
- `.red-form-stepper-step.active` - Active step
- `.red-form-stepper-step.completed` - Completed step
- `.red-form-stepper-step-circle` - Step number/icon circle
- `.red-form-stepper-connector` - Line between steps
- `.red-form-stepper-progress-bar` - Bottom progress bar
- `.red-form-stepper-progress-fill` - Progress bar fill

## TypeScript Support

Full TypeScript support with type inference:

```tsx
import { StepperForm, StepConfig, StepperFormProps } from "red-form";

// Type-safe step configuration
const steps: StepConfig<any>[] = [
  { label: "Step 1", schema: schema1 },
  { label: "Step 2", schema: schema2 }
];

// Type-safe props
const props: StepperFormProps<[typeof schema1, typeof schema2]> = {
  steps,
  onComplete: data => {
    // data is properly typed as [Values<schema1>, Values<schema2>]
  }
};
```

## Best Practices

1. **Keep steps focused**: Each step should have a clear, single purpose
2. **Use validation**: Enable `validateOnNext` to prevent invalid data
3. **Provide descriptions**: Help users understand what each step requires
4. **Mark optional steps**: Use `optional: true` for non-critical steps
5. **Handle completion**: Always provide meaningful feedback in `onComplete`
6. **Track progress**: Use `onStepChange` for analytics or state management

## Comparison: StepperForm vs Manual Wizard

| Feature           | StepperForm | Manual Wizard  |
| ----------------- | ----------- | -------------- |
| Setup complexity  | Simple      | Complex        |
| Visual indicator  | Built-in    | Manual         |
| Data persistence  | Automatic   | Manual state   |
| Navigation        | Built-in    | Manual buttons |
| Progress tracking | Built-in    | Manual         |
| Validation        | Integrated  | Manual         |
| Responsive design | Built-in    | Manual         |

## Migration from Manual Wizard

Before (Manual):

```tsx
const [step, setStep] = useState(0);
const [data, setData] = useState([{}, {}, {}]);

// ... lots of manual logic
```

After (StepperForm):

```tsx
<StepperForm
  steps={[...]}
  onComplete={(data) => console.log(data)}
/>
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## License

Part of the `red-form` library. See main README for license details.
