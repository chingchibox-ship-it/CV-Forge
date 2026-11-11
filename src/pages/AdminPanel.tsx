import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Database,
  Download,
  Files,
  HardDrive,
  HeartPulse,
  KeyRound,
  LayoutTemplate,
  Lock,
  LogOut,
  Megaphone,
  Palette,
  PenLine,
  Save,
  Settings2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";
import { Button, Card, ColorField, Field, Input, PageHeader, Textarea, Toggle } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { ACCENT_PRESETS, defaultResume } from "@/lib/defaults";
import { readJsonFile, saveBlob } from "@/lib/exportUtils";
import { navigate } from "@/lib/router";
import {
  backupAll,
  bumpExport,
  ensureAuth,
  formatBytes,
  formatDate,
  getResume,
  getSettings,
  getStats,
  hasAdminSession,
  lastCrashAt,
  restoreBackup,
  saveCover,
  getCover,
  saveSettings,
  setAdminSession,
  storageReport,
  STORAGE_QUOTA,
  updateCredentials,
  useBusTick,
  verifyLogin,
  wipeAll,
} from "@/lib/store";
import { cn } from "@/utils/cn";

// ─────────────────────────────────────────────────────────────
// Auth gate
// ─────────────────────────────────────────────────────────────
const ATTEMPT_KEY = "cvf.admin.attempts";

function getAttempts(): { n: number; until: number } {
  try {
    return JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) ?? '{"n":0,"until":0}');
  } catch {
    return { n: 0, until: 0 };
  }
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    void ensureAuth();
  }, []);

  const submit = async () => {
    const { n, until } = getAttempts();
    if (Date.now() < until) {
      setError(`Locked. Try again in ${Math.ceil((until - Date.now()) / 1000)}s.`);
      return;
    }
    setBusy(true);
    setError(null);
    const ok = await verifyLogin(username, password);
    setBusy(false);
    if (ok) {
      sessionStorage.removeItem(ATTEMPT_KEY);
      setAdminSession(true);
      toast.push("Welcome back, administrator", { desc: "Session active for this tab" });
      onSuccess();
    } else {
      const attempts = n + 1;
      const lock = attempts >= 5 ? Date.now() + 60_000 : 0;
      sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ n: attempts, until: lock }));
      setError(
        lock ? "Too many attempts — console locked for 60 seconds." : `Invalid credentials · ${5 - attempts} attempts remaining`
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center animate-fade-up">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(30rem 18rem at 50% 20%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 70%)",
        }}
      />
      <style>{`@keyframes shakeX { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(3px)} }`}</style>
      <div
        className="glass relative w-full rounded-3xl p-8 shadow-2xl shadow-black/60 animate-scale-in"
        style={shake ? { animation: "shakeX 0.45s ease" } : undefined}
      >
        <div className="mb-7 text-center">
          <span className="accent-bg-soft accent-border-soft accent-text mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border">
            <Lock size={20} strokeWidth={2.2} />
          </span>
          <h1 className="font-grotesk text-xl font-semibold text-zinc-50">Admin Console</h1>
          <p className="mt-1 text-[0.72rem] text-zinc-500">
            Restricted area · credentials are verified against a locally stored SHA-256 hash
          </p>
        </div>
        <div className="space-y-3.5">
          <Field label="Username">
            <Input
              value={username}
              autoComplete="username"
              placeholder="cvforge"
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </Field>
          <Field label="Passcode">
            <Input
              type="password"
              value={password}
              autoComplete="current-password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </Field>
          {error && (
            <p className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-[0.72rem] text-red-300 animate-fade-in">
              {error}
            </p>
          )}
          <Button size="lg" className="w-full" onClick={submit} loading={busy} icon={KeyRound}>
            Authenticate
          </Button>
          <p className="text-center text-[0.62rem] leading-relaxed text-zinc-600">
            First launch seeds <span className="font-mono text-zinc-500">cvforge / cvforge</span> — rotate it
            immediately from Security settings.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────
type Tab = "overview" | "branding" | "templates" | "appearance" | "security" | "system";

const TABS: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: "overview", label: "Analytics", icon: Activity },
  { key: "branding", label: "Branding", icon: Megaphone },
  { key: "templates", label: "Templates", icon: LayoutTemplate },
  { key: "appearance", label: "UI Palette", icon: Palette },
  { key: "security", label: "Security", icon: KeyRound },
  { key: "system", label: "System", icon: Wrench },
];

export function AdminPanel() {
  const [authed, setAuthed] = useState(hasAdminSession());
  const [tab, setTab] = useState<Tab>("overview");
  const toast = useToast();
  useBusTick();

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  return (
    <div>
      <PageHeader
        eyebrow="Restricted — Administrator"
        title="Admin Console"
        desc="Govern templates, global palette, announcements, analytics and system state. All changes apply instantly."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={() => {
              setAdminSession(false);
              setAuthed(false);
              toast.push("Signed out", { kind: "info" });
              navigate("/");
            }}
          >
            Sign out
          </Button>
        }
      />

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[0.72rem] font-medium transition-all",
              tab === key
                ? "accent-border-soft accent-bg-soft accent-text border"
                : "border-edge/70 bg-white/[0.015] text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "branding" && <BrandingTab />}
      {tab === "templates" && <TemplatesTab />}
      {tab === "appearance" && <AppearanceTab />}
      {tab === "security" && <SecurityTab />}
      {tab === "system" && <SystemTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const stats = getStats();
  const { entries, used } = storageReport();
  const pct = Math.min(100, (used / STORAGE_QUOTA) * 100);
  const totalExports = Object.values(stats.exports).reduce((a, b) => a + b, 0);
  const maxExport = Math.max(1, ...Object.values(stats.exports));

  // Deep-metric derivations (v2)
  const resume = getResume();
  const cover = getCover();
  const wordsCrafted = [
    resume.personal.summary,
    ...resume.experience.flatMap((j) => j.bullets),
    ...resume.projects.map((p) => p.description),
    cover.body,
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  const shares = stats.shares ?? 0;
  const crashes = stats.crashes ?? 0;
  const crashAt = lastCrashAt();
  const biggest = entries[0];
  const health =
    pct < 55
      ? { label: "Healthy", cls: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300" }
      : pct < 85
        ? { label: "Caution", cls: "border-amber-500/25 bg-amber-500/[0.08] text-amber-300" }
        : { label: "Critical", cls: "border-red-500/25 bg-red-500/[0.08] text-red-300" };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { icon: Files, label: "Generated drafts", value: String(stats.drafts), sub: "explicit saves, all tools" },
          { icon: Download, label: "Total exports", value: String(totalExports), sub: stats.lastExportAt ? `last ${formatDate(stats.lastExportAt)}` : "none yet" },
          { icon: Database, label: "Storage used", value: formatBytes(used), sub: `${pct.toFixed(2)}% of 5 MB local quota` },
          { icon: Share2, label: "Share links forged", value: String(shares), sub: "permission-gated URLs issued" },
          { icon: PenLine, label: "Words crafted", value: wordsCrafted.toLocaleString(), sub: "resume + letter corpus" },
          { icon: Activity, label: "Last activity", value: formatDate(stats.lastActive), sub: `tracking since ${formatDate(stats.createdAt)}` },
        ].map(({ icon: Icon, label, value, sub }) => (
          <Card key={label} className="p-4">
            <span className="accent-bg-soft accent-text mb-3 flex h-9 w-9 items-center justify-center rounded-xl">
              <Icon size={15} />
            </span>
            <div className="font-grotesk text-xl font-semibold text-zinc-50">{value}</div>
            <div className="text-[0.64rem] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
            <div className="mt-0.5 text-[0.62rem] text-zinc-600">{sub}</div>
          </Card>
        ))}
      </div>

      {/* Vault health & integrity strip (v2) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="accent-bg-soft accent-text flex h-9 w-9 items-center justify-center rounded-xl">
              <HeartPulse size={16} />
            </span>
            <span className={cn("rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em]", health.cls)}>
              {health.label}
            </span>
          </div>
          <h3 className="mt-3 text-[0.8rem] font-semibold text-zinc-200">Storage health</h3>
          <div className="mt-2.5 space-y-1.5 text-[0.68rem] text-zinc-500">
            <div className="flex justify-between"><span>Quota pressure</span><span className="font-mono text-zinc-400">{formatBytes(used)} / 5 MB</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-edge/60">
              <div className={cn("h-full rounded-full", pct > 85 ? "bg-red-400" : pct > 55 ? "bg-amber-300" : "accent-bg")} style={{ width: `${Math.max(pct, 1.5)}%` }} />
            </div>
            <div className="flex justify-between"><span>Keys tracked</span><span className="font-mono text-zinc-400">{entries.length}</span></div>
            <div className="flex justify-between gap-3">
              <span>Largest key</span>
              <span className="truncate font-mono text-zinc-400" title={biggest?.key}>
                {biggest ? `${biggest.key.slice(0, 22)} · ${formatBytes(biggest.bytes)}` : "—"}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <span className="accent-bg-soft accent-text flex h-9 w-9 items-center justify-center rounded-xl">
            <ShieldAlert size={16} />
          </span>
          <h3 className="mt-3 text-[0.8rem] font-semibold text-zinc-200">Runtime integrity</h3>
          <div className="mt-2.5 space-y-1.5 text-[0.68rem] text-zinc-500">
            <div className="flex justify-between"><span>Crashes contained</span><span className="font-mono text-zinc-400">{crashes}</span></div>
            <div className="flex justify-between"><span>Last crash</span><span className="font-mono text-zinc-400">{crashAt ? formatDate(crashAt) : "never"}</span></div>
            <div className="flex justify-between"><span>Error boundary</span><span className="font-mono text-emerald-300/90">armed</span></div>
            <p className="pt-1 text-[0.62rem] leading-relaxed text-zinc-600">
              The global boundary traps render faults, logs telemetry here, and offers report export to users.
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <span className="accent-bg-soft accent-text flex h-9 w-9 items-center justify-center rounded-xl">
            <Share2 size={16} />
          </span>
          <h3 className="mt-3 text-[0.8rem] font-semibold text-zinc-200">Distribution posture</h3>
          <div className="mt-2.5 space-y-1.5 text-[0.68rem] text-zinc-500">
            <div className="flex justify-between"><span>Links issued</span><span className="font-mono text-zinc-400">{shares}</span></div>
            <div className="flex justify-between"><span>Payload mode</span><span className="font-mono text-zinc-400">base64url · in-URL</span></div>
            <div className="flex justify-between"><span>Service egress</span><span className="font-mono text-emerald-300/90">zero</span></div>
            <p className="pt-1 text-[0.62rem] leading-relaxed text-zinc-600">
              Share payloads travel inside the URL — no server storage, revocation by deletion.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-[0.8rem] font-semibold text-zinc-200">Export breakdown</h3>
          <div className="space-y-3">
            {(Object.entries(stats.exports) as [string, number][]).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-10 font-mono text-[0.66rem] uppercase text-zinc-500">{k}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-edge/60">
                  <div className="accent-bg h-full rounded-full transition-all duration-500" style={{ width: `${(v / maxExport) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-[0.7rem] text-zinc-400">{v}</span>
              </div>
            ))}
          </div>
          <h3 className="mb-3 mt-7 text-[0.8rem] font-semibold text-zinc-200">Draft saves by tool</h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(stats.savesByTool).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-edge/70 bg-white/[0.02] p-3 text-center">
                <div className="font-grotesk text-lg font-semibold text-zinc-100">{v}</div>
                <div className="text-[0.6rem] uppercase tracking-[0.12em] text-zinc-600">{k}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-[0.8rem] font-semibold text-zinc-200">Local storage ledger</h3>
            <span className="flex items-center gap-1.5 text-[0.64rem] text-zinc-500">
              <HardDrive size={11} /> {formatBytes(used)} / 5 MB
            </span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-edge/60">
            <div
              className={cn("h-full rounded-full transition-all duration-500", pct > 85 ? "bg-red-400" : "accent-bg")}
              style={{ width: `${Math.max(pct, 1.5)}%` }}
            />
          </div>
          <div className="divide-y divide-edge/50">
            {entries.length === 0 && (
              <p className="py-6 text-center text-[0.72rem] text-zinc-600">Storage is empty.</p>
            )}
            {entries.map((e) => (
              <div key={e.key} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 truncate font-mono text-[0.7rem] text-zinc-400">{e.key}</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-edge/60">
                  <div
                    className="accent-bg h-full rounded-full"
                    style={{ width: `${Math.max((e.bytes / Math.max(used, 1)) * 100, 3)}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono text-[0.68rem] text-zinc-500">{formatBytes(e.bytes)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function BrandingTab() {
  const toast = useToast();
  const s = getSettings();
  const [brand, setBrand] = useState({ ...s.brand });
  const [announcement, setAnnouncement] = useState(s.announcement);
  const [maintenanceMessage, setMaintenanceMessage] = useState(s.maintenanceMessage);

  const save = () => {
    saveSettings({ ...getSettings(), brand, announcement, maintenanceMessage });
    toast.push("Branding updated", { desc: "Navbar, banner and metadata refreshed live" });
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 animate-fade-up">
      <Card className="space-y-4 p-5">
        <h3 className="text-[0.8rem] font-semibold text-zinc-200">Identity</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand name">
            <Input value={brand.name} onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))} />
          </Field>
          <Field label="Accent word">
            <Input value={brand.accentWord} onChange={(e) => setBrand((b) => ({ ...b, accentWord: e.target.value }))} />
          </Field>
        </div>
        <Field label="Tagline">
          <Input value={brand.tagline} onChange={(e) => setBrand((b) => ({ ...b, tagline: e.target.value }))} />
        </Field>
        <div className="rounded-xl border border-edge/70 bg-white/[0.02] px-4 py-3">
          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-zinc-600">Preview</span>
          <div className="mt-1 font-grotesk text-[0.95rem] font-semibold text-zinc-50">
            {brand.name || "Brand"}
            <span className="accent-text ml-1">{brand.accentWord}</span>
          </div>
          <div className="mt-0.5 text-[0.68rem] text-zinc-500">{brand.tagline}</div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-[0.8rem] font-semibold text-zinc-200">Communications</h3>
        <Field label="Global announcement" hint="empty = hidden">
          <Textarea rows={3} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="e.g. New executive template pack ships Friday — your drafts migrate automatically." />
        </Field>
        <Field label="Maintenance message">
          <Textarea rows={3} value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Button size="sm" icon={Save} onClick={save}>
            Save branding
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function TemplatesTab() {
  const toast = useToast();
  const s = getSettings();
  const [json, setJson] = useState(() =>
    JSON.stringify(s.defaultResume ?? defaultResume(), null, 2)
  );
  const [cover, setCover] = useState(s.coverTemplate);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const validate = (text: string): boolean => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed.personal || !Array.isArray(parsed.experience)) {
        setJsonError("Shape mismatch — needs at least { personal, experience[] }.");
        return false;
      }
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      return false;
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[0.8rem] font-semibold text-zinc-200">Default resume template (placeholder data)</h3>
            <p className="mt-0.5 text-[0.66rem] text-zinc-500">
              Seeded into any fresh workspace and used by “Reset to template” in the builder.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setJson(JSON.stringify(getResume(), null, 2)); validate(JSON.stringify(getResume())); }}>
              Load current workspace
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { const f = JSON.stringify(defaultResume(), null, 2); setJson(f); validate(f); }}>
              Factory template
            </Button>
            <Button
              size="sm"
              icon={Save}
              onClick={() => {
                if (!validate(json)) {
                  toast.push("Template rejected", { desc: "Fix the JSON errors first.", kind: "error" });
                  return;
                }
                saveSettings({ ...getSettings(), defaultResume: JSON.parse(json) });
                toast.push("Default template saved", { desc: "New workspaces will open with this data" });
              }}
            >
              Save as default
            </Button>
          </div>
        </div>
        <textarea
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            validate(e.target.value);
          }}
          spellCheck={false}
          className={cn(
            "h-80 w-full resize-y rounded-xl border bg-[#0c0c11] p-4 font-mono text-[0.68rem] leading-relaxed text-zinc-300 outline-none transition-colors",
            jsonError ? "border-red-500/40" : "border-edge focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
          )}
        />
        {jsonError ? (
          <p className="mt-2 text-[0.68rem] text-red-300">{jsonError}</p>
        ) : (
          <p className="mt-2 text-[0.68rem] text-emerald-300/80">JSON valid · {Math.round(json.length / 1024)} KB</p>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-[0.8rem] font-semibold text-zinc-200">Cover letter boilerplate</h3>
        <p className="mb-3 mt-0.5 text-[0.66rem] text-zinc-500">
          A reusable base letter admins can push into any workspace with one click.
        </p>
        <Textarea rows={6} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Enter a reusable cover letter body…" />
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!cover.trim()) {
                toast.push("Boilerplate is empty", { kind: "info" });
                return;
              }
              const current = getCover();
              saveCover({ ...current, body: cover }, true);
              toast.push("Boilerplate applied", { desc: "Cover letter body replaced and saved" });
            }}
          >
            Push to workspace letter
          </Button>
          <Button
            size="sm"
            icon={Save}
            onClick={() => {
              saveSettings({ ...getSettings(), coverTemplate: cover });
              toast.push("Boilerplate saved");
            }}
          >
            Save boilerplate
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function AppearanceTab() {
  const toast = useToast();
  const s = getSettings();
  const [accent, setAccent] = useState(s.accent);

  useEffect(() => setAccent(s.accent), [s.accent]);

  const apply = (value: string) => {
    setAccent(value);
    const next = { ...getSettings(), accent: value };
    saveSettings(next);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 animate-fade-up">
      <Card className="space-y-5 p-5">
        <div>
          <h3 className="text-[0.8rem] font-semibold text-zinc-200">Global UI accent</h3>
          <p className="mt-0.5 text-[0.66rem] text-zinc-500">
            Drives buttons, highlights, links and focus rings across every module — live.
          </p>
        </div>
        <ColorField label="Accent palette" value={accent} onChange={apply} presets={ACCENT_PRESETS} />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl border border-edge/70 bg-white/[0.02] p-4">
            <span className="text-[0.62rem] uppercase tracking-[0.14em] text-zinc-600">Buttons</span>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className="accent-bg inline-flex h-8 items-center rounded-lg px-3 text-[0.72rem] font-semibold" style={{ color: "var(--accent-contrast)" }}>
                Primary
              </span>
              <span className="accent-bg-soft accent-text inline-flex h-8 items-center rounded-lg border accent-border-soft px-3 text-[0.72rem] font-medium">
                Soft
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-edge/70 bg-white/[0.02] p-4">
            <span className="text-[0.62rem] uppercase tracking-[0.14em] text-zinc-600">Type & focus</span>
            <div className="accent-text mt-2.5 text-[0.8rem] font-semibold">Linked accent text</div>
            <div className="accent-ring mt-2 h-8 rounded-lg bg-[#101015]" />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-[0.8rem] font-semibold text-zinc-200">Brand tokens</h3>
        <div className="space-y-2 font-mono text-[0.7rem]">
          {[
            ["obsidian", "#09090b", "page background"],
            ["carbon", "#18181b", "cards & surfaces"],
            ["edge", "#27274a", "hairline borders"],
            ["accent", "var(--accent)", "dynamic — set on the left"],
            ["gold", "#d4af37", "champagne default"],
            ["cyan", "#38bdf8", "tech alternative"],
          ].map(([name, value, use]) => (
            <div key={name} className="flex items-center gap-3 rounded-lg border border-edge/60 bg-white/[0.015] px-3 py-2.5">
              <span className="h-5 w-5 rounded-md border border-white/10" style={{ background: value.startsWith("#") ? value : "var(--accent)" }} />
              <span className="w-20 text-zinc-300">{name}</span>
              <span className="w-24 text-zinc-500">{value}</span>
              <span className="flex-1 truncate text-right text-[0.62rem] text-zinc-600">{use}</span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            apply("#d4af37");
            toast.push("Palette restored to Champagne Gold", { kind: "info" });
          }}
        >
          Restore default palette
        </Button>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const toast = useToast();
  const s = getSettings();
  const [current, setCurrent] = useState("");
  const [newUser, setNewUser] = useState(s.auth?.username ?? "cvforge");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (newPass.length < 6) {
      toast.push("Password too short", { desc: "Use at least 6 characters.", kind: "error" });
      return;
    }
    if (newPass !== confirm) {
      toast.push("Passwords do not match", { kind: "error" });
      return;
    }
    setBusy(true);
    const res = await updateCredentials(current, newUser, newPass);
    setBusy(false);
    if (res.ok) {
      setCurrent("");
      setNewPass("");
      setConfirm("");
      toast.push("Credentials rotated", { desc: `Admin username is now “${newUser.trim() || "cvforge"}”` });
    } else {
      toast.push("Rotation failed", { desc: res.error, kind: "error" });
    }
  };

  const strength = useMemo(() => {
    let score = 0;
    if (newPass.length >= 8) score += 34;
    if (/[A-Z]/.test(newPass) && /[a-z]/.test(newPass)) score += 22;
    if (/\d/.test(newPass)) score += 22;
    if (/[^A-Za-z0-9]/.test(newPass)) score += 22;
    return Math.min(100, score);
  }, [newPass]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 animate-fade-up">
      <Card className="space-y-4 p-5">
        <h3 className="text-[0.8rem] font-semibold text-zinc-200">Rotate admin credentials</h3>
        <Field label="Current password">
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New username">
          <Input value={newUser} onChange={(e) => setNewUser(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="New password" hint="min 6 chars">
          <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} autoComplete="new-password" />
        </Field>
        {newPass && (
          <div>
            <div className="mb-1 flex justify-between text-[0.62rem] text-zinc-500">
              <span>Strength</span>
              <span className="font-mono">{strength}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-edge/60">
              <div className={cn("h-full rounded-full transition-all duration-300", strength >= 60 ? "accent-bg" : "bg-amber-400")} style={{ width: `${strength}%` }} />
            </div>
          </div>
        )}
        <Field label="Confirm new password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button className="w-full" icon={KeyRound} loading={busy} onClick={submit}>
          Update credentials
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-[0.8rem] font-semibold text-zinc-200">How authentication works</h3>
        <ul className="space-y-3 text-[0.74rem] leading-relaxed text-zinc-400">
          {[
            ["Hashed at rest", "Passwords are stored as SHA-256 digests (salted per-install) — never in plaintext."],
            ["Session-scoped", "Admin sessions live in sessionStorage and die with the tab; closing the browser signs you out."],
            ["Brute-force guard", "Five failed attempts locks the console for 60 seconds."],
            ["Local only", "No network calls. Credentials never leave this browser."],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <ShieldCheck size={14} className="accent-text mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold text-zinc-200">{t}.</span> {d}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function SystemTab() {
  const toast = useToast();
  const s = getSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [wipeText, setWipeText] = useState("");

  const downloadBackup = () => {
    const payload = { __cvfBackup: true, exportedAt: new Date().toISOString(), data: backupAll() };
    saveBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      `cvforge-localstorage-backup-${Date.now()}.json`
    );
    bumpExport("json");
    toast.push("Full storage backup downloaded");
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h3 className="text-[0.8rem] font-semibold text-zinc-200">Runtime controls</h3>
          <Toggle
            checked={s.maintenance}
            onChange={(v) => {
              saveSettings({ ...getSettings(), maintenance: v });
              toast.push(v ? "Maintenance mode engaged" : "Maintenance mode lifted", {
                desc: v ? "Visitors see the maintenance screen" : "All tools are publicly available",
                kind: v ? "info" : "success",
              });
            }}
            label="Maintenance mode"
            desc="Locks every public route behind the maintenance screen; /admin stays reachable"
          />
          <div className="rounded-xl border border-edge/70 bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-2 text-[0.68rem] text-zinc-400">
              <Settings2 size={12} className="accent-text" />
              Maintenance screen shows: “{s.maintenanceMessage.slice(0, 90)}{s.maintenanceMessage.length > 90 ? "…" : ""}”
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h3 className="text-[0.8rem] font-semibold text-zinc-200">Local cache backup & restore</h3>
          <p className="text-[0.7rem] leading-relaxed text-zinc-500">
            Snapshot the entire CVForge localStorage (documents, settings, analytics, credentials) or
            restore it from a previous snapshot.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={downloadBackup}>
              Backup everything
            </Button>
            <Button variant="subtle" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
              Restore snapshot…
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  const parsed = await readJsonFile(f);
                  const data = (parsed as { __cvfBackup?: boolean; data?: Record<string, string> }).data;
                  if (data && restoreBackup(data)) {
                    toast.push("Snapshot restored", { desc: "Local storage rewritten from backup" });
                  } else {
                    toast.push("Not a CVForge snapshot", { kind: "error" });
                  }
                } catch (err) {
                  toast.push("Restore failed", { desc: err instanceof Error ? err.message : "Invalid file", kind: "error" });
                }
              }}
            />
          </div>
        </Card>
      </div>

      <Card className="border-red-500/20 p-5">
        <h3 className="mb-1 flex items-center gap-2 text-[0.8rem] font-semibold text-red-300">
          <Trash2 size={14} /> Danger zone
        </h3>
        <p className="mb-4 max-w-2xl text-[0.7rem] leading-relaxed text-zinc-500">
          Wipe all CVForge keys (documents, settings, stats, credentials). The next launch re-seeds
          factory defaults and the default admin login. This action is irreversible — take a backup first.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={wipeText}
            onChange={(e) => setWipeText(e.target.value)}
            placeholder='Type "WIPE" to arm'
            className="w-56"
          />
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            disabled={wipeText !== "WIPE"}
            onClick={() => {
              wipeAll();
              setAdminSession(false);
              toast.push("Local storage wiped", { desc: "Factory defaults restored on next load", kind: "info" });
              navigate("/");
            }}
          >
            Wipe local cache
          </Button>
        </div>
      </Card>
    </div>
  );
}


