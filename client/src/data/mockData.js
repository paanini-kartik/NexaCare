export const onboardingSlides = [
  {
    title: "Welcome to your health command center",
    body: "Track appointments, benefits, and emergency support from one secure workspace.",
  },
  {
    title: "Share only what you are comfortable with",
    body: "Your profile powers checkup reminders and smarter clinic suggestions using dummy local data.",
  },
  {
    title: "Ready when urgency happens",
    body: "Get fast emergency actions and a prebuilt 911 speech script when verbal communication is limited.",
  },
];

export const onboardingSteps = [
  {
    id: "profile",
    title: "Complete Health Profile",
    description: "Add age, occupation, medical history, allergies, and preferred clinics.",
    route: "/health-profile",
  },
  {
    id: "calendar",
    title: "Connect Calendar Preference",
    description: "Choose Google, Outlook, or Apple to prepare smart scheduling.",
    route: "/health-profile",
  },
  {
    id: "benefits",
    title: "Review Benefits Setup",
    description: "Confirm your active insurers and plan coverage details.",
    route: "/benefits",
  },
];

export const quickActions = [
  { id: "book", label: "Book Appointment", icon: "calendar", active: true, route: "/health-compass" },
  { id: "benefits", label: "View Benefits", icon: "shield", active: true, route: "/benefits" },
  { id: "emergency", label: "Emergency Support", icon: "heart", active: true, route: "/emergency" },
  { id: "profile", label: "Update Profile", icon: "user", active: true, route: "/health-profile" },
];

export const insurers = [
  {
    id: "a1",
    provider: "Blue Horizon Health",
    plan: "Corporate Plus",
    categories: [
      { name: "Dental", coverage: 0.8, annualLimit: 2500, used: 900 },
      { name: "Vision", coverage: 0.7, annualLimit: 1200, used: 300 },
      { name: "Physio", coverage: 0.6, annualLimit: 1500, used: 450 },
    ],
  },
  {
    id: "a2",
    provider: "Northern Mutual Care",
    plan: "Family Extend",
    categories: [
      { name: "Emergency", coverage: 0.9, annualLimit: 5000, used: 1200 },
      { name: "General Checkups", coverage: 0.75, annualLimit: 2200, used: 700 },
    ],
  },
];

export const clinicLocations = [
  { id: 1, name: "Northside Dental", type: "Clinic", lat: 43.653, lng: -79.383, benefits: true },
  { id: 2, name: "OptiView Care", type: "Optometry", lat: 43.662, lng: -79.395, benefits: false },
  { id: 3, name: "City General Hospital", type: "Hospital", lat: 43.647, lng: -79.372, benefits: true },
  { id: 4, name: "HealthPlus Pharmacy", type: "Pharmacy", lat: 43.658, lng: -79.364, benefits: true },
];

export const healthNews = [
  {
    id: 1,
    tag: "PREVENTION",
    title: "Daily eye care habits for remote workers",
    image: "https://images.unsplash.com/photo-1576671414121-aa0c81c869e1?auto=format&fit=crop&w=200&q=60",
  },
  {
    id: 2,
    tag: "DENTAL",
    title: "How routine cleanings reduce long-term costs",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=200&q=60",
  },
];
