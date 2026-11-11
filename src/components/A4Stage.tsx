import { useEffect, useRef, useState, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────
// A4Stage — true-to-life A4 presentation canvas.
// Pixel-exact 210:297 ratio (794×1123 @96dpi), pedestal shadow
// framing, margin-safe-area guides and page-break rulings.
// Visible-preview only — exports still use flat PrintStage.
// ─────────────────────────────────────────────────────────────
const PX_W = 794;
const PX_H = 1123;

export function A4Stage({
  children,
  margin = 46,
  topOffset = 5,
  showGuides = true,
  showBreaks = true,
  label = "A4 · 210 × 297 mm",
}: {
  children: ReactNode;
  margin?: number;
  /** extra vertical chrome inside the sheet above the content (e.g. accent bar height) */
  topOffset?: number;
  showGuides?: boolean;
  showBreaks?: boolean;
  label?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(PX_H);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const update = (): void => {
      const w = outer.clientWidth;
      setScale(w > 0 ? Math.min(w / PX_W, 1) : 1);
      setHeight(inner.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const pages = Math.max(1, Math.ceil(height / PX_H));
  const breakLines = Array.from({ length: pages - 1 }, (_, i) => (i + 1) * PX_H);

  return (
    <div>
      {/* meta plate */}
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-zinc-600">
          {label}
        </span>
        <span className="flex items-center gap-2 font-mono text-[0.62rem] text-zinc-600">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          {pages} page{pages > 1 ? "s" : ""} · {(scale * 100).toFixed(0)}% zoom
        </span>
      </div>

      {/* pedestal */}
      <div
        className="rounded-2xl border border-edge/70 p-3 sm:p-5"
        style={{
          background:
            "radial-gradient(40rem 20rem at 50% 0%, rgba(255,255,255,0.035), transparent 60%), #0d0d11",
        }}
      >
        <div
          ref={outerRef}
          className="w-full overflow-hidden"
          style={{ height: Math.ceil(height * scale) + 2 }}
        >
          <div
            className="relative mx-auto"
            style={{
              width: PX_W,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              filter: "drop-shadow(0 34px 54px rgba(0,0,0,0.62)) drop-shadow(0 6px 16px rgba(0,0,0,0.45))",
            }}
          >
            <div ref={innerRef} className="relative">
              {children}

              {/* margin safe-area guide */}
              {showGuides && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    top: topOffset + margin,
                    left: margin,
                    right: margin,
                    bottom: margin,
                    border: "1px dashed color-mix(in srgb, var(--accent) 38%, transparent)",
                    borderRadius: 2,
                  }}
                >
                  <span
                    className="absolute -top-4 right-0 font-mono text-[9px]"
                    style={{ color: "color-mix(in srgb, var(--accent) 65%, #71717a)" }}
                  >
                    safe area · {Math.round(margin / 3.78)}mm
                  </span>
                </div>
              )}

              {/* page-break rulings */}
              {showBreaks &&
                breakLines.map((y, i) => (
                  <div
                    key={y}
                    aria-hidden
                    className="pointer-events-none absolute left-0 right-0"
                    style={{ top: y }}
                  >
                    <div
                      style={{
                        borderTop: "2px dashed rgba(56, 189, 248, 0.55)",
                        margin: "0 -14px",
                      }}
                    />
                    <span
                      className="absolute -top-[11px] right-[-14px] rounded-md px-2 py-[2px] font-mono text-[9px] font-semibold"
                      style={{
                        background: "#0c1017",
                        color: "#38bdf8",
                        border: "1px solid rgba(56,189,248,0.35)",
                      }}
                    >
                      page {i + 2} begins
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
