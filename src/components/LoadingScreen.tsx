import { useEffect, useState } from "react";

const DEFAULT_MESSAGES = [
  "Initializing typography engine…",
  "Compiling canvas pixels…",
  "Structuring layout vectors…",
  "Calibrating ink density…",
  "Compositing layers…",
  "Finalizing byte stream…",
];

export function LoadingScreen({
  active,
  title = "Rendering document",
  messages = DEFAULT_MESSAGES,
}: {
  active: boolean;
  title?: string;
  messages?: string[];
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => (s + 1) % messages.length), 1250);
    return () => clearInterval(t);
  }, [active, messages.length]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#09090b]/80 backdrop-blur-md animate-fade-in">
      <style>{`
        @keyframes cvfSlide { 0% { transform: translateX(-110%);} 100% { transform: translateX(320%);} }
        @keyframes cvfPulseDot { 0%,80%,100% { opacity:.25; transform:translateY(0);} 40% { opacity:1; transform:translateY(-4px);} }
      `}</style>
      <div className="glass w-[min(92vw,24rem)] rounded-3xl px-8 py-9 text-center shadow-2xl shadow-black/70 animate-scale-in">
        {/* ring spinner */}
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div
            className="absolute inset-0 rounded-full border-2 border-white/[0.06]"
          />
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: "var(--accent)", borderRightColor: "color-mix(in srgb, var(--accent) 40%, transparent)", animationDuration: "0.9s" }}
          />
          <div className="accent-text absolute inset-0 flex items-center justify-center font-mono text-[0.6rem] tracking-[0.2em]">
            CVF
          </div>
        </div>

        <p className="font-mono text-[0.6rem] uppercase tracking-[0.34em] text-zinc-600">
          CVForge pipeline
        </p>
        <h2 className="font-display mt-1.5 text-2xl font-bold tracking-tight text-zinc-50">
          {title}
        </h2>

        {/* rotating cinematic status line */}
        <p key={step} className="accent-text mt-3.5 h-4 font-mono text-[0.68rem] animate-fade-in">
          {messages[step]}
        </p>

        {/* indeterminate progress */}
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-edge/70">
          <div
            className="accent-bg h-full w-1/3 rounded-full"
            style={{ animation: "cvfSlide 1.15s ease-in-out infinite" }}
          />
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className="accent-bg h-1.5 w-1.5 rounded-full"
              style={{ animation: `cvfPulseDot 1.2s ${d * 0.18}s ease-in-out infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
