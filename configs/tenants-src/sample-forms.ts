import type { FormsTemplate } from "../../src/templates/types";

export const sampleFormsTemplate: FormsTemplate = {
  templateId: "forms",
  brand: {
    logoUri:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
    primaryColor: "#3B82F6",
    backgroundColor: "#0F172A",
    textColor: "#FFFFFF",
    mutedTextColor: "#94A3B8",
  },
  auth: {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
  },
  forms: {
    forms: [
      {
        id: "building-permit",
        title: "Building Permit Application",
        description: "Submit an application for a new building permit or renovation project.",
        fields: [
          { id: "name", label: "Full Name", type: "text", required: true, placeholder: "Jane Doe" },
          { id: "email", label: "Email Address", type: "email", required: true, placeholder: "jane@example.com" },
          { id: "phone", label: "Phone Number", type: "phone", required: true, placeholder: "(555) 123-4567" },
          { id: "address", label: "Project Address", type: "textarea", required: true, placeholder: "Enter the full street address of the project site" },
          {
            id: "project-type",
            label: "Project Type",
            type: "select",
            required: true,
            options: [
              { label: "Residential", value: "residential" },
              { label: "Commercial", value: "commercial" },
              { label: "Renovation", value: "renovation" },
            ],
          },
          { id: "description", label: "Project Description", type: "textarea", required: true, placeholder: "Describe the scope of work" },
          { id: "start-date", label: "Planned Start Date", type: "date", required: true },
        ],
      },
      {
        id: "complaint",
        title: "Complaint Form",
        description: "Report an issue or concern to the City Permits Office.",
        fields: [
          { id: "name", label: "Full Name", type: "text", required: true, placeholder: "Jane Doe" },
          { id: "email", label: "Email Address", type: "email", required: true, placeholder: "jane@example.com" },
          { id: "location", label: "Location", type: "textarea", required: true, placeholder: "Describe the location of the issue" },
          {
            id: "category",
            label: "Category",
            type: "select",
            required: true,
            options: [
              { label: "Noise", value: "noise" },
              { label: "Safety", value: "safety" },
              { label: "Parking", value: "parking" },
              { label: "Other", value: "other" },
            ],
          },
          { id: "details", label: "Details", type: "textarea", required: true, placeholder: "Provide as much detail as possible" },
        ],
      },
      {
        id: "feedback",
        title: "General Feedback",
        description: "Share your thoughts on city services or suggest improvements.",
        fields: [
          { id: "name", label: "Full Name", type: "text", required: false, placeholder: "Jane Doe" },
          { id: "email", label: "Email Address", type: "email", required: false, placeholder: "jane@example.com" },
          {
            id: "rating",
            label: "Rating",
            type: "select",
            required: true,
            options: [
              { label: "1 - Poor", value: "1" },
              { label: "2 - Fair", value: "2" },
              { label: "3 - Good", value: "3" },
              { label: "4 - Very Good", value: "4" },
              { label: "5 - Excellent", value: "5" },
            ],
          },
          { id: "comments", label: "Comments", type: "textarea", required: true, placeholder: "Tell us what you think" },
        ],
      },
    ],
    allowFileUploads: true,
    maxFileSizeMb: 10,
  },
  tabs: [
    {
      id: "home",
      label: "Home",
      headerTitle: "City Permits Office",
      headerBody: "Submit applications, report issues, and provide feedback online.",
      cards: [
        {
          id: "welcome",
          imageUri:
            "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
          title: "Welcome to City Permits Office",
          body: "Access all city forms digitally. Submit permit applications, file complaints, and share feedback from your phone.",
          action: {
            type: "open_url",
            url: "https://example.com/city-permits",
            label: "Get started",
            variant: "primary",
          },
        },
        {
          id: "form-building",
          imageUri:
            "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
          title: "Building Permit Application",
          body: "Apply for residential, commercial, or renovation permits.",
        },
        {
          id: "form-complaint",
          imageUri:
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
          title: "File a Complaint",
          body: "Report noise, safety, parking, or other concerns to the city.",
        },
        {
          id: "form-feedback",
          imageUri:
            "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
          title: "General Feedback",
          body: "Help us improve by sharing your experience with city services.",
        },
      ],
    },
    {
      id: "forms",
      label: "Forms",
      headerTitle: "Available Forms",
      headerBody: "Select a form to fill out and submit.",
      cards: [],
    },
    {
      id: "submissions",
      label: "Submitted",
      headerTitle: "Your Submissions",
      headerBody: "Track the status of forms you have submitted.",
      cards: [],
    },
    {
      id: "profile",
      label: "Profile",
      headerTitle: "Your Profile",
      headerBody: "Manage your account and contact information.",
      cards: [],
    },
  ],
  protectedTabs: ["forms", "submissions", "profile"],
};
