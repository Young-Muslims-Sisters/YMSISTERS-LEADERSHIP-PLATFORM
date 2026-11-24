// Static option lists for the annual form. Database-backed lists live in reference.ts.

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
] as const;

// "Current Education / Work Status" chips. Multiple may apply.
export const EDUCATION_STATUSES = [
  "Middle School", "High School", "Undergraduate", "Graduate", "Student", "Working", "Other",
] as const;

export const ETHNICITY_OPTIONS: readonly string[] = [
  "Afghan", "African American / Black", "Albanian", "Algerian", "Arab (other)", "Bangladeshi", "Bosnian",
  "Burmese", "Chinese", "Egyptian", "Emirati", "Eritrean", "Ethiopian", "Filipino", "Gambian", "Ghanaian", "Guyanese",
  "Hispanic / Latina", "Indian", "Indonesian", "Iranian / Persian", "Iraqi", "Jordanian", "Kashmiri", "Kurdish",
  "Kuwaiti", "Lebanese", "Libyan", "Malaysian", "Moroccan", "Native American / Alaska Native",
  "Native Hawaiian / Pacific Islander", "Nigerian", "Omani", "Pakistani", "Palestinian", "Qatari", "Rohingya",
  "Saudi", "Senegalese", "Somali", "South African", "Sri Lankan", "Sudanese", "Syrian", "Trinidadian",
  "Tunisian", "Turkish", "Uyghur", "Uzbek", "White / European", "Yemeni", "Prefer not to say",
];

export const FORM_STEPS = [
  { key: "personal", label: "Personal Information", icon: "personal" },
  { key: "contact", label: "Contact Details", icon: "contact" },
  { key: "involvement", label: "YM Involvement", icon: "involvement" },
  { key: "skills", label: "Skills & Contributions", icon: "skills" },
  { key: "education", label: "Education & Professional Background", icon: "education" },
] as const;
