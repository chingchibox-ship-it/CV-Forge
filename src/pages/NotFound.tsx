import { ArrowLeft, Compass, FileText, Home } from "lucide-react";
import { navigate } from "@/lib/router";
import { NAV_LINKS } from "@/components/Navbar";

export function NotFound() {
  return (
    <div className="bg-scene relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(46rem 26rem at 50% 30%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 65%)",
        }}
      />
      <div className="relative animate-fade-up">
        <p className="accent-text font-mono text-[0.66rem] font-semibold uppercase tracking-[0.34em]">
          Lost coordinates
        </p>
        <h1
          className="font-display mt-2 font-bold leading-none tracking-tight text-zinc-800"
          style={{ fontSize: "clamp(6rem, 22vw, 12rem)" }}
        >
          4<span className="accent-text">0</span>4
        </h1>
        <h2 className="font-grotesk -mt-2 text-xl font-semibold text-zinc-100 sm:text-2xl">
          This page slipped off the drafting table.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[0.82rem] leading-relaxed text-zinc-500">
          The route you followed doesn't map to any module in this studio. Your documents are
          untouched — pick a destination below.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => navigate("/")}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[0.8rem] font-semibold transition hover:brightness-110"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            <Home size={14} /> Back to dashboard
          </button>
          <button
            onClick={() => navigate("/resume")}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-edge bg-white/[0.03] px-5 text-[0.8rem] font-medium text-zinc-200 transition-colors hover:bg-white/[0.07]"
          >
            <FileText size={14} /> Resume builder
          </button>
        </div>

        <div className="mx-auto mt-9 grid max-w-md grid-cols-2 gap-1.5 text-left sm:grid-cols-3">
          {NAV_LINKS.filter((l) => l.path !== "/").map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-2 rounded-lg border border-edge/60 bg-white/[0.02] px-3 py-2 text-[0.7rem] font-medium text-zinc-400 transition-all hover:border-edge hover:text-zinc-100"
            >
              <Icon size={12} className="accent-text" />
              {label}
            </button>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-[0.62rem] text-zinc-600">
          <Compass size={11} className="accent-text" />
          <ArrowLeft size={11} className="hidden" />
          Everything in CVForge lives under the routes listed above — or press
          <span className="kbd mx-1">/</span> to search.
        </p>
      </div>
    </div>
  );
}
