export const FRAME_COUNT = 721;
export const HOLD_RATIO = 1 / 8;
export function frameAtProgress(progress, count = FRAME_COUNT) {
  return Math.max(0, Math.min(count - 1, progress / (1 - HOLD_RATIO) * (count - 1)));
}
export function approachFrame(current, target, seconds) {
  const dt = Math.min(seconds, .034);
  const difference = target - current;
  const eased = Math.abs(difference) * (1 - Math.exp(-dt / .16));
  const next = current + Math.sign(difference) * Math.min(eased, 110 * dt);
  return Math.abs(next - target) < .015 ? target : next;
}
