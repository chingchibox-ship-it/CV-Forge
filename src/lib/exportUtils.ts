import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";
import JSZip from "jszip";
import { bumpExport, getBio, getCover, getResume } from "./store";
import { nowIso } from "./defaults";

// ─────────────────────────────────────────────────────────────
// Shared capture helpers
// ─────────────────────────────────────────────────────────────

function mustGet(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Capture target #${id} not mounted.`);
  return el;
}

async function captureCanvas(id: string, scale = 2): Promise<HTMLCanvasElement> {
  const el = mustGet(id);
  return html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: Math.max(el.scrollWidth, 820),
  });
}

function pdfOptions(filename: string) {
  return {
    margin: 0,
    filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    },
    jsPDF: { unit: "px" as const, format: [794, 1123] as [number, number], hotfixes: ["px_scaling"] },
    pagebreak: { mode: ["css", "legacy"] as const },
  };
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ─────────────────────────────────────────────────────────────
// Single-format exports
// ─────────────────────────────────────────────────────────────

export async function exportPDF(elementId: string, filename: string): Promise<void> {
  const el = mustGet(elementId);
  await html2pdf().set(pdfOptions(filename)).from(el).save();
  bumpExport("pdf");
}

async function pdfBlob(elementId: string, filename: string): Promise<Blob> {
  const el = mustGet(elementId);
  const out = (await html2pdf()
    .set(pdfOptions(filename))
    .from(el)
    .outputPdf("blob")) as Blob;
  return out;
}

export async function exportPNG(elementId: string, filename: string): Promise<void> {
  const canvas = await captureCanvas(elementId);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("PNG render failed.");
  saveBlob(blob, filename);
  bumpExport("png");
}

export async function exportJPG(elementId: string, filename: string): Promise<void> {
  const canvas = await captureCanvas(elementId, 2);
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", 0.92)
  );
  if (!blob) throw new Error("JPG render failed.");
  saveBlob(blob, filename);
  bumpExport("jpg");
}

// ─────────────────────────────────────────────────────────────
// JSON portability
// ─────────────────────────────────────────────────────────────

export function exportJSON(filename: string): void {
  const payload = {
    __cvforge: true,
    exportedAt: nowIso(),
    version: 1,
    resume: getResume(),
    cover: getCover(),
    bio: getBio(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  saveBlob(blob, filename);
  bumpExport("json");
}

export interface ImportResult {
  ok: boolean;
  message: string;
}

export function readJsonFile(file: File): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)));
      } catch {
        reject(new Error("File is not valid JSON."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsText(file);
  });
}

// ─────────────────────────────────────────────────────────────
// Complete bundle (.zip)
// ─────────────────────────────────────────────────────────────

export async function exportBundle(ids: {
  resume: string;
  cover: string;
  bio: string;
}): Promise<void> {
  const zip = new JSZip();
  const stamp = new Date().toISOString().slice(0, 10);

  const [resumePdf, coverPdf] = await Promise.all([
    pdfBlob(ids.resume, "CVForge-Resume.pdf"),
    pdfBlob(ids.cover, "CVForge-CoverLetter.pdf"),
  ]);
  const bioCanvas = await captureCanvas(ids.bio, 2);
  const bioPng = await new Promise<Blob | null>((res) =>
    bioCanvas.toBlob(res, "image/png")
  );

  zip.folder("resume")?.file(`CVForge-Resume-${stamp}.pdf`, resumePdf);
  zip.folder("cover-letter")?.file(`CVForge-CoverLetter-${stamp}.pdf`, coverPdf);
  if (bioPng) zip.folder("bio-card")?.file(`CVForge-BioCard-${stamp}.png`, bioPng);
  zip
    .folder("data")
    ?.file(
      "cvforge-backup.json",
      JSON.stringify(
        {
          __cvforge: true,
          exportedAt: nowIso(),
          resume: getResume(),
          cover: getCover(),
          bio: getBio(),
        },
        null,
        2
      )
    );
  zip.file(
    "README.txt",
    [
      "CVFORGE STUDIO — CAREER BUNDLE",
      "================================",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Contents",
      "  resume/          High-resolution PDF resume",
      "  cover-letter/    Matching cover letter PDF",
      "  bio-card/        Social bio card render (PNG)",
      "  data/            Full JSON backup — restore via Export Center → Import",
      "",
      "All data lives in your browser. Keep this bundle as your portable backup.",
    ].join("\n")
  );

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  saveBlob(blob, `CVForge-Bundle-${stamp}.zip`);
  bumpExport("zip");
}
