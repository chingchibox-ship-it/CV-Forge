import type { BioCardData } from "@/lib/types";

// Capture-safe social card (inline styles + hex only).
const OBSIDIAN = "#0b0b0e";
const PANEL = "#131318";

function alphaHex(hex: string, alpha: number): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const a = parseInt((h + "000000").slice(0, 6), 16);
  const r = (a >> 16) & 255, g = (a >> 8) & 255, b = a & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BioCardPreview({
  data,
  id,
  width = 840,
}: {
  data: BioCardData;
  id?: string;
  width?: number;
}) {
  const height = Math.round(width * 0.5625);
  const scale = width / 840;
  const accent = data.accent;

  const initials = data.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const links = [data.email, data.website, data.github, data.linkedin].filter(Boolean);

  return (
    <div
      id={id}
      style={{
        width,
        height,
        background: OBSIDIAN,
        borderRadius: 18 * scale,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        border: `1px solid ${alphaHex(accent, 0.35)}`,
      }}
    >
      {/* ambient accents — flat fills only (capture-safe) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(600px 300px at 85% -10%, ${alphaHex(accent, 0.14)}, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5 * scale,
          background: accent,
        }}
      />

      <div style={{ position: "relative", height: "100%", padding: 44 * scale, boxSizing: "border-box" }}>
        {/* top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 84 * scale,
                height: 84 * scale,
                borderRadius: 14 * scale,
                background: PANEL,
                border: `1.5px solid ${alphaHex(accent, 0.55)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 30 * scale,
                fontWeight: 700,
                color: accent,
                letterSpacing: "0.02em",
                marginRight: 22 * scale,
                flexShrink: 0,
              }}
            >
              {initials || "—"}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 33 * scale,
                  fontWeight: 700,
                  color: "#f4f4f5",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                }}
              >
                {data.name || "Your Name"}
              </div>
              <div
                style={{
                  fontSize: 15 * scale,
                  fontWeight: 600,
                  color: accent,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginTop: 6 * scale,
                }}
              >
                {data.role || "Role"}
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10 * scale,
              letterSpacing: "0.32em",
              color: "#52525b",
              textTransform: "uppercase",
              paddingTop: 6 * scale,
            }}
          >
            CVForge · Studio
          </div>
        </div>

        {/* tagline */}
        <div
          style={{
            marginTop: 30 * scale,
            fontSize: 17 * scale,
            lineHeight: 1.55,
            color: "#a1a1aa",
            maxWidth: "82%",
          }}
        >
          {data.tagline || "A short, sharp professional tagline goes here."}
        </div>

        {/* skills */}
        {data.skills.length > 0 && (
          <div style={{ marginTop: 24 * scale }}>
            {data.skills.map((s, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontSize: 12.5 * scale,
                  fontWeight: 500,
                  color: "#d4d4d8",
                  background: alphaHex(accent, 0.09),
                  border: `1px solid ${alphaHex(accent, 0.3)}`,
                  borderRadius: 999,
                  padding: `${5 * scale}px ${13 * scale}px`,
                  marginRight: 8 * scale,
                  marginBottom: 8 * scale,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* footer links */}
        <div
          style={{
            position: "absolute",
            left: 44 * scale,
            right: 44 * scale,
            bottom: 34 * scale,
            paddingTop: 20 * scale,
            borderTop: `1px solid rgba(255,255,255,0.07)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 12.5 * scale, color: "#8b8b93", fontFamily: "'JetBrains Mono', monospace" }}>
            {links.map((l, i) => (
              <span key={i} style={{ display: "inline-block", marginRight: 18 * scale }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 5 * scale,
                    height: 5 * scale,
                    borderRadius: 999,
                    background: accent,
                    marginRight: 8 * scale,
                    verticalAlign: "middle",
                  }}
                />
                {l}
              </span>
            ))}
          </div>
          {data.location && (
            <div style={{ fontSize: 12.5 * scale, color: "#71717a", fontFamily: "'JetBrains Mono', monospace" }}>
              {data.location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
