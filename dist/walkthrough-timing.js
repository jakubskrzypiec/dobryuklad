const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
// Short acceleration/deceleration ramps, with even pacing through the room.
const paced=value=>{const x=clamp(value),edge=.06;const ramp=t=>edge*(t*t*t-.5*t*t*t*t)/(1-edge);return x<edge?ramp(x/edge):x>1-edge?1-ramp((1-x)/edge):(x-edge*.5)/(1-edge);};
// Traverse the complete room before revealing copy over the same frozen scene.
// Begin in the spatial clay model; the paper-plan phase is intentionally absent.
export function walkthroughPhases(progress){const p=clamp(progress);return {growth:.72+.28*smooth((p-.02)/.13),labels:1-smooth((p-.035)/.125),intro:smooth((p-.015)/.255),materials:smooth((p-.20)/.14),travel:paced((p-.34)/.38),photo:smooth((p-.75)/.17),hero:smooth((p-.865)/.09),hold:p>=.955};}
export const HERO_STOP=.98;
