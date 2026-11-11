import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Download, Home, RefreshCcw, ShieldAlert } from "lucide-react";
import { recordCrash, storageReport, STORAGE_QUOTA } from "@/lib/store";
import { saveBlob } from "@/lib/exportUtils";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    recordCrash({ message: error.message, route: window.location.hash || "/" });
    console.error("[CVForge] boundary caught:", error, info);
  }

  private reset = (): void => this.setState({ error: null, info: null });

  private exportReport = (): void => {
    const { error, info } = this.state;
    const { used } = ((): { used: number } => {
      try {
        return storageReport();
      } catch {
        return { used: 0 };
      }
    })();
    const report = {
      tool: "CVForge Studio",
      capturedAt: new Date().toISOString(),
      route: window.location.hash || "/",
      userAgent: navigator.userAgent,
      message: error?.message,
      stack: error?.stack,
      componentStack: info?.componentStack,
      storageBytesUsed: used,
      storageQuotaApprox: STORAGE_QUOTA,
      localStorageKeys: (() => {
        try {
          return Object.keys(localStorage);
        } catch {
          return [];
        }
      })(),
    };
    saveBlob(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
      `cvforge-error-report-${Date.now()}.json`
    );
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="bg-scene relative flex min-h-screen items-center justify-center px-5">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="glass relative w-full max-w-lg rounded-3xl p-9 text-center shadow-2xl shadow-black/60 animate-scale-in">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/[0.08] text-red-300">
            <AlertTriangle size={24} strokeWidth={2} />
          </span>
          <p className="accent-text mb-1.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.3em]">
            Fault containment engaged
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50">
            Oops! Something went wrong.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[0.82rem] leading-relaxed text-zinc-400">
            The studio caught an unexpected fault and paused safely. Your documents are stored
            separately from the interface — nothing was lost.
          </p>

          <div className="mt-5 max-h-28 overflow-y-auto rounded-xl border border-edge/70 bg-[#0c0c11] px-4 py-3 text-left">
            <p className="font-mono text-[0.66rem] leading-relaxed text-red-300/90">
              {error.message || "Unknown error"}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button
              onClick={this.reset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl text-[0.8rem] font-semibold transition hover:brightness-110"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              <RefreshCcw size={14} /> Try again
            </button>
            <button
              onClick={() => {
                window.location.hash = "#/";
                this.reset();
                window.location.reload();
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-edge bg-white/[0.03] text-[0.8rem] font-medium text-zinc-200 transition-colors hover:bg-white/[0.07]"
            >
              <Home size={14} /> Reload to dashboard
            </button>
          </div>
          <button
            onClick={this.exportReport}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-edge/70 text-[0.72rem] font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <Download size={13} /> Export error report (JSON)
          </button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.62rem] text-zinc-600">
            <ShieldAlert size={11} /> Repeated faults? Admin → System → “Wipe local cache” restores factory state.
          </p>
        </div>
      </div>
    );
  }
}
