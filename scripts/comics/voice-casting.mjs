// Shared casting authority for Studio and native Node speech/projection gates.
// chosen = Matt-approved choice (incl. production-held); selected = chosen and not production-held.
export function chosen(profile) {
    const choice = profile?.casting?.selectedVoice;
    return choice && choice.status === 'approved' && choice.selectedBy === 'Matt Stark' && choice.selectedAt && choice.provider && choice.voiceId ? choice : null;
}
export function selected(profile) {
    const choice = chosen(profile);
    return choice && choice.productionHold !== true ? choice : null;
}
export const key = (voice) => `${voice.provider || 'ElevenLabs'}/${voice.voiceId}`;
export const productionSelectable = (voice) => !!voice && voice.comparisonOnly !== true && voice.productionSelectable !== false;
export function validate(profiles, catalog, characters) {
    const owners = new Map();
    for (const profile of profiles) {
        const choice = chosen(profile);
        if (!choice)
            continue;
        const voice = catalog.find((v) => key(v) === key(choice));
        if (!voice)
            throw new Error(`Selected voice missing from provider catalog: ${profile.characterId}`);
        if (profile.provider !== choice.provider || profile.voiceId !== choice.voiceId)
            throw new Error(`Selected voice/profile binding differs: ${profile.characterId}`);
        const character = (characters ?? []).find((c) => c.id === profile.characterId);
        const gender = profile.voiceGender || character?.gender;
        // A held preview-review choice may use a comparison-only reference (casting.js, Main Comic 2026-10-10).
        const previewHold = choice.productionHold === true && choice.useScope === 'preview-review';
        if (!productionSelectable(voice) && !previewHold)
            throw new Error(`Comparison-only reference cannot be selected for production: ${profile.characterId}`);
        if (gender && voice.labels?.gender && gender !== voice.labels.gender && choice.genderOverride !== true)
            throw new Error(`Selected voice gender conflicts with authored character: ${profile.characterId}`);
        if (owners.has(key(choice)))
            throw new Error(`Approved voice assigned to two characters: ${owners.get(key(choice))}/${profile.characterId}`);
        owners.set(key(choice), profile.characterId);
    }
    return owners;
}
export function options(profile, catalog, profiles, character) {
    const choice = chosen(profile);
    if (choice)
        return catalog.filter((v) => key(v) === key(choice));
    const owners = validate(profiles, catalog);
    const gender = profile.voiceGender || character?.gender;
    const persona = profile.voicePersona;
    const rejected = profile.casting?.history ?? [];
    return catalog.filter((v) => !owners.has(key(v)) &&
        !rejected.some((entry) => entry.status === 'rejected' && key(entry) === key(v)) &&
        (!gender || v.labels?.gender === gender) &&
        (!persona || [v.labels?.persona, v.labels?.descriptive].includes(persona) || v.verifiedFit?.[profile.characterId] === true));
}
export function clips(profile) {
    const choice = chosen(profile);
    return (profile.clips ?? []).filter((clip) => !choice || key(clip) === key(choice));
}
export function approval(row, review, profile) {
    const choice = selected(profile);
    return !!(choice && row && review && review.status === 'approved' && review.reviewedBy === 'Matt Stark' && review.reviewedAt &&
        review.id === row.id && review.characterId === row.characterId && review.provider === choice.provider && review.voiceId === choice.voiceId &&
        row.provider === choice.provider && row.voiceId === choice.voiceId && review.textSha256 === row.textSha256 &&
        review.storySource && row.storySource && review.storySource.path === row.storySource.path && review.storySource.sha256 === row.storySource.sha256);
}
export function choiceState(profile) {
    const choice = chosen(profile);
    return !choice ? 'none' : choice.productionHold === true ? 'held' : 'production';
}
/** The reserved namespace: voice key to the character whose chosen voice it is (held choices included). */
export function reserved(profiles) {
    const out = new Map();
    for (const p of profiles) {
        const c = chosen(p);
        if (c)
            out.set(key(c), p.characterId);
    }
    return out;
}
/** The choice history as one oldest-first timeline: the current choice, earlier choices and rejections. */
export function timeline(profile) {
    const out = [];
    const add = (e) => out.push({ ...e, provider: e.provider || 'ElevenLabs' });
    for (const h of profile?.casting?.history ?? []) {
        if (h.selectedAt && h.selectedBy)
            add({ at: h.selectedAt, kind: 'chosen', provider: h.provider, voiceId: h.voiceId, by: h.selectedBy });
        if (h.rejectedAt)
            add({ at: h.rejectedAt, kind: 'rejected', provider: h.provider, voiceId: h.voiceId, ...(h.rejectedBy ? { by: h.rejectedBy } : {}), ...(h.reason ? { reason: h.reason } : {}) });
    }
    const c = chosen(profile);
    if (c)
        add({ at: c.selectedAt, kind: c.productionHold === true ? 'held' : 'chosen', provider: c.provider, voiceId: c.voiceId, ...(c.selectedBy ? { by: c.selectedBy } : {}), ...(c.holdReason ? { reason: c.holdReason } : {}) });
    return out.sort((a, b) => a.at.localeCompare(b.at));
}
/** The only fields a person edits in the console. Provider, voice, status and both gate flags stay as the producer wrote them. */
export const EFFECT_EDITABLE = ['usage', 'notes'];
/**
 * Exact-words gate (voices.json effectVoiceDirections; wiki/site/comics-library.md): a direction is a casting decision, not
 * approval to synthesize. New vocal words are generated only when generation is approved and no exact-word review is still required.
 */
export function effectGate(d) {
    if (d.exactWordsReviewRequired !== false)
        return { canGenerate: false, reason: 'Exact words need review before any new effect is generated.' };
    if (d.generationApproved !== true)
        return { canGenerate: false, reason: 'Generation is not approved.' };
    return { canGenerate: true, reason: 'Words reviewed and generation approved.' };
}
