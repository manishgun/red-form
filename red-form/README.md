
![red form code snippet](https://crudios.com/images/red-form-code-snapshot.png)
---

# 🟥 **Red Form**

> **Schema-driven React form system that builds entire UI — no HTML, no CSS.**
> Define once. Render anywhere. Fully typed, flexible, and lightning-fast.

---

<p align="center">
  <a href="https://www.npmjs.com/package/red-form"><img src="https://img.shields.io/npm/v/red-form?color=ff3b30&label=version&logo=npm&logoColor=white" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/red-form"><img src="https://img.shields.io/npm/dm/red-form?color=007acc&logo=npm" alt="downloads"/></a>
  <a href="https://github.com/manishgun/red-form/stargazers"><img src="https://img.shields.io/github/stars/manishgun/red-form?color=yellow&logo=github" alt="stars"/></a>
  <a href="https://github.com/manishgun/red-form/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"/></a>
</p>

---

## 🚀 Why Red Form?

Building forms in React often means juggling inputs, styles, and validation logic for every single field.
**Red Form** solves that by letting you define the **schema only once** — it automatically generates the UI, handles validation, manages state, and aligns everything perfectly.

You get **developer clarity**, **instant layout**, and **zero boilerplate**.

---

## ✨ Features

- 🧱 **Schema-driven** – define once, render everywhere
- 🎨 **No HTML/CSS needed** – automatic layout, focus, hover, spacing, and shadows
- ⚙️ **Type-safe** – fully typed schema and form instance
- 🧩 **Extensible** – inject custom components and validation logic
- 🚀 **Optimized** – minimal re-renders, built for scalability
- 💡 **Declarative logic** – dynamic visibility and branching made easy

---

## 📦 Installation

```bash
npm install red-form
# or
yarn add red-form
```

---

## 🧩 Example 1 — Create Product Form

> A simple and elegant example showing Red Form’s minimal setup.

```tsx
import Form, { create } from "red-form";
import "red-form/dist/index.css";

const productForm = create({
  name: { label: "Product Name", component: "text", value: "", required: true },
  category: {
    label: "Category",
    component: "select",
    options: ["Electronics", "Clothing", "Books", "Other"],
    value: "",
    required: true
  },
  price: {
    label: "Price ($)",
    component: "number",
    value: 0,
    min: 0,
    required: true
  },
  available: { label: "In Stock", component: "switch", value: true },
  description: { label: "Description", component: "textarea", value: "", span: 12 }
});

export default function CreateProduct() {
  return (
    <Form title="Add New Product" description="Fill in the details below to list your product." schema={productForm} onSubmit={values => alert(JSON.stringify(values, null, 2))} />
  );
}
```

---

## ⚙️ Example 2 — Dynamic Form + Custom Component

> Dynamic field rendering and asynchronous file uploads — all declaratively.

```tsx
import Form, { create } from "red-form";

const schema = create({
  title: { label: "Project Title", component: "text", value: "", required: true },
  category: {
    label: "Category",
    component: "select",
    options: ["Web", "Mobile", "AI", "IoT"],
    value: "",
    required: true
  },
  image: {
    label: "Cover Image",
    component: "image",
    value: "",
    onSelect: async file => {
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  },
  isPrivate: { label: "Private Project", component: "switch", value: false },
  password: {
    label: "Access Password",
    component: "password",
    value: "",
    hidden: form => !form.values.isPrivate
  },
  customFooter: {
    label: "Custom Note",
    component: "custom",
    inputBase: false,
    render: () => (
      <div style={{ padding: 12, background: "#f5f5f5", borderRadius: 6 }}>
        <small>All fields are auto-validated before submit ✅</small>
      </div>
    ),
    span: 12
  }
});

export default function ProjectForm() {
  return <Form title="New Project" description="Quickly configure and submit your project details." schema={schema} onSubmit={values => console.log("Submitted:", values)} />;
}
```

---

## 👩‍💼 Example 3 — Job Application Form (Real-world)

> A large, production-grade form built entirely through schema configuration.

```tsx
import Form, { create } from "red-form";

export default function JobApplication() {
  const schema = create({
    name: { label: "Name", component: "text", value: "", autoFill: "name", required: true, max: 20 },
    email: { label: "Email", component: "text", value: "", autoFill: "email", required: true, max: 30 },
    phone: { label: "Phone", component: "text", value: "", autoFill: "home tel", required: true, max: 10 },
    address: { label: "Address", component: "text", value: "", autoFill: "address-line1", required: true, max: 20 },
    city: { label: "City", component: "text", value: "", autoFill: "address-level3", required: true, max: 20 },
    district: { label: "District", component: "text", value: "", autoFill: "address-level2", required: true, max: 20 },
    state: { label: "State", component: "text", value: "", autoFill: "address-level3", required: true, max: 20 },
    zipcode: { label: "Pincode", component: "text", value: "", autoFill: "postal-code", required: true, max: 6 },
    role: {
      label: "Role",
      component: "search",
      value: "",
      options: ["frontend", "backend", "sales", "bidder", "analyst", "architect", "DBA"],
      required: true
    },
    gender: { label: "Gender", component: "radio", value: "", options: ["Male", "Female", "Other"] },
    qualification: {
      label: "Highest Qualification",
      component: "checkbox",
      value: "", // INITIAL VALUE BLANK QUOTE ON CHECKBOX COMPONENT WILL ALLOW SINGLE CHECK AT A TIME.
      options: ["Diploma", "B.Tech", "M.Tech"],
      required: true
    },
    site: {
      label: "Preferred Site (multi select)",
      component: "checkbox",
      value: [], // INITIAL VALUE BLANK ARRAY ON CHECKBOX COMPONENT WILL ALLOW MULTI SELECT.
      options: ["on-site", "remote"],
      required: true
    },
    skills: {
      label: "Skills",
      component: "multi-select",
      value: [],
      span: 12,
      options: ["react", "angular", "node.js", "php"],
      required: true
    },
    comment: { label: "Comment", component: "textarea", value: "", span: 12 }
  });

  return (
    <div className="border-3 border-border-strong border-solid px-6 py-8 rounded-lg">
      <Form title="Job Application" description="Please fill all the details carefully." schema={schema} onSubmit={values => console.log(values)} />
    </div>
  );
}
```

🧩 This example demonstrates:

- 10+ field types (text, select, radio, checkbox, switch, textarea, search, etc.)
- Built-in **autoFill** support
- **Multi-column layout** via `span`
- Zero external UI dependency — all styling and alignment handled by Red Form

![red form code snippet](https://crudios.com/images/red-form-code-suggestion.png)


---

## 🎨 Styling with `sx`

```tsx
<Form
  schema={schema}
  sx={{
    title: { color: "#e11d48", fontWeight: 700 },
    submitButton: { background: "#e11d48", color: "#fff" },
    inputBase: { borderRadius: 8, borderColor: "#ddd" }
  }}
/>
```

## 🧑‍💻 Author

**Manish Gun**
💻 [GitHub](https://github.com/manishgun) • 🌐 [Website](https://crudios.com/projects/red-form) • ✉️ [mail.cto.manish@gmail.com](mailto:mail.cto.manish@gmail.com)

---

## 🪪 License

MIT © [Manish Gun](https://github.com/manishgun)
