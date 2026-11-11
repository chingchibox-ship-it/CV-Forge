import { useEffect, useRef, useState } from "react";
import {
  FileArchive,
  FileDown,
  FileImage,
  FileJson2,
  FileText,
  IdCard,
  Import,
  Mail,
  Package,
} from "lucide-react";
import { BioCardPreview } from "@/components/BioCardPreview";
import { CoverLetterPreview } from "@/components/CoverLetterPreview";
import { ResumePreview } from "@/components/ResumePreview";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button, Card, PageHeader, PrintStage } from "@/components/UI";
import { useToast } from "@/components/Toast";
import {
  exportBundle,
  exportJPG,
  exportJSON,
  exportPDF,
  exportPNG,
  readJsonFile,
} from "@/lib/exportUtils";
import { formatDate, getBio, getCover, getResume, saveBio, saveCover, saveResume, useBusTick } from "@/lib/store";
import type { BioCardData, CoverLetterData, ResumeData } from "@/lib/types";
import { cn } from "@/utils/cn";

type BusyKey = "pdf" | "png" | "jpg" | "zip" | "json" | null;

const EXPORTERS: {
  key: Exclude<BusyKey, null>;
  title: string;
  desc: string;
  icon: typeof FileDown;
  tag: string;
}[] = [
  { key: "pdf", title: "Resume · PDF", desc: "Print-accurate A4, multi-page, 2× supersampled text-crisp render.", icon: FileDown, tag: "Best for ATS & recruiters" },
  { key: "png", title: "Resume · PNG", desc: "Lossless high-resolution image of the full document.", icon: FileImage, tag: "Portfolios & previews" },
  { key: "jpg", title: "Resume · JPG", desc: "Compressed image render — smaller footprint, quick sharing.", icon: FileImage, tag: "Lightweight sharing" },
  { key: "zip", title: "Complete Bundle", desc: "Resume PDF + cover letter PDF + bio card PNG + JSON backup, zipped.", icon: FileArchive, tag: "Everything, archived" },
  { key: "json", title: "Raw JSON Export", desc: "Full data portability — resume, letter and bio in one JSON file.", icon: FileJson2, tag: "Backup & migrate" },
];

export function ExportCenter() {
  const toast = useToast();
  useBusTick();
  const [busy, setBusy] = useState<BusyKey>(null);
  const [cover, setCover] = useState<CoverLetterData>(() => getCover());
  const fileRef = useRef<HTMLInputElement>(null);

  const resume = getResume();
  const bio = getBio();

  const effectiveCover: CoverLetterData = cover.matchStyle
    ? { ...cover, fontFamily: resume.layout.fontFamily, accentColor: resume.layout.accentColor }
    : cover;

  const guard = async (key: Exclude<BusyKey, null>, fn: () => Promise<void> | void, done: string) => {
    setBusy(key);
    try {
      await fn();
      toast.push(done);
    } catch (e) {
      toast.push("Export failed", { desc: e instanceof Error ? e.message : "Unknown error", kind: "error" });
    } finally {
      setBusy(null);
    }
  };

  const run = (key: Exclude<BusyKey, null>) => {
    const name = (resume.personal.fullName || "CVForge").replace(/\s+/g, "_");
    const fns: Record<Exclude<BusyKey, null>, () => [(() => Promise<void> | void), string]> = {
      pdf: () => [() => exportPDF("resume-print-root", `${name}_Resume.pdf`), "Resume PDF downloaded"],
      png: () => [() => exportPNG("resume-print-root", `${name}_Resume.png`), "Resume PNG downloaded"],
      jpg: () => [() => exportJPG("resume-print-root", `${name}_Resume.jpg`), "Resume JPG downloaded"],
      zip: () => [
        () => exportBundle({ resume: "resume-print-root", cover: "cover-print-root", bio: "bio-print-root" }),
        "Complete bundle zipped & downloaded",
      ],
      json: () => [() => exportJSON(`${name}_CVForge_Backup.json`), "JSON backup downloaded"],
    };
    const [fn, msg] = fns[key]();
    void guard(key, fn, msg);
  };

  // Ctrl+P → direct PDF when on this page
  useEffect(() => {
    const h = () => run("pdf");
    window.addEventListener("cvf:print", h);
    return () => window.removeEventListener("cvf:print", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume]);

  const importBackup = async (file: File) => {
    try {
      const parsed = await readJsonFile(file);
      const p = parsed as {
        __cvforge?: boolean;
        resume?: ResumeData;
        cover?: CoverLetterData;
        bio?: BioCardData;
      };
      if (!p.__cvforge && !p.resume && !p.cover && !p.bio) {
        toast.push("Unrecognized backup", { desc: "Expected a CVForge JSON export.", kind: "error" });
        return;
      }
      if (p.resume) saveResume(p.resume, false);
      if (p.cover) {
        saveCover(p.cover, false);
        setCover(p.cover);
      }
      if (p.bio) saveBio(p.bio, false);
      toast.push("Backup restored", { desc: "Workspace updated from imported JSON." });
    } catch (e) {
      toast.push("Import failed", { desc: e instanceof Error ? e.message : "Invalid file", kind: "error" });
    }
  };

  const docs = [
    { icon: FileText, name: "Resume", detail: `${resume.experience.length} roles · ${resume.personal.fullName}`, updated: resume.meta.updatedAt, path: "/resume" },
    { icon: Mail, name: "Cover letter", detail: cover.company ? `To ${cover.company} · ${cover.position}` : "General letter", updated: cover.meta.updatedAt, path: "/cover-letter" },
    { icon: IdCard, name: "Bio card", detail: `${bio.name} · ${bio.role}`, updated: bio.meta.updatedAt, path: "/bio" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Module 05 — Distribution"
        title="Export Center"
        desc="One tap for every format. All renders happen locally in your browser at 2× resolution."
        actions={
          <span className="text-[0.66rem] text-zinc-500">
            <span className="kbd">Ctrl</span>+<span className="kbd">P</span> = instant resume PDF
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {EXPORTERS.map(({ key, title, desc, icon: Icon, tag }) => (
          <Card key={key} hover className="flex flex-col p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="accent-bg-soft accent-text flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon size={17} strokeWidth={2.1} />
              </span>
              <span className="rounded-full border border-edge/70 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-zinc-500">
                {tag}
              </span>
            </div>
            <div className="font-grotesk text-[0.95rem] font-semibold text-zinc-50">{title}</div>
            <p className="mb-5 mt-1 flex-1 text-[0.74rem] leading-relaxed text-zinc-500">{desc}</p>
            <Button
              variant={key === "pdf" ? "primary" : "outline"}
              size="sm"
              loading={busy === key}
              disabled={busy !== null && busy !== key}
              onClick={() => run(key)}
              className="w-full"
            >
              {busy === key ? "Rendering…" : `Download ${key.toUpperCase()}`}
            </Button>
          </Card>
        ))}

        {/* Import card */}
        <Card hover className="flex flex-col border-dashed p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-white/[0.03] text-zinc-400">
              <Import size={17} strokeWidth={2.1} />
            </span>
            <span className="rounded-full border border-edge/70 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-zinc-500">
              Restore
            </span>
          </div>
          <div className="font-grotesk text-[0.95rem] font-semibold text-zinc-50">Import Backup</div>
          <p className="mb-5 mt-1 flex-1 text-[0.74rem] leading-relaxed text-zinc-500">
            Bring back a previous CVForge JSON export — documents overwrite the current workspace.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importBackup(f);
              e.target.value = "";
            }}
          />
          <Button variant="subtle" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
            Choose JSON file…
          </Button>
        </Card>
      </div>

      {/* Document registry */}
      <h2 className="mb-3 mt-9 font-grotesk text-lg font-semibold text-zinc-100">Document registry</h2>
      <Card className="divide-y divide-edge/60 overflow-hidden">
        {docs.map(({ icon: Icon, name, detail, updated, path }) => (
          <a
            key={name}
            href={`#${path}`}
            className={cn("flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge/70 bg-white/[0.02] text-zinc-400">
              <Icon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[0.84rem] font-semibold text-zinc-200">{name}</div>
              <div className="truncate text-[0.7rem] text-zinc-500">{detail}</div>
            </div>
            <span className="text-[0.66rem] text-zinc-600">updated {formatDate(updated)}</span>
            <span className="accent-text text-[0.7rem] font-semibold">Open →</span>
          </a>
        ))}
        <div className="flex items-center gap-3 bg-white/[0.015] px-5 py-3.5">
          <Package size={13} className="accent-text" />
          <p className="text-[0.68rem] text-zinc-500">
            Every export is counted in local analytics — visible to the admin console.
          </p>
        </div>
      </Card>

      {/* Off-screen capture targets */}
      <PrintStage>
        <ResumePreview id="resume-print-root" data={resume} />
        <CoverLetterPreview id="cover-print-root" data={effectiveCover} />
        <BioCardPreview id="bio-print-root" data={bio} />
      </PrintStage>

      <LoadingScreen
        active={busy !== null}
        title={
          busy === "zip"
            ? "Packaging complete bundle"
            : busy === "pdf"
              ? "Rendering PDF document"
              : busy === "png"
                ? "Rasterizing PNG render"
                : busy === "jpg"
                  ? "Compressing JPG render"
                  : "Serializing JSON payload"
        }
        messages={
          busy === "zip"
            ? [
                "Compiling resume canvas…",
                "Rendering cover letter…",
                "Capturing bio card…",
                "Sealing JSON vault…",
                "Deflating archive layers…",
              ]
            : [
                "Initializing typography engine…",
                "Compiling canvas pixels…",
                "Structuring layout vectors…",
                "Finalizing byte stream…",
              ]
        }
      />
    </div>
  );
}
