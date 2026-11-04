// Tło nocnej strony: prawie czarna przestrzeń z dużymi, rozmytymi, ciepłymi światłami
// (taupe, grafit, beż), które powoli płyną, oraz rzadkie gwiazdy. Niska rozdzielczość, pauza w tle karty.
const canvas = document.querySelector('.tlo-3d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl = canvas && canvas.getContext('webgl', { antialias: false });
if (canvas && gl) {
  const vs = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
  const fs = `precision mediump float;
  uniform vec2 uRes; uniform float uTime, uScroll; uniform vec2 uMouse;
  float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec3 blob(vec2 uv, vec2 c, float r, vec3 col){ float d = length(uv - c); return col * exp(-d * d / (r * r)); }
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes;
    float ar = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * ar, uv.y);
    float t = uTime * 0.05;
    float s = uScroll * 0.00012;
    vec3 gold  = vec3(0.66, 0.62, 0.58);  // taupe
    vec3 amber = vec3(0.55, 0.52, 0.49);  // taupe w cieniu
    vec3 brown = vec3(0.21, 0.20, 0.19);  // grafit
    vec3 beige = vec3(0.91, 0.89, 0.87);  // beż
    vec3 col = vec3(0.067, 0.067, 0.063); // głęboka czerń
    // duże, miękkie światła przy krawędziach — jak smugi światła w ciemnym wnętrzu
    col += blob(p, vec2(-0.05 + 0.08 * sin(t * 1.1), 0.05 + 0.1 * sin(t * 0.7 + s)), 0.55, gold * 0.55);
    col += blob(p, vec2(0.15 + 0.1 * sin(t * 0.8 + 1.0), -0.12 + 0.06 * cos(t + s * 2.0)), 0.35, beige * 0.35);
    col += blob(p, vec2(ar + 0.05 + 0.08 * cos(t * 0.9), 0.55 + 0.25 * sin(t * 0.6 - s)), 0.5, amber * 0.45);
    col += blob(p, vec2(ar * 0.55 + 0.25 * sin(t * 0.5 + 2.0), 1.15 + 0.08 * cos(t * 0.7)), 0.45, brown * 0.7);
    col += blob(p, vec2(ar * 0.3 + 0.2 * cos(t * 0.4 + s), 0.45 + 0.15 * sin(t * 0.9)), 0.28, brown * 0.35);
    col += blob(p, uMouse * vec2(ar, 1.0) + vec2(ar * 0.5, 0.5), 0.3, gold * 0.06);
    // środek ciemniejszy, żeby treść była czytelna
    col *= 0.55 + 0.45 * smoothstep(0.0, 0.75, length((uv - 0.5) * vec2(1.3, 1.0)));
    // rzadkie gwiazdy
    vec2 g = floor(gl_FragCoord.xy / 3.0 + vec2(0.0, uScroll * 0.02));
    float r = h(g);
    float star = step(0.9985, r) * (0.5 + 0.5 * sin(uTime * (1.0 + r * 3.0) + r * 50.0));
    col += vec3(1.0) * star * 0.5;
    col += (h(gl_FragCoord.xy + uTime) - 0.5) * 0.018;
    gl_FragColor = vec4(col, 1.0);
  }`;
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uTime = U('uTime'), uScroll = U('uScroll'), uMouse = U('uMouse');
  const SCALE = 0.6;
  const resize = () => {
    canvas.width = Math.round(innerWidth * SCALE);
    canvas.height = Math.round(innerHeight * SCALE);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  addEventListener('resize', resize);
  resize();
  let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  const t0 = performance.now();
  const draw = (now) => {
    smx += (mx - smx) * 0.03;
    smy += (my - smy) * 0.03;
    gl.uniform1f(uTime, reduceMotion ? 0 : (now - t0) / 1000);
    gl.uniform1f(uScroll, scrollY);
    gl.uniform2f(uMouse, smx, -smy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduceMotion && !document.hidden) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduceMotion) requestAnimationFrame(draw); });
  if (reduceMotion) addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true });
  document.body.classList.add('tlo-on');
}
