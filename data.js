/* Synthetic fixtures for the interactive demo.
   No production data: every person, company, email and row below is invented.
   Structure mirrors the real pipeline's shapes so the walkthrough stays faithful. */

window.DEMO_DATA = {
  meta: {
    title: "Autonomous Sourcing & Outreach",
    subtitle: "How a dry-run-by-default agent pipeline finds, scores, and reaches out to partners.",
    syntheticNotice:
      "All names, companies, emails and rows below are synthetic. Nothing here is production data."
  },

  metrics: [
    { value: "8", label: "Pipeline stages", note: "Discovery to feedback dataset" },
    { value: "3", label: "Sourcing tracks", note: "Events, Partners, Speakers" },
    { value: "300+", label: "Operational scripts", note: "Each dry-run by default" },
    { value: "98", label: "Test modules", note: "Offline stages are pure functions" }
  ],

  /* Every stage carries where it runs, whether it touches the network,
     and the artifact it hands to the next stage. */
  stages: [
    {
      id: "discovery",
      n: "01",
      name: "Discovery",
      mode: "online",
      blurb: "Search per geography and track.",
      where: "scripts/sourcing_loop.py",
      artifact: "candidate pool",
      detail:
        "A search API call runs per target geography and track. Queries are built from the city list and the track's intent, so the same engine serves Events, Partners and Speakers without a separate crawler per track.",
      points: [
        "One query plan per city, not per keyword.",
        "Blocklists drop known non-targets before any spend.",
        "Read-only: no writes, only candidate URLs collected."
      ]
    },
    {
      id: "extraction",
      n: "02",
      name: "Extraction",
      mode: "online",
      blurb: "Parse pages into structured fields.",
      where: "services/extraction.py",
      artifact: "candidate rows",
      detail:
        "The LLM reads each candidate page and returns structured fields: company, city, event, date, person, title, links. The model classifies and summarises only. It never decides a score, and it never invents a URL.",
      points: [
        "Candidate CSVs are the interchange format between every stage.",
        "Rubric columns are appended, never renamed.",
        "Missing evidence is left missing, not guessed."
      ]
    },
    {
      id: "scoring",
      n: "03",
      name: "Rubric scoring",
      mode: "offline",
      blurb: "Deterministic fit and priority.",
      where: "services/rubric/",
      artifact: "scored rows",
      detail:
        "Pure functions turn a row into a score. Organization fit and persona fit each run 1 to 5. Market weighting then converts the base score into a priority score without ever changing the base score itself.",
      points: [
        "No network, no LLM: the same row always scores the same.",
        "A score level is assigned only if collected data supports it.",
        "Missing evidence lowers confidence. It never raises the score."
      ]
    },
    {
      id: "personalization",
      n: "04",
      name: "Personalization",
      mode: "online",
      blurb: "Derive an outreach angle.",
      where: "services/personalization.py",
      artifact: "angle + tier",
      detail:
        "Each row is assigned a personalization tier from the evidence it carries. The tier decides whether the contact is eligible for an automated sequence or must go to a human first.",
      points: [
        "Tier 1 and 2 are sequence-eligible. Tier 3 needs review.",
        "Compliment and fit lines are assembled from collected evidence.",
        "No evidence means no personalization. The row goes to review."
      ]
    },
    {
      id: "dedup",
      n: "05",
      name: "Deduplication",
      mode: "online",
      blurb: "The CRM and the outreach platform are authoritative.",
      where: "services/dedup.py",
      artifact: "dedup verdicts",
      detail:
        "Every candidate is matched against live CRM and outreach records on domain, LinkedIn, email and name plus company. Exact matches are dropped. Fuzzy matches are flagged and always routed to a human.",
      points: [
        "Two layers: the CRM and past batch sheets.",
        "Exact matches resolve automatically.",
        "Fuzzy matches never auto-resolve."
      ]
    },
    {
      id: "review",
      n: "06",
      name: "Human review",
      mode: "human",
      blurb: "Qualification by the team.",
      where: "the CRM (human)",
      artifact: "approved set",
      detail:
        "Sourcing stops here. A person decides what is qualified. The agent's job is to make that decision fast and well-evidenced, not to make it.",
      points: [
        "Every row arrives with a source URL.",
        "QC sampling flags low-confidence rows for a second look.",
        "Nothing proceeds on a filename alone."
      ]
    },
    {
      id: "upload",
      n: "07",
      name: "Upload prep",
      mode: "gated",
      blurb: "Gated CRM upload.",
      where: "services/upload_gate.py",
      artifact: "upload plan",
      detail:
        "The upload path builds a plan and refuses to run unless two independent gates are both open. Schema creation needs a third. A plan can be inspected in full before anything is written.",
      points: [
        "Two gates must agree: LIVE_WRITE and ALLOW_CRM_WRITES.",
        "Schema writes need a separate third gate.",
        "The agent never writes the outreach sequence field."
      ]
    },
    {
      id: "feedback",
      n: "08",
      name: "Feedback dataset",
      mode: "offline",
      blurb: "Decisions become training data.",
      where: "services/learning_dataset/",
      artifact: "learning JSONL",
      detail:
        "Approvals and edits are written to a JSONL learning dataset. Generation only: nothing is trained here. Personal fields are redacted on the way out.",
      points: [
        "Every decision becomes a labelled example.",
        "Redaction runs at write time, not read time.",
        "The loop closes without retraining anything automatically."
      ]
    }
  ],

  tracks: [
    {
      id: "events",
      name: "Events",
      goal: "Build the market database, one city at a time.",
      intent:
        "Find the organisers who run significant events in target cities, prioritising late 2026. The agent returns the single best contact per organisation. Expanding to second and third contacts is deliberately manual.",
      steps: [
        { actor: "agent", label: "Event discovery", note: "Scored 10 for a flagship industry event down to 5 for general activity." },
        { actor: "agent", label: "One best contact per organisation", note: "Event owner first, established organiser as fallback." },
        { actor: "human", label: "Multi-contact expansion", note: "Agent caps at one pick. Growth is a judgement call." },
        { actor: "human", label: "Evidence validation", note: "Organisation, city, event, date, title, links from an official page." },
        { actor: "gated", label: "Readiness check", note: "Blocks a handoff when city or variables are missing." }
      ],
      constraints: [
        "Date window is only partly enforced by default.",
        "Fuzzy duplicates always route to a human.",
        "Never relabel an event score as P1 or P2."
      ]
    },
    {
      id: "partners",
      name: "Partners",
      goal: "Find decision-makers at companies the CRM already qualified.",
      intent:
        "Not cold discovery. The pipeline pulls companies already sitting in qualified stages, then searches for partnerships, business development, marketing and events owners at each one.",
      steps: [
        { actor: "agent", label: "Pull qualified companies", note: "Company selection comes from the CRM pipeline stages." },
        { actor: "agent", label: "Persona sourcing", note: "Roles scored against a three-tier persona ladder." },
        { actor: "human", label: "Identity and field validation", note: "Title, company and domain match, plus an evidence URL." },
        { actor: "human", label: "Workload cap", note: "Three contacts per company maximum. Two is the target." },
        { actor: "gated", label: "Readiness check", note: "Catches blanks and duplicates before handoff." }
      ],
      constraints: [
        "Contacts without a persona set are invisible in the CRM view.",
        "Priority labels are preserved, never re-derived.",
        "No email enrichment credits are spent during sourcing."
      ]
    },
    {
      id: "speakers",
      name: "Speakers",
      goal: "Build a speaker candidate pipeline per city.",
      intent:
        "Targets corporate development leaders, innovation leads, operators and subject-matter experts city by city. Output is a review queue rather than a CRM write.",
      steps: [
        { actor: "agent", label: "Speaker candidate search", note: "City and country scope per run." },
        { actor: "agent", label: "Relevance classification", note: "Deterministic dedup, LLM only for relevance." },
        { actor: "human", label: "Approve or reject", note: "A reviewer decision column, intentionally blank at generation." },
        { actor: "human", label: "Promotion", note: "Approved rows move toward outreach status." },
        { actor: "gated", label: "Bulk import", note: "Deferred and gated, never implied by a filename." }
      ],
      constraints: [
        "Review queue, not an import file.",
        "Deduplication is deterministic, never model-driven.",
        "No automatic sequence enrolment."
      ]
    }
  ],

  rubric: {
    presets: [
      { name: "Flagship event, saturated", org: 5, persona: 5, market: "saturated", media: true },
      { name: "Modest event, new market", org: 3, persona: 4, market: "new", media: false },
      { name: "Strong convener, underserved", org: 4, persona: 5, market: "underserved", media: true },
      { name: "Newcomer, new market", org: 2, persona: 3, market: "new", media: false }
    ],
    confidenceSignals: [
      { label: "Identity corroborated by 2+ independent sources", delta: 15 },
      { label: "Verified business email", delta: 10 },
      { label: "Event metrics from a media or official source", delta: 10 },
      { label: "Role or title explicitly stated", delta: 10 },
      { label: "Website domain resolves and matches the org", delta: 5 },
      { label: "Score relies on a single unverified source", delta: -20 },
      { label: "Email is guessed or pattern-only", delta: -15 }
    ]
  },

  dedup: {
    pairs: [
      { a: "Northwind Ventures", b: "Northwind Venture Partners", note: "Likely the same firm, different naming." },
      { a: "Baltic Business Forum", b: "Baltic Business Forum 2026", note: "Same event, year suffix." },
      { a: "Kanto Labs", b: "Kanto Robotics", note: "Different entities in the same city." },
      { a: "Helios Energy", b: "Helios Energy Group", note: "Corporate suffix difference." }
    ],
    thresholds: [
      { label: "Exact match", rule: "score >= 95", outcome: "Dropped automatically" },
      { label: "Possible match", rule: "80 <= score < 95", outcome: "Flagged for human review" },
      { label: "Unique", rule: "score < 80", outcome: "Proceeds as new" }
    ]
  },

  contacts: [
    {
      id: "c1",
      name: "Maya Okonkwo",
      title: "Head of Partnerships",
      company: "Northwind Ventures",
      email: "maya.okonkwo@example.com",
      city: "Lagos",
      country: "Nigeria",
      market: "new",
      track: "partners",
      status: "Qualified",
      sequence: "",
      thesis: "frontier-market expansion",
      firmPositioning: "the leading early-stage fund in West Africa",
      angle: "corporate venture partnerships",
      sourceUrl: "https://example.com/northwind/team",
      verifiedEmail: true,
      corroborated: true
    },
    {
      id: "c2",
      name: "Petra Lindqvist",
      title: "Program Director",
      company: "Baltic Business Forum",
      email: "petra.lindqvist@example.com",
      city: "Tallinn",
      country: "Estonia",
      market: "underserved",
      track: "events",
      status: "Qualified",
      sequence: "",
      thesis: "Nordic-Baltic market entry",
      firmPositioning: "the region's flagship industry forum",
      angle: "",
      sourceUrl: "https://example.com/baltic-business-forum/team",
      verifiedEmail: true,
      corroborated: true
    },
    {
      id: "c3",
      name: "Daniel Reyes",
      title: "Community & Events Lead",
      company: "Andes Innovation Hub",
      email: "daniel.reyes@example.com",
      city: "Bogota",
      country: "Colombia",
      market: "new",
      track: "events",
      status: "Qualified",
      sequence: "",
      thesis: "",
      firmPositioning: "a city-wide network for local business leaders",
      angle: "community-led events",
      sourceUrl: "https://example.com/andes-hub/people",
      verifiedEmail: false,
      corroborated: false
    },
    {
      id: "c4",
      name: "Tomas Alvarez",
      title: "Managing Director",
      company: "Andes Capital Partners",
      email: "tomas.alvarez@example.com",
      city: "Santiago",
      country: "Chile",
      market: "new",
      track: "speakers",
      status: "Prospecting",
      sequence: "",
      thesis: "corporate development in Latin America",
      firmPositioning: "a regional mid-market investment group",
      angle: "speaker on regional expansion",
      sourceUrl: "https://example.com/andes-capital/team",
      verifiedEmail: true,
      corroborated: true
    },
    {
      id: "c5",
      name: "Hannah Meyer",
      title: "Marketing Director",
      company: "Helios Energy",
      email: "hannah.meyer@example.com",
      city: "Munich",
      country: "Germany",
      market: "saturated",
      track: "partners",
      status: "Qualified",
      sequence: "Partners_2026",
      thesis: "",
      firmPositioning: "a European renewable energy operator",
      angle: "brand partnerships in cleantech",
      sourceUrl: "https://example.com/helios-energy/team",
      verifiedEmail: true,
      corroborated: true
    },
    {
      id: "c6",
      name: "Yuki Tanaka",
      title: "Managing Director",
      company: "Kanto Labs",
      email: "yuki.tanaka@example.com",
      city: "Tokyo",
      country: "Japan",
      market: "new",
      track: "speakers",
      status: "Qualified",
      sequence: "",
      thesis: "hardware-first robotics in Asia",
      firmPositioning: "",
      angle: "building hardware in a software market",
      sourceUrl: "https://example.com/kanto-labs/about",
      verifiedEmail: true,
      corroborated: true
    }
  ],

  /* Email copy templates per track. Assembled from evidence, never free-form. */
  emailTemplates: {
    partners: {
      subject: "Partnering with {company} in {city}",
      greeting: "Hi {first},",
      body: [
        "{compliment}",
        "{event} runs partner programmes in 40+ markets and refreshes the roster every quarter. {fit}",
        "I'd like to explore whether {company} would want a partnership slot in {city}. Worth a short call?"
      ],
      signoff: "Best,\nPartnerships"
    },
    events: {
      subject: "{event} and our {city} programme",
      greeting: "Hi {first},",
      body: [
        "{compliment}",
        "We're mapping the most active organisers in {city} this quarter. {fit}",
        "Would you be open to a 15-minute call about how {company} could take part?"
      ],
      signoff: "Best,\nEvents"
    },
    speakers: {
      subject: "Speaking slot: {city} session",
      greeting: "Hi {first},",
      body: [
        "{compliment}",
        "We're putting together a session in {city} for operators and industry leaders. {fit}",
        "Would you consider a speaking slot? Happy to share the format first."
      ],
      signoff: "Best,\nProgrammes"
    }
  },

  gates: [
    {
      id: "live",
      env: "LIVE_WRITE",
      label: "Live write switch",
      note: "Marks the run as intentionally live."
    },
    {
      id: "writes",
      env: "ALLOW_CRM_WRITES",
      label: "CRM write permission",
      note: "Second, independent permission for CRM records."
    },
    {
      id: "schema",
      env: "ALLOW_SCHEMA_WRITES",
      label: "Schema write permission",
      note: "Only for creating or changing properties, separate again."
    }
  ],

  /* Synthetic rows shaped like the pipeline's review and dry-run outputs. */
  outputRows: [
    { company: "Northwind Ventures", city: "Lagos", country: "Nigeria", track: "Partners", event: "", date: "", fit: 9, priority: 11.7, band: "8-9 personalized", confidence: 80, dedup: "Unique" },
    { company: "Baltic Business Forum", city: "Tallinn", country: "Estonia", track: "Events", event: "Baltic Business Forum", date: "2026-09-18", fit: 8, priority: 9.66, band: "8-9 personalized", confidence: 75, dedup: "Exact" },
    { company: "Andes Innovation Hub", city: "Bogota", country: "Colombia", track: "Events", event: "Andes Partner Day", date: "2026-10-02", fit: 7, priority: 9.1, band: "6-7 viable", confidence: 55, dedup: "Possible" },
    { company: "Andes Capital Partners", city: "Santiago", country: "Chile", track: "Speakers", event: "", date: "", fit: 9, priority: 11.7, band: "8-9 personalized", confidence: 85, dedup: "Unique" },
    { company: "Helios Energy", city: "Munich", country: "Germany", track: "Partners", event: "", date: "", fit: 10, priority: 8.5, band: "10 priority", confidence: 90, dedup: "Unique" },
    { company: "Kanto Labs", city: "Tokyo", country: "Japan", track: "Speakers", event: "", date: "", fit: 8, priority: 10.4, band: "8-9 personalized", confidence: 70, dedup: "Unique" },
    { company: "Northwind Capital", city: "Lagos", country: "Nigeria", track: "Partners", event: "", date: "", fit: 9, priority: 11.7, band: "8-9 personalized", confidence: 80, dedup: "Possible" },
    { company: "Cordillera Business Club", city: "Medellin", country: "Colombia", track: "Events", event: "Cordillera Forum", date: "2026-08-29", fit: 6, priority: 6.9, band: "6-7 viable", confidence: 60, dedup: "Unique" },
    { company: "Hanseatic Growth Fund", city: "Hamburg", country: "Germany", track: "Partners", event: "", date: "", fit: 7, priority: 5.95, band: "6-7 viable", confidence: 65, dedup: "Unique" },
    { company: "Sao Paulo Business Collective", city: "Sao Paulo", country: "Brazil", track: "Events", event: "Sao Paulo Trade Week", date: "2026-09-25", fit: 8, priority: 10.4, band: "8-9 personalized", confidence: 78, dedup: "Unique" }
  ],
};
