const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
const smoother=value=>{const x=clamp(value);return x*x*x*(x*(x*6-15)+10);};
// Traverse the complete room before revealing copy over the same frozen scene.
export function walkthroughPhases(progress){const p=clamp(progress);return {travel:smoother(p/.89),hero:smooth((p-.89)/.055),hold:p>=.945};}
export const HERO_STOP=.965;
