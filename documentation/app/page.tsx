"use client";
import { FaGithub, FaYoutube, FaCopy } from "react-icons/fa";
import { useState } from "react";
import { clsx } from "clsx";
import Form, { create } from "red-form";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import tsx from "refractor/lang/tsx.js";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Full Schemas (as provided)
const employeeSchema = create({
  name: { label: "Name", value: "", component: "text", required: true, span: 6 },
  email: { label: "Email", value: "", component: "email", required: true, span: 6 },
  department: { label: "Department", value: "", component: "select", options: ["HR", "Engineering", "Sales"], required: true, span: 6 },
  salary: { label: "Salary", value: 0, component: "number", min: 30000, max: 200000, required: true, span: 6 },
  hireDate: { label: "Hire Date", value: "", component: "date", required: true, span: 6 },
  skills: { label: "Skills", value: [], component: "multi-select", options: ["React", "Node", "Python"], span: 12 },
  bio: { label: "Bio", value: "", component: "textarea", required: true, span: 12 },
  profilePic: { label: "Profile Pic", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), span: 2 },
  isActive: { label: "Active", value: true, component: "switch", span: 6 },
  interests: { label: "Interests", value: [], component: "tags", placeholder: "Add interests", span: 12 },
  rating: { label: "Rating", value: 5, component: "range", min: 1, max: 10, span: 6 },
  themeColor: { label: "Theme Color", value: "#000000", component: "color", span: 6 },
  feedback: {
    label: "Feedback Type",
    value: "",
    component: "radio",
    options: [
      { label: "Positive", value: "pos" },
      { label: "Negative", value: "neg" },
    ],
    required: true,
    span: 12,
  },
  newsletter: { label: "Newsletter", value: ["Weekly"], component: "checkbox", options: ["Daily", "Weekly", "Monthly"], span: 12 },
});

const projectSchema = create({
  title: { label: "Title", value: "", component: "text", required: true, span: 12 },
  description: { label: "Description", value: "", component: "textarea", required: true, span: 12 },
  startDate: { label: "Start Date", value: "", component: "date", required: true, span: 6 },
  endDate: { label: "End Date", value: "", component: "date", required: true, span: 6 },
  budget: { label: "Budget", value: 0, component: "number", min: 1000, required: true, span: 6 },
  priority: { label: "Priority", value: 5, component: "range", min: 1, max: 10, span: 6 },
  team: { label: "Team Members", value: [], component: "multi-select", options: ["Alice", "Bob", "Charlie"], required: true, span: 12 },
  tags: { label: "Tags", value: [], component: "tags", placeholder: "Add tags", span: 12 },
  status: { label: "Status", value: "Planning", component: "select", options: ["Planning", "In Progress", "Completed"], required: true, span: 6 },
  isPublic: { label: "Public", value: false, component: "switch", span: 6 },
  coverImage: { label: "Cover Image", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), span: 2 },
  color: { label: "Project Color", value: "#ff0000", component: "color", span: 6 },
  type: {
    label: "Type",
    value: "",
    component: "radio",
    options: [
      { label: "Web", value: "web" },
      { label: "Mobile", value: "mobile" },
    ],
    required: true,
    span: 6,
  },
  notifications: { label: "Notifications", value: ["Email"], component: "checkbox", options: ["Email", "Slack", "SMS"], span: 12 },
});

const companySchema = create({
  name: { label: "Name", value: "", component: "text", required: true, span: 12 },
  industry: { label: "Industry", value: "", component: "select", options: ["Tech", "Finance", "Healthcare"], required: true, span: 6 },
  founded: { label: "Founded Year", value: "", component: "month", required: true, span: 6 },
  employees: { label: "Employee Count", value: 0, component: "number", min: 1, max: 10000, required: true, span: 6 },
  revenue: { label: "Annual Revenue", value: 0, component: "range", min: 0, max: 1000000000, span: 6 },
  logo: { label: "Logo", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), required: true, span: 2 },
  description: { label: "Description", value: "", component: "textarea", required: true, span: 12 },
  services: { label: "Services", value: [], component: "multi-select", options: ["Consulting", "Development", "Design"], span: 12 },
  keywords: { label: "Keywords", value: [], component: "tags", placeholder: "Add keywords", span: 12 },
  isActive: { label: "Active", value: true, component: "switch", span: 6 },
  primaryColor: { label: "Brand Color", value: "#0000ff", component: "color", span: 6 },
  type: {
    label: "Company Type",
    value: "",
    component: "radio",
    options: [
      { label: "Private", value: "private" },
      { label: "Public", value: "public" },
    ],
    required: true,
    span: 12,
  },
  alerts: { label: "Alerts", value: ["Security"], component: "checkbox", options: ["Security", "Financial", "Legal"], span: 12 },
});

const userSchema = create({
  username: { label: "Username", value: "", component: "text", required: true, span: 6 },
  password: { label: "Password", value: "", component: "password", required: true, span: 6 },
  email: { label: "Email", value: "", component: "email", required: true, span: 12 },
  birthDate: { label: "Birth Date", value: "", component: "date", required: true, span: 6 },
  timezone: { label: "Timezone", value: "", component: "select", options: ["UTC", "EST", "PST"], required: true, span: 6 },
  preferences: { label: "Preferences", value: [], component: "multi-select", options: ["Dark Mode", "Notifications"], span: 12 },
  bio: { label: "Bio", value: "", component: "textarea", span: 12 },
  avatar: { label: "Avatar", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), span: 2 },
  verified: { label: "Email Verified", value: false, component: "switch", span: 6 },
  interests: { label: "Interests", value: [], component: "tags", placeholder: "Add interests", span: 12 },
  experience: { label: "Years of Experience", value: 0, component: "number", min: 0, max: 50, span: 6 },
  theme: { label: "Theme Color", value: "#333333", component: "color", span: 6 },
  role: {
    label: "Role",
    value: "",
    component: "radio",
    options: [
      { label: "Admin", value: "admin" },
      { label: "User", value: "user" },
    ],
    required: true,
    span: 12,
  },
  subscriptions: { label: "Subscriptions", value: ["Basic"], component: "checkbox", options: ["Basic", "Premium", "Pro"], span: 12 },
});

const taskSchema = create({
  title: { label: "Title", value: "", component: "text", required: true, span: 12 },
  description: { label: "Description", value: "", component: "textarea", required: true, span: 12 },
  dueDate: { label: "Due Date", value: "", component: "datetime", required: true, span: 6 },
  priority: { label: "Priority", value: 3, component: "range", min: 1, max: 5, required: true, span: 6 },
  assignee: { label: "Assignee", value: "", component: "select", options: ["Alice", "Bob"], required: true, span: 6 },
  labels: { label: "Labels", value: [], component: "multi-select", options: ["Urgent", "Review"], span: 6 },
  attachments: { label: "Attachments", value: [], component: "tags", placeholder: "Add files", span: 12 },
  completed: { label: "Completed", value: false, component: "switch", span: 6 },
  color: { label: "Task Color", value: "#00ff00", component: "color", span: 6 },
  status: {
    label: "Status",
    value: "",
    component: "radio",
    options: [
      { label: "To Do", value: "todo" },
      { label: "In Progress", value: "progress" },
    ],
    required: true,
    span: 12,
  },
  reminders: { label: "Reminders", value: ["Email"], component: "checkbox", options: ["Email", "Push"], span: 12 },
});

const healthSurveySchema = create({
  name: { label: "Name", value: "", component: "text", required: true, span: 12 },
  age: { label: "Age", value: 0, component: "number", min: 18, max: 100, required: true, span: 6 },
  gender: { label: "Gender", value: "", component: "select", options: ["Male", "Female", "Other"], required: true, span: 6 },
  symptoms: { label: "Symptoms", value: [], component: "multi-select", options: ["Fever", "Cough", "Fatigue"], required: true, span: 12 },
  severity: { label: "Severity", value: 5, component: "range", min: 1, max: 10, required: true, span: 12 },
  notes: { label: "Notes", value: "", component: "textarea", span: 12 },
  photo: { label: "Symptom Photo", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), span: 2 },
  consent: { label: "Consent to Share", value: false, component: "switch", required: true, span: 6 },
  keywords: { label: "Additional Keywords", value: [], component: "tags", placeholder: "Add keywords", span: 6 },
  type: {
    label: "Issue Type",
    value: "",
    component: "radio",
    options: [
      { label: "Acute", value: "acute" },
      { label: "Chronic", value: "chronic" },
    ],
    required: true,
    span: 12,
  },
  alerts: { label: "Alert Preferences", value: ["SMS"], component: "checkbox", options: ["SMS", "Email"], span: 12 },
});

const examRegistrationSchema = create({
  fullName: { label: "Full Name", value: "", component: "text", required: true, span: 6 },
  email: { label: "Email", value: "", component: "email", required: true, span: 6 },
  phone: { label: "Phone", value: "", component: "text", required: true, span: 6, autoFill: "tel" },
  examDate: { label: "Exam Date", value: "", component: "date", required: true, span: 6 },
  subjects: { label: "Subjects", value: [], component: "multi-select", options: ["Math", "Science", "English"], required: true, span: 12 },
  address: { label: "Address", value: "", component: "textarea", required: true, span: 12 },
  photo: { label: "ID Photo", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), required: true, span: 2 },
  verified: { label: "Documents Verified", value: false, component: "switch", span: 6 },
  preferences: { label: "Preferences", value: [], component: "tags", placeholder: "Add preferences", span: 6 },
  scoreExpectation: { label: "Expected Score", value: 0, component: "number", min: 0, max: 1000, span: 6 },
  theme: { label: "Form Theme Color", value: "#ff6600", component: "color", span: 6 },
  category: {
    label: "Category",
    value: "",
    component: "radio",
    options: [
      { label: "General", value: "gen" },
      { label: "Competitive", value: "comp" },
    ],
    required: true,
    span: 12,
  },
  notifications: { label: "Notification Channels", value: ["Email"], component: "checkbox", options: ["Email", "SMS", "App"], span: 12 },
});

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText("npm install red-form");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const schemas = {
    employee: employeeSchema,
    project: projectSchema,
    company: companySchema,
    user: userSchema,
    task: taskSchema,
    health: healthSurveySchema,
    exam: examRegistrationSchema,
  };
  const titles = {
    employee: "Employee Creation",
    project: "Project Creation",
    company: "Company Creation",
    user: "User Creation",
    task: "Task Creation",
    health: "Health Issue Survey",
    exam: "Govt Exam Registration",
  };

  const fullCodeSnippets = {
    employee: `const employeeSchema = create({
  name: { label: "Name", value: "", component: "text", required: true, span: 6 },
  email: { label: "Email", value: "", component: "email", required: true, span: 6 },
  department: { label: "Department", value: "", component: "select", options: ["HR", "Engineering", "Sales"], required: true, span: 6 },
  salary: { label: "Salary", value: 0, component: "number", min: 30000, max: 200000, required: true, span: 6 },
  hireDate: { label: "Hire Date", value: "", component: "date", required: true, span: 6 },
  skills: { label: "Skills", value: [], component: "multi-select", options: ["React", "Node", "Python"], span: 12 },
  bio: { label: "Bio", value: "", component: "textarea", required: true, span: 12 },
  profilePic: { label: "Profile Pic", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), span: 6 },
  isActive: { label: "Active", value: true, component: "switch", span: 6 },
  interests: { label: "Interests", value: [], component: "tags", placeholder: "Add interests", span: 12 },
  rating: { label: "Rating", value: 5, component: "range", min: 1, max: 10, span: 6 },
  themeColor: { label: "Theme Color", value: "#000000", component: "color", span: 6 },
  feedback: {
    label: "Feedback Type",
    value: "",
    component: "radio",
    options: [
      { label: "Positive", value: "pos" },
      { label: "Negative", value: "neg" },
    ],
    required: true,
    span: 12,
  },
  newsletter: { label: "Newsletter", value: ["Weekly"], component: "checkbox", options: ["Daily", "Weekly", "Monthly"], span: 12 },
});

<Form
  title="Employee Creation"
  description="Comprehensive employee form with all red-form components."
  schema={employeeSchema}
  onSubmit={(values) => {
    console.log("Employee Submitted:", values);
  }}
/>;`,
    project: `const projectSchema = create({
  title: { label: "Title", value: "", component: "text", required: true, span: 12 },
  description: { label: "Description", value: "", component: "textarea", required: true, span: 12 },
  startDate: { label: "Start Date", value: "", component: "date", required: true, span: 6 },
  endDate: { label: "End Date", value: "", component: "date", required: true, span: 6 },
  budget: { label: "Budget", value: 0, component: "number", min: 1000, required: true, span: 6 },
  priority: { label: "Priority", value: 5, component: "range", min: 1, max: 10, span: 6 },
  team: { label: "Team Members", value: [], component: "multi-select", options: ["Alice", "Bob", "Charlie"], required: true, span: 12 },
  tags: { label: "Tags", value: [], component: "tags", placeholder: "Add tags", span: 12 },
  status: { label: "Status", value: "Planning", component: "select", options: ["Planning", "In Progress", "Completed"], required: true, span: 6 },
  isPublic: { label: "Public", value: false, component: "switch", span: 6 },
  coverImage: { label: "Cover Image", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), span: 12 },
  color: { label: "Project Color", value: "#ff0000", component: "color", span: 6 },
  type: {
    label: "Type",
    value: "",
    component: "radio",
    options: [
      { label: "Web", value: "web" },
      { label: "Mobile", value: "mobile" },
    ],
    required: true,
    span: 6,
  },
  notifications: { label: "Notifications", value: ["Email"], component: "checkbox", options: ["Email", "Slack", "SMS"], span: 12 },
});

<Form
  title="Project Creation"
  description="Comprehensive project form with all red-form components."
  schema={projectSchema}
  onSubmit={(values) => {
    console.log("Project Submitted:", values);
  }}
/>;`,
    company: `const companySchema = create({
  name: { label: "Name", value: "", component: "text", required: true, span: 12 },
  industry: { label: "Industry", value: "", component: "select", options: ["Tech", "Finance", "Healthcare"], required: true, span: 6 },
  founded: { label: "Founded Year", value: "", component: "month", required: true, span: 6 },
  employees: { label: "Employee Count", value: 0, component: "number", min: 1, max: 10000, required: true, span: 6 },
  revenue: { label: "Annual Revenue", value: 0, component: "range", min: 0, max: 1000000000, span: 6 },
  logo: { label: "Logo", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), required: true, span: 12 },
  description: { label: "Description", value: "", component: "textarea", required: true, span: 12 },
  services: { label: "Services", value: [], component: "multi-select", options: ["Consulting", "Development", "Design"], span: 12 },
  keywords: { label: "Keywords", value: [], component: "tags", placeholder: "Add keywords", span: 12 },
  isActive: { label: "Active", value: true, component: "switch", span: 6 },
  primaryColor: { label: "Brand Color", value: "#0000ff", component: "color", span: 6 },
  type: {
    label: "Company Type",
    value: "",
    component: "radio",
    options: [
      { label: "Private", value: "private" },
      { label: "Public", value: "public" },
    ],
    required: true,
    span: 12,
  },
  alerts: { label: "Alerts", value: ["Security"], component: "checkbox", options: ["Security", "Financial", "Legal"], span: 12 },
});

<Form
  title="Company Creation"
  description="Comprehensive company form with all red-form components."
  schema={companySchema}
  onSubmit={(values) => {
    console.log("Company Submitted:", values);
  }}
/>;`,
    user: `const userSchema = create({
  username: { label: "Username", value: "", component: "text", required: true, span: 6 },
  password: { label: "Password", value: "", component: "password", required: true, span: 6 },
  email: { label: "Email", value: "", component: "email", required: true, span: 12 },
  birthDate: { label: "Birth Date", value: "", component: "date", required: true, span: 6 },
  timezone: { label: "Timezone", value: "", component: "select", options: ["UTC", "EST", "PST"], required: true, span: 6 },
  preferences: { label: "Preferences", value: [], component: "multi-select", options: ["Dark Mode", "Notifications"], span: 12 },
  bio: { label: "Bio", value: "", component: "textarea", span: 12 },
  avatar: { label: "Avatar", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), span: 6 },
  verified: { label: "Email Verified", value: false, component: "switch", span: 6 },
  interests: { label: "Interests", value: [], component: "tags", placeholder: "Add interests", span: 12 },
  experience: { label: "Years of Experience", value: 0, component: "number", min: 0, max: 50, span: 6 },
  theme: { label: "Theme Color", value: "#333333", component: "color", span: 6 },
  role: {
    label: "Role",
    value: "",
    component: "radio",
    options: [
      { label: "Admin", value: "admin" },
      { label: "User", value: "user" },
    ],
    required: true,
    span: 12,
  },
  subscriptions: { label: "Subscriptions", value: ["Basic"], component: "checkbox", options: ["Basic", "Premium", "Pro"], span: 12 },
});

<Form
  title="User Creation"
  description="Comprehensive user form with all red-form components."
  schema={userSchema}
  onSubmit={(values) => {
    console.log("User Submitted:", values);
  }}
/>;`,
    task: `const taskSchema = create({
  title: { label: "Title", value: "", component: "text", required: true, span: 12 },
  description: { label: "Description", value: "", component: "textarea", required: true, span: 12 },
  dueDate: { label: "Due Date", value: "", component: "datetime", required: true, span: 6 },
  priority: { label: "Priority", value: 3, component: "range", min: 1, max: 5, required: true, span: 6 },
  assignee: { label: "Assignee", value: "", component: "select", options: ["Alice", "Bob"], required: true, span: 6 },
  labels: { label: "Labels", value: [], component: "multi-select", options: ["Urgent", "Review"], span: 6 },
  attachments: { label: "Attachments", value: [], component: "tags", placeholder: "Add files", span: 12 },
  completed: { label: "Completed", value: false, component: "switch", span: 6 },
  color: { label: "Task Color", value: "#00ff00", component: "color", span: 6 },
  status: {
    label: "Status",
    value: "",
    component: "radio",
    options: [
      { label: "To Do", value: "todo" },
      { label: "In Progress", value: "progress" },
    ],
    required: true,
    span: 12,
  },
  reminders: { label: "Reminders", value: ["Email"], component: "checkbox", options: ["Email", "Push"], span: 12 },
});

<Form
  title="Task Creation"
  description="Comprehensive task form with all red-form components."
  schema={taskSchema}
  onSubmit={(values) => {
    console.log("Task Submitted:", values);
  }}
/>;`,
    health: `const healthSurveySchema = create({
  name: { label: "Name", value: "", component: "text", required: true, span: 12 },
  age: { label: "Age", value: 0, component: "number", min: 18, max: 100, required: true, span: 6 },
  gender: { label: "Gender", value: "", component: "select", options: ["Male", "Female", "Other"], required: true, span: 6 },
  symptoms: { label: "Symptoms", value: [], component: "multi-select", options: ["Fever", "Cough", "Fatigue"], required: true, span: 12 },
  severity: { label: "Severity", value: 5, component: "range", min: 1, max: 10, required: true, span: 12 },
  notes: { label: "Notes", value: "", component: "textarea", span: 12 },
  photo: { label: "Symptom Photo", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), span: 12 },
  consent: { label: "Consent to Share", value: false, component: "switch", required: true, span: 6 },
  keywords: { label: "Additional Keywords", value: [], component: "tags", placeholder: "Add keywords", span: 6 },
  type: {
    label: "Issue Type",
    value: "",
    component: "radio",
    options: [
      { label: "Acute", value: "acute" },
      { label: "Chronic", value: "chronic" },
    ],
    required: true,
    span: 12,
  },
  alerts: { label: "Alert Preferences", value: ["SMS"], component: "checkbox", options: ["SMS", "Email"], span: 12 },
});

<Form
  title="Health Issue Survey"
  description="Comprehensive health survey form with all red-form components."
  schema={healthSurveySchema}
  onSubmit={(values) => {
    console.log("Health Submitted:", values);
  }}
/>;`,
    exam: `const examRegistrationSchema = create({
  fullName: { label: "Full Name", value: "", component: "text", required: true, span: 6 },
  email: { label: "Email", value: "", component: "email", required: true, span: 6 },
  phone: { label: "Phone", value: "", component: "text", required: true, span: 6, autoFill: "tel" },
  examDate: { label: "Exam Date", value: "", component: "date", required: true, span: 6 },
  subjects: { label: "Subjects", value: [], component: "multi-select", options: ["Math", "Science", "English"], required: true, span: 12 },
  address: { label: "Address", value: "", component: "textarea", required: true, span: 12 },
  photo: { label: "ID Photo", value: "", component: "image", onSelect: async (file: File) => URL.createObjectURL(file), required: true, span: 12 },
  verified: { label: "Documents Verified", value: false, component: "switch", span: 6 },
  preferences: { label: "Preferences", value: [], component: "tags", placeholder: "Add preferences", span: 6 },
  scoreExpectation: { label: "Expected Score", value: 0, component: "number", min: 0, max: 1000, span: 6 },
  theme: { label: "Form Theme Color", value: "#ff6600", component: "color", span: 6 },
  category: {
    label: "Category",
    value: "",
    component: "radio",
    options: [
      { label: "General", value: "gen" },
      { label: "Competitive", value: "comp" },
    ],
    required: true,
    span: 12,
  },
  notifications: { label: "Notification Channels", value: ["Email"], component: "checkbox", options: ["Email", "SMS", "App"], span: 12 },
});

<Form
  title="Govt Exam Registration"
  description="Comprehensive exam registration form with all red-form components."
  schema={examRegistrationSchema}
  onSubmit={(values) => {
    console.log("Exam Submitted:", values);
  }}
/>;`,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans dark">
      {/* Header - Dark Mode (unchanged) */}
      <header className="w-full px-6 md:px-12 py-6 bg-gray-800 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-orange-400">red-form</h1>
          <nav className="hidden md:flex gap-8 text-gray-400 font-medium">
            <a href="#features" className="hover:text-orange-400 transition">
              Features
            </a>
            <a href="/docs" className="hover:text-orange-400 transition">
              Docs
            </a>
            <a href="/playground" className="hover:text-orange-400 transition">
              Playground
            </a>
            <a href="https://github.com/manishgun/red-form" className="hover:text-orange-400 transition">
              GitHub
            </a>
            <a href="#blog" className="hover:text-orange-400 transition">
              Blog
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/manishgun/red-form" className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition">
            <FaGithub /> <span>Star</span>
          </a>
          <a href="#" className="text-gray-400 hover:text-orange-400 transition">
            <FaYoutube />
          </a>
          <button className="border border-orange-400 px-4 py-2 rounded-md hover:bg-orange-400 hover:text-gray-900 transition">Login</button>
          <button className="bg-orange-400 px-4 py-2 rounded-md text-gray-900 hover:bg-orange-500 transition">Get Started</button>
        </div>
      </header>

      {/* Hero - Dark (unchanged) */}
      <main className="flex flex-col items-center justify-center text-center mt-20 px-6 md:px-12">
        <h2 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-5xl">
          Build Dynamic Forms <span className="text-orange-400">Fast</span> with red-form
        </h2>
        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-3xl">Schema-driven React forms, TypeScript-ready. Ship pro forms instantly.</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a href="#examples" className="bg-orange-400 px-6 py-3 rounded-lg text-gray-900 font-semibold hover:bg-orange-500 transition">
            Explore Examples
          </a>
          <div
            className={clsx(
              "bg-gray-800 px-4 py-3 rounded-lg flex items-center gap-2 font-mono text-gray-200 cursor-pointer",
              copied && "border border-green-500"
            )}
            onClick={copyToClipboard}>
            <span>$ npm install red-form</span>
            <FaCopy className="hover:text-white transition" />
            {copied && <span className="ml-2 text-green-500">Copied!</span>}
          </div>
        </div>
      </main>

      {/* Examples Section - Stacked Full-Width Forms & Snippets */}
      <section id="examples" className="py-20 px-4 md:px-8">
        <div className="w-full">
          <h3 className="text-3xl md:text-4xl font-bold mb-8 text-center">Comprehensive Form Examples</h3>
          <p className="text-lg text-gray-400 mb-12 text-center">
            Live demos using all components: text, email, select, radio, checkbox, switch, number, date, range, color, multi-select, tags, image.
          </p>
          {/* {Object.keys(schemas).map((key) => (
            <div key={key} className="mb-16 w-full">
              <h4 className="text-2xl font-semibold mb-4 text-center">{titles[key as keyof typeof titles]}</h4>
              <div className="grid grid-cols-1 gap-8 w-full">
                <div className="w-full max-w-none">
                  <Form
                    title={titles[key as keyof typeof titles]}
                    description={`Comprehensive ${key} form with all red-form components.`}
                    schema={schemas[key as keyof typeof schemas]}
                    onSubmit={(values) => {
                      console.log(`\${key} Submitted:\``, values);
                      setSubmitted(key);
                      setTimeout(() => setSubmitted(null), 2000);
                    }}
                  />
                  {submitted === key && <p className="text-center text-green-500 mt-4">Submitted! Check console.</p>}
                </div>
                <div className="w-full max-w-none">
                  <SyntaxHighlighter language="tsx" style={oneDark} className="rounded-lg !w-full !max-h-[600px] overflow-auto">
                    {fullCodeSnippets[key as keyof typeof fullCodeSnippets]}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          ))} */}
        </div>
      </section>

      {/* Footer - Dark (unchanged) */}
      <footer className="py-8 px-6 md:px-12 bg-gray-800 text-gray-400 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-lg font-bold text-gray-100">red-form</h4>
            <p className="text-sm">Schema-driven React forms.</p>
          </div>
          <div className="flex gap-6">
            <a href="/docs" className="text-sm hover:text-white">
              Docs
            </a>
            <a href="/playground" className="text-sm hover:text-white">
              Playground
            </a>
            <a href="https://github.com/manishgun/red-form" className="text-sm hover:text-white">
              GitHub
            </a>
          </div>
        </div>
        <p className="mt-4 text-sm">&copy; 2025 red-form. All rights reserved.</p>
      </footer>
    </div>
  );
}
