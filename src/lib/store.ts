import { useEffect, useState } from "react";
import {
  defaultBioCard,
  defaultCoverLetter,
  defaultResume,
  defaultSettings,
  defaultStats,
  nowIso,
} from "./defaults";
import type {
  AppSettings,
  BioCardData,
  CoverLetterData,
  ExportCounts,
  ResumeData,
  Stats,
  StorageEntry,
  ToolKey,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Keys
// ─────────────────────────────────────────────────────────────
export const LS = {
  resume: "cvf.resume.v1",
  cover: "cvf.cover.v1",
  bio: "cvf.bio.v1",
  settings: "cvf.settings.v1",
  stats: "cvf.stats.v1",
} as const;

const BUS_EVENT = "cvf:bus";

export function busEmit(): void {
  window.dispatchEvent(new CustomEvent(BUS_EVENT));
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // QuotaExceededError / privacy mode: never crash the workspace over a
    // persistence fault — log and keep the in-memory session usable.
    console.warn(`[CVForge] storage write failed for "${key}" (quota or private mode)`);
  }
  busEmit();
}

// ─────────────────────────────────────────────────────────────
// Hashing (SHA-256 via WebCrypto, FNV-1a fallback for http)
// ─────────────────────────────────────────────────────────────
const AUTH_SALT = "cvforge::studio::v1";

export async function sha256(input: string): Promise<string> {
  try {
    if (window.crypto?.subtle) {
      const data = new TextEncoder().encode(input);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* fall through */
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fnv${(h >>> 0).toString(16)}${input.length.toString(16)}`;
}

async function credentialHash(username: string, password: string): Promise<string> {
  return sha256(`${AUTH_SALT}::${username.toLowerCase()}::${password}`);
}

// ─────────────────────────────────────────────────────────────
// Settings (cached + reactive)
// ─────────────────────────────────────────────────────────────
let settingsCache: AppSettings | null = null;

export function getSettings(): AppSettings {
  if (!settingsCache) {
    const stored = readJSON<Partial<AppSettings>>(LS.settings, {});
    settingsCache = { ...defaultSettings(), ...stored, brand: { ...defaultSettings().brand, ...(stored.brand ?? {}) } };
  }
  return settingsCache;
}

export function saveSettings(next: AppSettings): void {
  settingsCache = next;
  writeJSON(LS.settings, next);
}

export async function ensureAuth(): Promise<AppSettings> {
  const s = getSettings();
  if (!s.auth) {
    const auth = {
      username: "cvforge",
      passHash: await credentialHash("cvforge", "cvforge"),
    };
    const next = { ...s, auth };
    saveSettings(next);
    return next;
  }
  return s;
}

export async function verifyLogin(username: string, password: string): Promise<boolean> {
  const s = await ensureAuth();
  if (!s.auth) return false;
  if (s.auth.username.toLowerCase() !== username.trim().toLowerCase()) return false;
  const hash = await credentialHash(username.trim(), password);
  return hash === s.auth.passHash;
}

export async function updateCredentials(
  currentPassword: string,
  newUsername: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const s = await ensureAuth();
  if (!s.auth) return { ok: false, error: "Credential store unavailable." };
  const currentHash = await credentialHash(s.auth.username, currentPassword);
  if (currentHash !== s.auth.passHash)
    return { ok: false, error: "Current password is incorrect." };
  const username = newUsername.trim() || s.auth.username;
  const passHash = await credentialHash(username, newPassword);
  saveSettings({ ...s, auth: { username, passHash } });
  return { ok: true };
}

// session flag — survives refresh of tab only
const SESSION_KEY = "cvf.admin.session";
export function setAdminSession(on: boolean): void {
  if (on) sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  else sessionStorage.removeItem(SESSION_KEY);
}
export function hasAdminSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) !== null;
}

// ─────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────
export function getResume(): ResumeData {
  const stored = readJSON<ResumeData | null>(LS.resume, null);
  if (stored) return stored;
  const s = getSettings();
  if (s.defaultResume) return structuredClone(s.defaultResume);
  return defaultResume();
}
export function saveResume(d: ResumeData, countDraft = false): void {
  const stamped = { ...d, meta: { updatedAt: nowIso() } };
  writeJSON(LS.resume, stamped);
  if (countDraft) bumpDraft("resume");
}

export function getCover(): CoverLetterData {
  return readJSON<CoverLetterData>(LS.cover, defaultCoverLetter());
}
export function saveCover(d: CoverLetterData, countDraft = false): void {
  const stamped = { ...d, meta: { updatedAt: nowIso() } };
  writeJSON(LS.cover, stamped);
  if (countDraft) bumpDraft("cover");
}

export function getBio(): BioCardData {
  return readJSON<BioCardData>(LS.bio, defaultBioCard());
}
export function saveBio(d: BioCardData, countDraft = false): void {
  const stamped = { ...d, meta: { updatedAt: nowIso() } };
  writeJSON(LS.bio, stamped);
  if (countDraft) bumpDraft("bio");
}

// ─────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────
export function getStats(): Stats {
  return readJSON<Stats>(LS.stats, defaultStats());
}

export function bumpDraft(tool: ToolKey): void {
  const s = getStats();
  s.drafts += 1;
  s.savesByTool[tool] = (s.savesByTool[tool] ?? 0) + 1;
  s.lastActive = nowIso();
  writeJSON(LS.stats, s);
}

export function bumpExport(kind: keyof ExportCounts): void {
  const s = getStats();
  s.exports[kind] = (s.exports[kind] ?? 0) + 1;
  s.lastActive = nowIso();
  s.lastExportAt = nowIso();
  writeJSON(LS.stats, s);
}

export function bumpShare(): void {
  const s = getStats();
  s.shares = (s.shares ?? 0) + 1;
  s.lastActive = nowIso();
  writeJSON(LS.stats, s);
}

// Crash telemetry for the error boundary — written directly to minimize
// failure surface when the app itself is in a broken state.
export function recordCrash(report: { message: string; route: string }): void {
  try {
    const s = getStats();
    s.crashes = (s.crashes ?? 0) + 1;
    writeJSON(LS.stats, s);
    localStorage.setItem(
      "cvf.lastError",
      JSON.stringify({ ...report, at: nowIso() })
    );
  } catch {
    /* storage may be the very thing that failed — swallow */
  }
}

export function lastCrashAt(): string | null {
  try {
    const raw = localStorage.getItem("cvf.lastError");
    if (!raw) return null;
    return (JSON.parse(raw) as { at?: string }).at ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Storage analytics / backup / maintenance
// ─────────────────────────────────────────────────────────────
export const STORAGE_QUOTA = 5 * 1024 * 1024; // ~5MB typical localStorage

export function storageReport(): { entries: StorageEntry[]; used: number } {
  const entries: StorageEntry[] = [];
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const bytes = (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2;
    entries.push({ key, bytes });
    used += bytes;
  }
  entries.sort((a, b) => b.bytes - a.bytes);
  return { entries, used };
}

export function backupAll(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) out[key] = localStorage.getItem(key) ?? "";
  }
  return out;
}

export function restoreBackup(data: Record<string, string>): boolean {
  const keys = Object.keys(data).filter((k) => k.startsWith("cvf."));
  if (keys.length === 0) return false;
  keys.forEach((k) => {
    if (k === LS.settings) {
      try {
        const parsed = JSON.parse(data[k]);
        saveSettings({ ...defaultSettings(), ...parsed });
        return;
      } catch {
        /* ignore */
      }
    }
    localStorage.setItem(k, data[k]);
  });
  settingsCache = null;
  busEmit();
  return true;
}

export function wipeAll(): void {
  Object.values(LS).forEach((k) => localStorage.removeItem(k));
  settingsCache = null;
  busEmit();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

// ─────────────────────────────────────────────────────────────
// Reactive hooks
// ─────────────────────────────────────────────────────────────
export function useBusTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener(BUS_EVENT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(BUS_EVENT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return tick;
}

export function useSettings(): AppSettings {
  useBusTick();
  return getSettings();
}
