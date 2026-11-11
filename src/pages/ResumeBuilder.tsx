import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FolderGit2,
  GraduationCap,
  LayoutTemplate,
  Loader2,
  Palette,
  PencilLine,
  Plus,
  RotateCcw,
  Ruler,
  Save,
  ScissorsLineDashed,
  Share2,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { ResumePreview } from "@/components/ResumePreview";
import { A4Stage } from "@/components/A4Stage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ShareModal } from "@/components/ShareModal";
import { SuggestionBanner } from "@/components/SuggestionBanner";
import {
  Button,
  Card,
  ColorField,
  Field,
  Input,
  PageHeader,
  PrintStage,
  RangeField,
  Textarea,
} from "@/components/UI";
import { useToast } from "@/components/Toast";
import { DOC_ACCENT_PRESETS, defaultResume, nowIso, uid } from "@/lib/defaults";
import { getResume, getSettings, saveResume } from "@/lib/store";
import { exportPDF } from "@/lib/exportUtils";
import { analyzeResume } from "@/lib/suggestions";
import type {
  CertificationItem,
  DocFont,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
  SkillGroup,
} from "@/lib/types";
import { cn } from "@/utils/cn";

// ─────────────────────────────────────────────────────────────
type SectionKey =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "design";

const SECTIONS: { key: SectionKey; label: string; icon: typeof UserRound }[] = [
  { key: "personal", label: "Personal Info", icon: UserRound },
  { key: "summary", label: "Executive Summary", icon: PencilLine },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "skills", label: "Skills Matrix", icon: SlidersHorizontal },
  { key: "projects", label: "Projects", icon: FolderGit2 },
  { key: "certifications", label: "Certifications", icon: Award },
  { key: "design", label: "Layout & Design", icon: Palette },
];

const FONT_OPTIONS: { key: DocFont; label: string; css: string }[] = [
  { key: "sans", label: "Inter", css: "'Inter', sans-serif" },
  { key: "serif", label: "Playfair", css: "'Playfair Display', serif" },
  { key: "grotesk", label: "Grotesk", css: "'Space Grotesk', sans-serif" },
  { key: "mono", label: "Mono", css: "'JetBrains Mono', monospace" },
];

// ─────────────────────────────────────────────────────────────
function ItemShell({
  title,
  subtitle,
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}: {
  title: string;
  subtitle?: string;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
}) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 2600);
    return () => clearTimeout(t);
  }, [confirm]);

  return (
    <div className="rounded-xl border border-edge/70 bg-white/[0.015] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.8rem] font-semibold text-zinc-200">{title}</div>
          {subtitle && <div className="truncate text-[0.66rem] text-zinc-500">{subtitle}</div>}
        </div>
        {onMoveUp && (
          <button onClick={onMoveUp} className="rounded-md p-1 text-zinc-600 hover:bg-white/5 hover:text-zinc-300" title="Move up">
            <ChevronUp size={14} />
          </button>
        )}
        {onMoveDown && (
          <button onClick={onMoveDown} className="rounded-md p-1 text-zinc-600 hover:bg-white/5 hover:text-zinc-300" title="Move down">
            <ChevronDown size={14} />
          </button>
        )}
        <button
          onClick={() => (confirm ? onRemove() : setConfirm(true))}
          className={cn(
            "rounded-md p-1 transition-colors",
            confirm ? "bg-red-500/15 text-red-300" : "text-zinc-600 hover:bg-white/5 hover:text-red-300"
          )}
          title={confirm ? "Click again to confirm" : "Remove"}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function BulletsEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (next: string[]) => void;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <div>
      <span className="mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Achievement bullets
      </span>
      <div className="space-y-1.5">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="accent-bg h-1 w-1 shrink-0 rounded-full" />
            <Input
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              value={b}
              placeholder="Delivered a measurable outcome…"
              onChange={(e) => {
                const next = [...bullets];
                next[i] = e.target.value;
                onChange(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const next = [...bullets];
                  next.splice(i + 1, 0, "");
                  onChange(next);
                  setTimeout(() => inputsRef.current[i + 1]?.focus(), 20);
                }
              }}
            />
            <button
              onClick={() => onChange(bullets.filter((_, j) => j !== i))}
              className="rounded-md p-1.5 text-zinc-600 hover:bg-white/5 hover:text-red-300"
              aria-label="Remove bullet"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange([...bullets, ""])}
        className="accent-text mt-2 flex items-center gap-1 text-[0.68rem] font-semibold hover:brightness-110"
      >
        <Plus size={11} /> Add bullet
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export function ResumeBuilder() {
  const toast = useToast();
  const [data, setData] = useState<ResumeData>(() => getResume());
  const [section, setSection] = useState<SectionKey>("personal");
  const [dirty, setDirty] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [guides, setGuides] = useState(true);
  const [breaksOn, setBreaksOn] = useState(true);
  const firstRun = useRef(true);

  // Local AI engine — live heuristic analysis of the active draft
  const tips = useMemo(() => analyzeResume(data), [data]);

  const update = useCallback((fn: (draft: ResumeData) => void) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  }, []);

  // autosave (silent)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      saveResume(data, false);
    }, 900);
    return () => clearTimeout(t);
  }, [data]);

  const saveNow = useCallback(
    (announce = true) => {
      saveResume(data, true);
      setDirty(false);
      setData((d) => ({ ...d, meta: { updatedAt: nowIso() } }));
      if (announce) toast.push("Resume draft saved", { desc: "Stored locally · counted in analytics" });
    },
    [data, toast]
  );

  useEffect(() => {
    const h = () => saveNow();
    window.addEventListener("cvf:save", h);
    return () => window.removeEventListener("cvf:save", h);
  }, [saveNow]);

  const completeness = useMemo(() => {
    const checks = [
      data.personal.fullName,
      data.personal.title,
      data.personal.email,
      data.personal.phone,
      data.personal.location,
      data.personal.summary.length > 80 ? "ok" : "",
      data.experience.length > 0 ? "ok" : "",
      data.experience.some((j) => j.bullets.some((b) => /\d/.test(b))) ? "ok" : "",
      data.education.length > 0 ? "ok" : "",
      data.skills.length > 0 ? "ok" : "",
      data.projects.length > 0 ? "ok" : "",
      data.certifications.length > 0 ? "ok" : "",
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [data]);

  const quickPdf = async () => {
    setBusy(true);
    try {
      saveNow(false);
      await exportPDF("resume-print-root", `${data.personal.fullName.replace(/\s+/g, "_") || "Resume"}_CVForge.pdf`);
      toast.push("PDF exported", { desc: "High-resolution A4 document downloaded" });
    } catch (e) {
      toast.push("Export failed", { desc: e instanceof Error ? e.message : "Unknown error", kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const swap = <T,>(arr: T[], i: number, j: number): T[] => {
    const next = [...arr];
    const [x] = next.splice(i, 1);
    next.splice(j, 0, x);
    return next;
  };

  // ──────── section editors ────────
  const personalPanel = (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <Field label="Full name" className="sm:col-span-2">
        <Input value={data.personal.fullName} onChange={(e) => update((d) => void (d.personal.fullName = e.target.value))} />
      </Field>
      <Field label="Professional title" className="sm:col-span-2">
        <Input value={data.personal.title} onChange={(e) => update((d) => void (d.personal.title = e.target.value))} />
      </Field>
      <Field label="Email">
        <Input type="email" value={data.personal.email} onChange={(e) => update((d) => void (d.personal.email = e.target.value))} />
      </Field>
      <Field label="Phone">
        <Input type="tel" value={data.personal.phone} onChange={(e) => update((d) => void (d.personal.phone = e.target.value))} />
      </Field>
      <Field label="Location">
        <Input value={data.personal.location} onChange={(e) => update((d) => void (d.personal.location = e.target.value))} />
      </Field>
      <Field label="Website / Portfolio">
        <Input type="url" value={data.personal.website} onChange={(e) => update((d) => void (d.personal.website = e.target.value))} />
      </Field>
      <Field label="LinkedIn" className="sm:col-span-2">
        <Input value={data.personal.linkedin} onChange={(e) => update((d) => void (d.personal.linkedin = e.target.value))} />
      </Field>
    </div>
  );

  const summaryPanel = (
    <div className="space-y-3">
      <Field label="Executive summary" hint={`${data.personal.summary.length} chars · aim 320–560`}>
        <Textarea
          rows={7}
          value={data.personal.summary}
          onChange={(e) => update((d) => void (d.personal.summary = e.target.value))}
          placeholder="Position your value in 3–4 commanding sentences…"
        />
      </Field>
      <p className="rounded-lg border border-edge/60 bg-white/[0.02] px-3 py-2 text-[0.68rem] leading-relaxed text-zinc-500">
        Lead with tenure and scope, name one headline result with a number, and close with the
        domain you want to be hired for. Third-person titles ("Technology executive") outrank "I".
      </p>
    </div>
  );

  const experiencePanel = (
    <div className="space-y-3">
      {data.experience.map((job, i) => (
        <ItemShell
          key={job.id}
          title={job.role || `Role ${i + 1}`}
          subtitle={job.company}
          onRemove={() => update((d) => void (d.experience = d.experience.filter((x) => x.id !== job.id)))}
          onMoveUp={i > 0 ? () => update((d) => void (d.experience = swap(d.experience, i, i - 1))) : undefined}
          onMoveDown={i < data.experience.length - 1 ? () => update((d) => void (d.experience = swap(d.experience, i, i + 1))) : undefined}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Role">
              <Input value={job.role} onChange={(e) => update((d) => void (d.experience[i].role = e.target.value))} />
            </Field>
            <Field label="Company">
              <Input value={job.company} onChange={(e) => update((d) => void (d.experience[i].company = e.target.value))} />
            </Field>
            <Field label="Location">
              <Input value={job.location} onChange={(e) => update((d) => void (d.experience[i].location = e.target.value))} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start">
                <Input value={job.start} placeholder="2021" onChange={(e) => update((d) => void (d.experience[i].start = e.target.value))} />
              </Field>
              <Field label="End">
                <Input value={job.end} placeholder="2024" disabled={job.current} onChange={(e) => update((d) => void (d.experience[i].end = e.target.value))} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-[0.72rem] text-zinc-400 sm:col-span-2">
              <input
                type="checkbox"
                checked={job.current}
                onChange={(e) => update((d) => void (d.experience[i].current = e.target.checked))}
                className="accent-[var(--accent)]"
              />
              Currently in this role
            </label>
            <div className="sm:col-span-2">
              <BulletsEditor
                bullets={job.bullets}
                onChange={(next) => update((d) => void (d.experience[i].bullets = next))}
              />
            </div>
          </div>
        </ItemShell>
      ))}
      <AddButton
        label="Add experience"
        onClick={() =>
          update((d) =>
            void d.experience.push({
              id: uid(),
              role: "",
              company: "",
              location: "",
              start: "",
              end: "",
              current: false,
              bullets: [""],
            } satisfies ExperienceItem)
          )
        }
      />
    </div>
  );

  const educationPanel = (
    <div className="space-y-3">
      {data.education.map((ed, i) => (
        <ItemShell
          key={ed.id}
          title={ed.school || `School ${i + 1}`}
          subtitle={`${ed.degree} ${ed.field}`}
          onRemove={() => update((d) => void (d.education = d.education.filter((x) => x.id !== ed.id)))}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="School" className="sm:col-span-2">
              <Input value={ed.school} onChange={(e) => update((d) => void (d.education[i].school = e.target.value))} />
            </Field>
            <Field label="Degree">
              <Input value={ed.degree} placeholder="M.S." onChange={(e) => update((d) => void (d.education[i].degree = e.target.value))} />
            </Field>
            <Field label="Field of study">
              <Input value={ed.field} onChange={(e) => update((d) => void (d.education[i].field = e.target.value))} />
            </Field>
            <Field label="Start">
              <Input value={ed.start} onChange={(e) => update((d) => void (d.education[i].start = e.target.value))} />
            </Field>
            <Field label="End">
              <Input value={ed.end} onChange={(e) => update((d) => void (d.education[i].end = e.target.value))} />
            </Field>
          </div>
        </ItemShell>
      ))}
      <AddButton
        label="Add education"
        onClick={() =>
          update((d) =>
            void d.education.push({ id: uid(), school: "", degree: "", field: "", start: "", end: "" } satisfies EducationItem)
          )
        }
      />
    </div>
  );

  const skillsPanel = (
    <div className="space-y-3">
      {data.skills.map((g, i) => (
        <ItemShell
          key={g.id}
          title={g.category || `Group ${i + 1}`}
          subtitle={`${g.items.length} skills`}
          onRemove={() => update((d) => void (d.skills = d.skills.filter((x) => x.id !== g.id)))}
        >
          <div className="space-y-3">
            <Field label="Category">
              <Input value={g.category} placeholder="Leadership" onChange={(e) => update((d) => void (d.skills[i].category = e.target.value))} />
            </Field>
            <Field label="Skills" hint="comma separated">
              <Input
                value={g.items.join(", ")}
                onChange={(e) =>
                  update((d) => void (d.skills[i].items = e.target.value.split(",").map((s) => s.trim()).filter(Boolean)))
                }
              />
            </Field>
          </div>
        </ItemShell>
      ))}
      <AddButton
        label="Add skill group"
        onClick={() => update((d) => void d.skills.push({ id: uid(), category: "", items: [] } satisfies SkillGroup))}
      />
    </div>
  );

  const projectsPanel = (
    <div className="space-y-3">
      {data.projects.map((p, i) => (
        <ItemShell
          key={p.id}
          title={p.name || `Project ${i + 1}`}
          subtitle={p.link}
          onRemove={() => update((d) => void (d.projects = d.projects.filter((x) => x.id !== p.id)))}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Project name">
              <Input value={p.name} onChange={(e) => update((d) => void (d.projects[i].name = e.target.value))} />
            </Field>
            <Field label="Link">
              <Input value={p.link} onChange={(e) => update((d) => void (d.projects[i].link = e.target.value))} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea rows={2} value={p.description} onChange={(e) => update((d) => void (d.projects[i].description = e.target.value))} />
            </Field>
            <Field label="Tech stack" hint="comma separated" className="sm:col-span-2">
              <Input
                value={p.tech.join(", ")}
                onChange={(e) =>
                  update((d) => void (d.projects[i].tech = e.target.value.split(",").map((s) => s.trim()).filter(Boolean)))
                }
              />
            </Field>
          </div>
        </ItemShell>
      ))}
      <AddButton
        label="Add project"
        onClick={() => update((d) => void d.projects.push({ id: uid(), name: "", link: "", tech: [], description: "" } satisfies ProjectItem))}
      />
    </div>
  );

  const certificationsPanel = (
    <div className="space-y-3">
      {data.certifications.map((c, i) => (
        <ItemShell
          key={c.id}
          title={c.name || `Certification ${i + 1}`}
          subtitle={c.issuer}
          onRemove={() => update((d) => void (d.certifications = d.certifications.filter((x) => x.id !== c.id)))}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Certification" className="sm:col-span-3">
              <Input value={c.name} onChange={(e) => update((d) => void (d.certifications[i].name = e.target.value))} />
            </Field>
            <Field label="Issuer">
              <Input value={c.issuer} onChange={(e) => update((d) => void (d.certifications[i].issuer = e.target.value))} />
            </Field>
            <Field label="Year">
              <Input value={c.year} onChange={(e) => update((d) => void (d.certifications[i].year = e.target.value))} />
            </Field>
          </div>
        </ItemShell>
      ))}
      <AddButton
        label="Add certification"
        onClick={() => update((d) => void d.certifications.push({ id: uid(), name: "", issuer: "", year: "" } satisfies CertificationItem))}
      />
    </div>
  );

  const designPanel = (
    <div className="space-y-6">
      <div>
        <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Typography
        </span>
        <div className="grid grid-cols-4 gap-2">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => update((d) => void (d.layout.fontFamily = f.key))}
              className={cn(
                "rounded-xl border px-2 py-3 text-center transition-all",
                data.layout.fontFamily === f.key
                  ? "accent-border-soft accent-bg-soft border"
                  : "border-edge/70 bg-white/[0.015] hover:border-edge"
              )}
            >
              <span className="block text-lg text-zinc-100" style={{ fontFamily: f.css }}>
                Ag
              </span>
              <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.1em] text-zinc-500">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <RangeField label="Base font size" value={data.layout.fontSize} min={11} max={15} step={0.5} format={(v) => `${v.toFixed(1)} px`} onChange={(v) => update((d) => void (d.layout.fontSize = v))} />
      <RangeField label="Line spacing" value={data.layout.lineHeight} min={1.3} max={1.8} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => update((d) => void (d.layout.lineHeight = v))} />
      <RangeField label="Page margins" value={data.layout.margin} min={30} max={64} step={2} format={(v) => `${v} px · ${Math.round(v / 3.78)} mm`} onChange={(v) => update((d) => void (d.layout.margin = v))} />

      {/* v2: precision spacing & rhythm controls (backward-compatible optional fields) */}
      <RangeField label="Letter tracking" value={data.layout.tracking ?? 0} min={0} max={0.05} step={0.005} format={(v) => (v === 0 ? "default" : `${(v * 100).toFixed(1)}% em`)} onChange={(v) => update((d) => void (d.layout.tracking = v))} />
      <RangeField label="Section spacing" value={data.layout.sectionSpacing ?? 1} min={0.8} max={2} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => update((d) => void (d.layout.sectionSpacing = v))} />

      <div>
        <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Header style
        </span>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: "bar", label: "Accent bar" },
              { key: "rule", label: "Fine rule" },
              { key: "minimal", label: "Minimal" },
            ] as const
          ).map((h) => (
            <button
              key={h.key}
              onClick={() => update((d) => void (d.layout.headerStyle = h.key))}
              className={cn(
                "rounded-xl border py-2.5 text-[0.7rem] font-medium transition-all",
                (data.layout.headerStyle ?? "bar") === h.key
                  ? "accent-border-soft accent-bg-soft accent-text border"
                  : "border-edge/70 bg-white/[0.015] text-zinc-400 hover:border-edge"
              )}
            >
              <span
                className="mx-auto mb-1.5 block h-[3px] w-8 rounded-full"
                style={{
                  background:
                    h.key === "minimal"
                      ? "transparent"
                      : `linear-gradient(90deg, var(--accent), ${h.key === "rule" ? "transparent" : "var(--accent)"})`,
                  border: h.key === "minimal" ? "1px dashed #3f3f46" : "none",
                  height: h.key === "minimal" ? 3 : undefined,
                }}
              />
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Column layout
        </span>
        <div className="grid grid-cols-2 gap-2">
          {([1, 2] as const).map((n) => (
            <button
              key={n}
              onClick={() => update((d) => void (d.layout.columns = n))}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[0.74rem] font-medium transition-all",
                data.layout.columns === n
                  ? "accent-border-soft accent-bg-soft accent-text border"
                  : "border-edge/70 bg-white/[0.015] text-zinc-400 hover:border-edge"
              )}
            >
              <LayoutTemplate size={14} className={n === 2 ? "" : "opacity-50"} />
              {n === 1 ? "Single column" : "Split columns"}
            </button>
          ))}
        </div>
      </div>

      <ColorField
        label="Document accent"
        value={data.layout.accentColor}
        onChange={(v) => update((d) => void (d.layout.accentColor = v))}
        presets={DOC_ACCENT_PRESETS}
      />

      <ResetTemplateButton
        onReset={() => {
          const tpl = getSettings().defaultResume ?? defaultResume();
          setData(structuredClone(tpl));
          setDirty(true);
          toast.push("Template applied", { desc: "Workspace reset to the default template", kind: "info" });
        }}
      />
    </div>
  );

  const panels: Record<SectionKey, React.ReactNode> = {
    personal: personalPanel,
    summary: summaryPanel,
    experience: experiencePanel,
    education: educationPanel,
    skills: skillsPanel,
    projects: projectsPanel,
    certifications: certificationsPanel,
    design: designPanel,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Module 01 — Resume Builder"
        title="Advanced Resume Builder"
        desc="Eight fully dynamic sections, granular layout control and a zero-lag live A4 preview. Changes autosave locally."
        actions={
          <>
            <div className="mr-1 hidden items-center gap-2 sm:flex" title="Profile completeness">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-edge/70">
                <div className="accent-bg h-full rounded-full transition-all duration-500" style={{ width: `${completeness}%` }} />
              </div>
              <span className="text-[0.66rem] font-medium text-zinc-500">{completeness}%</span>
            </div>
            <Button variant="outline" size="sm" icon={Download} loading={busy} onClick={quickPdf}>
              PDF
            </Button>
            <Button variant="outline" size="sm" icon={Share2} onClick={() => setShareOpen(true)}>
              Share
            </Button>
            <Button size="sm" icon={Save} onClick={() => saveNow()}>
              Save{dirty ? " •" : ""}
            </Button>
          </>
        }
      />

      {/* mobile editor/preview switch */}
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

      {/* local AI suggestion engine — non-intrusive insight strip */}
      <SuggestionBanner tips={tips} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Editor column */}
        <div className={cn("lg:col-span-5", mobileView === "preview" && "hidden lg:block")}>
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[0.7rem] font-medium transition-all",
                  section === key
                    ? "accent-border-soft accent-bg-soft accent-text border"
                    : "border-edge/70 bg-white/[0.015] text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
          <Card className="p-4 sm:p-5" key={section}>
            {panels[section]}
          </Card>
        </div>

        {/* Preview column */}
        <div className={cn("lg:col-span-7", mobileView === "edit" && "hidden lg:block")}>
          <div className="lg:sticky lg:top-[4.5rem]">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                <Eye size={12} className="accent-text" /> Precision A4 canvas
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => setGuides((v) => !v)}
                  title="Margin safe-area guides"
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] transition-colors",
                    guides ? "accent-border-soft accent-bg-soft accent-text border" : "border-edge/70 text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  <Ruler size={10} /> Guides
                </button>
                <button
                  onClick={() => setBreaksOn((v) => !v)}
                  title="Page-break indicators"
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] transition-colors",
                    breaksOn ? "border-[rgba(56,189,248,0.4)] bg-[rgba(56,189,248,0.08)] text-[#38bdf8]" : "border-edge/70 text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  <ScissorsLineDashed size={10} /> Breaks
                </button>
                <span className="ml-1 flex items-center gap-1.5 text-[0.64rem] text-zinc-600">
                  <span className={cn("h-1.5 w-1.5 rounded-full", dirty ? "bg-amber-400" : "bg-emerald-400")} />
                  {dirty ? "Editing…" : "Saved"}
                </span>
              </span>
            </div>
            <A4Stage
              margin={data.layout.margin}
              topOffset={(data.layout.headerStyle ?? "bar") === "bar" ? 5 : 0}
              showGuides={guides}
              showBreaks={breaksOn}
            >
              <ResumePreview data={data} />
            </A4Stage>
            <p className="mt-3 text-center text-[0.64rem] text-zinc-600">
              Pixel-true 794 × 1123 px (96 DPI) · PDF export uses 2× supersampling without guides
            </p>
          </div>
        </div>
      </div>

      <PrintStage>
        <ResumePreview id="resume-print-root" data={data} />
      </PrintStage>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} resume={data} />
      <LoadingScreen
        active={busy}
        title="Rendering resume PDF"
        messages={[
          "Initializing typography engine…",
          "Compiling canvas pixels…",
          "Structuring layout vectors…",
          "Paginating A4 sheets…",
          "Finalizing byte stream…",
        ]}
      />
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-edge py-2.5 text-[0.74rem] font-medium text-zinc-500 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:text-[var(--accent)]"
    >
      <Plus size={13} /> {label}
    </button>
  );
}

function ResetTemplateButton({ onReset }: { onReset: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 2600);
    return () => clearTimeout(t);
  }, [confirm]);
  return (
    <Button
      variant="ghost"
      size="sm"
      icon={confirm ? Trash2 : busy ? Loader2 : RotateCcw}
      className={confirm ? "text-red-300" : ""}
      onClick={() => {
        if (!confirm) return setConfirm(true);
        setBusy(true);
        onReset();
        setTimeout(() => {
          setBusy(false);
          setConfirm(false);
        }, 300);
      }}
    >
      {confirm ? "Confirm reset workspace" : "Reset workspace to default template"}
    </Button>
  );
}


