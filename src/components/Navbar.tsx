import { useEffect, useState } from "react";
import {
  FileText,
  IdCard,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { navigate } from "@/lib/router";
import { useSettings } from "@/lib/store";
import { cn } from "@/utils/cn";

export const NAV_LINKS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/resume", label: "Resume Builder", icon: FileText },
  { path: "/cover-letter", label: "Cover Letter", icon: Mail },
  { path: "/bullets", label: "Bullet Optimizer", icon: Sparkles },
  { path: "/bio", label: "Bio Card", icon: IdCard },
  { path: "/export", label: "Export Center", icon: Package },
];

export function Navbar({
  route,
  onOpenPalette,
}: {
  route: string;
  onOpenPalette: () => void;
}) {
  const settings = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => setMobileOpen(false), [route]);
  useEffect(() => setBannerDismissed(false), [settings.announcement]);

  const go = (path: string) => () => navigate(path);

  return (
    <header className="glass-deep sticky top-0 z-50 border-b border-edge/60">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
        <button onClick={go("/")} className="group flex items-center gap-2.5">
          <span className="accent-bg-soft accent-border-soft accent-text flex h-8 w-8 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:rotate-6">
            <FileText size={15} strokeWidth={2.4} />
          </span>
          <span className="font-grotesk text-[0.95rem] font-semibold tracking-tight text-zinc-50">
            {settings.brand.name}
            <span className="accent-text ml-1">{settings.brand.accentWord}</span>
          </span>
        </button>

        <nav className="ml-6 hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map(({ path, label }) => {
            const active = route === path || (path !== "/" && route.startsWith(path));
            return (
              <button
                key={path}
                onClick={go(path)}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-[0.76rem] font-medium transition-colors duration-200",
                  active ? "accent-text" : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                {label}
                {active && (
                  <span className="accent-bg absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onOpenPalette}
            className="hidden h-8 items-center gap-2 rounded-lg border border-edge/80 bg-white/[0.02] px-2.5 text-[0.7rem] text-zinc-500 transition-colors hover:border-edge hover:text-zinc-200 sm:flex"
            aria-label="Quick search"
          >
            <Search size={13} />
            <span className="hidden xl:inline">Quick search</span>
            <span className="kbd">/</span>
          </button>
          <button
            onClick={go("/admin")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
              route === "/admin"
                ? "accent-border-soft accent-bg-soft accent-text"
                : "border-edge/80 bg-white/[0.02] text-zinc-500 hover:text-zinc-200"
            )}
            title="Admin Console"
            aria-label="Admin Console"
          >
            <ShieldCheck size={15} />
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge/80 bg-white/[0.02] text-zinc-400 lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-edge/60 px-4 py-3 lg:hidden animate-fade-in">
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_LINKS.map(({ path, label, icon: Icon }) => {
              const active = route === path;
              return (
                <button
                  key={path}
                  onClick={go(path)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.78rem] font-medium transition-colors",
                    active
                      ? "accent-bg-soft accent-text border accent-border-soft"
                      : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {settings.announcement && !bannerDismissed && (
        <div className="accent-bg-glow border-t border-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
          <div className="mx-auto flex max-w-[90rem] items-center gap-2.5 px-4 py-2 sm:px-6 animate-fade-in">
            <Megaphone size={13} className="accent-text shrink-0" />
            <p className="flex-1 truncate text-[0.72rem] text-zinc-300">{settings.announcement}</p>
            <button
              onClick={() => setBannerDismissed(true)}
              className="rounded p-0.5 text-zinc-500 hover:text-zinc-200"
              aria-label="Dismiss announcement"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
