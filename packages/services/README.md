# De-concierge Services

Shared domain services powering De-concierge. Everything lives in TypeScript so the Next.js app
and future workers can import the same logic.

Currently implemented
---------------------

- `generateIntentPlan(intent?: string)` – scores guest intents against concierge templates and
  returns featured + alternate recommendations, timeline events, heuristics, and property inventory.
- `listQuickPrompts()` – returns curated quick prompts for the UI.
- `getPropertyInventory(featuredId?)` & `getTimelineForProperty(propertyId)` – utilities for ENS
  property cards and verifiable timeline feed.
- Sample data (`src/data/sample.ts`) standing in for future integrations (Flare, Filecoin, Nylas, etc.).
- Intent scoring helpers in `src/utils/intentScoring.ts`.
- Calendar ingestion helper `ingestCalendarFromUrl(source)` that:
  - Fetches remote ICS feeds
  - Normalizes events into our internal format
  - Generates a placeholder Flare FDC attestation (to be swapped with real proof)
  - Persists the snapshot to Filecoin Onchain Cloud via the Synapse SDK when credentials are present

### Synapse integration

Set the following environment variables (workspace root or `packages/services/.env`) to enable real Filecoin storage:

```
SYNAPSE_NETWORK=calibration          # or mainnet
SYNAPSE_RPC_URL=https://api.node.glif.io/rpc/v1
SYNAPSE_PRIVATE_KEY=0x...
# optional overrides
SYNAPSE_ACCOUNT_LABEL=DeConciergeStaging
```

If these values are missing the service falls back to deterministic CIDs so local development stays unblocked.

Roadmap
-------

- Calendar ingestion (iCal + Nylas) with Flare Data Connector attestations.
- Duplicate detection engine combining deterministic scoring + LLM reasoning with Filecoin proofs.
- Booking agent runner for Polygon confirmations, Circle payouts, and notification hooks.
- Intent orchestrator improvements (vector search + OpenAI prompts).

