import { useMemo, useState } from "react";
import { BrainCircuit, CheckCheck, ChevronDown, Sparkles, X } from "lucide-react";
import type { Tip } from "@/lib/suggestions";
import { cn } from "@/utils/cn";

const SEVERITY_STYLE: Record<Tip["severity"], { dot: string; chip: string; label: string }> = {
  high: {
    dot: "bg-red-400",
    chip: "border-red-500/25 bg-red-500/[0.07] text-red-300/90",
    label: "critical",
  },
  medium: {
    dot: "bg-amber-300",
    chip: "accent-border-soft accent-bg-soft accent-text",
    label: "advice",
  },
  low: {
    dot: "bg-zinc-500",
    chip: "border-edge text-zinc-500",
    label: "polish",
  },
};

// Non-intrusive smart-suggestion banner — collapses to a chip row,
// dismissible per tip, zero layout shift once dismissed.
export function SuggestionBanner({ tips }: { tips: Tip[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => tips.filter((t) => !dismissed.has(t.id)), [tips, dismissed]);
  const shown = expanded ? visible : visible.slice(0, 3);

  if (tips.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-edge/70 bg-carbon/70 animate-fade-in">
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <span className="accent-bg-soft accent-text flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
          <BrainCircuit size={13} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[0.74rem] font-semibold text-zinc-200">
            Smart suggestions · local engine
          </span>
          <span className="ml-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-zinc-600">
            {visible.length ? `${visible.length} insight${visible.length > 1 ? "s" : ""}` : "clear"}
          </span>
        </div>
        {visible.length > 3 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.66rem] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
          >
            {expanded ? "Collapse" : `+${visible.length - 3} more`}
            <ChevronDown size={11} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex items-center gap-2.5 px-4 pb-3.5 pt-3">
          <CheckCheck size={14} className="accent-text" />
          <p className="text-[0.74rem] text-zinc-400">
            All quality checks pass — this draft is export-ready.
          </p>
        </div>
      ) : (
        <div className="space-y-2 px-3.5 pb-3.5 pt-3">
          {shown.map((tip) => {
            const s = SEVERITY_STYLE[tip.severity];
            return (
              <div
                key={tip.id}
                className="group relative rounded-xl border border-edge/60 bg-white/[0.015] py-2.5 pl-3.5 pr-8 transition-colors hover:border-edge"
              >
                <span className={cn("absolute left-3.5 top-[1.05rem] h-1.5 w-1.5 rounded-full", s.dot)} />
                <div className="pl-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-1.5 py-px font-mono text-[0.55rem] uppercase tracking-[0.12em]", s.chip)}>
                      {s.label}
                    </span>
                    <span className="text-[0.76rem] font-semibold text-zinc-200">{tip.title}</span>
                  </div>
                  <p className="mt-1 flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-zinc-500">
                    <Sparkles size={10} className="accent-text mt-0.5 shrink-0" />
                    {tip.detail}
                  </p>
                </div>
                <button
                  onClick={() => setDismissed((prev) => new Set(prev).add(tip.id))}
                  className="absolute right-2 top-2 rounded-md p-1 text-zinc-600 opacity-0 transition-all hover:bg-white/5 hover:text-zinc-300 group-hover:opacity-100"
                  aria-label="Dismiss suggestion"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
