export const FRAME_COUNT = 721;
export const HOLD_RATIO = 2 / 9;
export const CROP_BOTTOM = 76;
export function frameAtProgress(progress, count = FRAME_COUNT) {
  return Math.max(0, Math.min(count - 1, progress / (1 - HOLD_RATIO) * (count - 1)));
}
// Carry velocity across wheel events, with bounded acceleration and fixed-size
// integration steps. This avoids the abrupt speed changes of position-only easing.
export function advanceFrame(position, velocity, target, seconds) {
  let remaining = Math.min(Math.max(seconds, 0), .05);
  while (remaining > 1e-8) {
    const dt = Math.min(remaining, 1 / 120);
    const difference = target - position;
    const acceleration = Math.max(-700, Math.min(700, 256 * difference - 32 * velocity));
    const nextVelocity = Math.max(-125, Math.min(125, velocity + acceleration * dt));
    const next = position + (velocity + nextVelocity) * .5 * dt;
    if ((target - position) * (target - next) <= 0 || (Math.abs(target - next) < .015 && Math.abs(nextVelocity) < .2)) {
      position = target; velocity = 0;
    } else { position = next; velocity = nextVelocity; }
    remaining -= dt;
  }
  return { position, velocity };
}
