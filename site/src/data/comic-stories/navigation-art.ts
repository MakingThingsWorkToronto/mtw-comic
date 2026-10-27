/** Registered navigation crops keyed by the panel image id used by covers and NEXT choices.
 * Each URL is an integration copy of a canonical, registered crop of the owning scene.art region
 * (panel.ar, or panel.r). Add entries only after those exact crop files exist and are checked.
 * Keep source/crop lineage in the image library. Never alias a retired id to unrelated artwork.
 */
export const navigationArt: Partial<Record<string, `/${string}`>> = {
  "home-tower-night": "/comic/navigation/home-tower-night-20261008.webp",
  "agentic-floor19": "/comic/navigation/agentic-floor19-20261008.webp",
  "trad-dana-desk": "/comic/navigation/trad-dana-desk-20261008.webp",
  "dm-records-room": "/comic/navigation/dm-records-room-20261008.webp",
  "home-phone-sam": "/comic/navigation/home-phone-sam-20261008.webp",
  "home-phone-dana-access": "/comic/navigation/home-phone-dana-access-20261008.webp",
  "home-phone-dana": "/comic/navigation/home-phone-dana-20261008.webp",
  "agentic-next-dana": "/comic/navigation/agentic-next-dana-20261008.webp",
  "trad-next-dana": "/comic/navigation/trad-next-dana-20261008.webp",
  "agentic-next-dana-access": "/comic/navigation/agentic-next-dana-access-20261008.webp",
  "dm-next-dana-access": "/comic/navigation/dm-next-dana-access-20261008.webp",
  "agentic-brain-esposito": "/comic/navigation/agentic-brain-esposito-20261008.webp",
  "agentic-codex-tests": "/comic/navigation/agentic-codex-tests-20261008.webp",
  "trad-next-sam": "/comic/navigation/trad-next-sam-20261008.webp",
  "dm-next-sam": "/comic/navigation/dm-next-sam-20261008.webp",
  "trad-hands-map": "/comic/navigation/trad-hands-map-20261008.webp",
  "trad-dana-label": "/comic/navigation/trad-dana-label-20261008.webp",
  "dm-snowball-grows": "/comic/navigation/dm-snowball-grows-20261008.webp",
  "dm-cutover": "/comic/navigation/dm-cutover-20261008.webp"
};

/** Subject positions within the registered crops, shared by shelf, Issues and NEXT. */
export const navigationPositions: Partial<Record<string, string>> = {
  "home-tower-night": "78% 35%",
  "agentic-floor19": "44% 43%",
  "trad-dana-desk": "40% 37%",
  "dm-records-room": "81% 32%",
  "home-phone-sam": "43% 48%",
  "home-phone-dana-access": "34% 48%",
  "home-phone-dana": "46% 48%",
  "agentic-next-dana": "46% 48%",
  "trad-next-dana": "46% 48%",
  "agentic-next-dana-access": "62% 50%",
  "dm-next-dana-access": "62% 50%",
  "agentic-brain-esposito": "51% 48%",
  "agentic-codex-tests": "56% 45%",
  "trad-next-sam": "43% 48%",
  "dm-next-sam": "43% 48%",
  "trad-hands-map": "51% 66%",
  "trad-dana-label": "53% 45%",
  "dm-snowball-grows": "37% 48%",
  "dm-cutover": "60% 55%"
};
