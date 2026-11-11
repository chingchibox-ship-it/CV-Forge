import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, Save, Type, WandSparkles } from "lucide-react";
import { BioCardPreview } from "@/components/BioCardPreview";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SuggestionBanner } from "@/components/SuggestionBanner";
import { analyzeBio } from "@/lib/suggestions";
import {
  ACCENT_PRESETS,
  nowIso,
} from "@/lib/defaults";
import { getBio, saveBio } from "@/lib/store";
import { exportPNG } from "@/lib/exportUtils";
import {
  Button,
  Card,
  ColorField,
  Field,
  Input,
  PageHeader,
  PrintStage,
  SheetScaler,
  Textarea,
} from "@/components/UI";
import { useToast } from "@/components/Toast";
import type { BioCardData } from "@/lib/types";
import { cn } from "@/utils/cn";

const TAGLINES = [
  "Building elite engineering organizations and the platforms that outlast them.",
  "Turning ambiguous problems into shipping products since day one.",
  "Full-stack craftsman. Systems thinker. Relentless about the last 2%.",
  "I make complex infrastructure feel boringly reliable.",
];

export function BioCardTool() {
  const toast = useToast();
  const [data, setData] = useState<BioCardData>(() => getBio());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const firstRun = useRef(true);

  // Local AI engine — card-quality heuristics
  const tips = useMemo(() => analyzeBio(data), [data]);

  const update = (fn: (draft: BioCardData) => void) => {
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
    const t = setTimeout(() => saveBio(data, false), 900);
    return () => clearTimeout(t);
  }, [data]);

  const saveNow = useCallback(
    (announce = true) => {
      saveBio(data, true);
      setDirty(false);
      setData((d) => ({ ...d, meta: { updatedAt: nowIso() } }));
      if (announce) toast.push("Bio card saved", { desc: "Stored locally · counted in analytics" });
    },
    [data, toast]
  );

  useEffect(() => {
    const h = () => saveNow();
    window.addEventListener("cvf:save", h);
    return () => window.removeEventListener("cvf:save", h);
  }, [saveNow]);

  const downloadCard = async () => {
    setBusy(true);
    try {
      saveNow(false);
      await exportPNG("bio-print-root", `Bio_Card_${data.name.replace(/\s+/g, "_") || "CVForge"}.png`);
      toast.push("Bio card PNG exported", { desc: "2× supersampled render downloaded" });
    } catch (e) {
      toast.push("Export failed", { desc: e instanceof Error ? e.message : "Unknown error", kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const copyText = () => {
    const lines = [
      `${data.name} — ${data.role}`,
      data.tagline,
      "",
      data.skills.join(" · "),
      [data.website, data.github, data.linkedin, data.email].filter(Boolean).join("  |  "),
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(lines).then(
      () => toast.push("Plain-text bio copied"),
      () => toast.push("Clipboard blocked by browser", { kind: "error" })
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Module 04 — Social / Portfolio"
        title="Executive Bio Card"
        desc="A share-ready summary card for portfolios, speaker pages and social profiles — rendered as a crisp PNG."
        actions={
          <>
            <Button variant="outline" size="sm" icon={Type} onClick={copyText}>
              Copy as text
            </Button>
            <Button variant="outline" size="sm" icon={Download} loading={busy} onClick={downloadCard}>
              PNG
            </Button>
            <Button size="sm" icon={Save} onClick={() => saveNow()}>
              Save{dirty ? " •" : ""}
            </Button>
          </>
        }
      />

      <SuggestionBanner tips={tips} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="self-start space-y-3.5 p-5 lg:col-span-5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Name">
              <Input value={data.name} onChange={(e) => update((d) => void (d.name = e.target.value))} />
            </Field>
            <Field label="Role">
              <Input value={data.role} onChange={(e) => update((d) => void (d.role = e.target.value))} />
            </Field>
            <Field label="Tagline" className="sm:col-span-2">
              <Textarea rows={2} value={data.tagline} onChange={(e) => update((d) => void (d.tagline = e.target.value))} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TAGLINES.map((t) => (
              <button
                key={t}
                onClick={() => update((d) => void (d.tagline = t))}
                className="rounded-full border border-edge/70 bg-white/[0.02] px-2.5 py-1 text-[0.62rem] text-zinc-500 transition-colors hover:text-[var(--accent)]"
              >
                <WandSparkles size={9} className="mr-1 inline" />
                {t.slice(0, 34)}…
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Location">
              <Input value={data.location} onChange={(e) => update((d) => void (d.location = e.target.value))} />
            </Field>
            <Field label="Email">
              <Input type="email" value={data.email} onChange={(e) => update((d) => void (d.email = e.target.value))} />
            </Field>
            <Field label="Website">
              <Input type="url" value={data.website} onChange={(e) => update((d) => void (d.website = e.target.value))} />
            </Field>
            <Field label="GitHub">
              <Input type="url" value={data.github} onChange={(e) => update((d) => void (d.github = e.target.value))} />
            </Field>
            <Field label="LinkedIn" className="sm:col-span-2">
              <Input value={data.linkedin} onChange={(e) => update((d) => void (d.linkedin = e.target.value))} />
            </Field>
            <Field label="Skill chips" hint="comma separated" className="sm:col-span-2">
              <Input
                value={data.skills.join(", ")}
                onChange={(e) =>
                  update((d) => void (d.skills = e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)))
                }
              />
            </Field>
          </div>
          <ColorField
            label="Card accent"
            value={data.accent}
            onChange={(v) => update((d) => void (d.accent = v))}
            presets={ACCENT_PRESETS}
          />
        </Card>

        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-[4.5rem]">
            <div className="mb-2.5 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              <Eye size={12} className="accent-text" /> Card preview · 840 × 472
            </div>
            <div
              className="rounded-3xl border border-edge/60 p-4 sm:p-6"
              style={{
                background:
                  "radial-gradient(28rem 16rem at 80% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%), #0d0d11",
              }}
            >
              <SheetScaler baseWidth={840}>
                <BioCardPreview data={data} />
              </SheetScaler>
            </div>
            <p className={cn("mt-3 text-center text-[0.64rem] text-zinc-600")}>
              Exported at 2× resolution — ideal for X/LinkedIn banners and personal sites.
            </p>
          </div>
        </div>
      </div>

      <PrintStage>
        <BioCardPreview id="bio-print-root" data={data} />
      </PrintStage>

      <LoadingScreen
        active={busy}
        title="Capturing bio card"
        messages={[
          "Compiling canvas pixels…",
          "Compositing accent glow…",
          "Rasterizing at 2× density…",
          "Finalizing byte stream…",
        ]}
      />
    </div>
  );
}
