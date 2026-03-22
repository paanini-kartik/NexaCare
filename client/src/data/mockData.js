/** Onboarding, quick actions, and Health Compass fallback pins. */

export const onboardingSlides = [
  {
    title: "Welcome to NexaCare",
    body: "Your dashboard brings together appointments, benefits, and the information you choose to save—so you spend less time hunting through portals.",
  },
  {
    title: "You’re in control of what you share",
    body: "What you add to your profile helps us show useful reminders and summaries. You can update it whenever you like.",
  },
  {
    title: "If you ever need help in a hurry",
    body: "The Emergency section is there for clear next steps—including wording you can read aloud if it’s hard to speak.",
  },
];

export const onboardingSteps = [
  {
    id: "profile",
    title: "Add your health profile",
    description: "Start with basics like age; you can fill in the rest over time.",
    route: "/health-profile",
  },
  {
    id: "calendar",
    title: "Pick your calendar",
    description: "Choose the calendar you use most—we’ll use it when scheduling features are available.",
    route: "/health-profile",
  },
  {
    id: "benefits",
    title: "Connect your benefits",
    description: "Add a work invite code or your plans in Settings so your coverage shows up here.",
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
    title: "Set up job roles",
    description: "Define coverage and limits by role so each employee gets the right plan.",
    route: "/employer",
  },
  {
    id: "keys",
    title: "Share invite codes",
    description: "Employees enter their code once in Settings to link their work benefits.",
    route: "/settings",
  },
  {
    id: "compass",
    title: "Find care nearby",
    description: "Use Health Compass to look up clinics and pharmacies when you need a starting point.",
    route: "/health-compass",
  },
];

export const employerQuickActions = [
  { id: "hub", label: "Employer Hub", icon: "user", active: true, route: "/employer" },
  { id: "compass", label: "Health Compass", icon: "calendar", active: true, route: "/health-compass" },
  { id: "emergency", label: "Emergency", icon: "heart", active: true, route: "/emergency" },
  { id: "settings", label: "Settings", icon: "shield", active: true, route: "/settings" },
];
