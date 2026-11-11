# CVForge Studio — Executive Career Suite

A production-grade, **local-first** career toolkit. No accounts, no servers — every document,
credential and analytic lives in your browser's LocalStorage. Ships as a single static file,
ready for instant deployment on any static host.

## Stack

React 19 · Vite 7 · Tailwind CSS v4 (CSS-first theming via `src/index.css@theme`) ·
Lucide React · html2pdf.js · html2canvas · JSZip · browser LocalStorage.

> Note: this template uses **Tailwind v4**, where `tailwind.config.js` is replaced by the
> `@theme` block inside `src/index.css` (colors, fonts, animations). `vite.config.ts` ships
> with the single-file plugin so `dist/index.html` is fully self-contained.

## Directory structure

```
├── index.html                     # Fonts, meta, favicon, title
├── vite.config.ts                 # Vite + singlefile plugin (preconfigured)
├── src/
│   ├── main.tsx                   # Entry
│   ├── App.tsx                    # Router, shortcuts, accent engine, maintenance gate
│   ├── index.css                  # Tailwind v4 @theme, tokens, glass/elevation, print-safe CSS
│   ├── utils/cn.ts                # clsx + tailwind-merge
│   ├── lib/
│   │   ├── types.ts               # Shared contracts (ResumeData, Settings, Stats…)
│   │   ├── defaults.ts            # Factory resume/letter/bio + verb banks + presets
│   │   ├── store.ts               # LocalStorage layer, SHA-256 auth, stats, backup/wipe
│   │   ├── router.ts              # Hash router (static-deploy friendly)
│   │   └── ExportUtils.ts         # exportPDF / exportPNG / exportJPG / exportBundle / JSON
│   ├── components/
│   │   ├── UI.tsx                 # Buttons, fields, toggles, sliders, SheetScaler, PrintStage
│   │   ├── Toast.tsx              # Zero-layout-shift toast system
│   │   ├── Navbar.tsx             # Glass navbar + announcement banner
│   │   ├── CommandPalette.tsx     # “/” quick-search palette
│   │   ├── ResumePreview.tsx      # Capture-accurate A4 resume sheet (PreviewCard)
│   │   ├── CoverLetterPreview.tsx # Matching letter sheet
│   │   └── BioCardPreview.tsx     # 840×472 social card
│   └── pages/
│       ├── Dashboard.tsx          # Overview, stats, tool grid
│       ├── ResumeBuilder.tsx      # 8-section editor + layout customizer + live preview
│       ├── CoverLetterTool.tsx    # Letter architect (mirror-resume typography)
│       ├── BulletOptimizer.tsx    # Raw notes → scored, action-verb bullets
│       ├── BioCardTool.tsx        # Bio card generator + PNG export
│       ├── ExportCenter.tsx       # PDF / PNG / JPG / ZIP bundle / JSON import-export
│       └── AdminPanel.tsx         # /admin — auth, analytics, branding, palette, security
└── dist/index.html                # Built artifact (single file, inlined)
```

## Routes

| Route            | Module                                             |
| ---------------- | -------------------------------------------------- |
| `#/`             | Dashboard                                          |
| `#/resume`       | Resume Builder + precision A4 canvas + AI banner   |
| `#/cover-letter` | Cover Letter Architect                             |
| `#/bullets`      | Bullet Point Polisher / Impact Optimizer           |
| `#/bio`          | Social / Portfolio Bio Card                        |
| `#/export`       | Multi-format Export Center (Ctrl+P = instant PDF)  |
| `#/admin`        | Password-protected Admin Console                   |
| `#/share/<tk>`   | Permission-enforced shared recipient view          |
| `?share=<tk>`    | Deep-link alias — auto-normalized to the hash form |
| _anything else_  | Cinematic 404 with quick-recovery navigation       |

## v2 architecture additions

- **`src/components/ErrorBoundary.tsx`** — global fault containment ("Oops! Something went wrong"),
  retry trigger, one-click JSON error report, crash telemetry surfaced in Admin → Analytics.
- **`src/components/LoadingScreen.tsx`** — reusable cinematic suspense overlay with rotating
  pipeline status lines; mounted on every heavy export / share-decode path.
- **`src/components/A4Stage.tsx`** — pixel-true 794×1123 (96 DPI) canvas frame with drop-shadow
  pedestal, margin safe-area guides (mm readout) and dashed page-break rulings per 1123 px page.
- **`src/lib/share.ts` + `src/components/ShareModal.tsx`** — base64url-encoded share payloads
  carrying a 7-attribute permission matrix (Edit · Highlight · Format · Comment · PDF · JSON ·
  Reorder). `src/pages/SharedView.tsx` enforces each grant dynamically on the receiving end
  (selection lock, action gating, recipient-side reorder & annotations).
- **`src/lib/suggestions.ts` + `src/components/SuggestionBanner.tsx`** — zero-network heuristic
  engine: weak-opener detection, metric coverage audit, summary depth, verb verbosity and
  demand-keyword gap analysis per module.
- **Admin v2** — vault-health strip (quota pressure, largest key, key count), runtime integrity
  (contained crashes, boundary status) and distribution posture metrics.

## Admin console

- **Default credentials:** `cvforge` / `cvforge` (rotate immediately under **Security**).
- Passwords stored as salted **SHA-256** digests; sessions are tab-scoped (sessionStorage);
  5 failed attempts → 60 s lockout.
- Capabilities: draft/export **analytics**, **storage ledger** with per-key sizes, brand &
  announcement management, **default template governance** (validated JSON editor), global
  **UI palette control** (presets + custom hex, applied live via CSS variables), credential
  rotation, **maintenance mode**, full cache **backup / restore / wipe**.

## Keyboard shortcuts

- `Ctrl/⌘ + S` — save current draft (counted in analytics)
- `Ctrl/⌘ + P` — open Export Center (press again there for instant resume PDF)
- `/` — quick-search command palette

## Development

```bash
npm install
npm run dev      # local dev
npm run build    # → dist/index.html (single self-contained file)
```

Deploy by uploading `dist/index.html` to any static host (Netlify, Vercel, GitHub Pages, S3).
Hash-based routing means no server rewrite rules are required.
