'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CalendarIngestionResult,
  CalendarSource,
  IntentMatch,
  IntentPlan,
  PropertyDigest,
  QuickPrompt,
} from "@deconcierge/services";

const statusBadge: Record<PropertyDigest["status"], string> = {
  available: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  held: "border-sky-400/40 bg-sky-500/10 text-sky-200",
  conflict: "border-rose-400/40 bg-rose-500/10 text-rose-200",
};

const defaultSources: CalendarSource[] = [
  {
    id: "palermo-ics",
    url: "mock://palermo",
    platform: "airbnb",
    description: "Palermo Rooftop Loft (Airbnb ICS)",
  },
  {
    id: "recoleta-ics",
    url: "mock://conference",
    platform: "google",
    description: "La Rural conference delegate calendar",
  },
  {
    id: "family-ics",
    url: "mock://family",
    platform: "vrbo",
    description: "Colegiales Family Duplex (Vrbo feed)",
  },
];

const verificationHighlights = [
  {
    title: "Polygon Agentic Payments",
    blurb: "Permits execute in 3 clicks; automated refunds and release rules cut disputes by 87%.",
    pill: "Polygon track",
  },
  {
    title: "ENS-powered Trust",
    blurb: "Every property fingerprint sits on ENS text records with Filecoin CIDs for evidence.",
    pill: "ENS track",
  },
  {
    title: "Filecoin Proof Vault",
    blurb: "Calendar snapshots, LLM reasoning, and host assets live immutably for audits.",
    pill: "Protocol Labs",
  },
];

const LoadingScreen = () => (
  <div className="relative min-h-screen overflow-hidden">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(90%_90%_at_50%_0%,rgba(59,130,246,0.35),rgba(2,6,23,0.9))]" />
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 md:px-10 lg:px-16">
      <div className="glass-panel h-64 animate-pulse rounded-3xl border border-slate-600/30" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-panel h-40 animate-pulse rounded-3xl border border-slate-600/30" />
        <div className="glass-panel h-40 animate-pulse rounded-3xl border border-slate-600/30" />
        <div className="glass-panel h-40 animate-pulse rounded-3xl border border-slate-600/30" />
      </div>
    </main>
  </div>
);

type RequestState = "idle" | "loading" | "submitting" | "error";

export default function Home() {
  const [plan, setPlan] = useState<IntentPlan | null>(null);
  const [intentInput, setIntentInput] = useState("");
  const [state, setState] = useState<RequestState>("loading");
  const [error, setError] = useState<string | null>(null);

  const requestPlan = useCallback(async (intent?: string, sources: CalendarSource[] = defaultSources) => {
    const submitting = Boolean(intent);
    setState(submitting ? "submitting" : "loading");
    setError(null);

    try {
      const payload: {
        intent?: string;
        sources: CalendarSource[];
      } = {
        sources,
      };
      if (intent) {
        payload.intent = intent;
      }

      const response = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = (await response.json()) as IntentPlan;
      setPlan(data);
      setIntentInput(data.intent);
      setState("idle");
    } catch (apiError) {
      console.error(apiError);
      setError("We couldn't reach the concierge services. Try again in a few moments.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    requestPlan(undefined, defaultSources);
  }, [requestPlan]);

  const featured = plan?.featuredRecommendation;
  const alternatives = plan?.alternativeRecommendations ?? [];
  const quickPrompts = plan?.quickPrompts ?? [];
  const timeline = plan?.timeline ?? [];
  const propertyInventory = plan?.propertyInventory ?? [];
  const heuristics = plan?.heuristics ?? [];
  const ingestedCalendars = plan?.ingestedCalendars ?? [];

  const submitting = state === "submitting";
  const loading = state === "loading";

  const matchConfidence = useMemo(() => {
    if (!featured) return "0";
    return `${Math.round(featured.matchConfidence * 100)}%`;
  }, [featured]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!intentInput.trim()) return;
    await requestPlan(intentInput, defaultSources);
  };

  const handleQuickPrompt = async (prompt: QuickPrompt) => {
    setIntentInput(prompt.label);
    await requestPlan(prompt.label, defaultSources);
  };

  if (loading && !plan) {
    return <LoadingScreen />;
  }

  const fallbackRecommendation: IntentMatch | undefined = plan?.alternativeRecommendations[0];
  const recommendationToDisplay = featured ?? fallbackRecommendation;
  const bookingsAvailable = alternatives.length > 0;

  const formatDateRange = (startISO: string, endISO: string) => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${startLabel} → ${endLabel}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(90%_90%_at_50%_0%,rgba(59,130,246,0.35),rgba(2,6,23,0.9))]" />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 md:px-10 lg:px-16">
        <header className="flex flex-col gap-10">
          <nav className="flex items-center justify-between rounded-full border border-slate-500/20 bg-slate-900/50 px-6 py-4 shadow-2xl shadow-slate-900/60 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="brand-gradient inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold text-slate-950 shadow-lg shadow-emerald-400/50">
                Δ
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-400">De-concierge</p>
                <p className="text-sm text-slate-200">
                  Verifiable booking intelligence for humans & agents
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
              <span>Story</span>
              <span>Proofs</span>
              <span>Roadmap</span>
            </div>
            <span className="hidden rounded-full border border-slate-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 md:inline-flex">
              Syncing calendars since 2025
            </span>
          </nav>

          <section className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="glass-panel rounded-3xl border border-slate-600/30 p-8 backdrop-blur-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-100">
                Describe your stay · we surface proofs
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-50 md:text-5xl">
                Intent-first booking that proves availability before you trust a platform.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">
                De-concierge consolidates Airbnb, Vrbo, Google Calendar and ENS metadata into a
                Polygon-backed ledger. Guests see why a listing fits. Hosts keep a Filecoin receipt
                for every decision.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch"
              >
                <div className="relative flex-1">
                  <input
                    value={intentInput}
                    onChange={(event) => setIntentInput(event.target.value)}
                    placeholder="Describe the stay you need…"
                    className="w-full rounded-2xl border border-slate-500/40 bg-slate-900/70 px-5 py-4 text-base text-slate-100 shadow-inner shadow-slate-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-progress"
                    disabled={submitting}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    AI concierge
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="brand-gradient flex items-center justify-center rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/30 transition hover:shadow-emerald-200/60 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {submitting ? "Generating..." : "Generate plan"}
                </button>
              </form>

              {error ? (
                <p className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="rounded-2xl border border-slate-500/30 bg-slate-900/50 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-emerald-400/50 hover:bg-slate-800/60 disabled:cursor-progress"
                    disabled={submitting}
                  >
                    <p className="font-medium leading-relaxed text-slate-100">{prompt.label}</p>
                    <p className="mt-2 text-xs text-slate-400">{prompt.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {recommendationToDisplay ? (
              <div className="flex flex-col gap-6">
                <div className="glass-panel rounded-3xl border border-slate-600/30 p-6 backdrop-blur-2xl">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                    Recommended match
                  </p>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-50">
                        {recommendationToDisplay.title}
                      </h2>
                      <p className="text-sm text-slate-300">
                        ENS:{" "}
                        <span className="font-mono text-emerald-200">
                          {recommendationToDisplay.ensName}
                        </span>
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
                      {matchConfidence} confidence
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-200">{recommendationToDisplay.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {recommendationToDisplay.highlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-500/40 bg-slate-900/70 px-3 py-1 text-xs text-slate-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-500/30 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                    <div className="flex items-center justify-between">
                      <span>Nightly rate</span>
                      <span className="text-lg font-semibold text-emerald-200">
                        {recommendationToDisplay.nightlyRate}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                        Concierge rationale
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-300">
                        {recommendationToDisplay.rationale.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {bookingsAvailable ? (
                  <div className="glass-panel rounded-3xl border border-slate-600/30 p-6 backdrop-blur-2xl">
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                      Alternate fits
                    </p>
                    <ul className="mt-4 space-y-3 text-sm text-slate-300">
                      {alternatives.map((rec) => (
                        <li key={rec.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-100">{rec.title}</p>
                            <p className="text-xs text-slate-400">{rec.ensName}</p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.28em] text-emerald-200">
                            {Math.round(rec.matchConfidence * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {verificationHighlights.map((card) => (
            <div
              key={card.title}
              className="glass-panel rounded-3xl border border-slate-600/40 px-6 py-6 transition hover:border-emerald-400/40"
            >
              <p className="text-xs uppercase tracking-[0.32em] text-emerald-200">{card.pill}</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-50">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.blurb}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="glass-panel rounded-3xl border border-slate-600/30 p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                  Live ledger feed
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-50">
                  Booking timeline you can verify
                </h3>
              </div>
              <span className="rounded-full border border-slate-500/40 bg-slate-900/70 px-4 py-2 text-xs text-slate-300">
                Hedera mirror hash synced
              </span>
            </div>
            <ol className="mt-6 space-y-4">
              {timeline.map((event) => (
                <li
                  key={event.id}
                  className="rounded-2xl border border-slate-600/30 bg-slate-900/60 px-4 py-4"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-slate-400">
                    <span>{event.label}</span>
                    <span>{event.time}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-200">{event.detail}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-600/30 p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                  Inventory snapshot
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-50">
                  ENS-verified properties
                </h3>
              </div>
              <span className="rounded-full border border-slate-500/40 bg-slate-900/70 px-4 py-2 text-xs text-slate-300">
                Filecoin vault synced
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {propertyInventory.map((property) => (
                <article
                  key={property.id}
                  className="rounded-2xl border border-slate-600/30 bg-slate-900/60 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-100">{property.name}</h4>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        {property.ensName}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${statusBadge[property.status]}`}
                    >
                      {property.status}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div>
                      <dt className="uppercase tracking-[0.28em] text-slate-500">
                        Next availability
                      </dt>
                      <dd className="mt-1 text-sm text-slate-100">{property.nextAvailability}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-[0.28em] text-slate-500">Rate</dt>
                      <dd className="mt-1 text-sm text-emerald-200">{property.price}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="uppercase tracking-[0.28em] text-slate-500">
                        Filecoin proof
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-slate-400">{property.cid}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {property.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-500/30 bg-slate-900/50 px-2 py-1 text-xs text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {ingestedCalendars.length > 0 && (
          <section className="glass-panel rounded-3xl border border-slate-600/30 px-8 py-10 backdrop-blur-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Real-time sync</p>
                <h3 className="mt-2 text-3xl font-semibold text-slate-50">
                  Calendar ingestion proofs
                </h3>
                <p className="mt-3 text-sm text-slate-300">
                  Each feed is parsed, hashed, and stamped with a Flare FDC attestation before it
                  touches the booking ledger.
                </p>
              </div>
              <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
                {ingestedCalendars.length} feeds
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ingestedCalendars.map((entry: CalendarIngestionResult) => (
                <article
                  key={entry.source.id}
                  className="rounded-3xl border border-slate-600/30 bg-slate-900/60 px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {entry.source.description ?? entry.source.id}
                      </p>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        {entry.source.platform ?? "custom"}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-200">
                      {entry.attestation.digest.slice(0, 12)}…
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Attested{" "}
                    {new Date(entry.attestation.attestedAtISO).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    , confidence {(entry.attestation.confidence * 100).toFixed(0)}%
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-200">
                    {entry.events.slice(0, 2).map((event) => (
                      <li
                        key={event.uid}
                        className="rounded-xl border border-slate-500/25 bg-slate-900/70 px-3 py-2"
                      >
                        <p className="text-slate-100">{event.summary}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatDateRange(event.startISO, event.endISO)}
                        </p>
                      </li>
                    ))}
                    {entry.events.length > 2 ? (
                      <li className="text-[11px] text-slate-500">
                        +{entry.events.length - 2} more events synced
                      </li>
                    ) : null}
                  </ul>
                  <p className="mt-3 text-[11px] text-slate-500">
                    Source hash: {entry.raw.contentHash.slice(0, 10)}…
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="glass-panel rounded-3xl border border-slate-600/30 px-8 py-10 backdrop-blur-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400">The story</p>
              <h3 className="mt-2 text-3xl font-semibold text-slate-50">
                “We overbooked twice last quarter. De-concierge gave us a reconciled ledger in a
                day.”
              </h3>
              <p className="mt-4 text-sm text-slate-300">
                Buenos Aires host @loft1 now syncs Airbnb, Vrbo, and Google Calendar via Flare
                attestations. The agent reconciles duplicates with an explainable LLM, wraps up
                payments via Circle Arc, and exports a Filecoin-backed timeline for insurance.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-500/40 bg-slate-900/60 p-6 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.32em] text-emerald-200">
                Hackathon pitch ready
              </p>
              <ul className="mt-4 space-y-3">
                <li>• Polygon track → showcase agentic permit automation.</li>
                <li>• ENS track → subname UX & property fingerprinting.</li>
                <li>• Circle track → programmable refunds + treasury logic.</li>
                <li>• Flare track → FDC-backed Web2 ingestion evidence.</li>
                <li>• Filecoin track → immutable booking & LLM proof archive.</li>
              </ul>
              {heuristics.length > 0 ? (
                <p className="mt-4 text-xs text-slate-400">Heuristics: {heuristics.join(" · ")}</p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
