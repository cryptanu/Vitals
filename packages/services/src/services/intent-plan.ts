import { DateTime } from "luxon";
import { QUICK_PROMPTS, RECOMMENDATIONS } from "../data/sample";
import type { CalendarIngestionResult, CalendarSource, IntentPlan, IntentMatch } from "../types";
import { computeConfidence, normalizeIntent, scoreRecommendation } from "../utils/intentScoring";
import { getPropertyInventory } from "./properties";
import { getTimelineForProperty } from "./timeline";
import { ingestCalendars } from "../ingestion";

const DEFAULT_INTENT =
  "Find a sunlit loft in Palermo for next weekend"; // matches first prompt for bootstrapping

export type GenerateIntentPlanOptions = {
  sources?: CalendarSource[];
};

export const generateIntentPlan = async (
  rawIntent?: string,
  options: GenerateIntentPlanOptions = {}
): Promise<IntentPlan> => {
  const normalizedIntent = normalizeIntent(rawIntent ?? "");
  const intentText = rawIntent?.trim().length ? rawIntent.trim() : DEFAULT_INTENT;

  const scored = RECOMMENDATIONS.map((recommendation) => {
    const { score, matchedKeywords } = scoreRecommendation(normalizedIntent, recommendation);
    const confidence = computeConfidence(score);
    const rationale = buildRationale(recommendation.intentExample, intentText, matchedKeywords);
    return {
      ...recommendation,
      matchConfidence: confidence,
      matchedKeywords,
      rationale,
    } satisfies IntentMatch;
  }).sort((a, b) => b.matchConfidence - a.matchConfidence);

  const featuredRecommendation = scored[0];
  const alternativeRecommendations = scored.slice(1);
  const propertyInventory = getPropertyInventory(featuredRecommendation.propertyId);
  const timeline = getTimelineForProperty(featuredRecommendation.propertyId);

  const heuristics = buildHeuristics(featuredRecommendation, intentText);

  let ingestedCalendars: CalendarIngestionResult[] | undefined;
  if (options.sources && options.sources.length > 0) {
    try {
      ingestedCalendars = await ingestCalendars(options.sources);
    } catch (error) {
      console.error("Calendar ingestion failed", error);
    }
  }

  return {
    intent: intentText,
    quickPrompts: QUICK_PROMPTS,
    featuredRecommendation,
    alternativeRecommendations,
    timeline,
    propertyInventory,
    heuristics,
    generatedAtISO: DateTime.utc().toISO(),
    ingestedCalendars,
  };
};

const buildRationale = (
  referenceIntent: string,
  requestedIntent: string,
  matchedKeywords: string[]
): string[] => {
  const rationales: string[] = [];

  if (matchedKeywords.length > 0) {
    rationales.push(
      `Matched key phrases: ${matchedKeywords
        .map((word) => `“${word}”`)
        .join(", ")} from the guest request.`
    );
  }

  if (referenceIntent.toLowerCase() === requestedIntent.toLowerCase()) {
    rationales.push("Exact match to one of the concierge quick prompts.");
  } else {
    rationales.push(`Closest concierge template: “${referenceIntent}”.`);
  }

  rationales.push("Filecoin CID and Polygon booking proof available for audit.");
  return rationales;
};

const buildHeuristics = (featured: IntentMatch, intent: string): string[] => {
  const heuristics: string[] = [];
  if (featured.matchedKeywords.length > 0) {
    heuristics.push(
      `Intent "${intent}" overlapped with ${featured.matchedKeywords.length} tracked keyword(s).`
    );
  } else {
    heuristics.push("Fallback to highest confidence concierge template for this intent slice.");
  }
  heuristics.push(`Confidence scored at ${(featured.matchConfidence * 100).toFixed(0)}%.`);
  heuristics.push(
    `Property ${featured.propertyId} exposes ENS handle ${featured.ensName} and Filecoin CID evidence.`
  );
  return heuristics;
};

