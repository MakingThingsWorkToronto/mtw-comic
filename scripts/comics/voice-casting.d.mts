export interface VoiceChoice {
    provider: string;
    voiceId: string;
    status?: string;
    selectedBy?: string;
    selectedAt?: string;
    genderOverride?: boolean;
    productionHold?: boolean;
    useScope?: string;
    holdReason?: string;
    selectionSource?: string;
}
export interface HistoryEntry {
    provider?: string;
    voiceId: string;
    status: string;
    selectedAt?: string;
    selectedBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
    reason?: string;
    [k: string]: unknown;
}
export interface Casting {
    candidateVoiceIds: string[];
    shortlistVoiceIds: string[];
    selectedVoice?: VoiceChoice;
    history?: HistoryEntry[];
    [k: string]: unknown;
}
export interface Clip {
    id: string;
    title?: string;
    path: string;
    provider?: string;
    voiceId?: string;
    status?: string;
    sha256?: string;
    durationSeconds?: number;
    text?: string;
    [k: string]: unknown;
}
export interface Profile {
    characterId: string;
    delivery: string;
    pace: string;
    pitch: string;
    accent: string;
    provider: string;
    voiceId: string;
    referenceAudio: string;
    sampleLine: string;
    pronunciations: string;
    notes: string;
    clips?: Clip[];
    casting?: Casting | null;
    voiceGender?: string;
    voicePersona?: string;
    [k: string]: unknown;
}
export interface CatalogVoice {
    voiceId: string;
    name: string;
    provider?: string;
    labels?: Record<string, string | undefined>;
    comparisonOnly?: boolean;
    productionSelectable?: boolean;
    verifiedFit?: Record<string, boolean>;
    [k: string]: unknown;
}
export interface CastCharacter {
    id: string;
    gender?: string;
    [k: string]: unknown;
}
export interface ReviewRow {
    id: string;
    characterId: string;
    provider: string | null;
    voiceId: string | null;
    textSha256: string;
    storySource: {
        path: string;
        sha256: string;
    };
    [k: string]: unknown;
}
export interface TextReview {
    id: string;
    characterId: string;
    provider: string;
    voiceId: string;
    textSha256: string;
    storySource: {
        path: string;
        sha256: string;
    };
    status: string;
    reviewedBy: string;
    reviewedAt: string;
}
export declare function chosen(profile: Profile | undefined | null): VoiceChoice | null;
export declare function selected(profile: Profile | undefined | null): VoiceChoice | null;
export declare const key: (voice: {
    provider?: string | undefined;
    voiceId: string;
}) => string;
export declare const productionSelectable: (voice: CatalogVoice | undefined) => boolean;
export declare function validate(profiles: Profile[], catalog: CatalogVoice[], characters?: CastCharacter[]): Map<string, string>;
export declare function options(profile: Profile, catalog: CatalogVoice[], profiles: Profile[], character?: CastCharacter): CatalogVoice[];
export declare function clips(profile: Profile): Clip[];
export declare function approval(row: ReviewRow | undefined, review: Partial<TextReview> | undefined, profile: Profile | undefined): boolean;
/** What the console shows for a character's voice: nothing, a held preview-review choice, or a production-eligible choice. */
export type ChoiceState = 'none' | 'held' | 'production';
export declare function choiceState(profile: Profile | undefined | null): ChoiceState;
/** The reserved namespace: voice key to the character whose chosen voice it is (held choices included). */
export declare function reserved(profiles: Profile[]): Map<string, string>;
export interface TimelineEvent {
    at: string;
    kind: 'chosen' | 'held' | 'rejected';
    provider: string;
    voiceId: string;
    by?: string;
    reason?: string;
}
/** The choice history as one oldest-first timeline: the current choice, earlier choices and rejections. */
export declare function timeline(profile: Profile | undefined | null): TimelineEvent[];
/** An effect voice direction (voices.json effectVoiceDirections), exactly as stored. */
export interface EffectDirection {
    id: string;
    provider: string;
    voiceId: string;
    usage: string;
    selectedBy?: string;
    selectedAt?: string;
    status?: string;
    generationApproved?: boolean;
    exactWordsReviewRequired?: boolean;
    notes?: string;
    [k: string]: unknown;
}
/** The only fields a person edits in the console. Provider, voice, status and both gate flags stay as the producer wrote them. */
export declare const EFFECT_EDITABLE: readonly ["usage", "notes"];
/**
 * Exact-words gate (voices.json effectVoiceDirections; wiki/site/comics-library.md): a direction is a casting decision, not
 * approval to synthesize. New vocal words are generated only when generation is approved and no exact-word review is still required.
 */
export declare function effectGate(d: EffectDirection): {
    canGenerate: boolean;
    reason: string;
};
