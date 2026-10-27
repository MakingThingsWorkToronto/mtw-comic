// Types for registration.mjs so MTW Studio (apps/mtw, TypeScript) shares the one registration lookup with the hooks.
export declare const IMAGE_EXT: string[];
export declare const AUDIO_EXT: string[];
export declare const VIDEO_EXT: string[];
export declare const MEDIA_EXT: string[];
export declare const IMAGE_ASSETS: string;
export declare const AUDIO_ASSETS: string;
export declare const COMIC_AUDIO_CATALOGS: string[];
export declare const CANONICAL_PREFIXES: string[];
export declare const MEDIA_COPY_PREFIXES: string[];
export declare const REGISTER_HINT: { image: string; audio: string };
export declare function isMedia(rel: string): boolean;
export declare function toRepoRelative(p: string, root: string): string;
export declare function registryFor(rel: string): 'image' | 'audio' | null;
export declare function checkRegistered(rel: string, readText: (rel: string) => string | null): { registered: boolean; registry: 'image' | 'audio' | null; detail?: string };
export declare function diskReader(root: string): (rel: string) => string | null;
export declare function mediaExemptions(root: string): RegExp[];
export declare function isExemptMedia(rel: string, root: string, exemptions?: RegExp[]): boolean;
export declare function hasLibraryMaster(rel: string, readText: (rel: string) => string | null): boolean;
