import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type ToastKind = "success" | "info" | "error";

interface ToastItem {
  id: number;
  title: string;
  desc?: string;
  kind: ToastKind;
}

interface ToastApi {
  push: (title: string, opts?: { desc?: string; kind?: ToastKind }) => void;
}

const ToastCtx = createContext<ToastApi>({ push: () => undefined });

export function useToast(): ToastApi {
  return useContext(ToastCtx);
}

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  error: AlertTriangle,
};

const ICON_TINT: Record<ToastKind, string> = {
  success: "text-emerald-400",
  info: "accent-text",
  error: "text-red-400",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (title: string, opts?: { desc?: string; kind?: ToastKind }) => {
      const id = ++idRef.current;
      const item: ToastItem = { id, title, desc: opts?.desc, kind: opts?.kind ?? "success" };
      setItems((prev) => [...prev.slice(-3), item]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[min(92vw,22rem)] flex-col gap-2.5">
        {items.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className="glass pointer-events-auto relative overflow-hidden rounded-xl px-4 py-3 shadow-2xl shadow-black/60 animate-toast-in"
              role="status"
            >
              <div className="flex items-start gap-3">
                <Icon size={17} strokeWidth={2.2} className={`mt-0.5 shrink-0 ${ICON_TINT[t.kind]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.82rem] font-semibold leading-snug text-zinc-100">{t.title}</p>
                  {t.desc && (
                    <p className="mt-0.5 text-[0.72rem] leading-relaxed text-zinc-400">{t.desc}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
                  aria-label="Dismiss"
                >
                  <X size={13} />
                </button>
              </div>
              <div
                className="accent-bg absolute bottom-0 left-0 h-[2px] opacity-70"
                style={{ animation: "toastbar 3.6s linear forwards" }}
              />
              <style>{`@keyframes toastbar { from { width: 100%; } to { width: 0%; } }`}</style>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
