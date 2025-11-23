import { DateTime } from "luxon";

type SampleEventDefinition = {
  uid: string;
  startISO: string;
  endISO: string;
  summary: string;
  description?: string;
  location?: string;
  status?: string;
};

type SampleDefinition = {
  url: string;
  prodId: string;
  events: SampleEventDefinition[];
};

const formatUtc = (iso: string) =>
  DateTime.fromISO(iso, { zone: "utc" }).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");

const buildIcs = (definition: SampleDefinition): string => {
  const dtstamp = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//De-concierge//${definition.prodId}//EN`,
    ...definition.events.flatMap((event) => {
      const eventLines = [
        "BEGIN:VEVENT",
        `UID:${event.uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${formatUtc(event.startISO)}`,
        `DTEND:${formatUtc(event.endISO)}`,
        `SUMMARY:${event.summary}`,
      ];

      if (event.description) {
        eventLines.push(`DESCRIPTION:${event.description}`);
      }
      if (event.location) {
        eventLines.push(`LOCATION:${event.location}`);
      }
      if (event.status) {
        eventLines.push(`STATUS:${event.status}`);
      }

      eventLines.push("END:VEVENT");
      return eventLines;
    }),
    "END:VCALENDAR",
  ];

  return lines.join("\n");
};

const sampleDefinitions: SampleDefinition[] = [
  {
    url: "mock://palermo",
    prodId: "Palermo Rooftop Loft",
    events: [
      {
        uid: "palermo-001",
        startISO: "2025-03-14T18:00:00Z",
        endISO: "2025-03-17T15:00:00Z",
        summary: "Booking - Palermo Rooftop Loft",
        description: "Imported from Airbnb - reservation #84721",
        location: "Palermo, Buenos Aires",
        status: "CONFIRMED",
      },
      {
        uid: "palermo-buffer",
        startISO: "2025-03-17T15:00:00Z",
        endISO: "2025-03-18T15:00:00Z",
        summary: "Cleaning buffer",
        status: "TENTATIVE",
      },
    ],
  },
  {
    url: "mock://conference",
    prodId: "Recoleta Executive Suite",
    events: [
      {
        uid: "conference-001",
        startISO: "2025-09-12T17:00:00Z",
        endISO: "2025-09-15T15:00:00Z",
        summary: "La Rural Executive Stay",
        description: "Google Calendar import - confirmed via Nylas",
        location: "Recoleta Executive Suite",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://family",
    prodId: "Colegiales Family Duplex",
    events: [
      {
        uid: "family-001",
        startISO: "2025-04-02T12:00:00Z",
        endISO: "2025-04-07T15:00:00Z",
        summary: "Family Duplex Stay",
        description: "Vrbo reservation #552133",
        location: "Colegiales Family Duplex",
        status: "CONFIRMED",
      },
      {
        uid: "family-conflict",
        startISO: "2025-04-05T16:00:00Z",
        endISO: "2025-04-06T15:00:00Z",
        summary: "Potential conflict - Airbnb lead",
        status: "TENTATIVE",
      },
    ],
  },
  {
    url: "mock://madero",
    prodId: "Puerto Madero River Loft",
    events: [
      {
        uid: "madero-001",
        startISO: "2025-03-20T18:00:00Z",
        endISO: "2025-03-23T15:00:00Z",
        summary: "River Loft Weekend Booking",
        description: "Booking.com reservation #33120",
        location: "Puerto Madero, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://belgrano",
    prodId: "Belgrano Garden Townhouse",
    events: [
      {
        uid: "belgrano-001",
        startISO: "2025-04-10T19:00:00Z",
        endISO: "2025-04-15T15:00:00Z",
        summary: "Garden Townhouse Stay",
        description: "Airbnb reservation #68211",
        location: "Belgrano, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://santelmo",
    prodId: "San Telmo Designer Studio",
    events: [
      {
        uid: "santelmo-001",
        startISO: "2025-03-05T16:00:00Z",
        endISO: "2025-03-09T12:00:00Z",
        summary: "San Telmo Weekend Stay",
        description: "Manual override: verified by host ENS text record",
        location: "San Telmo, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://retiro",
    prodId: "Retiro Corporate Suite",
    events: [
      {
        uid: "retiro-001",
        startISO: "2025-05-02T18:00:00Z",
        endISO: "2025-05-05T15:00:00Z",
        summary: "Corporate Suite Engagement",
        description: "Synced via Google Workspace",
        location: "Retiro, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://palermo-hollywood",
    prodId: "Palermo Hollywood Penthouse",
    events: [
      {
        uid: "phollywood-001",
        startISO: "2025-06-12T17:00:00Z",
        endISO: "2025-06-16T15:00:00Z",
        summary: "Penthouse Film Crew Booking",
        description: "Industry booking confirmed by agent",
        location: "Palermo Hollywood, Buenos Aires",
        status: "CONFIRMED",
      },
      {
        uid: "phollywood-buffer",
        startISO: "2025-06-16T15:00:00Z",
        endISO: "2025-06-17T18:00:00Z",
        summary: "Maintenance buffer",
        status: "TENTATIVE",
      },
    ],
  },
  {
    url: "mock://microcentro",
    prodId: "Microcentro Business Flat",
    events: [
      {
        uid: "micro-001",
        startISO: "2025-02-25T13:00:00Z",
        endISO: "2025-02-28T12:00:00Z",
        summary: "Business Flat Corporate Stay",
        description: "Synced from Salesforce integration",
        location: "Microcentro, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://chacarita",
    prodId: "Chacarita Creative Loft",
    events: [
      {
        uid: "chacarita-001",
        startISO: "2025-04-18T18:00:00Z",
        endISO: "2025-04-22T15:00:00Z",
        summary: "Creative Loft Residency",
        description: "Art collective stay",
        location: "Chacarita, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://villacrespo",
    prodId: "Villa Crespo Cozy Nook",
    events: [
      {
        uid: "crespo-001",
        startISO: "2025-03-28T17:00:00Z",
        endISO: "2025-03-30T14:00:00Z",
        summary: "Cozy Nook Weekend Stay",
        description: "Direct booking via De-concierge widget",
        location: "Villa Crespo, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://barracas",
    prodId: "Barracas Industrial Loft",
    events: [
      {
        uid: "barracas-001",
        startISO: "2025-05-10T16:00:00Z",
        endISO: "2025-05-14T15:00:00Z",
        summary: "Industrial Loft Fashion Shoot",
        description: "Ensured by ENS metadata + FDC proof",
        location: "Barracas, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://boedo",
    prodId: "Boedo Family Home",
    events: [
      {
        uid: "boedo-001",
        startISO: "2025-07-04T18:00:00Z",
        endISO: "2025-07-10T15:00:00Z",
        summary: "Boedo Family Gathering",
        description: "Vrbo reservation #88345",
        location: "Boedo, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://caballito",
    prodId: "Caballito Green Apartment",
    events: [
      {
        uid: "caballito-001",
        startISO: "2025-03-01T14:00:00Z",
        endISO: "2025-03-04T12:00:00Z",
        summary: "Caballito Eco Stay",
        description: "Airbnb green collection booking",
        location: "Caballito, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://nunez",
    prodId: "Núñez Riverside Retreat",
    events: [
      {
        uid: "nunez-001",
        startISO: "2025-06-20T17:00:00Z",
        endISO: "2025-06-24T15:00:00Z",
        summary: "Riverside Retreat Stay",
        description: "Direct host booking",
        location: "Núñez, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://botanico",
    prodId: "Palermo Botanico Flat",
    events: [
      {
        uid: "botanico-001",
        startISO: "2025-08-05T18:00:00Z",
        endISO: "2025-08-08T15:00:00Z",
        summary: "Botanico Flat Botanical Expo",
        description: "Synced via Google Calendar API",
        location: "Palermo Botanico, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://almagro",
    prodId: "Almagro Vintage Loft",
    events: [
      {
        uid: "almagro-001",
        startISO: "2025-04-08T18:00:00Z",
        endISO: "2025-04-11T12:00:00Z",
        summary: "Vintage Loft Music Residency",
        description: "Confirmed via ENS + Flare proof",
        location: "Almagro, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://saavedra",
    prodId: "Saavedra Park Residence",
    events: [
      {
        uid: "saavedra-001",
        startISO: "2025-09-15T18:00:00Z",
        endISO: "2025-09-20T12:00:00Z",
        summary: "Saavedra Park Retreat",
        description: "Corporate wellness retreat",
        location: "Saavedra, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://urquiza",
    prodId: "Villa Urquiza Smart Condo",
    events: [
      {
        uid: "urquiza-001",
        startISO: "2025-10-01T17:00:00Z",
        endISO: "2025-10-05T15:00:00Z",
        summary: "Smart Condo Conference Stay",
        description: "Synced via Calendly integration",
        location: "Villa Urquiza, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
  {
    url: "mock://congreso",
    prodId: "Congreso Heritage Suite",
    events: [
      {
        uid: "congreso-001",
        startISO: "2025-11-03T18:00:00Z",
        endISO: "2025-11-07T12:00:00Z",
        summary: "Heritage Suite Cultural Summit",
        description: "Direct booking with ENS verification",
        location: "Congreso, Buenos Aires",
        status: "CONFIRMED",
      },
    ],
  },
];

const SAMPLE_ICS: Record<string, string> = sampleDefinitions.reduce(
  (acc, definition) => {
    acc[definition.url] = buildIcs(definition);
    return acc;
  },
  {} as Record<string, string>
);

export const getSampleIcs = (url: string): string | undefined => SAMPLE_ICS[url];

