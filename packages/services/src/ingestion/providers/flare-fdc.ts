import { DateTime } from "luxon";
import { fetch } from "undici";
import type { AttestationResult, RawCalendarPayload } from "../types";

type FlareFdcResponse = {
  digest?: string;
  attestedAtISO?: string;
  confidence?: number;
  signature?: string;
  proofUri?: string;
  workflowRunId?: string;
  notes?: string;
  message?: string;
};

const getEndpoint = (): string | undefined =>
  process.env.FLARE_FDC_ATTESTATION_URL ?? process.env.FLARE_FDC_ENDPOINT;

const buildHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = process.env.FLARE_FDC_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
};

const mapResponse = (payload: RawCalendarPayload, response: FlareFdcResponse): AttestationResult => {
  const attestedAt =
    response.attestedAtISO ??
    DateTime.utc().toISO() ??
    payload.fetchedAtISO ??
    new Date().toISOString();

  return {
    provider: "flare-fdc",
    digest: response.digest ?? payload.contentHash,
    attestedAtISO: attestedAt,
    confidence:
      typeof response.confidence === "number" && response.confidence >= 0 && response.confidence <= 1
        ? response.confidence
        : 0.75,
    signature: response.signature,
    proofUri: response.proofUri,
    workflowRunId: response.workflowRunId,
    notes: response.notes ?? response.message ?? "Flare Data Connector attested calendar payload.",
  };
};

const fallbackAttestation = (payload: RawCalendarPayload, note: string): AttestationResult => ({
  provider: "flare-fdc",
  digest: payload.contentHash,
  attestedAtISO: DateTime.utc().toISO() ?? new Date().toISOString(),
  confidence: 0.75,
  notes: note,
});

export const attestWithFlareFdc = async (
  payload: RawCalendarPayload
): Promise<AttestationResult> => {
  const endpoint = getEndpoint();
  if (!endpoint) {
    return fallbackAttestation(
      payload,
      "Flare endpoint not configured; returning locally computed digest."
    );
  }

  const body = {
    datasetId: process.env.FLARE_FDC_DATASET_ID,
    payload: {
      calendarSource: payload.source,
      fetchedAtISO: payload.fetchedAtISO,
      icsBodyBase64: Buffer.from(payload.icsBody, "utf8").toString("base64"),
      contentHash: payload.contentHash,
      contentLength: payload.contentLength,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Flare FDC attestation failed (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as FlareFdcResponse;
    return mapResponse(payload, json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Flare FDC error";
    return fallbackAttestation(payload, `Failed to reach Flare FDC: ${message}`);
  }
};

