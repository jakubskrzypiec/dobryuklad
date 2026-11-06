/* Native H.264 scrubber: no hundreds of image decodes on the UI thread. */
(function () {
  'use strict';
  var intro=document.querySelector('.walk-intro');
  if(!intro) return;
  var stage=intro.querySelector('.walk-stage');
  var video=intro.querySelector('.walk-video');
  var poster=intro.querySelector('.hero-photo');
  var opening=intro.querySelector('.walk-opening');
  var hero=intro.querySelector('.hero-left');
  var actions=intro.querySelector('.walk-hero-actions');
  var startButton=intro.querySelector('.walk-start');
  var label=startButton.querySelector('span');
  var retryButton=intro.querySelector('.walk-try');
  var retryInfo=intro.querySelector('.walk-retry-info');
  var reduced=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  var base='assets/entrance-upstairs-v3/';
  var HOLD=2/9, firstFrame=base+'opening-crop.webp', lastFrame=base+'hero-final-crop.webp';
  var forceMotion=false,ready=false,failed=false,initialized=false;
  var start=0,range=1,progress=0,targetTime=0;
  var profile='',timeout=0,raf=0,resizeTimer=0,currentPoster='',phase='';
  function pickProfile(){return innerWidth<=760&&innerHeight>innerWidth?'mobile':'desktop';}
  function setPoster(src){if(currentPoster!==src){currentPoster=src;poster.src=src;}}
  function setPhase(next){
    if(phase===next)return;
    phase=next;intro.dataset.phase=next;
    var isHero=next==='hero'||next==='static';
    intro.classList.toggle('is-at-hero',isHero);
    document.body.classList.toggle('walk-hero',isHero);
    hero.inert=!isHero;actions.inert=!isHero;
    opening.inert=next!=='opening'&&next!=='loading';
    if(isHero){setPoster(lastFrame);stage.classList.remove('has-video-frame');}
    else{setPoster(firstFrame);if(ready&&video.readyState>=2)stage.classList.add('has-video-frame');}
  }
  function showRetry(message,buttonText){
    retryInfo.textContent=message;retryButton.textContent=buttonText;
    retryButton.hidden=false;intro.classList.add('walk-fallback');
  }
  function fallback(reason){
    failed=true;ready=false;clearTimeout(timeout);cancelAnimationFrame(raf);raf=0;
    try{video.pause();}catch(_){}
    document.body.classList.remove('walk-cinematic','walk-preparing','walk-active');
    intro.classList.add('walk-static');intro.classList.remove('walk-loading');
    intro.dataset.walkFailure=reason;
    if(reason==='reduced')showRetry('Na tym urządzeniu włączono ograniczenie ruchu. Możesz uruchomić spacer ręcznie.','Uruchom spacer');
    else if(reason==='unsupported')showRetry('Ta przeglądarka nie obsługuje wideo H.264. Otwórz stronę w Chrome lub Safari.','Spróbuj ponownie');
    else showRetry('Nie udało się wczytać spaceru. Sprawdź połączenie i ponów próbę.','Ponów ładowanie spaceru');
    setPhase('static');measure();
  }
  function measure(){
    start=intro.getBoundingClientRect().top+window.scrollY;
    range=Math.max(1,intro.offsetHeight-stage.offsetHeight);onScroll();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(scrub);}
  function scrub(){
    raf=0;
    if(!ready||failed||document.hidden||video.seeking||!Number.isFinite(video.duration))return;
    // Direct seeks use platform video decoding; FFmpeg encoded a keyframe every six frames.
    if(Math.abs(targetTime-video.currentTime)<1/36)return;
    try{video.currentTime=targetTime;}catch(_){}
  }
  function onScroll(){
    if(failed)return;
    progress=Math.max(0,Math.min(1,(window.scrollY-start)/range));
    var fraction=Math.min(1,progress/(1-HOLD));
    var rect=intro.getBoundingClientRect();
    var active=rect.bottom>0&&rect.top<innerHeight;
    document.body.classList.toggle('walk-active',active);
    document.body.style.setProperty('--walk-header-y',Math.min(0,range-(window.scrollY-start))+'px');
    if(progress>=1-HOLD-.002)setPhase('hero');
    else if(!ready)setPhase('loading');
    else if(fraction<=6/720)setPhase('opening');
    else setPhase('travel');
    if(!ready)return;
    var end=Math.max(0,video.duration-1/24);
    targetTime=Math.min(end,fraction*end);
    if(active)schedule();
  }
  function unlockVideo(){
    if(!video||failed||video.readyState>=2)return;
    // iOS/WebViews can delay preload until a trusted wheel/touch/click gesture.
    var attempt;
    try{attempt=video.play();}catch(_){return;}
    if(attempt&&typeof attempt.then==='function')
      attempt.then(function(){video.pause();schedule();}).catch(function(){});
    else video.pause();
  }
  function mediaReady(){
    if(ready||failed||!video.duration||!Number.isFinite(video.duration))return;
    ready=true;clearTimeout(timeout);
    intro.classList.remove('walk-loading','walk-fallback');
    document.body.classList.remove('walk-preparing');
    label.textContent='Scroll down';
    try{video.pause();}catch(_){}
    phase='';onScroll();
    if(video.readyState>=2&&phase!=='hero')stage.classList.add('has-video-frame');
  }
  function startFilm(){
    clearTimeout(timeout);cancelAnimationFrame(raf);raf=0;
    failed=false;ready=false;
    if(!video||!video.canPlayType||!video.canPlayType('video/mp4; codecs="avc1.42E01E"')){fallback('unsupported');return;}
    if(reduced.matches&&!forceMotion){fallback('reduced');return;}
    initialized=true;
    intro.classList.remove('walk-static','walk-fallback');
    intro.classList.add('walk-loading');
    delete intro.dataset.walkFailure;
    stage.classList.remove('has-video-frame');
    document.body.classList.add('walk-cinematic','walk-preparing');
    label.textContent='Ładowanie spaceru…';setPoster(firstFrame);
    profile=pickProfile();
    video.muted=true;video.playsInline=true;video.preload='auto';
    video.src=base+profile+'/walk.mp4?v=1';
    try{video.load();}catch(_){}
    timeout=setTimeout(function(){
      if(!ready&&!failed)showRetry('Wczytywanie trwa dłużej niż zwykle. Możesz spróbować ponownie.','Ponów ładowanie spaceru');
    },12000);
    phase='';measure();
    if(video.readyState>=2)mediaReady();
  }
  video.addEventListener('loadeddata',mediaReady);
  video.addEventListener('canplay',mediaReady);
  video.addEventListener('seeked',function(){
    if(failed)return;
    if(phase!=='hero'&&video.readyState>=2)stage.classList.add('has-video-frame');
    schedule();
  });
  video.addEventListener('error',function(){if(initialized)fallback('load');});
  video.addEventListener('stalled',function(){
    if(!ready&&!failed)showRetry('Połączenie zwolniło podczas ładowania spaceru.','Ponów ładowanie spaceru');
  });
  startButton.addEventListener('click',function(){
    unlockVideo();
    if(failed){forceMotion=true;intro.classList.add('walk-motion-opt-in');startFilm();return;}
    var to=start+range*(1-HOLD)*.055;
    try{window.scrollTo({top:to,behavior:'smooth'});}catch(_){window.scrollTo(0,to);}
  });
  intro.querySelector('.walk-skip').addEventListener('click',function(){
    if(!ready){fallback('load');return;}
    var to=start+range*(1-HOLD);
    try{window.scrollTo({top:to,behavior:'instant'});}catch(_){window.scrollTo(0,to);}
    setPhase('hero');
  });
  retryButton.addEventListener('click',function(){
    forceMotion=true;intro.classList.add('walk-motion-opt-in');startFilm();unlockVideo();
  });
  addEventListener('wheel',unlockVideo,{passive:true});
  addEventListener('touchstart',unlockVideo,{passive:true});
  addEventListener('pointerdown',unlockVideo,{passive:true});
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(function(){measure();if(!failed&&initialized&&pickProfile()!==profile)startFilm();},150);
  },{passive:true});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){measure();schedule();}});
  addEventListener('pageshow',function(){measure();schedule();});
  if(typeof reduced.addEventListener==='function')
    reduced.addEventListener('change',function(){if(!forceMotion)startFilm();});
  else if(typeof reduced.addListener==='function')
    reduced.addListener(function(){if(!forceMotion)startFilm();});
  startFilm();
})();