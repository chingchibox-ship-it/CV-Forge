import { useMemo, useState } from "react";
import {
  Check,
  ClipboardCopy,
  Copy,
  FlaskConical,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button, Card, Field, PageHeader, Select, Textarea, Toggle } from "@/components/UI";
import { SuggestionBanner } from "@/components/SuggestionBanner";
import { useToast } from "@/components/Toast";
import { OPTIMIZER_VERBS, SAMPLE_RAW_NOTES } from "@/lib/defaults";
import { getResume, saveResume } from "@/lib/store";
import { analyzeNotes } from "@/lib/suggestions";
import { cn } from "@/utils/cn";

// ─────────────────────────────────────────────────────────────
// Impact optimization engine (fully client-side)
// ─────────────────────────────────────────────────────────────
const WEAK_PREFIX =
  /^(i\s+|we\s+|my\s+)?(was\s+|were\s+)?(responsible for\s+|in charge of\s+|tasked with\s+|helped\s+(with\s+|to\s+|in\s+)?|worked on\s+|worked with\s+|assisted\s+(with\s+|in\s+)?|involved in\s+|participated in\s+|contributed to\s+|handled\s+|did\s+|made\s+|was part of\s+)/i;

const IRREGULAR_PAST: Record<string, string> = {
  run: "led",
  build: "built",
  make: "created",
  write: "authored",
  lead: "led",
  cut: "cut",
  grow: "grew",
  drive: "drove",
  win: "won",
  launch: "launched",
  ship: "shipped",
  say: "articulated",
  pay: "funded",
  buy: "procured",
  spend: "allocated",
  tell: "advised",
  set: "established",
  sell: "closed",
  hold: "maintained",
};

const KNOWN_STRONG = new Set(
  [
    ...OPTIMIZER_VERBS.Executive,
    ...OPTIMIZER_VERBS.Technical,
    ...OPTIMIZER_VERBS.Balanced,
  ].map((v) => v.toLowerCase())
);

function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function toPast(word: string): string {
  const lower = word.toLowerCase();
  if (lower in IRREGULAR_PAST) return IRREGULAR_PAST[lower];
  if (lower.endsWith("ed")) return lower;
  if (/e$/.test(lower)) return `${lower}d`;
  if (/[^aeiou]y$/.test(lower)) return `${lower.slice(0, -1)}ied`;
  return `${lower}ed`;
}

function gerundToPast(word: string): string {
  let base = word.toLowerCase().slice(0, -3); // strip "ing"
  if (base.length < 2) return word; // degenerate input — leave untouched
  if (base[base.length - 1] === base[base.length - 2]) {
    base = base.slice(0, -1); // running → run
  }
  return toPast(base);
}

export interface PolishedBullet {
  raw: string;
  text: string;
  verb: string;
  hasMetric: boolean;
  score: number;
  hint: string | null;
}

export function polishNotes(raw: string, tone: keyof typeof OPTIMIZER_VERBS, addPeriod: boolean): PolishedBullet[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•▪◦·]|\d+[.)])\s*/, "").trim())
    .filter((l) => l.length > 2);

  const bank = OPTIMIZER_VERBS[tone] ?? OPTIMIZER_VERBS.Balanced;

  return lines.map((line) => {
    let text = line.replace(/^i\s+/i, "");
    let verb = "";

    const weakMatch = text.match(WEAK_PREFIX);
    if (weakMatch) {
      let rest = text.slice(weakMatch[0].length).trim();
      const firstWord = rest.split(/\s+/)[0] ?? "";
      const lowerFirst = firstWord.toLowerCase();
      const articleish = ["the", "a", "an", "our", "my", "all", "new", "their", "daily", "weekly"].includes(lowerFirst);
      const nounish = /s$/i.test(lowerFirst) && lowerFirst.length > 3;
      if (/ing$/i.test(firstWord)) {
        // "responsible for migrating X" → "Migrated X"
        verb = gerundToPast(firstWord);
        verb = verb.charAt(0).toUpperCase() + verb.slice(1);
        rest = rest.slice(firstWord.length).trim();
        text = `${verb} ${rest}`;
      } else if (/^[a-z]+$/i.test(firstWord) && !lowerFirst.endsWith("ed") && !articleish && !nounish) {
        // "helped reduce X" → "Reduced X"
        verb = toPast(firstWord);
        verb = verb.charAt(0).toUpperCase() + verb.slice(1);
        rest = rest.slice(firstWord.length).trim();
        text = `${verb} ${rest}`;
      } else if (articleish) {
        // "worked on the kubernetes rollout" → "Hardened the kubernetes rollout"
        verb = bank[hashOf(line) % bank.length];
        text = `${verb} ${rest}`;
      } else {
        // "made dashboards for X" → "Delivered dashboards for X"
        verb = bank[hashOf(line) % bank.length];
        const ownership = /^dashboards|^reports|^presentations|^documentation|^tooling/i.test(firstWord)
          ? `delivery of ${rest.charAt(0).toLowerCase()}${rest.slice(1)}`
          : `${rest.charAt(0).toLowerCase()}${rest.slice(1)}`;
        text = `${verb} ${ownership}`;
      }
    } else {
      // already starts with a verb-ish word
      const first = text.split(/\s+/)[0] ?? "";
      const lower = first.toLowerCase();
      if (KNOWN_STRONG.has(lower) || lower.endsWith("ed")) {
        verb = first.charAt(0).toUpperCase() + first.slice(1);
        text = verb + text.slice(first.length);
      } else if (/ing$/i.test(lower)) {
        verb = gerundToPast(lower);
        verb = verb.charAt(0).toUpperCase() + verb.slice(1);
        text = `${verb}${text.slice(first.length)}`;
      } else if (/^[a-z]+$/i.test(lower) && ["a", "the", "all", "new", "our"].indexOf(lower) === -1) {
        // present-tense verb → past
        const past = toPast(lower);
        if (past !== lower) {
          verb = past.charAt(0).toUpperCase() + past.slice(1);
          text = verb + text.slice(first.length);
        } else {
          verb = bank[hashOf(line) % bank.length];
          text = `${verb} ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
        }
      } else {
        verb = bank[hashOf(line) % bank.length];
        text = `${verb} ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
      }
    }

    text = text.replace(/\s{2,}/g, " ").replace(/\.$/, "").trim();
    if (addPeriod) text += ".";

    const hasMetric = /\d|%\$|\$|percent|doubled|tripled/i.test(text);
    const strong = KNOWN_STRONG.has(verb.toLowerCase()) || verb.toLowerCase().endsWith("ed");
    const len = text.length;
    let score = (strong ? 45 : 18) + (hasMetric ? 35 : 0) + (len >= 45 && len <= 190 ? 20 : len < 220 ? 12 : 6);
    score = Math.min(100, score);

    const hint = hasMetric
      ? null
      : "No metric detected — consider adding %, $, time saved, or scale (users/requests).";

    return { raw: line, text, verb, hasMetric, score, hint };
  });
}

// ─────────────────────────────────────────────────────────────
export function BulletOptimizer() {
  const toast = useToast();
  const [raw, setRaw] = useState("");
  const [tone, setTone] = useState<keyof typeof OPTIMIZER_VERBS>("Balanced");
  const [addPeriod, setAddPeriod] = useState(true);
  const [results, setResults] = useState<PolishedBullet[]>([]);
  const [targetJob, setTargetJob] = useState<string>("");
  const [copiedAll, setCopiedAll] = useState(false);

  const resume = getResume();

  // Local AI engine — pre-polish raw-note heuristics
  const tips = useMemo(() => analyzeNotes(raw), [raw]);

  const avg = useMemo(
    () => (results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0),
    [results]
  );

  const run = () => {
    const out = polishNotes(raw, tone, addPeriod);
    if (out.length === 0) {
      toast.push("Nothing to polish", { desc: "Paste raw notes first — one line per bullet.", kind: "info" });
      return;
    }
    setResults(out);
    toast.push(`${out.length} bullets optimized`, { desc: `Average impact score ${avg}/100` });
  };

  const copyText = (text: string, label = "Bullet copied") => {
    navigator.clipboard.writeText(text).then(
      () => toast.push(label),
      () => toast.push("Clipboard blocked by browser", { kind: "error" })
    );
  };

  const copyAll = () => {
    copyText(results.map((r) => `• ${r.text}`).join("\n"), "All bullets copied");
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const insert = () => {
    if (!targetJob) {
      toast.push("Select a target role first", { kind: "info" });
      return;
    }
    const next = structuredClone(resume);
    const job = next.experience.find((j) => j.id === targetJob);
    if (!job) return;
    job.bullets = [...job.bullets.filter(Boolean), ...results.map((r) => r.text)];
    saveResume(next, true);
    toast.push(`Inserted ${results.length} bullets`, {
      desc: `Added to “${job.role || job.company}” and saved to your resume draft`,
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Module 03 — Impact Optimizer"
        title="Bullet Point Polisher"
        desc="Paste raw, honest work notes. Receive metric-aware, action-verb-driven bullets scored for impact."
        actions={
          <div className="flex items-center gap-2">
            <span className="kbd">/</span>
            <span className="text-[0.66rem] text-zinc-500">to switch tools fast</span>
          </div>
        }
      />

      <SuggestionBanner tips={tips} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Input */}
        <Card className="space-y-4 p-5 lg:col-span-5">
          <Field label="Raw notes" hint="one rough line per achievement">
            <Textarea
              rows={12}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={"responsible for the checkout rewrite\nhelped cut infra costs\nworked on hiring pipeline…"}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Verb tone">
              <Select value={tone} onChange={(e) => setTone(e.target.value as keyof typeof OPTIMIZER_VERBS)}>
                <option value="Executive">Executive — lead & govern</option>
                <option value="Technical">Technical — build & harden</option>
                <option value="Balanced">Balanced — deliver & grow</option>
              </Select>
            </Field>
            <div className="flex items-end">
              <button
                onClick={() => setRaw(SAMPLE_RAW_NOTES)}
                className="flex h-9.5 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-edge text-[0.72rem] font-medium text-zinc-500 transition-colors hover:text-[var(--accent)]"
              >
                <FlaskConical size={13} /> Load sample notes
              </button>
            </div>
          </div>
          <Toggle
            checked={addPeriod}
            onChange={setAddPeriod}
            label="Terminal periods"
            desc="Append a period to each polished bullet"
          />
          <Button size="lg" icon={Wand2} className="w-full" onClick={run}>
            Optimize into achievement bullets
          </Button>
        </Card>

        {/* Output */}
        <div className="lg:col-span-7">
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="accent-bg-soft accent-text flex h-9 w-9 items-center justify-center rounded-xl">
                  <Sparkles size={16} />
                </span>
                <div>
                  <div className="text-[0.85rem] font-semibold text-zinc-100">Polished output</div>
                  <div className="text-[0.66rem] text-zinc-500">
                    {results.length ? `${results.length} bullets · avg impact ${avg}/100` : "Awaiting input"}
                  </div>
                </div>
              </div>
              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" icon={copiedAll ? Check : Copy} onClick={copyAll}>
                    {copiedAll ? "Copied" : "Copy all"}
                  </Button>
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-edge px-6 py-14 text-center">
                <Wand2 size={20} className="mx-auto mb-3 text-zinc-600" />
                <p className="text-[0.8rem] font-medium text-zinc-400">Your optimized bullets will appear here</p>
                <p className="mx-auto mt-1 max-w-sm text-[0.7rem] leading-relaxed text-zinc-600">
                  Weak stems like “responsible for” are rewritten as past-tense action verbs, tense is
                  normalized, and every line is scored for measurable impact.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="group rounded-xl border border-edge/70 bg-white/[0.015] p-3.5 transition-colors hover:border-edge"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.82rem] leading-relaxed text-zinc-200">{r.text}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 font-mono text-[0.6rem]",
                              r.score >= 80
                                ? "accent-border-soft accent-text"
                                : r.score >= 55
                                  ? "border-edge text-zinc-400"
                                  : "border-amber-500/30 text-amber-300/90"
                            )}
                          >
                            impact {r.score}
                          </span>
                          <span className="rounded-full border border-edge/70 px-2 py-0.5 font-mono text-[0.6rem] text-zinc-500">
                            verb · {r.verb}
                          </span>
                          {r.hasMetric && (
                            <span className="rounded-full border border-emerald-500/25 px-2 py-0.5 font-mono text-[0.6rem] text-emerald-300/90">
                              metric ✓
                            </span>
                          )}
                        </div>
                        {r.hint && <p className="mt-1.5 text-[0.64rem] text-amber-300/70">{r.hint}</p>}
                      </div>
                      <button
                        onClick={() => copyText(r.text)}
                        className="rounded-lg border border-edge/70 p-2 text-zinc-500 opacity-0 transition-all hover:text-[var(--accent)] group-hover:opacity-100"
                        title="Copy bullet"
                      >
                        <ClipboardCopy size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-edge/70 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="text-[0.76rem] font-semibold text-zinc-200">Send straight to your resume</div>
                    <div className="text-[0.66rem] text-zinc-500">Appends these bullets to a chosen role and saves the draft.</div>
                  </div>
                  <Select value={targetJob} onChange={(e) => setTargetJob(e.target.value)} className="sm:w-56">
                    <option value="">Choose role…</option>
                    {resume.experience.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.role || "Untitled"} — {j.company}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" icon={Check} onClick={insert}>
                    Insert
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
