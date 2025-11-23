export type CalendarSource = {
  id: string;
  url: string;
  platform?: "airbnb" | "vrbo" | "booking" | "google" | "custom";
  description?: string;
};

export type RawCalendarPayload = {
  source: CalendarSource;
  fetchedAtISO: string;
  icsBody: string;
  contentLength: number;
  contentHash: string;
};

export type NormalizedCalendarEvent = {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startISO: string;
  endISO: string;
  allDay: boolean;
  status?: string;
  source: CalendarSource;
};

export type AttestationResult = {
  provider: "flare-fdc";
  digest: string;
  attestedAtISO: string;
  confidence: number;
  notes?: string;
};

export type CalendarIngestionResult = {
  source: CalendarSource;
  raw: RawCalendarPayload;
  attestation: AttestationResult;
  events: NormalizedCalendarEvent[];
};

