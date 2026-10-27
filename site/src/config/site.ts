// Header navigation from spec "Final Decision for Theme".
// URL slugs are provisional until the pages exist (Steps 3 to 6).
export const SITE_NAME = 'Making Things Work';

export const servicesLink = { label: 'Services', href: '/#solutions' };
export const services = [
  { label: 'Agentic Systems', href: '/agentic-systems/' },
  { label: 'Traditional Systems', href: '/traditional-systems/' },
  { label: 'Data & Migrations', href: '/data-migrations/' },
];
export const primaryLinks = [
  { label: 'Experiments', href: '/experiments/' },
  { label: 'About Matt', href: '/about-matt/' },
  { label: 'Journal', href: '/journal/' },
];
export const contactLink = { label: "Let's talk", href: '/contact/' };

// Temporary image style dropdown (spec: Sample Images). Same id, different folder and extension.
// Raster treatments (ext png) are converted to AVIF/WebP/JPEG by scripts/images (see src/lib/images.ts).
export const IMAGE_TREATMENTS = [
  { key: 'holographic', label: 'Holographic', folder: 'holographic', ext: 'png' },
  { key: 'photorealistic', label: 'Photorealistic', folder: 'photorealistic', ext: 'png' },
  { key: 'svg-outline', label: 'SVG Outline', folder: 'svg-outline', ext: 'svg' },
  { key: 'svg-flat', label: 'SVG Flat', folder: 'svg-flat', ext: 'svg' },
] as const;
export type TreatmentKey = (typeof IMAGE_TREATMENTS)[number]['key'];
export const DEFAULT_TREATMENT: TreatmentKey = 'svg-flat';
/** Old keys still saved in visitors' localStorage, mapped to their replacements. */
export const LEGACY_TREATMENT_KEYS: Record<string, TreatmentKey> = { svg: 'svg-outline', realistic: 'photorealistic' };
