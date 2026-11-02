const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
const smoother=value=>{const x=clamp(value);return x*x*x*(x*(x*6-15)+10);};
// Camera ends first, then the matched hero photograph takes over, followed by a hold.
export function walkthroughPhases(progress){const p=clamp(progress);return {travel:smoother(p/.68),hero:smooth((p-.71)/.10),hold:p>=.81};}
export const HERO_STOP=.9;
