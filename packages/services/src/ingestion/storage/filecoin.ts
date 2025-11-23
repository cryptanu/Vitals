import { createHash } from "crypto";
import { DateTime } from "luxon";
import { fetch } from "undici";
import { getSynapseClient } from "./synapse";
import type { AttestationResult, RawCalendarPayload, StorageProof } from "../types";

type FilecoinResponse = {
  cid?: string;
  uri?: string;
  persistedAtISO?: string;
  notes?: string;
  message?: string;
};

const getEndpoint = (): string | undefined =>
  process.env.FILECOIN_ONCHAIN_CLOUD_URL ??
  process.env.FILECOIN_ONCHAIN_CLOUD_ENDPOINT ??
  process.env.FILECOIN_STORAGE_ENDPOINT;

const buildHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = process.env.FILECOIN_ONCHAIN_CLOUD_TOKEN ?? process.env.FILECOIN_STORAGE_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const mockCid = (payload: RawCalendarPayload, attestation: AttestationResult): string => {
  const digest = createHash("sha256")
    .update(`${payload.contentHash}:${attestation.digest}`, "utf8")
    .digest("hex");
  return `bafy${digest.slice(0, 56)}`;
};

const fallbackStorageProof = (
  payload: RawCalendarPayload,
  attestation: AttestationResult,
  note: string
): StorageProof => ({
  cid: mockCid(payload, attestation),
  persistedAtISO: DateTime.utc().toISO() ?? payload.fetchedAtISO,
  notes: note,
});

export const persistCalendarSnapshot = async (
  payload: RawCalendarPayload,
  attestation: AttestationResult
): Promise<StorageProof> => {
  const synapseProof = await persistWithSynapse(payload, attestation);
  if (synapseProof) {
    return synapseProof;
  }

  const endpoint = getEndpoint();
  if (!endpoint) {
    return fallbackStorageProof(
      payload,
      attestation,
      "Filecoin endpoint not configured; generated deterministic placeholder CID."
    );
  }

  const body = {
    source: payload.source,
    attestation,
    fetchedAtISO: payload.fetchedAtISO,
    contentHash: payload.contentHash,
    icsBodyBase64: Buffer.from(payload.icsBody, "utf8").toString("base64"),
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Filecoin storage failed (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as FilecoinResponse;
    const persistedAt =
      json.persistedAtISO ?? DateTime.utc().toISO() ?? payload.fetchedAtISO ?? new Date().toISOString();

    return {
      cid: json.cid ?? mockCid(payload, attestation),
      uri: json.uri,
      persistedAtISO: persistedAt,
      notes: json.notes ?? json.message ?? "Calendar snapshot stored via Filecoin Onchain Cloud.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Filecoin error";
    return fallbackStorageProof(payload, attestation, `Failed to persist snapshot: ${message}`);
  }
};

const persistWithSynapse = async (
  payload: RawCalendarPayload,
  attestation: AttestationResult
): Promise<StorageProof | null> => {
  const client = await getSynapseClient();
  if (!client) {
    return null;
  }

  try {
    const contentBuffer = Buffer.from(payload.icsBody, "utf8");
    const label = `vitals-${payload.source ?? "calendar"}-${DateTime.utc().toFormat("yyyyLLddHHmmss")}`;
    const result = (await client.storage.createDataSetAndAddPieces({
      dataset: {
        label,
        metadata: {
          source: payload.source,
          storyteller: "de-concierge",
          fetchedAtISO: payload.fetchedAtISO,
          attestationDigest: attestation.digest,
        },
      },
      pieces: [
        {
          bytes: contentBuffer,
          mimeType: "text/calendar",
          metadata: {
            contentHash: payload.contentHash,
            attestDigest: attestation.digest,
            issuedAt: payload.fetchedAtISO ?? DateTime.utc().toISO(),
          },
        },
      ],
    })) as {
      datasetId?: string;
      pieces?: Array<{ cid?: string; uri?: string; notes?: string; persistedAtISO?: string }>;
      piece?: { cid?: string; uri?: string; notes?: string; persistedAtISO?: string };
    };

    const piece = result.pieces?.[0] ?? result.piece;
    if (!piece?.cid) {
      return null;
    }

    return {
      cid: piece.cid,
      uri: piece.uri ?? `synapse://${result.datasetId ?? "dataset"}/${piece.cid}`,
      persistedAtISO: piece.persistedAtISO ?? DateTime.utc().toISO() ?? payload.fetchedAtISO,
      notes: piece.notes ?? "Calendar snapshot persisted via Synapse SDK",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Synapse error";
    console.warn("[Synapse] storage failure, falling back to mock CID:", message);
    return null;
  }
};


