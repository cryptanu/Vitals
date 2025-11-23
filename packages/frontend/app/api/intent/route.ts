import { NextResponse } from "next/server";
import {
  generateIntentPlan,
  type CalendarSource,
  type GenerateIntentPlanOptions,
} from "@deconcierge/services";

const MAX_INTENT_LENGTH = 512;

const sanitizeIntent = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_INTENT_LENGTH);
};

export async function GET() {
  const plan = await generateIntentPlan();
  return NextResponse.json(plan);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { intent: rawIntent, sources: rawSources } = payload as {
    intent?: unknown;
    sources?: unknown;
  };

  const intent = sanitizeIntent(rawIntent);
  const sources = sanitizeSources(rawSources);

  const options: GenerateIntentPlanOptions = {};
  if (sources.length > 0) {
    options.sources = sources;
  }

  const plan = await generateIntentPlan(intent, options);
  return NextResponse.json(plan);
}

const sanitizeSources = (value: unknown): CalendarSource[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const { id, url, platform, description } = item as {
        id?: unknown;
        url?: unknown;
        platform?: unknown;
        description?: unknown;
      };
      if (typeof id !== "string" || typeof url !== "string") return null;
      const source: CalendarSource = {
        id,
        url,
        platform:
          typeof platform === "string" ? (platform as CalendarSource["platform"]) : undefined,
        description: typeof description === "string" ? description : undefined,
      };
      return source;
    })
    .filter((item): item is CalendarSource => Boolean(item));
};

