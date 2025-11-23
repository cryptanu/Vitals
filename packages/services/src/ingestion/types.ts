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

export type AttestationProvider = "flare-fdc" | "mock";

export type AttestationResult = {
  provider: AttestationProvider;
  digest: string;
  attestedAtISO: string;
  confidence: number;
  signature?: string;
  workflowRunId?: string;
  proofUri?: string;
  notes?: string;
};

export type StorageProof = {
  cid: string;
  uri?: string;
  persistedAtISO: string;
  notes?: string;
};

export type CalendarIngestionResult = {
  source: CalendarSource;
  raw: RawCalendarPayload;
  attestation: AttestationResult;
  events: NormalizedCalendarEvent[];
  storage?: StorageProof;
};

