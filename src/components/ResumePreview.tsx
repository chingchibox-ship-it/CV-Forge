import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { DocFont, ResumeData } from "@/lib/types";

// Document previews use inline styles + literal hex colors exclusively so
// html2canvas / html2pdf capture them with full fidelity.
const FONT_STACKS: Record<DocFont, string> = {
  sans: "'Inter', 'Segoe UI', sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  grotesk: "'Space Grotesk', 'Inter', sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

const INK = "#191920";
const MUTE = "#55555f";
const FAINT = "#83838d";
const LINE = "#e4e4ea";
const PAPER = "#ffffff";

function normalizeHex(hex: string): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return `#${(h + "000000").slice(0, 6)}`;
}

function mix(hex: string, pct: number, withHex = PAPER): string {
  const a = parseInt(normalizeHex(hex).slice(1), 16);
  const b = parseInt(normalizeHex(withHex).slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * pct);
  const g = Math.round(ag + (bg - ag) * pct);
  const bl = Math.round(ab + (bb - ab) * pct);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

export function ResumePreview({
  data,
  id,
  width = 794,
  sectionOrder,
}: {
  data: ResumeData;
  id?: string;
  width?: number;
  sectionOrder?: string[];
}) {
  const { layout, personal } = data;
  const base = layout.fontSize;
  const accent = layout.accentColor;
  const font = FONT_STACKS[layout.fontFamily];
  // v2 layout fields — optional; defaults preserve legacy draft rendering exactly
  const sGap = layout.sectionSpacing ?? 1;
  const headerStyle = layout.headerStyle ?? "bar";

  const sheet: CSSProperties = {
    width,
    minHeight: Math.round(width * 1.414),
    background: PAPER,
    color: INK,
    fontFamily: font,
    fontSize: base,
    lineHeight: layout.lineHeight,
    letterSpacing: layout.tracking ? `${layout.tracking}em` : undefined,
  };

  const sectionTitle: CSSProperties = {
    fontSize: base * 0.78,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: accent,
    marginBottom: base * 0.85,
    paddingBottom: base * 0.35,
    borderBottom: `1px solid ${mix(accent, 0.72)}`,
  };

  const contact = [
    personal.email,
    personal.phone,
    personal.location,
    personal.website,
    personal.linkedin,
  ].filter(Boolean);

  const Bullet = ({ text }: { text: string }) => (
    <div style={{ display: "flex", marginBottom: base * 0.32 }}>
      <span
        style={{
          flexShrink: 0,
          width: base * 0.42,
          height: base * 0.42,
          background: accent,
          borderRadius: 1,
          marginTop: base * 0.62,
          marginRight: base * 0.55,
        }}
      />
      <span style={{ color: "#33333b" }}>{text}</span>
    </div>
  );

  const Summary = personal.summary.trim() && (
    <section style={{ marginBottom: base * 1.7 * sGap }}>
      <div style={sectionTitle}>Executive Summary</div>
      <p style={{ margin: 0, color: "#33333b" }}>{personal.summary}</p>
    </section>
  );

  const Experience = data.experience.length > 0 && (
    <section style={{ marginBottom: base * 1.7 * sGap }}>
      <div style={sectionTitle}>Professional Experience</div>
      {data.experience.map((job) => (
        <div key={job.id} style={{ marginBottom: base * 1.25, pageBreakInside: "avoid", breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, fontSize: base * 1.04, color: INK }}>{job.role}</span>
            <span style={{ fontSize: base * 0.82, color: FAINT, whiteSpace: "nowrap", marginLeft: 12 }}>
              {job.start} — {job.current ? "Present" : job.end}
            </span>
          </div>
          <div style={{ fontSize: base * 0.9, color: accent, fontWeight: 600, marginTop: 1 }}>
            {job.company}
            {job.location ? <span style={{ color: FAINT, fontWeight: 400 }}> · {job.location}</span> : null}
          </div>
          <div style={{ marginTop: base * 0.4 }}>
            {job.bullets.filter(Boolean).map((b, i) => (
              <Bullet key={i} text={b} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );

  const Projects = data.projects.length > 0 && (
    <section style={{ marginBottom: base * 1.7 * sGap }}>
      <div style={sectionTitle}>Selected Projects</div>
      {data.projects.map((p) => (
        <div key={p.id} style={{ marginBottom: base * 1.1, pageBreakInside: "avoid", breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, fontSize: base * 0.98 }}>{p.name}</span>
            {p.link && <span style={{ fontSize: base * 0.8, color: FAINT, marginLeft: 12 }}>{p.link}</span>}
          </div>
          {p.description && (
            <p style={{ margin: `${base * 0.3}px 0 0`, color: "#33333b" }}>{p.description}</p>
          )}
          {p.tech.length > 0 && (
            <div style={{ marginTop: base * 0.45 }}>
              {p.tech.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    fontSize: base * 0.72,
                    color: MUTE,
                    border: `1px solid ${LINE}`,
                    borderRadius: 999,
                    padding: "1px 8px",
                    marginRight: 5,
                    marginBottom: 5,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );

  const Skills = data.skills.length > 0 && (
    <section style={{ marginBottom: base * 1.6 * sGap }}>
      <div style={sectionTitle}>Skills Matrix</div>
      {data.skills.map((g) => (
        <div key={g.id} style={{ marginBottom: base * 0.9 }}>
          <div style={{ fontWeight: 700, fontSize: base * 0.85, color: INK, marginBottom: 3 }}>
            {g.category}
          </div>
          <div>
            {g.items.map((s, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontSize: base * 0.76,
                  color: "#3d3d46",
                  background: mix(accent, 0.93),
                  border: `1px solid ${mix(accent, 0.8)}`,
                  borderRadius: 4,
                  padding: "2px 8px",
                  marginRight: 5,
                  marginBottom: 5,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );

  const Education = data.education.length > 0 && (
    <section style={{ marginBottom: base * 1.6 * sGap }}>
      <div style={sectionTitle}>Education</div>
      {data.education.map((e) => (
        <div key={e.id} style={{ marginBottom: base * 0.9, pageBreakInside: "avoid", breakInside: "avoid" }}>
          <div style={{ fontWeight: 700, fontSize: base * 0.92 }}>
            {e.degree} {e.field && <span style={{ fontWeight: 400 }}>· {e.field}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: base * 0.82, color: MUTE }}>
            <span>{e.school}</span>
            <span style={{ color: FAINT, whiteSpace: "nowrap" }}>
              {e.start}{e.end ? ` — ${e.end}` : ""}
            </span>
          </div>
        </div>
      ))}
    </section>
  );

  const Certifications = data.certifications.length > 0 && (
    <section style={{ marginBottom: base * 1.2 * sGap }}>
      <div style={sectionTitle}>Certifications</div>
      {data.certifications.map((c) => (
        <div key={c.id} style={{ marginBottom: base * 0.7 }}>
          <div style={{ fontWeight: 600, fontSize: base * 0.88 }}>{c.name}</div>
          <div style={{ fontSize: base * 0.8, color: FAINT }}>
            {c.issuer}
            {c.year ? ` · ${c.year}` : ""}
          </div>
        </div>
      ))}
    </section>
  );

  const sectionMap: Record<string, ReactNode> = {
    summary: Summary || null,
    experience: Experience || null,
    education: Education || null,
    skills: Skills || null,
    projects: Projects || null,
    certifications: Certifications || null,
  };

  // Deterministic ordering: provided order (valid ids first), with any
  // unknown/missing ids appended in their canonical position.
  const ordered = (canonical: string[]): ReactNode[] => {
    const src = sectionOrder ?? canonical;
    const picked = src.filter((id) => canonical.includes(id));
    const rest = canonical.filter((id) => !picked.includes(id));
    return [...picked, ...rest]
      .map((id) => sectionMap[id])
      .filter((el): el is ReactNode => el !== null && el !== false && el !== 0 && el !== "")
      .map((el, i) => <Fragment key={i}>{el}</Fragment>);
  };

  const MAIN_IDS = ["summary", "experience", "projects"];
  const SIDE_IDS = ["skills", "education", "certifications"];
  const SINGLE_IDS = ["summary", "experience", "education", "skills", "projects", "certifications"];

  return (
    <div id={id} className="doc-sheet" style={sheet}>
      {headerStyle === "bar" && (
        <div style={{ height: 5, background: accent, borderRadius: "6px 6px 0 0" }} />
      )}
      <div style={{ padding: layout.margin }}>
        {/* Header */}
        <header style={{ marginBottom: base * 1.9 }}>
          <div
            style={{
              fontSize: base * 2.35,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              color: INK,
              lineHeight: 1.1,
            }}
          >
            {personal.fullName || "Your Name"}
          </div>
          {personal.title && (
            <div
              style={{
                fontSize: base * 1.12,
                fontWeight: 600,
                color: accent,
                letterSpacing: "0.06em",
                marginTop: base * 0.35,
              }}
            >
              {personal.title}
            </div>
          )}
          {contact.length > 0 && (
            <div
              style={{
                marginTop: base * 0.8,
                fontSize: base * 0.78,
                color: FAINT,
                lineHeight: 1.9,
              }}
            >
              {contact.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: mix(accent, 0.35), marginRight: base * 0.7 }}>·</span>}
                  <span style={{ marginRight: base * 0.7 }}>{c}</span>
                </span>
              ))}
            </div>
          )}
          {headerStyle === "rule" && (
            <div
              style={{
                height: 2,
                background: `linear-gradient(90deg, ${accent}, ${mix(accent, 0.55)} 55%, transparent)`,
                marginTop: base * 1.0,
                borderRadius: 1,
              }}
            />
          )}
        </header>

        {layout.columns === 2 ? (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ flex: "1.9 1 0", minWidth: 0 }}>{ordered(MAIN_IDS)}</div>
            <div style={{ flex: "1 1 0", minWidth: 0, marginLeft: base * 2.4 }}>{ordered(SIDE_IDS)}</div>
          </div>
        ) : (
          <div>{ordered(SINGLE_IDS)}</div>
        )}
      </div>
    </div>
  );
}
