// Żywe tło 3D pod całą stroną: miękka, falująca tkanina w beżach i brązach,
// oświetlona z góry z lewej. Rysowane w niskiej rozdzielczości i tylko, gdy karta jest widoczna.
const canvas = document.querySelector('.tlo-3d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl = canvas && canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
if (canvas && gl) {
  const vs = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;
  const fs = `precision mediump float;
  uniform vec2 uRes; uniform float uTime, uScroll; uniform vec2 uMouse;
  float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1,0)), u.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), u.x), u.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * n(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; } return v; }
  // wysokość tkaniny: zagięta domenowo warstwa szumu, powoli płynie
  float height(vec2 p){
    float t = uTime * 0.035;
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 0.4));
    return fbm(p + 2.6 * r);
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y) * 1.6 + vec2(0.0, uScroll * 0.00025) + uMouse * 0.05;
    float e = 0.004;
    float c = height(p);
    float dx = height(p + vec2(e, 0.0)) - c;
    float dy = height(p + vec2(0.0, e)) - c;
    vec3 nrm = normalize(vec3(-dx * 9.0, -dy * 9.0, 1.0));
    vec3 L = normalize(vec3(-0.55, 0.65, 0.55));
    float diff = clamp(dot(nrm, L), 0.0, 1.0);
    float spec = pow(clamp(dot(reflect(-L, nrm), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 24.0);
    // paleta: kremowa biel, piasek, taupe, karmelowy brąz w zagłębieniach
    vec3 cream = vec3(0.965, 0.945, 0.915);
    vec3 sand  = vec3(0.905, 0.862, 0.800);
    vec3 taupe = vec3(0.800, 0.735, 0.655);
    vec3 brown = vec3(0.640, 0.520, 0.405);
    vec3 col = mix(sand, cream, smoothstep(0.35, 0.75, c));
    col = mix(col, taupe, smoothstep(0.45, 0.2, c) * 0.55);
    col = mix(col, brown, smoothstep(0.32, 0.12, c) * 0.35);
    col *= 0.86 + 0.2 * diff;
    col += vec3(1.0, 0.96, 0.9) * spec * 0.06;
    // całość jasna i spokojna, żeby treść była czytelna
    col = mix(col, cream, 0.38);
    col += (h(gl_FragCoord.xy + uTime) - 0.5) * 0.012;
    gl_FragColor = vec4(col, 1.0);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uTime = U('uTime'), uScroll = U('uScroll'), uMouse = U('uMouse');
  const SCALE = 0.5; // niska rozdzielczość: tło jest miękkie, a karta graficzna odpoczywa
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
