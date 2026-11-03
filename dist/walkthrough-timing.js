const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
// Short acceleration/deceleration ramps, with even pacing through the room.
const paced=value=>{const x=clamp(value),edge=.06;const ramp=t=>edge*(t*t*t-.5*t*t*t*t)/(1-edge);return x<edge?ramp(x/edge):x>1-edge?1-ramp((1-x)/edge):(x-edge*.5)/(1-edge);};
// Traverse the complete room before revealing copy over the same frozen scene.
export function walkthroughPhases(progress){const p=clamp(progress);return {travel:paced(p/.73),photo:smooth((p-.755)/.17),hero:smooth((p-.875)/.075),hold:p>=.95};}
export const HERO_STOP=.975;
