import { createHash } from "crypto";
import { DateTime } from "luxon";
import type { AttestationProvider, AttestationResult, RawCalendarPayload } from "../types";
import { attestWithFlareFdc } from "./flare-fdc";

const providerEnv = process.env.CALENDAR_ATTESTATION_PROVIDER ?? process.env.ATTESTATION_PROVIDER;

const normalizeProvider = (): AttestationProvider => {
  if (!providerEnv) return "flare-fdc";
  switch (providerEnv.toLowerCase()) {
    case "mock":
      return "mock";
    case "flare":
    case "flare-fdc":
    default:
      return "flare-fdc";
  }
};

const createMockAttestation = (payload: RawCalendarPayload, note?: string): AttestationResult => ({
  provider: "mock",
  digest: createHash("sha3-256").update(payload.icsBody, "utf8").digest("hex"),
  attestedAtISO: DateTime.utc().toISO() ?? payload.fetchedAtISO,
  confidence: 0.5,
  notes:
    note ??
    "Mock attestation fallback used. Provide CALENDAR_ATTESTATION_PROVIDER env vars to enable real attestations.",
});

export const resolveAttestationProvider = normalizeProvider;

export const attestCalendarPayload = async (
  payload: RawCalendarPayload
): Promise<AttestationResult> => {
  const provider = resolveAttestationProvider();

  try {
    switch (provider) {
      case "flare-fdc":
        return await attestWithFlareFdc(payload);
      case "mock":
      default:
        return createMockAttestation(payload);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown attestation error";
    return createMockAttestation(payload, `Attestation failed (${provider}): ${message}`);
  }
};


