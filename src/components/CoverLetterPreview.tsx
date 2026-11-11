import type { CSSProperties } from "react";
import type { CoverLetterData, DocFont } from "@/lib/types";

const FONT_STACKS: Record<DocFont, string> = {
  sans: "'Inter', 'Segoe UI', sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  grotesk: "'Space Grotesk', 'Inter', sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

const INK = "#191920";
const MUTE = "#55555f";
const FAINT = "#83838d";
const PAPER = "#ffffff";

export function CoverLetterPreview({
  data,
  id,
  width = 794,
}: {
  data: CoverLetterData;
  id?: string;
  width?: number;
}) {
  const base = 13.5;
  const accent = data.accentColor;
  const font = FONT_STACKS[data.fontFamily];
  const pad = 56;

  const sheet: CSSProperties = {
    width,
    minHeight: Math.round(width * 1.414),
    background: PAPER,
    color: INK,
    fontFamily: font,
    fontSize: base,
    lineHeight: 1.65,
  };

  const paragraphs = data.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const recipientBlock = [data.recipientName, data.recipientTitle, data.company].filter(Boolean);

  return (
    <div id={id} className="doc-sheet" style={sheet}>
      <div style={{ height: 5, background: accent, borderRadius: "6px 6px 0 0" }} />
      <div style={{ padding: pad }}>
        {/* Letterhead */}
        <header style={{ marginBottom: 34 }}>
          <div style={{ fontSize: base * 1.85, fontWeight: 800, letterSpacing: "-0.01em", color: INK }}>
            {data.senderName || "Your Name"}
          </div>
          {data.senderTitle && (
            <div style={{ fontSize: base * 0.92, fontWeight: 600, color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>
              {data.senderTitle}
            </div>
          )}
          {data.contactLine && (
            <div style={{ fontSize: base * 0.8, color: FAINT, marginTop: 6 }}>{data.contactLine}</div>
          )}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${accent}, transparent 70%)`, marginTop: 18 }} />
        </header>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
          <div style={{ fontSize: base * 0.88, color: MUTE, lineHeight: 1.7 }}>
            {recipientBlock.map((l, i) => (
              <div key={i} style={i === 0 ? { fontWeight: 700, color: INK } : undefined}>
                {l}
              </div>
            ))}
          </div>
          <div style={{ fontSize: base * 0.85, color: FAINT, whiteSpace: "nowrap", marginLeft: 24 }}>{data.date}</div>
        </div>

        {data.position && (
          <div style={{ fontSize: base * 0.95, fontWeight: 700, marginBottom: 22, color: INK }}>
            Re: Application for {data.position}
          </div>
        )}

        <div style={{ fontSize: base * 0.98, color: "#2c2c33" }}>
          <p style={{ margin: "0 0 16px" }}>{data.greeting || "Dear Hiring Team,"}</p>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: "0 0 16px" }}>
              {p}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 30 }}>
          <div style={{ color: "#2c2c33" }}>{data.closing || "Sincerely,"}</div>
          <div
            style={{
              marginTop: 26,
              fontSize: base * 1.15,
              fontWeight: 700,
              color: INK,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {data.senderName || "Your Name"}
          </div>
        </div>
      </div>
    </div>
  );
}
