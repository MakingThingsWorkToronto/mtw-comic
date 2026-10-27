// Shared types for the local authoring runner's model catalog.
export interface CatalogModel { id: string; label: string; efforts: string[]; defaultEffort?: string; hidden?: boolean }
export interface CatalogProvider { runner: string | null; label: string; source: string; fetchedAt: string | null; models: CatalogModel[] }
export declare const MODELS_FILE: string;
export declare function buildCatalog(home?: string): Record<string, CatalogProvider>;
export declare function syncModels(opts?: { home?: string; file?: string; check?: boolean }): boolean;
export declare function codexModels(cache: unknown): { source: string; fetchedAt: string | null; models: CatalogModel[] } | null;
export declare function grokModels(cache: unknown): { source: string; fetchedAt: string | null; models: CatalogModel[] } | null;
export declare function claudeModels(text: string | null): { source: string; fetchedAt: null; models: CatalogModel[] } | null;
