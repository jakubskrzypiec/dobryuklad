export const FRAME_COUNT = 481;
export const HOLD_RATIO = 1 / 6;
export function frameAtProgress(progress, count = FRAME_COUNT) {
  return Math.max(0, Math.min(count - 1, progress / (1 - HOLD_RATIO) * (count - 1)));
}
export function approachFrame(current, target, seconds) {
  const next = current + (target - current) * (1 - Math.exp(-Math.min(seconds, .05) / .095));
  return Math.abs(next - target) < .015 ? target : next;
}
