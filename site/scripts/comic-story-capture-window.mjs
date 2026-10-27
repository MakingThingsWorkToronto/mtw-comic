// Consume the runtime's measured art/lettering/fade interval without guessing timing.
export function captureWindow(review, panelId, sceneStart) {
  const frame = review?.frames?.find(item => item.panelImageIds.includes(panelId));
  if (!frame) throw Error(`No measured reading window for ${panelId}`);
  if (!Number.isFinite(frame.beat) || !Number.isFinite(sceneStart) || frame.beat < sceneStart) throw Error(`Invalid measured reading window for ${panelId}`);
  return { beat: frame.beat - sceneStart, readingWindow: frame };
}
