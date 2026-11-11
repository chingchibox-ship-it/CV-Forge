import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, Link2, PencilLine, Save } from "lucide-react";
import { CoverLetterPreview } from "@/components/CoverLetterPreview";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SuggestionBanner } from "@/components/SuggestionBanner";
import { analyzeCover } from "@/lib/suggestions";
import {
  Button,
  Card,
  ColorField,
  Field,
  Input,
  PageHeader,
  PrintStage,
  Select,
  SheetScaler,
  Textarea,
  Toggle,
} from "@/components/UI";
import { useToast } from "@/components/Toast";
import { DOC_ACCENT_PRESETS, nowIso } from "@/lib/defaults";
import { getCover, getResume, saveCover } from "@/lib/store";
import { exportPDF } from "@/lib/exportUtils";
import type { CoverLetterData, DocFont } from "@/lib/types";
import { cn } from "@/utils/cn";

const SNIPPETS: { label: string; text: string }[] = [
  {
    label: "Opening hook",
    text: "When [Company] set out to [ambition], it signaled a mandate that mirrors the heart of my career: converting deep technical capability into durable business advantage.",
  },
  {
    label: "Proof paragraph",
    text: "At [Current Company], I led [scope] through [transformation], delivering [metric outcome] while [second outcome]. That result came from deliberate org design, disciplined execution, and an operating cadence the whole company could trust.",
  },
  {
    label: "Closing ask",
    text: "I would welcome a focused conversation about where your roadmap needs leverage most, and how my playbook for [domain] can accelerate it. Thank you for your consideration.",
  },
];

export function CoverLetterTool() {
  const toast = useToast();
  const resume = getResume();
  const [data, setData] = useState<CoverLetterData>(() => getCover());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const firstRun = useRef(true);

  const update = (fn: (draft: CoverLetterData) => void) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => saveCover(data, false), 900);
    return () => clearTimeout(t);
  }, [data]);

  const saveNow = useCallback(
    (announce = true) => {
      saveCover(data, true);
      setDirty(false);
      setData((d) => ({ ...d, meta: { updatedAt: nowIso() } }));
      if (announce) toast.push("Cover letter saved", { desc: "Stored locally · counted in analytics" });
    },
    [data, toast]
  );

  useEffect(() => {
    const h = () => saveNow();
    window.addEventListener("cvf:save", h);
    return () => window.removeEventListener("cvf:save", h);
  }, [saveNow]);

  // Matching style: mirror the resume's typography + accent
  const effective: CoverLetterData = data.matchStyle
    ? { ...data, fontFamily: resume.layout.fontFamily, accentColor: resume.layout.accentColor }
    : data;

  // Local AI engine — letter-quality heuristics
  const tips = useMemo(() => analyzeCover(data), [data]);

  const quickPdf = async () => {
    setBusy(true);
    try {
      saveNow(false);
      await exportPDF("cover-print-root", `Cover_Letter_${data.company.replace(/\s+/g, "_") || "CVForge"}.pdf`);
      toast.push("Cover letter PDF exported");
    } catch (e) {
      toast.push("Export failed", { desc: e instanceof Error ? e.message : "Unknown error", kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const words = data.body.trim() ? data.body.trim().split(/\s+/).length : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Module 02 — Cover Letter Architect"
        title="Cover Letter Architect"
        desc="Draft tailored letters that inherit your resume's typography and accent — or style them independently."
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download} loading={busy} onClick={quickPdf}>
              PDF
            </Button>
            <Button size="sm" icon={Save} onClick={() => saveNow()}>
              Save{dirty ? " •" : ""}
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden">
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-lg border text-[0.74rem] font-medium",
              mobileView === v
                ? "accent-border-soft accent-bg-soft accent-text border"
                : "border-edge/70 text-zinc-400"
            )}
          >
            {v === "edit" ? <PencilLine size={13} /> : <Eye size={13} />}
            {v === "edit" ? "Editor" : "Preview"}
          </button>
        ))}
      </div>

      <SuggestionBanner tips={tips} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className={cn("space-y-4 lg:col-span-5", mobileView === "preview" && "hidden lg:block")}>
          <Card className="space-y-3.5 p-5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Your name">
                <Input value={data.senderName} onChange={(e) => update((d) => void (d.senderName = e.target.value))} />
              </Field>
              <Field label="Your title">
                <Input value={data.senderTitle} onChange={(e) => update((d) => void (d.senderTitle = e.target.value))} />
              </Field>
              <Field label="Contact line" className="sm:col-span-2">
                <Input value={data.contactLine} onChange={(e) => update((d) => void (d.contactLine = e.target.value))} />
              </Field>
              <Field label="Date">
                <Input value={data.date} onChange={(e) => update((d) => void (d.date = e.target.value))} />
              </Field>
              <Field label="Role applied for">
                <Input value={data.position} onChange={(e) => update((d) => void (d.position = e.target.value))} />
              </Field>
              <Field label="Recipient name">
                <Input value={data.recipientName} onChange={(e) => update((d) => void (d.recipientName = e.target.value))} />
              </Field>
              <Field label="Recipient title">
                <Input value={data.recipientTitle} onChange={(e) => update((d) => void (d.recipientTitle = e.target.value))} />
              </Field>
              <Field label="Company" className="sm:col-span-2">
                <Input value={data.company} onChange={(e) => update((d) => void (d.company = e.target.value))} />
              </Field>
              <Field label="Greeting">
                <Input value={data.greeting} onChange={(e) => update((d) => void (d.greeting = e.target.value))} />
              </Field>
              <Field label="Sign-off">
                <Input value={data.closing} onChange={(e) => update((d) => void (d.closing = e.target.value))} />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <Field label="Letter body" hint={`${words} words · blank line = new paragraph`}>
              <Textarea
                rows={11}
                value={data.body}
                onChange={(e) => update((d) => void (d.body = e.target.value))}
                placeholder="Open with the mandate, prove with one metric, close with an ask…"
              />
            </Field>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SNIPPETS.map((s) => (
                <button
                  key={s.label}
                  onClick={() =>
                    update((d) => void (d.body = (d.body.trim() ? `${d.body.trim()}\n\n` : "") + s.text))
                  }
                  className="rounded-full border border-edge/70 bg-white/[0.02] px-3 py-1 text-[0.66rem] font-medium text-zinc-400 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:text-[var(--accent)]"
                >
                  + {s.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <Toggle
              checked={data.matchStyle}
              onChange={(v) => update((d) => void (d.matchStyle = v))}
              label="Match resume typography"
              desc="Inherit font and accent from your active resume layout"
            />
            {!data.matchStyle && (
              <div className="space-y-4 animate-fade-in">
                <Field label="Font family">
                  <Select
                    value={data.fontFamily}
                    onChange={(e) => update((d) => void (d.fontFamily = e.target.value as DocFont))}
                  >
                    <option value="sans">Inter — modern sans</option>
                    <option value="serif">Playfair — editorial serif</option>
                    <option value="grotesk">Space Grotesk — tech grotesk</option>
                    <option value="mono">JetBrains Mono — precise mono</option>
                  </Select>
                </Field>
                <ColorField
                  label="Accent"
                  value={data.accentColor}
                  onChange={(v) => update((d) => void (d.accentColor = v))}
                  presets={DOC_ACCENT_PRESETS}
                />
              </div>
            )}
            {data.matchStyle && (
              <p className="flex items-center gap-2 text-[0.66rem] text-zinc-500">
                <Link2 size={11} className="accent-text" />
                Bound to resume · updates automatically when the resume design changes
              </p>
            )}
          </Card>
        </div>

        <div className={cn("lg:col-span-7", mobileView === "edit" && "hidden lg:block")}>
          <div className="lg:sticky lg:top-[4.5rem]">
            <div className="mb-2.5 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              <Eye size={12} className="accent-text" /> Live letter preview
            </div>
            <SheetScaler baseWidth={794}>
              <CoverLetterPreview data={effective} />
            </SheetScaler>
          </div>
        </div>
      </div>

      <PrintStage>
        <CoverLetterPreview id="cover-print-root" data={effective} />
      </PrintStage>

      <LoadingScreen
        active={busy}
        title="Rendering letter PDF"
        messages={[
          "Initializing typography engine…",
          "Compiling canvas pixels…",
          "Structuring layout vectors…",
          "Finalizing byte stream…",
        ]}
      />
    </div>
  );
}
