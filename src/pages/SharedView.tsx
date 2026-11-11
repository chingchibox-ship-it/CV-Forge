import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Download,
  FileJson2,
  Link2,
  Lock,
  MessageSquare,
  PencilLine,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ResumePreview } from "@/components/ResumePreview";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button, Card, Input, PrintStage, SheetScaler } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { exportPDF, saveBlob } from "@/lib/exportUtils";
import { decodeShare, PERMISSION_META, shareFingerprint } from "@/lib/share";
import { navigate } from "@/lib/router";
import { saveResume } from "@/lib/store";
import type { SharePayload } from "@/lib/types";
import { cn } from "@/utils/cn";
import { nowIso } from "@/lib/defaults";

const DEFAULT_ORDER = ["summary", "experience", "education", "skills", "projects", "certifications"];

const SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

interface Comment {
  id: string;
  text: string;
  at: string;
}

type DecodeState = "loading" | "ok" | "invalid";

export function SharedView({ token }: { token: string }) {
  const toast = useToast();
  const [state, setState] = useState<DecodeState>("loading");
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [fontScale, setFontScale] = useState(1);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");

  const fp = useMemo(() => shareFingerprint(token), [token]);

  // Decode with a brief cinematic beat
  useEffect(() => {
    const t = setTimeout(() => {
      const decoded = decodeShare(token);
      if (decoded) {
        setPayload(decoded);
        setState("ok");
        try {
          const raw = localStorage.getItem(`cvf.share.c.${fp}`);
          setComments(raw ? (JSON.parse(raw) as Comment[]) : []);
        } catch {
          setComments([]);
        }
      } else {
        setState("invalid");
      }
    }, 650);
    return () => clearTimeout(t);
  }, [token, fp]);

  const perms = payload?.perms;

  const viewData = useMemo(() => {
    if (!payload) return null;
    const r = structuredClone(payload.resume);
    if (perms?.format) {
      r.layout.fontSize = Math.round((r.layout.fontSize ?? 13) * fontScale * 10) / 10;
    }
    return r;
  }, [payload, fontScale, perms?.format]);

  const persistComments = (list: Comment[]): void => {
    setComments(list);
    try {
      localStorage.setItem(`cvf.share.c.${fp}`, JSON.stringify(list));
    } catch {
      /* quota guard */
    }
  };

  const addComment = (): void => {
    const text = draft.trim();
    if (!text) return;
    persistComments([{ id: `${Date.now()}`, text, at: nowIso() }, ...comments]);
    setDraft("");
    toast.push("Annotation added", { desc: "Stored locally — visible only on this device" });
  };

  const doPdf = async (): Promise<void> => {
    if (!payload) return;
    setBusy(true);
    try {
      const name = (payload.resume.personal.fullName || "Shared_Resume").replace(/\s+/g, "_");
      await exportPDF("shared-print-root", `${name}_Shared.pdf`);
      toast.push("PDF downloaded");
    } catch (e) {
      toast.push("Export failed", { desc: e instanceof Error ? e.message : "Unknown error", kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const doJson = (): void => {
    if (!payload) return;
    saveBlob(
      new Blob([JSON.stringify(payload.resume, null, 2)], { type: "application/json" }),
      `shared-resume-${Date.now()}.json`
    );
    toast.push("Resume JSON downloaded");
  };

  const doImport = (): void => {
    if (!payload) return;
    saveResume(structuredClone(payload.resume), true);
    toast.push("Imported into your studio", { desc: "Opening the builder with this draft" });
    navigate("/resume");
  };

  const move = (i: number, dir: -1 | 1): void => {
    setOrder((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const [x] = next.splice(i, 1);
      next.splice(j, 0, x);
      return next;
    });
  };

  if (state === "loading") {
    return (
      <div className="bg-scene min-h-screen">
        <LoadingScreen
          active
          title="Opening shared link"
          messages={[
            "Decoding secure payload…",
            "Verifying permission matrix…",
            "Structuring layout vectors…",
            "Rendering recipient view…",
          ]}
        />
      </div>
    );
  }

  if (state === "invalid" || !payload || !viewData || !perms) {
    return (
      <div className="bg-scene flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-md p-9 text-center animate-scale-in">
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] text-amber-300">
            <Ban size={22} />
          </span>
          <h1 className="font-grotesk text-xl font-semibold text-zinc-50">Link couldn't be decoded</h1>
          <p className="mt-2 text-[0.78rem] leading-relaxed text-zinc-500">
            This share link is malformed, truncated in transit, or forged with an incompatible
            version. Ask the sender to regenerate it from their Export-ready draft.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate("/")}>
            Go to my dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-scene min-h-screen">
      {/* shared toolbar */}
      <header className="glass-deep sticky top-0 z-40 border-b border-edge/60">
        <div className="mx-auto flex h-13 max-w-[90rem] flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
          <span className="accent-bg-soft accent-border-soft accent-text flex h-7 w-7 items-center justify-center rounded-lg border">
            <Link2 size={12} />
          </span>
          <div className="min-w-0">
            <span className="block truncate text-[0.76rem] font-semibold text-zinc-100">
              Shared résumé{payload.label ? ` · ${payload.label}` : ""}
            </span>
            <span className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-zinc-600">
              recipient mode · {Object.values(perms).filter(Boolean).length}/7 grants
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {perms.pdf && (
              <Button variant="outline" size="sm" icon={Download} loading={busy} onClick={() => void doPdf()}>
                PDF
              </Button>
            )}
            {perms.json && (
              <Button variant="outline" size="sm" icon={FileJson2} onClick={doJson}>
                JSON
              </Button>
            )}
            {perms.comment && (
              <Button
                variant={commentsOpen ? "subtle" : "outline"}
                size="sm"
                icon={MessageSquare}
                onClick={() => setCommentsOpen((v) => !v)}
              >
                Notes {comments.length > 0 && `· ${comments.length}`}
              </Button>
            )}
            {perms.edit && (
              <Button size="sm" icon={PencilLine} onClick={doImport}>
                Open in my studio
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[80rem] px-4 pb-16 pt-6 sm:px-6">
        {/* permission matrix readout */}
        <Card className="mb-5 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              <ShieldCheck size={12} className="accent-text" /> Enforcement matrix
            </span>
            {PERMISSION_META.map(({ key, label }) => {
              const on = perms[key];
              return (
                <span
                  key={key}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-medium",
                    on
                      ? "accent-border-soft accent-bg-soft accent-text"
                      : "border-edge/60 text-zinc-600 line-through decoration-zinc-700"
                  )}
                >
                  {!on && <Lock size={9} />}
                  {label}
                </span>
              );
            })}
          </div>
          {perms.comment && (
            <p className="mt-2.5 text-[0.62rem] text-zinc-600">
              Commenting is enabled — annotations stay on this device only and never sync back.
            </p>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* side controls */}
          <div className="space-y-4 xl:col-span-3">
            {perms.format && (
              <Card className="p-4">
                <h3 className="mb-3 text-[0.74rem] font-semibold text-zinc-200">View formatting</h3>
                <div className="flex items-center justify-between rounded-xl border border-edge/70 bg-white/[0.02] px-3 py-2.5">
                  <span className="text-[0.7rem] text-zinc-400">Text scale</span>
                  <div className="flex items-center gap-1.5">
                    {[0.92, 1, 1.1].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFontScale(f)}
                        className={cn(
                          "h-7 w-9 rounded-lg border font-mono text-[0.62rem] transition-colors",
                          fontScale === f
                            ? "accent-border-soft accent-bg-soft accent-text border"
                            : "border-edge/70 text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {Math.round(f * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {perms.reorder && (
              <Card className="p-4">
                <h3 className="mb-1 text-[0.74rem] font-semibold text-zinc-200">Section order</h3>
                <p className="mb-3 text-[0.62rem] text-zinc-600">Recipient-side reshuffle — sender's copy is untouched.</p>
                <div className="space-y-1.5">
                  {order.map((id, i) => (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-lg border border-edge/60 bg-white/[0.015] px-3 py-2"
                    >
                      <span className="flex-1 text-[0.72rem] font-medium text-zinc-300">
                        {SECTION_LABELS[id] ?? id}
                      </span>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="rounded p-1 text-zinc-600 hover:bg-white/5 hover:text-zinc-200 disabled:opacity-25"
                        aria-label="Move up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === order.length - 1}
                        className="rounded p-1 text-zinc-600 hover:bg-white/5 hover:text-zinc-200 disabled:opacity-25"
                        aria-label="Move down"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {commentsOpen && perms.comment && (
              <Card className="p-4 animate-fade-in">
                <h3 className="mb-3 text-[0.74rem] font-semibold text-zinc-200">Private annotations</h3>
                <div className="flex gap-1.5">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Note to self…"
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                  />
                  <Button variant="outline" size="md" icon={Send} onClick={addComment} aria-label="Add note" />
                </div>
                <div className="mt-3 space-y-2">
                  {comments.length === 0 && (
                    <p className="text-[0.66rem] text-zinc-600">No annotations yet.</p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="group rounded-lg border border-edge/60 bg-white/[0.015] px-3 py-2">
                      <p className="text-[0.72rem] leading-relaxed text-zinc-300">{c.text}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-mono text-[0.56rem] text-zinc-600">
                          {new Date(c.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          onClick={() => persistComments(comments.filter((x) => x.id !== c.id))}
                          className="rounded p-0.5 text-zinc-700 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                          aria-label="Delete note"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {!perms.highlight && (
              <div className="flex items-start gap-2 rounded-xl border border-edge/60 bg-white/[0.015] px-3.5 py-3">
                <Lock size={12} className="mt-0.5 shrink-0 text-zinc-600" />
                <p className="text-[0.64rem] leading-relaxed text-zinc-500">
                  The sender disabled text highlighting — selection and copying are suppressed.
                </p>
              </div>
            )}
          </div>

          {/* document */}
          <div className="xl:col-span-9">
            <div
              style={perms.highlight ? undefined : { userSelect: "none", WebkitUserSelect: "none" }}
              onCopy={perms.highlight ? undefined : (e) => e.preventDefault()}
            >
              <SheetScaler baseWidth={794}>
                <ResumePreview data={viewData} sectionOrder={perms.reorder ? order : undefined} />
              </SheetScaler>
            </div>
            <p className="mt-4 text-center text-[0.62rem] text-zinc-600">
              Shared via CVForge Studio · received {new Date(payload.createdAt).toLocaleString()} ·{" "}
              link integrity verified locally
            </p>
          </div>
        </div>
      </main>

      <PrintStage>
        <ResumePreview id="shared-print-root" data={viewData} sectionOrder={perms.reorder ? order : undefined} />
      </PrintStage>
      <LoadingScreen
        active={busy}
        title="Rendering shared document"
        messages={["Compiling canvas pixels…", "Structuring layout vectors…", "Binding permission envelope…"]}
      />
    </div>
  );
}
