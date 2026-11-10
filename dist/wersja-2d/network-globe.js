/* Spherical 3D projection with pointer-driven yaw/pitch; no external rendering dependency. */
(() => {
  const section = document.querySelector('[data-network-globe]');
  if (!section) return;
  const stage = section.querySelector('.network-scene');
  const canvas = stage.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const source = document.querySelector('script[src*="network-globe.js"]');
  const base = source && source.src ? source.src : document.baseURI;
  const radians = Math.PI / 180;
  const vector = (lon, lat) => {
    lon *= radians; lat *= radians;
    return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  };
  let countries = [], cities = [], width = 0, height = 0, radius = 0, cx = 0, cy = 0;
  let visible = false, loaded = false, raf = 0, last = 0;
  let yaw = 19, pitch = 18, targetYaw = 19, targetPitch = 18, hovered = '';
  let sy = 0, coy = 1, sp = 0, cp = 1;
  let points = [];
  const labels = new Map();
  const offsets = {Koszalin:-76,'Poznań':0,'Wrocław':70,'Gdańsk':-84,Warszawa:4,'Kraków':88};
  function project(v, elevation = 1) {
    const x = coy * v[0] - sy * v[2];
    const z = sy * v[0] + coy * v[2];
    const y = cp * v[1] - sp * z;
    return {x:cx+x*radius*elevation,y:cy-y*radius*elevation,z:sp*v[1]+cp*z};
  }
  function pathLine(vectors) {
    context.beginPath(); let open = false;
    vectors.forEach(v => {
      const p = project(v);
      if (p.z > .015) { if (open) context.lineTo(p.x,p.y); else context.moveTo(p.x,p.y); open=true; }
      else open=false;
    });
    context.stroke();
  }
  const graticules = [];
  for(let lat=-60;lat<=60;lat+=30){const line=[];for(let lon=-180;lon<=180;lon+=3)line.push(vector(lon,lat));graticules.push(line);}
  for(let lon=-180;lon<180;lon+=30){const line=[];for(let lat=-90;lat<=90;lat+=3)line.push(vector(lon,lat));graticules.push(line);}
  function paint() {
    if (!loaded || !width || !height) return;
    sy=Math.sin(yaw*radians);coy=Math.cos(yaw*radians);sp=Math.sin(pitch*radians);cp=Math.cos(pitch*radians);
    context.clearRect(0,0,width,height);
    context.save();context.beginPath();context.arc(cx,cy,radius,0,Math.PI*2);context.clip();
    const shade=context.createRadialGradient(cx+radius*.35,cy-radius*.7,0,cx,cy,radius*1.1);
    shade.addColorStop(0,'#242424');shade.addColorStop(.45,'#151515');shade.addColorStop(1,'#090909');
    context.fillStyle=shade;context.fillRect(0,0,width,height);
    context.lineWidth=.6;context.strokeStyle='rgba(235,235,235,.14)';context.setLineDash([1,6]);
    graticules.forEach(pathLine);context.setLineDash([]);
    countries.forEach(country => {
      context.lineWidth=country.poland?1.35:.65;
      context.strokeStyle=country.poland?'rgba(255,255,255,.95)':'rgba(210,210,210,.29)';
      country.rings.forEach(ring => {
        if(country.poland){context.beginPath();ring.forEach((v,i)=>{const p=project(v);if(i)context.lineTo(p.x,p.y);else context.moveTo(p.x,p.y);});context.closePath();context.fillStyle='rgba(245,245,245,.16)';context.fill();context.stroke();}
        else pathLine(ring);
      });
    });
    const poland=project(vector(19.1,52.1));
    const glow=context.createRadialGradient(poland.x,poland.y,0,poland.x,poland.y,75);
    glow.addColorStop(0,'rgba(255,255,255,.065)');glow.addColorStop(1,'rgba(255,255,255,0)');
    context.fillStyle=glow;context.fillRect(poland.x-75,poland.y-75,150,150);
    // Raised arcs connect the studio in Koszalin with the marked Polish cities.
    const origin=cities[0];
    context.lineWidth=.75;context.strokeStyle='rgba(255,255,255,.3)';
    cities.slice(1).forEach(city=>{context.beginPath();for(let step=0;step<=24;step++){
      const t=step/24,lon=origin.lon+(city.lon-origin.lon)*t,lat=origin.lat+(city.lat-origin.lat)*t;
      const p=project(vector(lon,lat),1+Math.sin(Math.PI*t)*.027);
      if(step)context.lineTo(p.x,p.y);else context.moveTo(p.x,p.y);
    }context.stroke();});
    points=[];
    cities.forEach(city=>{
      const p=project(city.v,1.002); if(p.z<=0)return;
      points.push({...p,city});const active=hovered===city.name;
      if(active||city.name==='Koszalin'){
        const g=context.createRadialGradient(p.x,p.y,0,p.x,p.y,active?17:12);g.addColorStop(0,'rgba(255,255,255,.42)');g.addColorStop(1,'rgba(255,255,255,0)');context.fillStyle=g;context.fillRect(p.x-17,p.y-17,34,34);
      }
      context.beginPath();context.arc(p.x,p.y,active?3.8:city.name==='Koszalin'?3:1.8,0,Math.PI*2);context.fillStyle='#f2f2f2';context.fill();
      if(city.label){
        const scale=Math.min(1,width/700),right=city.side==='right';
        const anchorX=Math.max(95,Math.min(width-100,poland.x+(right?125:-108)*scale));
        const anchorY=Math.max(26,Math.min(height-38,poland.y+offsets[city.name]*scale));
        context.beginPath();context.moveTo(p.x,p.y);context.lineTo(anchorX+(right?-14:14),anchorY);context.lineTo(anchorX,anchorY);context.lineWidth=.6;context.strokeStyle=active?'#eee':'rgba(230,230,230,.35)';context.stroke();
        const label=labels.get(city.name);label.style.left=anchorX+'px';label.style.top=anchorY+'px';label.classList.toggle('is-active',active);
      }
    });
    context.restore();
    context.beginPath();context.arc(cx,cy,radius,Math.PI,Math.PI*2);context.strokeStyle='rgba(255,255,255,.16)';context.lineWidth=1;context.stroke();
    canvas.dataset.rotation=yaw.toFixed(3)+','+pitch.toFixed(3);
    const tooltip=stage.querySelector('.network-tooltip');
    const selected=points.find(p=>p.city.name===hovered&&!p.city.label);
    if(selected){tooltip.hidden=false;tooltip.textContent=selected.city.name;tooltip.style.left=Math.min(width-100,selected.x+12)+'px';tooltip.style.top=Math.max(15,selected.y-28)+'px';}
    else tooltip.hidden=true;
  }
  function animate(time) {
    raf=0;if(!visible||document.hidden||!loaded)return;
    const dt=Math.min(.05,(time-(last||time))/1000);last=time;
    const ease=reduced.matches?1:1-Math.exp(-dt*8);
    yaw+=(targetYaw-yaw)*ease;pitch+=(targetPitch-pitch)*ease;paint();
    if(Math.abs(targetYaw-yaw)+Math.abs(targetPitch-pitch)>.005&&!reduced.matches)raf=requestAnimationFrame(animate);
  }
  function schedule(){if(visible&&loaded&&!document.hidden&&!raf){last=0;raf=requestAnimationFrame(animate);}}
  function resize(){
    const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);
    radius=height*.95;cx=width*.58;cy=height*.98;schedule();
  }
  stage.addEventListener('pointermove',event=>{
    const rect=stage.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
    if(!reduced.matches){targetYaw=19+(x/width-.5)*18;targetPitch=18+(y/height-.5)*9;}
    if(!event.target.closest('.network-city')){
      const nearest=points.reduce((best,p)=>{const d=Math.hypot(p.x-x,p.y-y);return d<best.d?{d,name:p.city.name}:best;},{d:17,name:''});hovered=nearest.name;
    }
    schedule();
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{targetYaw=19;targetPitch=18;hovered='';schedule();});
  new ResizeObserver(resize).observe(stage);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){resize();schedule();}else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'120px'});observer.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();});
  reduced.addEventListener('change',()=>{targetYaw=yaw=19;targetPitch=pitch=18;schedule();});
  fetch(new URL('assets/poland-network.json',base)).then(response=>{if(!response.ok)throw Error('Globe data unavailable');return response.json();}).then(data=>{
    countries=data.countries.map(country=>({poland:country.code==='POL',rings:country.rings.map(ring=>ring.map(([lon,lat])=>vector(lon,lat)))}));
    cities=data.cities.map(city=>({...city,v:vector(city.lon,city.lat)}));
    cities.filter(city=>city.label).forEach(city=>{
      const button=document.createElement('button');button.className='network-city network-city-'+city.side;button.type='button';button.textContent=city.name;button.setAttribute('aria-label',city.name+' — zaznacz na półkuli');
      button.addEventListener('pointerenter',()=>{hovered=city.name;schedule();});button.addEventListener('focus',()=>{hovered=city.name;schedule();});button.addEventListener('blur',()=>{hovered='';schedule();});button.addEventListener('click',()=>{hovered=city.name;schedule();});
      labels.set(city.name,button);stage.append(button);
    });
    loaded=true;stage.classList.add('globe-ready');stage.dataset.ready='true';resize();
  }).catch(()=>{stage.dataset.ready='fallback';});
})();
