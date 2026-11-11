import { useCallback, useEffect, useState } from "react";
import { Construction, ShieldCheck } from "lucide-react";
import { ToastProvider, useToast } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Navbar } from "@/components/Navbar";
import { CommandPalette } from "@/components/CommandPalette";
import { Dashboard } from "@/pages/Dashboard";
import { ResumeBuilder } from "@/pages/ResumeBuilder";
import { CoverLetterTool } from "@/pages/CoverLetterTool";
import { BulletOptimizer } from "@/pages/BulletOptimizer";
import { BioCardTool } from "@/pages/BioCardTool";
import { ExportCenter } from "@/pages/ExportCenter";
import { AdminPanel } from "@/pages/AdminPanel";
import { NotFound } from "@/pages/NotFound";
import { SharedView } from "@/pages/SharedView";
import { navigate, useHashRoute } from "@/lib/router";
import { useSettings } from "@/lib/store";
import { extractSearchShareToken } from "@/lib/share";

function contrastFor(hex: string): string {
  const clean = hex.replace("#", "").slice(0, 6).padEnd(6, "0");
  const c = parseInt(clean, 16);
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? "#0a0a0c" : "#f8fafc";
}

function MaintenanceScreen() {
  const settings = useSettings();
  return (
    <div className="bg-scene relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="bg-grid absolute inset-0" />
      <div className="relative animate-fade-up">
        <span className="accent-bg-soft accent-border-soft accent-text mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border">
          <Construction size={26} strokeWidth={2} />
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          {settings.brand.name} <span className="accent-text italic">{settings.brand.accentWord}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.88rem] leading-relaxed text-zinc-400">
          {settings.maintenanceMessage}
        </p>
        <button
          onClick={() => navigate("/admin")}
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-edge bg-white/[0.03] px-4 py-2.5 text-[0.76rem] font-medium text-zinc-300 transition-colors hover:bg-white/[0.07]"
        >
          <ShieldCheck size={14} className="accent-text" />
          Administrator sign-in
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const route = useHashRoute();
  const settings = useSettings();
  const toast = useToast();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Apply admin-controlled accent palette globally
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", settings.accent);
    root.style.setProperty("--accent-contrast", contrastFor(settings.accent));
  }, [settings.accent]);

  // Shared-link ingress: ?share=TOKEN (and bare #share=TOKEN) normalize into
  // the canonical hash route — on first load and for in-app link changes.
  useEffect(() => {
    const token = extractSearchShareToken();
    if (token) navigate(`/share/${token}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (route.startsWith("/share=")) navigate(`/share/${route.slice(7)}`);
  }, [route]);

  const triggerSave = useCallback(() => {
    window.dispatchEvent(new CustomEvent("cvf:save"));
    if (!["/resume", "/cover-letter", "/bio"].includes(route)) {
      toast.push("Nothing to save here", {
        desc: "Every edit autosaves locally as you type.",
        kind: "info",
      });
    }
  }, [route, toast]);

  // Global keyboard shortcuts
  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null): boolean => {
      const el = t as HTMLElement | null;
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        triggerSave();
        return;
      }
      if (meta && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (route === "/export") {
          window.dispatchEvent(new CustomEvent("cvf:print"));
        } else {
          navigate("/export");
          toast.push("Export Center", { desc: "Ctrl+P again here for an instant resume PDF", kind: "info" });
        }
        return;
      }
      if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [route, toast, triggerSave]);

  // Maintenance gate — admin route always reachable; shared links bypass
  // (visitors must be able to open links during maintenance windows)
  if (settings.maintenance && route !== "/admin" && !route.startsWith("/share/")) {
    return <MaintenanceScreen />;
  }

  // Shared recipient view renders chrome-free (no app navbar confusion)
  if (route.startsWith("/share/")) {
    const token = route.slice("/share/".length);
    return <SharedView token={decodeURIComponent(token)} />;
  }

  let page: React.ReactNode;
  switch (true) {
    case route === "/":
      page = <Dashboard />;
      break;
    case route.startsWith("/resume"):
      page = <ResumeBuilder />;
      break;
    case route.startsWith("/cover-letter"):
      page = <CoverLetterTool />;
      break;
    case route.startsWith("/bullets"):
      page = <BulletOptimizer />;
      break;
    case route.startsWith("/bio"):
      page = <BioCardTool />;
      break;
    case route.startsWith("/export"):
      page = <ExportCenter />;
      break;
    case route.startsWith("/admin"):
      page = <AdminPanel />;
      break;
    default:
      page = <NotFound />;
  }

  return (
    <div className="bg-scene min-h-screen">
      <div className="bg-grid pointer-events-none fixed inset-x-0 top-0 h-[26rem]" />
      <Navbar route={route} onOpenPalette={() => setPaletteOpen(true)} />
      <main className="relative mx-auto max-w-[90rem] px-4 pb-10 pt-8 sm:px-6">{page}</main>
      <footer className="border-t border-edge/50">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 sm:px-6">
          <span className="font-grotesk text-[0.78rem] font-semibold text-zinc-300">
            {settings.brand.name}
            <span className="accent-text ml-1">{settings.brand.accentWord}</span>
          </span>
          <span className="text-[0.66rem] text-zinc-600">
            Local-first · your data never leaves this browser
          </span>
          <span className="ml-auto hidden items-center gap-3 text-[0.64rem] text-zinc-600 md:flex">
            <span className="flex items-center gap-1">
              <span className="kbd">Ctrl</span>+<span className="kbd">S</span> save
            </span>
            <span className="flex items-center gap-1">
              <span className="kbd">Ctrl</span>+<span className="kbd">P</span> export
            </span>
            <span className="flex items-center gap-1">
              <span className="kbd">/</span> search
            </span>
          </span>
        </div>
      </footer>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSave={triggerSave} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </ErrorBoundary>
  );
}
