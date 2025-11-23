import type { CalendarIngestionResult } from "./ingestion/types";

export type PropertyStatus = "available" | "held" | "conflict";

export type QuickPrompt = {
  id: string;
  label: string;
  hint: string;
  keywords: string[];
};

export type RecommendationBase = {
  id: string;
  intentExample: string;
  title: string;
  ensName: string;
  nightlyRate: string;
  summary: string;
  highlights: string[];
  propertyId: string;
  keywords: string[];
  priority?: number;
};

export type IntentMatch = RecommendationBase & {
  matchConfidence: number;
  rationale: string[];
  matchedKeywords: string[];
};

export type TimelineEvent = {
  id: string;
  propertyId: string;
  time: string;
  label: string;
  detail: string;
};

export type PropertyDigest = {
  id: string;
  name: string;
  ensName: string;
  status: PropertyStatus;
  nextAvailability: string;
  price: string;
  cid: string;
  tags: string[];
  relatedRecommendationIds: string[];
  lastSyncISO: string;
};

export type IntentPlan = {
  intent: string;
  quickPrompts: QuickPrompt[];
  featuredRecommendation: IntentMatch;
  alternativeRecommendations: IntentMatch[];
  timeline: TimelineEvent[];
  propertyInventory: PropertyDigest[];
  heuristics: string[];
  generatedAtISO: string;
  ingestedCalendars?: CalendarIngestionResult[];
};

export type {
  CalendarSource,
  CalendarIngestionResult,
  NormalizedCalendarEvent,
  AttestationResult,
  StorageProof,
} from "./ingestion/types";

