import type {
  AppSettings,
  BioCardData,
  CoverLetterData,
  ResumeData,
  Stats,
} from "./types";

export const uid = (): string =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const nowIso = (): string => new Date().toISOString();

export const ACCENT_PRESETS = [
  { name: "Champagne Gold", value: "#d4af37" },
  { name: "Tech Cyan", value: "#38bdf8" },
  { name: "Platinum Mist", value: "#cbd5e1" },
  { name: "Emerald Seal", value: "#34d399" },
];

export const DOC_ACCENT_PRESETS = [
  { name: "Executive Gold", value: "#b08c2e" },
  { name: "Onyx", value: "#1f2a37" },
  { name: "Deep Navy", value: "#1e3a5f" },
  { name: "Steel Cyan", value: "#0e7490" },
  { name: "Burgundy", value: "#7a2434" },
];

export function defaultResume(): ResumeData {
  return {
    personal: {
      fullName: "Alexandra R. Carter",
      title: "Chief Technology Officer",
      email: "a.carter@meridianlabs.io",
      phone: "+1 (415) 555-0132",
      location: "San Francisco, CA",
      website: "alexandracarter.dev",
      linkedin: "linkedin.com/in/arcarter",
      summary:
        "Technology executive with 14+ years scaling engineering organizations from Series A through IPO. Proven record of aligning platform architecture, talent density, and capital efficiency to deliver compound product velocity. Trusted operator for boards navigating cloud transformation, AI adoption, and security modernization.",
    },
    experience: [
      {
        id: uid(),
        role: "Chief Technology Officer",
        company: "Meridian Labs",
        location: "San Francisco, CA",
        start: "2021",
        end: "",
        current: true,
        bullets: [
          "Scaled engineering organization from 42 to 180+ across 4 time zones while holding voluntary attrition under 8% annually.",
          "Directed $26M cloud modernization program, reducing infrastructure unit costs 38% and improving platform uptime to 99.99%.",
          "Championed AI-assisted developer tooling rollout that cut median cycle time from 9.2 to 4.6 days within two quarters.",
          "Partnered with the board on successful Series D close at a $1.4B valuation, owning technical diligence end-to-end.",
        ],
      },
      {
        id: uid(),
        role: "VP of Platform Engineering",
        company: "Northwind Systems",
        location: "Seattle, WA",
        start: "2017",
        end: "2021",
        current: false,
        bullets: [
          "Led 60-person platform group owning payments, identity, and data infrastructure serving 40M monthly active users.",
          "Re-architected event streaming backbone to Kafka-based mesh, unlocking 12x throughput growth for real-time analytics.",
          "Instituted blameless incident review and SLO-driven planning, cutting sev-1 incidents 71% year over year.",
        ],
      },
      {
        id: uid(),
        role: "Principal Engineer",
        company: "Atlas Fintech",
        location: "New York, NY",
        start: "2013",
        end: "2017",
        current: false,
        bullets: [
          "Designed low-latency ledger core processing $2.1B in annual transaction volume with zero reconciliation loss.",
          "Mentored 15 senior engineers; 9 promoted into staff or management tracks within 24 months.",
        ],
      },
    ],
    education: [
      {
        id: uid(),
        school: "Stanford University",
        degree: "M.S.",
        field: "Computer Science",
        start: "2009",
        end: "2011",
      },
      {
        id: uid(),
        school: "University of Washington",
        degree: "B.S.",
        field: "Software Engineering",
        start: "2005",
        end: "2009",
      },
    ],
    skills: [
      {
        id: uid(),
        category: "Leadership",
        items: ["Org Design", "Board Communication", "M&A Diligence", "Budget Ownership"],
      },
      {
        id: uid(),
        category: "Architecture",
        items: ["Distributed Systems", "Event Mesh", "Zero-Trust Security", "Data Platforms"],
      },
      {
        id: uid(),
        category: "Stack",
        items: ["TypeScript", "Go", "Kubernetes", "AWS", "Kafka", "PostgreSQL"],
      },
    ],
    projects: [
      {
        id: uid(),
        name: "OpenLedger Initiative",
        link: "github.com/openledger",
        tech: ["Rust", "gRPC"],
        description:
          "Founded open-source consortium standardizing double-entry ledger APIs, now adopted by 30+ fintech platforms.",
      },
      {
        id: uid(),
        name: "Velocity Index",
        link: "velocityindex.dev",
        tech: ["Research", "Analytics"],
        description:
          "Published industry benchmark measuring engineering velocity across 400 product teams; cited in two Gartner reports.",
      },
    ],
    certifications: [
      { id: uid(), name: "AWS Solutions Architect — Professional", issuer: "Amazon Web Services", year: "2023" },
      { id: uid(), name: "Certified Information Security Manager", issuer: "ISACA", year: "2022" },
    ],
    layout: {
      fontFamily: "sans",
      fontSize: 13,
      lineHeight: 1.5,
      margin: 46,
      columns: 2,
      accentColor: "#b08c2e",
    },
    meta: { updatedAt: nowIso() },
  };
}

export function defaultCoverLetter(): CoverLetterData {
  return {
    senderName: "Alexandra R. Carter",
    senderTitle: "Chief Technology Officer",
    contactLine: "a.carter@meridianlabs.io · +1 (415) 555-0132 · San Francisco, CA",
    date: new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    recipientName: "Hiring Committee",
    recipientTitle: "Office of the CEO",
    company: "Aurora Dynamics",
    position: "Chief Technology Officer",
    greeting: "Dear Members of the Search Committee,",
    body: `When an organization stands at the intersection of ambition and scale, technology leadership becomes the difference between momentum and drag. Across fourteen years of building platforms and the people who run them, I have specialized in one thing: turning engineering capacity into durable business advantage.

At Meridian Labs, I inherited a team of 42 engineers shipping quarterly and left it a 180-person organization shipping daily — while reducing infrastructure unit costs by thirty-eight percent and sustaining ninety-nine-ninety availability. That outcome was not accidental; it was the product of deliberate org design, SLO-driven planning, and a culture that treats operational excellence as a feature.

Aurora Dynamics' mandate — modernizing mission-critical systems while expanding into AI-assisted product lines — mirrors transformations I have led twice before, including a $26M program delivered ahead of schedule and under budget. I would welcome the opportunity to bring that playbook to your team.`,
    closing: "Respectfully,",
    matchStyle: true,
    accentColor: "#b08c2e",
    fontFamily: "sans",
    meta: { updatedAt: nowIso() },
  };
}

export function defaultBioCard(): BioCardData {
  return {
    name: "Alexandra R. Carter",
    role: "Chief Technology Officer",
    tagline: "Building elite engineering organizations and the platforms that outlast them.",
    location: "San Francisco, CA",
    email: "a.carter@meridianlabs.io",
    website: "alexandracarter.dev",
    github: "github.com/arcarter",
    linkedin: "linkedin.com/in/arcarter",
    skills: ["Architecture", "Org Design", "AI Strategy", "Cloud"],
    accent: "#d4af37",
    meta: { updatedAt: nowIso() },
  };
}

export function defaultSettings(): AppSettings {
  return {
    brand: {
      name: "CVForge",
      accentWord: "Studio",
      tagline: "Executive career instruments, forged with precision.",
    },
    accent: "#d4af37",
    announcement: "",
    maintenance: false,
    maintenanceMessage:
      "CVForge Studio is undergoing scheduled refinement. Please return shortly.",
    auth: null, // seeded on first auth check: cvforge / cvforge
    defaultResume: null,
    coverTemplate: "",
  };
}

export function defaultStats(): Stats {
  return {
    createdAt: nowIso(),
    drafts: 0,
    exports: { pdf: 0, png: 0, jpg: 0, zip: 0, json: 0 },
    savesByTool: { resume: 0, cover: 0, bio: 0, bullets: 0 },
    lastActive: nowIso(),
  };
}

export const OPTIMIZER_VERBS: Record<string, string[]> = {
  Executive: [
    "Spearheaded",
    "Orchestrated",
    "Directed",
    "Championed",
    "Negotiated",
    "Transformed",
    "Drove",
    "Governed",
    "Cultivated",
    "Mobilized",
  ],
  Technical: [
    "Architected",
    "Engineered",
    "Automated",
    "Optimized",
    "Refactored",
    "Containerized",
    "Hardened",
    "Scaled",
    "Instrumented",
    "Streamlined",
  ],
  Balanced: [
    "Delivered",
    "Accelerated",
    "Launched",
    "Redesigned",
    "Pioneered",
    "Fortified",
    "Expanded",
    "Modernized",
    "Consolidated",
    "Elevated",
  ],
};

export const SAMPLE_RAW_NOTES = `responsible for migrating the monolith to microservices
helped reduce page load times on the checkout funnel
worked on the kubernetes rollout across 40 clusters
I mentored junior developers and ran weekly 1:1s
made dashboards for exec team to track KPIs
handled vendor negotiations for cloud contracts
did a redesign of the onboarding flow, signup went up a lot
assisted with soc2 audit prep and remediation`;
