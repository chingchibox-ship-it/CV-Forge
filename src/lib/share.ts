import type { SharePermission, SharePermissions, SharePayload } from "./types";
import { nowIso } from "./defaults";

// ─────────────────────────────────────────────────────────────
// Permission registry (7-attribute switchboard)
// ─────────────────────────────────────────────────────────────
export const PERMISSION_META: {
  key: SharePermission;
  label: string;
  desc: string;
}[] = [
  { key: "edit", label: "Allow Edit", desc: "Recipient may import this into their own studio workspace" },
  { key: "highlight", label: "Allow Text Highlight", desc: "Recipient may select and copy text from the document" },
  { key: "format", label: "Allow Bold / Formatting", desc: "Unlocks recipient-side view formatting controls" },
  { key: "comment", label: "Allow Commenting", desc: "Recipient can attach private local annotations" },
  { key: "pdf", label: "Allow PDF Download", desc: "Enables the high-resolution A4 PDF export action" },
  { key: "json", label: "Allow JSON Export", desc: "Enables raw structured-data download" },
  { key: "reorder", label: "Allow Section Reordering", desc: "Recipient may reshuffle document section order" },
];

export function defaultPermissions(): SharePermissions {
  return {
    edit: false,
    highlight: true,
    format: false,
    comment: false,
    pdf: true,
    json: false,
    reorder: false,
  };
}

// ─────────────────────────────────────────────────────────────
// URL-safe base64 payload codec (UTF-8 aware, zero deps)
// ─────────────────────────────────────────────────────────────
function bytesToBinary(bytes: Uint8Array): string {
  let out = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return out;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return btoa(bytesToBinary(bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShare(payload: SharePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeShare(token: string): SharePayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as SharePayload;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.v !== 1 || !parsed.resume || !parsed.perms) return null;
    if (typeof parsed.resume !== "object" || !parsed.resume.personal) return null;
    // normalize + harden: permission map coerced to booleans
    const cleanPerms = defaultPermissions();
    (Object.keys(cleanPerms) as SharePermission[]).forEach((k) => {
      cleanPerms[k] = parsed.perms[k] === true;
    });
    return { ...parsed, perms: cleanPerms, label: String(parsed.label ?? "") };
  } catch {
    return null;
  }
}

export function buildShareUrl(token: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/share/${token}`;
}

// Also supports ``?share=TOKEN`` deep links: normalize into the hash route.
export function extractSearchShareToken(): string | null {
  try {
    const qs = new URLSearchParams(window.location.search);
    const fromQuery = qs.get("share");
    if (fromQuery) return fromQuery;
    // bare hash form: #share=TOKEN
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (hash.startsWith("share=")) return hash.slice(6);
    return null;
  } catch {
    return null;
  }
}

// Stable short id for a token — used to namespace recipient comments
export function shareFingerprint(token: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function makeSharePayload(
  resume: SharePayload["resume"],
  perms: SharePermissions,
  label: string
): SharePayload {
  return { v: 1, label, createdAt: nowIso(), perms, resume };
}
