// ─────────────────────────────────────────────────────────────
// CVForge Studio — shared type contracts
// ─────────────────────────────────────────────────────────────

export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  link: string;
  tech: string[];
  description: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export type DocFont = "sans" | "serif" | "grotesk" | "mono";

export interface ResumeLayout {
  fontFamily: DocFont;
  fontSize: number; // base px, 12–15
  lineHeight: number; // 1.3–1.8
  margin: number; // page padding px 32–64
  columns: 1 | 2;
  accentColor: string; // document accent hex
  // v2 additions — optional for full backward compatibility with existing drafts
  tracking?: number; // letter-spacing in em (0 – 0.05)
  sectionSpacing?: number; // section gap multiplier (0.8 – 2.0)
  headerStyle?: "bar" | "rule" | "minimal";
}

export interface ResumeData {
  personal: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  layout: ResumeLayout;
  meta: { updatedAt: string };
}

export interface CoverLetterData {
  senderName: string;
  senderTitle: string;
  contactLine: string;
  date: string;
  recipientName: string;
  recipientTitle: string;
  company: string;
  position: string;
  greeting: string;
  body: string;
  closing: string;
  matchStyle: boolean;
  accentColor: string;
  fontFamily: DocFont;
  meta: { updatedAt: string };
}

export interface BioCardData {
  name: string;
  role: string;
  tagline: string;
  location: string;
  email: string;
  website: string;
  github: string;
  linkedin: string;
  skills: string[];
  accent: string;
  meta: { updatedAt: string };
}

export interface BrandSettings {
  name: string;
  accentWord: string;
  tagline: string;
}

export interface AuthRecord {
  username: string;
  passHash: string;
}

export interface AppSettings {
  brand: BrandSettings;
  accent: string; // global UI accent hex
  announcement: string;
  maintenance: boolean;
  maintenanceMessage: string;
  auth: AuthRecord | null;
  defaultResume: ResumeData | null; // admin-managed template
  coverTemplate: string;
}

export interface ExportCounts {
  pdf: number;
  png: number;
  jpg: number;
  zip: number;
  json: number;
}

export type ToolKey = "resume" | "cover" | "bio" | "bullets";

export interface Stats {
  createdAt: string;
  drafts: number;
  exports: ExportCounts;
  savesByTool: Record<ToolKey, number>;
  lastActive: string;
  // v2 additions — optional for backward compatibility
  shares?: number;
  crashes?: number;
  lastExportAt?: string;
}

export interface StorageEntry {
  key: string;
  bytes: number;
}

// ─────────────────────────────────────────────────────────────
// Share-link contracts (v2)
// ─────────────────────────────────────────────────────────────
export type SharePermission =
  | "edit"
  | "highlight"
  | "format"
  | "comment"
  | "pdf"
  | "json"
  | "reorder";

export interface SharePermissions {
  edit: boolean; // Allow Edit
  highlight: boolean; // Allow Text Highlight
  format: boolean; // Allow Bold / Formatting
  comment: boolean; // Allow Commenting
  pdf: boolean; // Allow PDF Download
  json: boolean; // Allow JSON Export
  reorder: boolean; // Allow Section Reordering
}

export interface SharePayload {
  v: 1;
  label: string;
  createdAt: string;
  perms: SharePermissions;
  resume: ResumeData;
}
