import type { BioCardData, CoverLetterData, ResumeData } from "./types";

// ─────────────────────────────────────────────────────────────
// Local heuristic suggestion engine — 100% client-side.
// No network calls, no models; deterministic signal analysis.
// ─────────────────────────────────────────────────────────────
export type TipSeverity = "high" | "medium" | "low";

export interface Tip {
  id: string;
  severity: TipSeverity;
  title: string;
  detail: string;
}

const SEVERITY_RANK: Record<TipSeverity, number> = { high: 0, medium: 1, low: 2 };

const WEAK_OPENERS =
  /^(responsible for|helped|worked on|worked with|assisted|involved in|participated in|tasked with|handled|was in charge of|did|made)\b/i;

const DEMAND_KEYWORDS: { match: RegExp; suggest: string[] }[] = [
  {
    match: /engineer|developer|architect|devops|sre|data|software|full[- ]?stack|platform/i,
    suggest: ["Kubernetes", "TypeScript", "CI/CD", "Distributed Systems", "Observability", "AWS"],
  },
  {
    match: /chief|cto|vp|director|head of|executive|manager|lead/i,
    suggest: ["Org Design", "Budget Ownership", "Board Reporting", "OKRs", "M&A Diligence"],
  },
  {
    match: /design|ux|product/i,
    suggest: ["Design Systems", "User Research", "Prototyping", "Accessibility", "Figma"],
  },
];

function words(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function analyzeResume(r: ResumeData): Tip[] {
  const tips: Tip[] = [];

  // —— identity & reachability
  if (!r.personal.fullName.trim())
    tips.push({ id: "name", severity: "high", title: "Missing name", detail: "Your full name is the document title — add it before sharing or exporting." });
  if (!r.personal.title.trim())
    tips.push({ id: "headline", severity: "high", title: "No professional headline", detail: "A crisp title (“VP of Engineering”) anchors recruiter scanning in the first 6 seconds." });
  if (!r.personal.email.includes("@"))
    tips.push({ id: "email", severity: "high", title: "Email looks invalid", detail: "ATS platforms reject documents without a parseable email address." });
  if (!r.personal.linkedin.trim() && !r.personal.website.trim())
    tips.push({ id: "link", severity: "low", title: "No professional link", detail: "LinkedIn or a portfolio URL increases response rates materially at senior levels." });

  // —— summary depth
  const sumWords = words(r.personal.summary);
  if (sumWords === 0)
    tips.push({ id: "sum0", severity: "high", title: "Executive summary is empty", detail: "3–4 sentences: tenure + scope, one quantified headline result, target domain." });
  else if (sumWords < 40)
    tips.push({ id: "sum1", severity: "medium", title: `Summary is thin (${sumWords} words)`, detail: "Aim for 45–90 words — name scope, one hard number, and the mandate you want next." });
  else if (sumWords > 115)
    tips.push({ id: "sum2", severity: "low", title: `Summary runs long (${sumWords} words)`, detail: "Trim to ~90 words; executives skim, so density beats completeness." });

  // —— bullet quality audit
  const bullets = r.experience.flatMap((j) => j.bullets.filter(Boolean));
  if (bullets.length > 0) {
    const weak = bullets.filter((b) => WEAK_OPENERS.test(b.trim()));
    if (weak.length > 0)
      tips.push({
        id: "weak",
        severity: "high",
        title: `${weak.length} bullet${weak.length > 1 ? "s" : ""} open${weak.length > 1 ? "" : "s"} with weak duty language`,
        detail: `“${weak[0].trim().slice(0, 46)}…” — rewrite past-tense with an action verb (Spearheaded, Automated, Negotiated). The Bullet Polisher automates this.`,
      });
    const noMetric = bullets.filter((b) => !/\d|%|\$|doubled|tripled|half/i.test(b));
    if (bullets.length >= 3 && noMetric.length / bullets.length > 0.6)
      tips.push({
        id: "metric",
        severity: "high",
        title: `${noMetric.length}/${bullets.length} bullets lack a measurable outcome`,
        detail: "Add %, $, time saved, user scale, or error-rate deltas. Example: “Reduced deploy time” → “Reduced deploy time 63%, from 2.4h to 54m”.",
      });
    const long = bullets.filter((b) => words(b) > 34);
    if (long.length > 0)
      tips.push({ id: "verb", severity: "medium", title: `${long.length} over-long bullet${long.length > 1 ? "s" : ""}`, detail: "Keep bullets to one idea and ≤ 28 words — one metric, one mechanism, one outcome." });
    if (r.experience.some((j) => j.bullets.filter(Boolean).length === 0))
      tips.push({ id: "emptyjob", severity: "medium", title: "A role has no achievements listed", detail: "Every position needs ≥ 2 outcome bullets, or consider removing the entry." });
  } else {
    tips.push({ id: "nobullets", severity: "high", title: "Experience section has no bullets", detail: "Roles without achievement bullets read as job descriptions, not track records." });
  }

  // —— skills matrix coverage
  const skillsFlat = r.skills.flatMap((g) => g.items);
  if (skillsFlat.length > 0 && skillsFlat.length < 8)
    tips.push({ id: "skills", severity: "medium", title: `Only ${skillsFlat.length} skills listed`, detail: "8–16 grouped skills improve ATS keyword density without keyword-stuffing." });
  if (skillsFlat.length > 0) {
    const hay = skillsFlat.join(" ").toLowerCase();
    const missing = new Set<string>();
    DEMAND_KEYWORDS.forEach(({ match, suggest }) => {
      if (match.test(r.personal.title)) suggest.forEach((s) => !hay.includes(s.toLowerCase()) && missing.add(s));
    });
    const miss = [...missing].slice(0, 3);
    if (miss.length > 0)
      tips.push({
        id: "keywords",
        severity: "low",
        title: "High-demand keywords absent",
        detail: `For a “${r.personal.title || "your"}” profile, recruiters frequently filter for: ${miss.join(" · ")}. Add only if truthful.`,
      });
  }

  return tips.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]).slice(0, 5);
}

export function analyzeCover(c: CoverLetterData): Tip[] {
  const tips: Tip[] = [];
  const w = words(c.body);
  if (!c.company.trim())
    tips.push({ id: "co", severity: "high", title: "No target company", detail: "A cover letter without a company name reads generic instantly." });
  if (w < 120)
    tips.push({ id: "thin", severity: "medium", title: `Letter body is short (${w} words)`, detail: "200–400 words is the executive sweet spot: hook, proof, alignment, ask." });
  if (w > 450)
    tips.push({ id: "long", severity: "medium", title: `Letter body runs long (${w} words)`, detail: "Trim below ~450 words; one page must breathe." });
  if (w > 0 && !/\d|%|\$/.test(c.body))
    tips.push({ id: "num", severity: "medium", title: "No quantified proof point", detail: "Embed at least one hard number — budgets owned, growth delivered, teams scaled." });
  return tips.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]).slice(0, 4);
}

export function analyzeNotes(raw: string): Tip[] {
  const tips: Tip[] = [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length === 0) return tips;
  const weak = lines.filter((l) => WEAK_OPENERS.test(l));
  if (weak.length > 0)
    tips.push({ id: "nweak", severity: "high", title: `${weak.length} raw line${weak.length > 1 ? "s" : ""} start weak`, detail: "The optimizer will rewrite these; verify the chosen verb matches your actual role." });
  const metricless = lines.filter((l) => !/\d|%|\$/.test(l));
  if (metricless.length > 0)
    tips.push({ id: "nmetric", severity: "medium", title: `${metricless.length} line${metricless.length > 1 ? "s" : ""} without numbers`, detail: "Rough magnitudes are fine (“~40 clusters”, “$2M budget”) — polish will flag them for review." });
  return tips;
}

export function analyzeBio(b: BioCardData): Tip[] {
  const tips: Tip[] = [];
  if (words(b.tagline) < 6)
    tips.push({ id: "tag", severity: "medium", title: "Tagline is very short", detail: "8–16 words conveys scope + personality. Try the sample taglines for inspiration." });
  if (b.skills.length < 3)
    tips.push({ id: "chips", severity: "low", title: "Fewer than 3 skill chips", detail: "3–6 chips give the card its scannable rhythm without crowding." });
  if (!b.website && !b.github && !b.linkedin)
    tips.push({ id: "blinks", severity: "medium", title: "No outbound links", detail: "A bio card without a destination link is a dead end — add at least one." });
  return tips.slice(0, 3);
}
