import { useState, useMemo, type JSX } from "react";
import "./App.css";
import Form, { create, StepperForm } from "red-form";

// --- Scenario 1: Main Feature Playground (Existing) ---
const mainSchema = create({
  fullName: { label: "Full Name", component: "text", value: "", required: true, span: 6 },
  email: { label: "Email Address", component: "email", value: "", required: true, span: 6 },
  password: { label: "Password", component: "password", value: "", required: true, span: 6, min: 8 },
  skills: {
    label: "Skills",
    component: "multi-select",
    value: [],
    options: [
      { label: "React", value: "react" },
      { label: "Node.js", value: "node" },
      { label: "TypeScript", value: "ts" },
    ],
    span: 6,
  },
  bio: { label: "Biography", component: "textarea", value: "", span: 12 },
});

// --- Scenario 2: eCommerce Flow (Dynamic Dependencies) ---
// Note: Dependencies handled by recreating schema via shippingCountry state
const createECommerceSchema = (shippingCountry: string, giftWrap: boolean) =>
  create({
    product: { label: "Product", component: "text", value: "Premium Laptop", disabled: true, span: 12 },
    quantity: { label: "Quantity", component: "number", value: 1, min: 1, max: 5, span: 4 },
    country: {
      label: "Shipping Country",
      component: "select",
      value: shippingCountry,
      options: ["USA", "UK", "Germany", "India"],
      span: 8,
    },
    shippingMethod: {
      label: "Shipping Method",
      component: "radio",
      value: "",
      options: shippingCountry === "India" ? ["Standard (2-3 days)", "Express (Next Day)"] : ["International Priority", "International Economy"],
      span: 12,
      hidden: !shippingCountry,
    },
    giftWrap: { label: "Add Gift Wrapping", component: "switch", value: giftWrap, span: 6 },
    giftMessage: {
      label: "Gift Message",
      component: "textarea",
      value: "",
      span: 12,
      hidden: !giftWrap,
    },
  });

// --- Scenario 3: Validation Lab (Cross-field Validation) ---
const validationSchema = create({
  startDate: { label: "Vacation Start Date", component: "date", value: "", span: 6, required: true },
  endDate: {
    label: "Vacation End Date",
    component: "date",
    value: "",
    span: 6,
    required: true,
    validate: ({ form }) => {
      const start = form.values.startDate as string;
      const end = form.values.endDate as string;
      if (start && end && new Date(end) < new Date(start)) {
        return ["End date must be after start date"];
      }
      return [];
    },
  },
  password: { label: "New Password", component: "password", value: "", span: 6, required: true },
  confirmPassword: {
    label: "Confirm Password",
    component: "password",
    value: "",
    span: 6,
    required: true,
    validate: ({ form }) => {
      if (form.values.confirmPassword !== form.values.password) {
        return ["Passwords do not match"];
      }
      return [];
    },
  },
});

// --- Scenario 4: Multi-Step Wizard ---
const stepSchemas = [
  create({
    accountType: { label: "Account Type", component: "radio", value: "Personal", options: ["Personal", "Business"], span: 12 },
  }),
  create({
    username: { label: "Username", component: "text", value: "", required: true, span: 12 },
    displayName: { label: "Display Name", component: "text", value: "", span: 12 },
  }),
  create({
    terms: {
      label: "Accept Terms",
      component: "switch",
      value: false,
      required: true,
      validate: ({ form }) => (form.values.terms ? [] : ["You must accept the terms"]),
      span: 12,
    },
  }),
];

// --- Scenario 5: Stepper Form (New) ---
const registrationSchemas = [
  create({
    firstName: { label: "First Name", component: "text", value: "", required: true, span: 6 },
    lastName: { label: "Last Name", component: "text", value: "", required: true, span: 6 },
    email: { label: "Email", component: "email", value: "", required: true, span: 12 },
  }),
  create({
    address1: { label: "Address Line 1", component: "text", value: "", required: true, span: 12 },
    address2: { label: "Address Line 2", component: "text", value: "", span: 12 },
    city: { label: "City", component: "text", value: "", required: true, span: 6 },
    zip: { label: "Zip Code", component: "text", value: "", required: true, span: 6 },
  }),
  create({
    phone: { label: "Phone Number", component: "telephone", value: 0, span: 6 },
    newsletter: { label: "Subscribe to Newsletter", component: "switch", value: false, span: 6 },
    comments: { label: "Additional Comments", component: "textarea", value: "", span: 12 },
  }),
];

function App() {
  const scenarioKeys = ["features", "ecommerce", "validation", "wizard", "registration"] as const;
  type ScenarioKey = (typeof scenarioKeys)[number];

  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("features");
  const [shippingCountry, setShippingCountry] = useState("USA");
  const [giftWrap, setGiftWrap] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const ecommerceSchema = useMemo(() => createECommerceSchema(shippingCountry, giftWrap), [shippingCountry, giftWrap]);

  const scenarios: Record<ScenarioKey, JSX.Element> = {
    features: (
      <Form
        key="form-features"
        schema={mainSchema}
        title="Feature Playground"
        description="Try out various form fields and production-grade UI."
        onSubmit={(values) => console.log("Features:", values)}
        options={{ validateOn: ["submit"] }}
      />
    ),
    ecommerce: (
      <Form
        key="form-ecommerce"
        schema={ecommerceSchema}
        title="Dynamic eCommerce"
        description="Shipping options change based on selected country."
        onChange={(values) => {
          if (values.country !== shippingCountry) setShippingCountry(values.country as string);
          if (values.giftWrap !== giftWrap) setGiftWrap(!!values.giftWrap);
        }}
        onSubmit={(values) => console.log("Order Placed:", values)}
        options={{ buttons: { submit: "Place Order" } }}
      />
    ),
    validation: (
      <Form
        key="form-validation"
        schema={validationSchema}
        title="Validation Lab"
        description="Complex cross-field validation for dates and passwords."
        onSubmit={() => alert("Validated successfully!")}
      />
    ),
    wizard: (
      <div key="wizard-container">
        <div style={{ marginBottom: 20, textAlign: "center", fontWeight: "bold", color: "#6b7280" }}>
          Step {wizardStep + 1} of {stepSchemas.length}
        </div>
        <Form
          key={`form-wizard-step-${wizardStep}`}
          schema={stepSchemas[wizardStep]}
          title="Account Setup Wizard"
          onSubmit={() => {
            if (wizardStep < stepSchemas.length - 1) setWizardStep((s) => s + 1);
            else {
              alert("Wizard completed!");
              setWizardStep(0);
            }
          }}
          options={{
            buttons: { submit: wizardStep === stepSchemas.length - 1 ? "Complete" : "Next" },
          }}
        />
        {wizardStep > 0 && (
          <button
            onClick={() => setWizardStep((s) => s - 1)}
            style={{
              display: "block",
              margin: "12px auto",
              padding: "10px 24px",
              background: "#ffffff",
              border: "1.5px solid #e5e7eb",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: "#374151",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#9ca3af")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>
            ← Back to Step {wizardStep}
          </button>
        )}
      </div>
    ),
    registration: (
      <StepperForm
        key="stepper-registration"
        steps={[
          {
            label: "Personal Info",
            description: "Basic details",
            schema: registrationSchemas[0],
          },
          {
            label: "Address",
            description: "Where you live",
            schema: registrationSchemas[1],
          },
          {
            label: "Preferences",
            description: "Optional settings",
            schema: registrationSchemas[2],
            optional: true,
          },
        ]}
        title="User Registration"
        description="Complete all steps to create your account"
        onComplete={(data) => {
          console.log("Registration Complete:", data);
          alert("Registration successful! Check console for data.");
        }}
        onStepChange={(step) => console.log("Moved to step:", step + 1)}
        options={{
          showStepNumbers: true,
          allowSkip: true,
          validateOnNext: true,
          buttons: {
            next: "Continue →",
            previous: "← Back",
            complete: "Create Account",
            skip: "Skip for now →",
          },
        }}
      />
    ),
  };

  return (
    <div style={{ padding: "40px 20px", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", color: "#111827", marginBottom: "8px", fontSize: "2.25rem", fontWeight: 700 }}>Red-Form possibilities</h1>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "40px", fontSize: "1.125rem" }}>
          Select a scenario to test different features of the library.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}>
          {scenarioKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveScenario(key)}
              style={{
                padding: "10px 24px",
                borderRadius: "9999px",
                border: "1.5px solid",
                borderColor: activeScenario === key ? "#2563eb" : "#e5e7eb",
                background: activeScenario === key ? "#eff6ff" : "white",
                color: activeScenario === key ? "#2563eb" : "#4b5563",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                textTransform: "capitalize",
                boxShadow: activeScenario === key ? "0 4px 6px -1px rgba(37, 99, 235, 0.1)" : "none",
              }}>
              {key}
            </button>
          ))}
        </div>

        <div style={{ transition: "all 0.3s ease" }}>{scenarios[activeScenario]}</div>
      </div>
    </div>
  );
}

export default App;
