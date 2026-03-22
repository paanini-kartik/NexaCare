/** Onboarding, quick actions, and Health Compass fallback pins (mock clinics). Benefit/news demo data removed elsewhere. */

export const onboardingSlides = [
  {
    title: "Welcome to your health command center",
    body: "Track appointments, benefits, and emergency support from one workspace.",
  },
  {
    title: "Share only what you are comfortable with",
    body: "Your profile powers checkup reminders and suggestions from information you enter.",
  },
  {
    title: "Ready when urgency happens",
    body: "Fast emergency actions and a script you can show or read aloud when speech is difficult.",
  },
];

export const onboardingSteps = [
  {
    id: "profile",
    title: "Complete Health Profile",
    description: "Add age, occupation, medical history, allergies, and clinics you care about.",
    route: "/health-profile",
  },
  {
    id: "calendar",
    title: "Connect Calendar Preference",
    description: "Choose Google, Outlook, or Apple for future scheduling features.",
    route: "/health-profile",
  },
  {
    id: "benefits",
    title: "Review Benefits Setup",
    description: "Link employer keys or add providers in Settings when you are ready.",
    route: "/benefits",
  },
];

/** Sample map pins for Health Compass when the clinics API is unavailable */
export const clinicLocations = [
  {
    id: "c_01",
    name: "Smile Dental Studio",
    type: "dental",
    lat: 43.6545,
    lng: -79.3801,
    acceptedBenefits: ["Dental"],
  },
  {
    id: "c_02",
    name: "ClearView Optometry",
    type: "optometry",
    lat: 43.651,
    lng: -79.385,
    acceptedBenefits: ["Vision"],
  },
  {
    id: "c_03",
    name: "ActiveCare Physio",
    type: "hospital",
    lat: 43.658,
    lng: -79.39,
    acceptedBenefits: [],
  },
  {
    id: "c_04",
    name: "Rexall Pharmacy",
    type: "pharmacy",
    lat: 43.649,
    lng: -79.382,
    acceptedBenefits: [],
  },
  {
    id: "c_05",
    name: "Toronto General Hospital",
    type: "hospital",
    lat: 43.659,
    lng: -79.387,
    acceptedBenefits: ["Emergency"],
  },
];

export const quickActions = [
  { id: "book", label: "Book Appointment", icon: "calendar", active: true, route: "/health-compass" },
  { id: "benefits", label: "View Benefits", icon: "shield", active: true, route: "/benefits" },
  { id: "emergency", label: "Emergency Support", icon: "heart", active: true, route: "/emergency" },
  { id: "profile", label: "Update Profile", icon: "user", active: true, route: "/health-profile" },
];

export const employerOnboardingSteps = [
  {
    id: "roles",
    title: "Job roles & rates",
    description: "Each role includes Optometry, Dental, and Physical—set limits workers receive through invite keys.",
    route: "/employer",
  },
  {
    id: "keys",
    title: "Invite keys",
    description: "Copy EMP- keys under Settings → Connections for employees to link their work plan.",
    route: "/settings",
  },
  {
    id: "compass",
    title: "Health Compass",
    description: "Browse nearby clinics when you need a reference map—optional for your organization.",
    route: "/health-compass",
  },
];

export const employerQuickActions = [
  { id: "hub", label: "Employer Hub", icon: "user", active: true, route: "/employer" },
  { id: "compass", label: "Health Compass", icon: "calendar", active: true, route: "/health-compass" },
  { id: "emergency", label: "Emergency", icon: "heart", active: true, route: "/emergency" },
  { id: "settings", label: "Settings", icon: "shield", active: true, route: "/settings" },
];
