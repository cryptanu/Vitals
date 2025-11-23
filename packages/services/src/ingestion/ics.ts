import { createHash } from "crypto";
import ical, { VEvent } from "node-ical";
import { fetch } from "undici";
import { DateTime } from "luxon";
import type {
  CalendarIngestionResult,
  CalendarSource,
  NormalizedCalendarEvent,
  RawCalendarPayload,
} from "./types";
import { attestCalendarPayload } from "./providers";
import { getSampleIcs } from "./samples";
import { persistCalendarSnapshot } from "./storage/filecoin";

const isVEvent = (entry: unknown): entry is VEvent => {
  if (!entry || typeof entry !== "object") return false;
  return (entry as VEvent).type === "VEVENT";
};

const hashContent = (body: string): string =>
  createHash("sha256").update(body, "utf8").digest("hex");

const normalizeEvent = (
  event: VEvent,
  source: CalendarSource
): NormalizedCalendarEvent | null => {
  if (!event.start || !event.end) return null;

  const start = DateTime.fromJSDate(event.start);
  const end = DateTime.fromJSDate(event.end);

  if (!start.isValid || !end.isValid) return null;

  return {
    uid: event.uid ?? `${source.id}:${start.toISO() ?? ""}`,
    summary: event.summary ?? "Untitled stay",
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    startISO: start.toUTC().toISO() ?? start.toISO() ?? "",
    endISO: end.toUTC().toISO() ?? end.toISO() ?? "",
    allDay: Boolean(event.datetype === "date"),
    status: event.status ?? undefined,
    source,
  };
};

export type FetchOptions = {
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export const ingestCalendarFromUrl = async (
  source: CalendarSource,
  options: FetchOptions = {}
): Promise<CalendarIngestionResult> => {
  const fetchBody = async (): Promise<string> => {
    if (source.url.startsWith("mock://")) {
      const sample = getSampleIcs(source.url);
      if (!sample) {
        throw new Error(`No mock ICS registered for ${source.url}`);
      }
      return sample;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);

    try {
      const response = await fetch(source.url, {
        headers: options.headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const sample = getSampleIcs(source.url);
        if (sample) return sample;
        throw new Error(`Failed to fetch ICS (${response.status}): ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      const sample = getSampleIcs(source.url);
      if (sample) return sample;
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };

  const icsBody = await fetchBody();

    const contentHash = hashContent(icsBody);
    const fetchedAtISO = DateTime.utc().toISO();

    const raw: RawCalendarPayload = {
      source,
      fetchedAtISO: fetchedAtISO ?? new Date().toISOString(),
      icsBody,
      contentLength: icsBody.length,
      contentHash,
    };

    const parsed = ical.parseICS(icsBody);
    const events = Object.values(parsed)
      .filter(isVEvent)
      .map((event) => normalizeEvent(event, source))
      .filter((event): event is NormalizedCalendarEvent => Boolean(event));

  const attestation = await attestCalendarPayload(raw);
  const storage = await persistCalendarSnapshot(raw, attestation);

  return {
    source,
    raw,
    attestation,
    events,
    storage,
  };
};

