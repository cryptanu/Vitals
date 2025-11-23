import { ingestCalendarFromUrl } from "./ics";
import type { CalendarSource, CalendarIngestionResult } from "./types";

export { ingestCalendarFromUrl } from "./ics";
export type {
  CalendarSource,
  CalendarIngestionResult,
  NormalizedCalendarEvent,
  AttestationResult,
  StorageProof,
} from "./types";
export { persistCalendarSnapshot } from "./storage/filecoin";

export const ingestCalendars = async (
  sources: CalendarSource[],
  concurrency = 3
): Promise<CalendarIngestionResult[]> => {
  const results: CalendarIngestionResult[] = [];
  const queue = [...sources];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const source = queue.shift();
      if (!source) break;
      const result = await ingestCalendarFromUrl(source);
      results.push(result);
    }
  });

  await Promise.all(workers);
  return results;
};

