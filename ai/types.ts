export interface User {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: { lat: number; lng: number };
  benefits: {
    dental: { total: number; used: number };
    vision: { total: number; used: number };
    physio: { total: number; used: number };
  };
}

export interface Recommendation {
  type: string;
  reason: string;
  urgency: "low" | "medium" | "high";
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;  // base64-encoded image data (no data: prefix)
  imageType?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

export interface Appointment {
  id: string;
  type: string;
  clinicName: string;
  date: string;
  duration: number;
  status: "upcoming" | "past";
}
