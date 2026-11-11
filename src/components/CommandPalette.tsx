import { useEffect, useMemo, useRef, useState } from "react";
import {
  CornerDownLeft,
  FileText,
  IdCard,
  LayoutDashboard,
  Mail,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { navigate } from "@/lib/router";
import { cn } from "@/utils/cn";

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  icon: typeof FileText;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = useMemo(
    () => [
      { id: "dash", label: "Dashboard", hint: "Overview & system status", icon: LayoutDashboard, run: () => navigate("/") },
      { id: "resume", label: "Resume Builder", hint: "Multi-section editor + live preview", icon: FileText, run: () => navigate("/resume") },
      { id: "cover", label: "Cover Letter Architect", hint: "Matched typography letters", icon: Mail, run: () => navigate("/cover-letter") },
      { id: "bullets", label: "Bullet Point Polisher", hint: "Impact optimizer", icon: Sparkles, run: () => navigate("/bullets") },
      { id: "bio", label: "Social Bio Card", hint: "Executive summary card", icon: IdCard, run: () => navigate("/bio") },
      { id: "export", label: "Export Center", hint: "PDF · PNG · JPG · ZIP · JSON", icon: Package, run: () => navigate("/export") },
      { id: "save", label: "Save current draft", hint: "Ctrl + S", icon: FileText, run: onSave },
      { id: "admin", label: "Admin Console", hint: "Restricted area", icon: ShieldCheck, run: () => navigate("/admin") },
    ],
    [onSave]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  if (!open) return null;

  const runItem = (item: PaletteItem) => {
    onClose();
    item.run();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl shadow-black/70 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-edge/70 px-4">
          <Search size={15} className="accent-text shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter" && filtered[cursor]) {
                runItem(filtered[cursor]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Jump to a tool or action…"
            className="h-12 w-full bg-transparent text-[0.85rem] text-zinc-100 placeholder:text-zinc-600 outline-none"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="max-h-[19rem] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-[0.78rem] text-zinc-600">
              No matching tools.
            </p>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.id}
              onClick={() => runItem(item)}
              onMouseEnter={() => setCursor(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                i === cursor ? "accent-bg-soft" : "hover:bg-white/[0.03]"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border",
                  i === cursor
                    ? "accent-border-soft accent-text border bg-transparent"
                    : "border-edge/70 bg-carbon text-zinc-500"
                )}
              >
                <item.icon size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8rem] font-medium text-zinc-100">{item.label}</span>
                <span className="block truncate text-[0.66rem] text-zinc-500">{item.hint}</span>
              </span>
              {i === cursor && <CornerDownLeft size={13} className="accent-text shrink-0" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t border-edge/70 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[0.64rem] text-zinc-600">
            <span className="kbd">↑↓</span> navigate
          </span>
          <span className="flex items-center gap-1.5 text-[0.64rem] text-zinc-600">
            <span className="kbd">↵</span> open
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[0.64rem] text-zinc-600">
            <span className="kbd">/</span> anywhere to summon
          </span>
        </div>
      </div>
    </div>
  );
}
