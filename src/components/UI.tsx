import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

// ─────────────────────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "outline" | "ghost" | "danger" | "subtle";
type BtnSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: LucideIcon;
  loading?: boolean;
}

const btnSizes: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-[0.72rem] gap-1.5",
  md: "h-9.5 px-4 text-[0.8rem] gap-2",
  lg: "h-11 px-5 text-[0.85rem] gap-2",
};

const btnVariants: Record<BtnVariant, string> = {
  primary:
    "font-semibold hover:brightness-110 active:brightness-95 shadow-[0_8px_24px_-10px_color-mix(in_srgb,var(--accent)_60%,transparent)]",
  outline:
    "border border-edge bg-carbon/60 text-zinc-200 hover:border-edge hover:bg-carbon-2 hover:text-white",
  ghost: "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
  subtle: "border border-edge/60 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05] hover:text-white",
  danger: "border border-red-500/25 bg-red-500/[0.08] text-red-300 hover:bg-red-500/[0.16]",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading,
  className,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const primaryStyle =
    variant === "primary"
      ? { background: "var(--accent)", color: "var(--accent-contrast)", ...style }
      : style;
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center rounded-lg tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        btnSizes[size],
        btnVariants[variant],
        className
      )}
      disabled={disabled || loading}
      style={primaryStyle}
      {...rest}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        Icon && <Icon size={15} strokeWidth={2.2} />
      )}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Form primitives
// ─────────────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </span>
        {hint && <span className="text-[0.62rem] text-zinc-600">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-edge bg-[#101015] px-3 text-[0.82rem] text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-[var(--accent)]/60 focus:bg-[#12121a] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_14%,transparent)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(inputBase, "h-9.5", className)} {...rest} />;
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(inputBase, "py-2.5 leading-relaxed resize-y min-h-20", className)}
        {...rest}
      />
    );
  }
);

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        inputBase,
        "h-9.5 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%2371717a%22%20stroke-width=%222.5%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[position:right_0.7rem_center] bg-no-repeat pr-8",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-edge/70 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-edge"
    >
      <span>
        <span className="block text-[0.8rem] font-medium text-zinc-200">{label}</span>
        {desc && <span className="mt-0.5 block text-[0.68rem] text-zinc-500">{desc}</span>}
      </span>
      <span
        className={cn(
          "relative h-5.5 w-10.5 shrink-0 rounded-full transition-colors duration-300",
          checked ? "accent-bg" : "bg-zinc-700/70"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-all duration-300",
            checked ? "left-[1.35rem]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </span>
        <span className="accent-text font-mono text-[0.7rem] font-medium">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  presets,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets: { name: string; value: string }[];
}) {
  return (
    <div>
      <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            title={p.name}
            onClick={() => onChange(p.value)}
            className={cn(
              "h-7 w-7 rounded-full border transition-transform duration-150 hover:scale-110",
              value.toLowerCase() === p.value.toLowerCase()
                ? "accent-border border-2 scale-110"
                : "border-white/15"
            )}
            style={{ background: p.value }}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-edge" />
        <span className="relative inline-flex items-center overflow-hidden rounded-lg border border-edge bg-[#101015]">
          <span className="h-8 w-8" style={{ background: value }} />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-24 bg-transparent px-2 font-mono text-[0.7rem] text-zinc-200 outline-none"
            spellCheck={false}
          />
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-edge/80 bg-carbon/80",
        hover && "hover-lift hover:border-edge",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  desc,
  actions,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <p className="accent-text mb-1.5 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.28em]">
          {eyebrow}
        </p>
        <h1 className="font-grotesk text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          {title}
        </h1>
        {desc && <p className="mt-1.5 max-w-xl text-[0.83rem] leading-relaxed text-zinc-500">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge/70 bg-carbon/70 px-4 py-3">
      <span className="accent-bg-soft accent-text flex h-8 w-8 items-center justify-center rounded-lg">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <span>
        <span className="block font-grotesk text-sm font-semibold text-zinc-100">{value}</span>
        <span className="block text-[0.64rem] uppercase tracking-[0.12em] text-zinc-500">{label}</span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sheet scaler — fits fixed-width documents into any container
// ─────────────────────────────────────────────────────────────
export function SheetScaler({
  baseWidth,
  children,
  className,
}: {
  baseWidth: number;
  children: ReactNode;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      const w = outer.clientWidth;
      setScale(w > 0 ? Math.min(w / baseWidth, 1) : 1);
      setHeight(inner.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [baseWidth]);

  return (
    <div
      ref={outerRef}
      className={cn("w-full overflow-hidden", className)}
      style={{ height: height ? Math.ceil(height * scale) + 2 : "auto" }}
    >
      <div
        ref={innerRef}
        style={{
          width: baseWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Print stage — mounted off-screen for html2canvas/pdf capture
// ─────────────────────────────────────────────────────────────
export function PrintStage({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: -12000,
        top: 0,
        pointerEvents: "none",
        zIndex: -10,
      }}
    >
      {children}
    </div>
  );
}
