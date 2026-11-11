import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Bold,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  FileDown,
  FileJson2,
  Highlighter,
  Link2,
  MessageSquare,
  Share2,
  X,
} from "lucide-react";
import { Button, Field, Input } from "@/components/UI";
import { useToast } from "@/components/Toast";
import {
  buildShareUrl,
  defaultPermissions,
  encodeShare,
  makeSharePayload,
  PERMISSION_META,
} from "@/lib/share";
import { bumpShare } from "@/lib/store";
import type { ResumeData, SharePermission, SharePermissions } from "@/lib/types";
import { cn } from "@/utils/cn";

const PERM_ICONS: Record<SharePermission, typeof Edit3> = {
  edit: Edit3,
  highlight: Highlighter,
  format: Bold,
  comment: MessageSquare,
  pdf: FileDown,
  json: FileJson2,
  reorder: ArrowUpDown,
};

export function ShareModal({
  open,
  onClose,
  resume,
}: {
  open: boolean;
  onClose: () => void;
  resume: ResumeData;
}) {
  const toast = useToast();
  const [perms, setPerms] = useState<SharePermissions>(defaultPermissions());
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl("");
      setCopied(false);
    }
  }, [open]);

  const enabledCount = useMemo(() => Object.values(perms).filter(Boolean).length, [perms]);

  const generate = () => {
    const token = encodeShare(makeSharePayload(resume, perms, label.trim()));
    const link = buildShareUrl(token);
    setUrl(link);
    bumpShare();
    toast.push("Secure share link forged", {
      desc: `${enabledCount} of 7 recipient permissions enabled`,
    });
  };

  const copy = () => {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        toast.push("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      },
      () => toast.push("Clipboard blocked by browser", { kind: "error" })
    );
  };

  if (!open) return null;

  const oversized = url.length > 6000;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 shadow-2xl shadow-black/70 sm:p-7 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="accent-text mb-1 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.28em]">
              Secure distribution
            </p>
            <h2 className="font-grotesk text-xl font-semibold text-zinc-50">
              Share Resume
            </h2>
            <p className="mt-1 text-[0.72rem] text-zinc-500">
              A base64url-encoded, permission-gated snapshot of your current draft.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <Field label="Link label" hint="optional">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. For the Aurora Dynamics search committee"
          />
        </Field>

        {/* 7-permission switchboard */}
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Recipient permission switchboard
            </span>
            <span className="font-mono text-[0.64rem] text-zinc-600">{enabledCount}/7 on</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PERMISSION_META.map(({ key, label: l, desc }) => {
              const Icon = PERM_ICONS[key];
              const on = perms[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => setPerms((p) => ({ ...p, [key]: !p[key] }))}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
                    on
                      ? "accent-border-soft accent-bg-soft border"
                      : "border-edge/70 bg-white/[0.015] hover:border-edge"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      on
                        ? "accent-border-soft accent-text border bg-transparent"
                        : "border-edge/70 text-zinc-600 group-hover:text-zinc-400"
                    )}
                  >
                    <Icon size={13} strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-[0.72rem] font-semibold", on ? "text-zinc-100" : "text-zinc-400")}>
                        {l}
                      </span>
                      <span
                        className={cn(
                          "relative h-4 w-7.5 shrink-0 rounded-full transition-colors duration-300",
                          on ? "accent-bg" : "bg-zinc-700/70"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all duration-300",
                            on ? "left-[0.95rem]" : "left-0.5"
                          )}
                        />
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[0.62rem] leading-snug text-zinc-600">{desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!url ? (
          <Button size="lg" icon={Link2} className="mt-5 w-full" onClick={generate}>
            Forge secure share link
          </Button>
        ) : (
          <div className="mt-5 space-y-3 animate-fade-up">
            <Field label="Generated URL">
              <div className="flex gap-2">
                <Input readOnly value={url} onFocus={(e) => e.target.select()} className="font-mono text-[0.62rem]" />
                <Button variant={copied ? "subtle" : "primary"} icon={copied ? Check : Copy} onClick={copy}>
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </Field>
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="accent-text flex items-center gap-1.5 text-[0.72rem] font-semibold hover:brightness-110"
              >
                <ExternalLink size={12} /> Preview as recipient
              </a>
              <span className={cn("ml-auto font-mono text-[0.6rem]", oversized ? "text-amber-300" : "text-zinc-600")}>
                {url.length.toLocaleString()} chars
              </span>
            </div>
            {oversized && (
              <p className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[0.66rem] leading-relaxed text-amber-200/90">
                Long link (&gt;6k chars). Modern browsers handle hash links this size, but some
                chat/email clients truncate them — consider exporting the JSON bundle for those channels.
              </p>
            )}
            <p className="text-[0.64rem] leading-relaxed text-zinc-600">
              The payload travels inside the URL itself — nothing is uploaded, tracked, or stored
              remotely. Revocation = delete the link; it cannot be decoded without it.
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end border-t border-edge/60 pt-4">
          <span className="mr-auto flex items-center gap-1.5 text-[0.62rem] text-zinc-600">
            <Share2 size={11} className="accent-text" /> Snapshot of current saved draft
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
