// Render only frames on the path towards the camera's desired position.
// A late-decoding image can never teleport the canvas dozens of frames.
export function chooseBufferedFrame(frames, lastDrawn, position, maxStep = 3) {
  if (lastDrawn < 0) return frames.has(0) ? 0 : -1;
  const goal = Math.max(0, Math.min(720, Math.round(position)));
  const difference = goal - lastDrawn;
  if (difference === 0) return -1;
  const direction = Math.sign(difference);
  const steps = Math.min(Math.abs(difference), Math.max(1, Math.floor(maxStep)));
  for (let offset = steps; offset > 0; offset--) {
    const next = lastDrawn + direction * offset;
    if (frames.has(next)) return next;
  }
  return -1;
}
export function frameStepBudget(seconds) {
  return Math.max(1, Math.min(6, Math.ceil(Math.min(.05, Math.max(0, seconds)) * 180)));
}
