export interface Counts { total: number; approved: number; rejected: number; stale: number; pending: number; unvoiced: number }
export interface IssueSummary {
  id: string; issue: number | null; title: string; collection: string; hook: string; path: string; liveUrl: string; localUrl: string; bPage: string | null;
  cover: string | null; durationSeconds: number; bpm: number; scenes: number; panels: number; speakers: string[]; reviews: Counts; problems: number;
}
export interface SceneRow { id: string; title: string; beat: number; seconds: number; panels: number; score: number; scoreAuthored: boolean; room: string; roomAuthored: boolean; effects: number; motion: number; speakers: string[]; villains: string[] }
export interface IssueFull extends Omit<IssueSummary, 'scenes'> {
  scenes: SceneRow[];
  nextSound: unknown;
  coverage: { missingIntroductions: string[]; missingProfiles: string[]; unknownSpeakers: string[]; scenesWithoutExplicitScore: string[]; scenesWithoutExplicitRoom: string[] };
}
export interface CastRow {
  id: string; name: string; group: string; role: string; voiceUse: string | null; speakingIn: string[];
  model: { recordId: string; style: string; status: string | null; present: boolean; shared: boolean } | null;
  portrait: string | null; imgRef: string | null;
  voice: { state: 'selected'; voiceId: string; provider: string; name: string; ref: string; held: boolean } | null;
  shortlist: number; clips: number;
  /** Newest sheet in the reference slot (list view); `awaitingRegistration` when the catalog has not registered it. */
  slotVersion?: number; awaitingRegistration?: boolean;
}
export interface VoiceView {
  ref: string; voiceId: string; provider: string; name: string; description: string; labels: Record<string, string | undefined>;
  canonicalPath: string | null; preview?: string; state: 'selected' | 'shortlist' | 'candidate' | 'rejected' | 'option'; held?: boolean; ownedBy?: string;
}
export interface ClipView { id: string; title: string; status: string; text: string; durationSeconds?: number; voiceId?: string; provider?: string; canonicalPath: string | null; preview?: string }
export interface CastDetail extends Omit<CastRow, 'clips'> {
  aliases: string[]; signature: string; introduction: string | null;
  profile: Record<'delivery' | 'pace' | 'pitch' | 'accent' | 'pronunciations' | 'sampleLine' | 'notes', string> | null;
  auditionScripts?: { id: string; title: string; text: string }[];
  audition?: { voiceURI?: string; rate?: number; pitch?: number } | null;
  locked: boolean;
  choice: { voice: VoiceView | null; held: boolean; useScope: string | null; holdReason: string | null; source: string | null; selectedAt: string | null; selectedBy: string | null } | null;
  shortlisted: VoiceView[];
  history: { at: string; kind: 'chosen' | 'held' | 'rejected'; provider: string; voiceId: string; name: string; by?: string; reason?: string }[];
  voices: VoiceView[]; clips: ClipView[]; taken: (VoiceView & { characterId: string; characterName: string })[];
  /** The character's reference slot: every `-vN` sheet on disk, newest first, and which one the catalog registered. */
  slot?: {
    dir: string; stem: string; recordId: string | null; registeredVersion: number | null;
    versions: { version: number; path: string; preview: string; savedAt: string; registered: boolean; observations: string[]; unresolved: string[] }[];
  };
}
export type ReviewState = 'approved' | 'rejected' | 'stale' | 'pending' | 'unvoiced';
export interface CanonicalArtSource { path: string; sha256?: string; recordId?: string; treatment?: string; panelId?: string; [key: string]: unknown }
export interface PanelLayerPlacement { sourceROI: [number, number, number, number]; slot: [number, number, number, number]; fit: 'contain'; speakerIds?: string[] }
export interface PanelArtLayer { id: string; role?: string; src: string; crop: [number, number, number, number]; r?: [number, number, number, number]; opacity: number; canonicalSource?: CanonicalArtSource; agentPlacement?: PanelLayerPlacement; propPlacement?: PanelLayerPlacement }
export interface PanelPresentation { src: string | null; crop: [number, number, number, number] | null; fit?: string; media?: 'desktop' | 'phone'; canonicalSource?: CanonicalArtSource; layers?: PanelArtLayer[] }
export interface SpeechRow {
  id: string; storyId: string; sceneId: string; sceneTitle: string; panelId: string | null; panelIndex: number; balloonIndex: number; kind: string;
  characterId: string; text: string; state: ReviewState; reviewedAt?: string; voice: string | null;
  audio?: { ref: string; preview?: string; durationSeconds: number; status: string };
  crop?: { src: string; rect: [number, number, number, number]; alt: string; art: string | null; canonicalSource?: CanonicalArtSource; layers?: PanelArtLayer[]; phone?: PanelPresentation; views?: (PanelPresentation & { id?: string; at: number })[] };
  baseline?: string | null;
}
export interface PageBalloon { id: string; text: string; kind: string; characterId: string; state: ReviewState; voiced: boolean }
export interface PagePanel { index: number; img: string; alt: string; crop: [number, number, number, number] | null; balloons: PageBalloon[]; src?: string | null; canonicalSource?: CanonicalArtSource; layers?: PanelArtLayer[]; phone?: PanelPresentation; views?: (PanelPresentation & { id?: string; at: number })[] }
export interface PageScene { id: string; title: string; beat: number; seconds: number; art: string | null; thumb: string | null; full: string | null; balloons: number; voiced: number; counts: Counts; panels: PagePanel[] }
export interface SoundsData {
  rooms: { room: string; status: string; provider: string; loop: boolean; integratedLufs: number | null; truePeakDbfs: number | null; productionApproved: boolean; canonicalPath: string | null; preview?: string }[];
  speech: { id: string; title: string; storyId: string; characterId: string; provider: string; text: string; durationSeconds: number; status: string; canonicalPath: string | null; preview?: string }[];
  next: { issue: string; title: string; sound: unknown }[];
}
export interface EffectDirectionView {
  id: string; provider: string; voiceId: string; voiceName: string; usage: string; notes?: string; status?: string; selectedBy?: string; selectedAt?: string;
  generationApproved?: boolean; exactWordsReviewRequired?: boolean; preview?: string; gate: { canGenerate: boolean; reason: string }; editable: string[];
}
