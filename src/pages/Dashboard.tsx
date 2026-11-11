import {
  ArrowRight,
  ArrowUpRight,
  Construction,
  Database,
  FileText,
  Files,
  Layers,
  Package,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { navigate } from "@/lib/router";
import { formatBytes, formatDate, getResume, getStats, storageReport, STORAGE_QUOTA, useBusTick, useSettings } from "@/lib/store";
import { Card } from "@/components/UI";
import { NAV_LINKS } from "@/components/Navbar";

const EXTRA_CARDS = [
  {
    path: "/admin",
    label: "Admin Console",
    desc: "Templates, analytics, security and system controls.",
    icon: ShieldCheck,
  },
];

const TOOL_META: Record<string, string> = {
  "/": "Workspace overview, live status and quick actions.",
  "/resume": "Multi-section editor with zero-lag live preview.",
  "/cover-letter": "Letters that mirror your resume's typography.",
  "/bullets": "Raw notes → metric-driven, action-verb bullets.",
  "/bio": "Executive bio card for portfolios and socials.",
  "/export": "PDF, PNG, JPG, ZIP bundle and JSON portability.",
};

export function Dashboard() {
  const settings = useSettings();
  useBusTick();
  const stats = getStats();
  const resume = getResume();
  const { used } = storageReport();
  const storagePct = Math.min(100, (used / STORAGE_QUOTA) * 100);
  const totalExports = Object.values(stats.exports).reduce((a, b) => a + b, 0);

  const cards = [...NAV_LINKS.filter((l) => l.path !== "/"), ...EXTRA_CARDS];

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-edge/70 bg-carbon/60">
        <div className="bg-grid absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50rem 22rem at 85% -20%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 65%)",
          }}
        />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <p className="accent-text mb-3 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.3em]">
            Local-first · Private · Production-grade
          </p>
          <h1 className="font-display max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-zinc-50 sm:text-5xl text-balance">
            Forge a career narrative with{" "}
            <span className="accent-text italic">executive precision</span>.
          </h1>
          <p className="mt-4 max-w-xl text-[0.9rem] leading-relaxed text-zinc-400">
            {settings.brand.tagline} Every byte stays in your browser — no accounts, no servers,
            no leaks.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/resume")}
              className="group inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[0.85rem] font-semibold transition-all duration-200 hover:brightness-110"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              Open Resume Builder
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate("/export")}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-edge bg-white/[0.03] px-5 text-[0.85rem] font-medium text-zinc-200 transition-colors hover:bg-white/[0.07]"
            >
              <Package size={15} />
              Export Center
            </button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.68rem] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="kbd">Ctrl</span>+<span className="kbd">S</span> save draft
            </span>
            <span className="flex items-center gap-1.5">
              <span className="kbd">Ctrl</span>+<span className="kbd">P</span> export
            </span>
            <span className="flex items-center gap-1.5">
              <span className="kbd">/</span> quick search
            </span>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Files, label: "Drafts generated", value: String(stats.drafts) },
          { icon: Package, label: "Files exported", value: String(totalExports) },
          { icon: Database, label: "Local storage", value: formatBytes(used) },
          { icon: Timer, label: "Last activity", value: formatDate(stats.lastActive) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="accent-bg-soft accent-text flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="truncate font-grotesk text-lg font-semibold leading-tight text-zinc-50">
                  {value}
                </div>
                <div className="text-[0.62rem] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Working document strip */}
      <section className="mb-8">
        <Card className="flex flex-wrap items-center gap-4 px-5 py-4">
          <span className="accent-bg-soft accent-text flex h-10 w-10 items-center justify-center rounded-xl">
            <Layers size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.88rem] font-semibold text-zinc-100">
              {resume.personal.fullName} — {resume.personal.title || "Untitled resume"}
            </div>
            <div className="text-[0.7rem] text-zinc-500">
              Active draft · updated {formatDate(resume.meta.updatedAt)} ·{" "}
              {resume.experience.length} roles · {resume.skills.reduce((a, s) => a + s.items.length, 0)} skills
            </div>
          </div>
          <div className="hidden flex-1 items-center gap-3 md:flex">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge/70">
              <div
                className="accent-bg h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(storagePct, 2)}%` }}
              />
            </div>
            <span className="text-[0.66rem] text-zinc-500">{storagePct.toFixed(1)}% of 5 MB</span>
          </div>
          <button
            onClick={() => navigate("/resume")}
            className="accent-text flex items-center gap-1 text-[0.76rem] font-semibold hover:brightness-110"
          >
            Continue <ArrowUpRight size={13} />
          </button>
        </Card>
      </section>

      {/* Tool grid */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-grotesk text-lg font-semibold text-zinc-100">Career Suite</h2>
          {settings.maintenance && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-3 py-1 text-[0.66rem] font-medium text-amber-300">
              <Construction size={11} /> Maintenance mode active
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ path, label, icon: Icon }) => (
            <button key={path} onClick={() => navigate(path)} className="text-left">
              <Card hover className="group h-full p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="accent-bg-soft accent-text flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105">
                    <Icon size={17} strokeWidth={2.1} />
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="text-zinc-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-300"
                  />
                </div>
                <div className="font-grotesk text-[0.95rem] font-semibold text-zinc-50">{label}</div>
                <p className="mt-1 text-[0.75rem] leading-relaxed text-zinc-500">
                  {TOOL_META[path] ?? ""}
                </p>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {/* Highlight strip */}
      <section className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { icon: FileText, title: "Zero-lag live preview", body: "Every keystroke reflects instantly in a print-accurate A4 canvas." },
          { icon: Sparkles, title: "Impact optimizer", body: "Weak duty statements become strong, metric-driven achievement bullets." },
          { icon: ShieldCheck, title: "Admin-governed", body: "Templates, branding, palette and security — all under one console." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-edge/60 bg-white/[0.015] p-5">
            <Icon size={16} className="accent-text mb-3" />
            <div className="text-[0.85rem] font-semibold text-zinc-200">{title}</div>
            <p className="mt-1 text-[0.74rem] leading-relaxed text-zinc-500">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
