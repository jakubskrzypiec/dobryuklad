/* Dobry Układ: continuous scroll-controlled playback, without per-frame seeking. */
(function(){
  'use strict';
  var intro=document.querySelector('.walk-intro');
  if(!intro)return;
  var stage=intro.querySelector('.walk-stage');
  var forward=intro.querySelector('.walk-forward');
  var reverse=intro.querySelector('.walk-reverse');
  var poster=intro.querySelector('.hero-photo');
  var opening=intro.querySelector('.walk-opening');
  var hero=intro.querySelector('.hero-left');
  var actions=intro.querySelector('.walk-hero-actions');
  var startButton=intro.querySelector('.walk-start');
  var label=startButton.querySelector('span');
  var retryButton=intro.querySelector('.walk-try');
  var retryInfo=intro.querySelector('.walk-retry-info');
  var reduced=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  var BASE='assets/entrance-upstairs-v3/', HOLD=2/9;
  var firstFrame=BASE+'opening-crop.webp',lastFrame=BASE+'hero-final-crop.webp';
  var motionOptIn=false,ready=false,failed=false,initialized=false;
  var active=forward,direction=1,profile='',pendingDirection=0,swapId=0;
  var start=0,range=1,targetTime=0,duration=30,raf=0,timeout=0,resizeTimer=0,phase='',currentPoster='';
  var scrollActive=false;
  function pickProfile(){return innerWidth<=760&&innerHeight>innerWidth?'mobile':'desktop';}
  function clamp(n,lo,hi){return Math.max(lo,Math.min(hi,n));}
  function setPoster(src){if(currentPoster!==src){currentPoster=src;poster.src=src;}}
  function endTime(){return Math.max(0,duration-1/24);}
  function timeline(){return clamp(direction===1?active.currentTime:endTime()-active.currentTime,0,endTime());}
  function pauseAll(){forward.pause();reverse.pause();}
  function schedule(){if(!raf)raf=requestAnimationFrame(tick);}
  function setPhase(next){
    if(phase===next)return;
    phase=next;intro.dataset.phase=next;
    var isHero=next==='hero'||next==='static';
    intro.classList.toggle('is-at-hero',isHero);
    document.body.classList.toggle('walk-hero',isHero);
    hero.inert=!isHero;actions.inert=!isHero;
    opening.inert=next!=='opening'&&next!=='loading';
    if(isHero){
      pauseAll();setPoster(lastFrame);stage.classList.remove('has-video-frame');
    }else{
      setPoster(firstFrame);
      if(ready&&active.readyState>=2)stage.classList.add('has-video-frame');
    }
  }
  function showRetry(message,buttonText){
    retryInfo.textContent=message;retryButton.textContent=buttonText;
    retryButton.hidden=false;intro.classList.add('walk-fallback');
  }
  function fallback(reason){
    failed=true;ready=false;swapId++;pendingDirection=0;
    clearTimeout(timeout);cancelAnimationFrame(raf);raf=0;pauseAll();
    document.body.classList.remove('walk-cinematic','walk-preparing','walk-active');
    intro.classList.add('walk-static');intro.classList.remove('walk-loading');
    intro.dataset.walkFailure=reason;
    if(reason==='reduced')showRetry('Na tym urządzeniu włączono ograniczenie ruchu. Spacer możesz uruchomić ręcznie.','Uruchom spacer');
    else if(reason==='unsupported')showRetry('Ta przeglądarka nie obsługuje spaceru MP4. Spróbuj w Chrome lub Safari.','Spróbuj ponownie');
    else showRetry('Nie udało się załadować spaceru. Sprawdź internet i ponów próbę.','Ponów ładowanie spaceru');
    setPhase('static');measure();
  }
  function measure(){
    start=intro.getBoundingClientRect().top+scrollY;
    range=Math.max(1,intro.offsetHeight-stage.offsetHeight);
    onScroll();
  }
  function activeOnScreen(){
    var rect=intro.getBoundingClientRect();
    return rect.bottom>0&&rect.top<innerHeight;
  }
  function onScroll(){
    if(failed)return;
    var p=clamp((scrollY-start)/range,0,1);
    var fraction=clamp(p/(1-HOLD),0,1);
    scrollActive=activeOnScreen();
    document.body.classList.toggle('walk-active',scrollActive);
    document.body.style.setProperty('--walk-header-y',Math.min(0,range-(scrollY-start))+'px');
    targetTime=fraction*endTime();
    var wasHero=phase==='hero';
    if(p>=1-HOLD-.002)setPhase('hero');
    else if(!ready)setPhase('loading');
    else if(fraction<=6/720)setPhase('opening');
    else setPhase('travel');
    if(!ready)return;
    if(phase==='hero'){pauseAll();return;}
    // Leaving the final poster: a single seek restores the correct position.
    // Never seek continuously while scroll events arrive.
    if(wasHero&&Math.abs(targetTime-timeline())>2){
      pauseAll();
      try{active.currentTime=clamp(direction===1?targetTime:endTime()-targetTime,0,endTime());}catch(_){}
    }
    if(scrollActive)schedule();
  }
  function loadReverse(){
    if(reverse.getAttribute('src'))return;
    reverse.preload='metadata';
    reverse.src=BASE+profile+'/walk-reverse.mp4?v=2';
    reverse.load();
  }
  function play(media){
    if(!media.paused)return;
    var promise;
    try{promise=media.play();}catch(_){return;}
    if(promise&&typeof promise.catch==='function')promise.catch(function(){});
  }
  function switchDirection(wanted){
    if(pendingDirection||wanted===direction||failed)return;
    pendingDirection=wanted;
    var token=++swapId;
    var from=active;
    var next=wanted===1?forward:reverse;
    var at=timeline();
    from.pause();
    if(next===reverse)loadReverse();
    function settle(){
      if(token!==swapId||failed||pendingDirection!==wanted)return;
      if(next.readyState<2||next.seeking){
        next.addEventListener('seeked',settle,{once:true});
        next.addEventListener('loadeddata',settle,{once:true});
        return;
      }
      from.classList.remove('is-current');
      next.classList.add('is-current');
      active=next;direction=wanted;pendingDirection=0;
      if(phase!=='hero')stage.classList.add('has-video-frame');
      schedule();
    }
    function position(){
      if(token!==swapId||failed)return;
      if(!Number.isFinite(next.duration)||next.duration<=0){
        next.addEventListener('loadedmetadata',position,{once:true});
        return;
      }
      var seek=clamp(wanted===1?at:endTime()-at,0,Math.max(0,next.duration-1/24));
      if(Math.abs(next.currentTime-seek)>0.085){
        try{next.currentTime=seek;}catch(_){next.addEventListener('canplay',position,{once:true});return;}
      }
      settle();
    }
    position();
  }
  function tick(){
    raf=0;
    if(failed||!ready||document.hidden||!scrollActive||phase==='hero')return;
    if(pendingDirection)return;
    var difference=targetTime-timeline();
    var distance=Math.abs(difference);
    // Deadband prevents repeated direction switches at the target.
    if(distance<=.13){
      active.pause();
      return;
    }
    var wanted=difference>0?1:-1;
    if(wanted!==direction){
      if(distance>.25)switchDirection(wanted);
      else active.pause();
      return;
    }
    if(active.seeking||active.readyState<2){
      active.pause();schedule();return;
    }
    // While the user scrolls, advance by decoding *every* video frame normally.
    // Seeking on every animation frame was the cause of slide-like jumps.
    var rate=clamp(.6+distance*1.3,.65,2.6);
    try{active.playbackRate=rate;}catch(_){active.playbackRate=1;}
    play(active);
    schedule();
  }
  function unlockVideo(){
    if(failed||!ready)return;
    if(active.paused&&phase!=='hero'&&Math.abs(targetTime-timeline())>.14)play(active);
  }
  function mediaReady(){
    if(ready||failed||!Number.isFinite(forward.duration)||forward.duration<=0)return;
    duration=forward.duration;ready=true;clearTimeout(timeout);
    intro.classList.remove('walk-loading','walk-fallback');
    document.body.classList.remove('walk-preparing');
    label.textContent='Scroll down';
    active=forward;direction=1;pendingDirection=0;
    forward.classList.add('is-current');reverse.classList.remove('is-current');
    pauseAll();phase='';onScroll();schedule();
    if(phase!=='hero'&&forward.readyState>=2)stage.classList.add('has-video-frame');
    loadReverse();
  }
  function startFilm(){
    clearTimeout(timeout);cancelAnimationFrame(raf);raf=0;swapId++;
    pendingDirection=0;ready=false;failed=false;pauseAll();
    if(!forward||!reverse||!forward.canPlayType||!forward.canPlayType('video/mp4; codecs="avc1.42E01E"')){
      fallback('unsupported');return;
    }
    if(reduced.matches&&!motionOptIn){fallback('reduced');return;}
    initialized=true;
    intro.classList.remove('walk-static','walk-fallback');
    intro.classList.add('walk-loading');
    delete intro.dataset.walkFailure;
    stage.classList.remove('has-video-frame');
    document.body.classList.add('walk-cinematic','walk-preparing');
    label.textContent='Ładowanie spaceru…';setPoster(firstFrame);
    profile=pickProfile();active=forward;direction=1;phase='';
    [forward,reverse].forEach(function(v){
      v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');
      v.pause();v.removeAttribute('src');v.load();
    });
    forward.preload='auto';reverse.preload='none';
    forward.src=BASE+profile+'/walk.mp4?v=2';
    forward.load();
    timeout=setTimeout(function(){
      if(!ready&&!failed)showRetry('Wczytywanie trwa dłużej niż zwykle. Spróbuj ponownie.','Ponów ładowanie spaceru');
    },12000);
    measure();
    if(forward.readyState>=2)mediaReady();
  }
  forward.addEventListener('loadeddata',mediaReady);
  forward.addEventListener('canplay',mediaReady);
  forward.addEventListener('error',function(){if(initialized&&!failed)fallback('load');});
  reverse.addEventListener('error',function(){
    // Failure to load the optional reverse clip must not discard the entire walk.
    if(pendingDirection===-1){pendingDirection=0;swapId++;schedule();}
  });
  [forward,reverse].forEach(function(media){
    media.addEventListener('seeked',function(){if(!failed)schedule();});
    media.addEventListener('waiting',function(){if(!failed&&ready)schedule();});
  });
  startButton.addEventListener('click',function(){
    if(failed){motionOptIn=true;intro.classList.add('walk-motion-opt-in');startFilm();return;}
    unlockVideo();
    var to=start+range*(1-HOLD)*.055;
    try{window.scrollTo({top:to,behavior:'smooth'});}catch(_){window.scrollTo(0,to);}
  });
  intro.querySelector('.walk-skip').addEventListener('click',function(){
    var to=start+range*(1-HOLD);
    try{window.scrollTo({top:to,behavior:'instant'});}catch(_){window.scrollTo(0,to);}
    setPhase('hero');
  });
  retryButton.addEventListener('click',function(){
    motionOptIn=true;intro.classList.add('walk-motion-opt-in');
    startFilm();
  });
  addEventListener('wheel',unlockVideo,{passive:true});
  addEventListener('touchstart',unlockVideo,{passive:true});
  addEventListener('pointerdown',unlockVideo,{passive:true});
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(function(){measure();if(!failed&&initialized&&pickProfile()!==profile)startFilm();},150);
  },{passive:true});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden)pauseAll();else{measure();schedule();}
  });
  addEventListener('pageshow',function(){measure();schedule();});
  if(typeof reduced.addEventListener==='function')
    reduced.addEventListener('change',function(){if(!motionOptIn)startFilm();});
  else if(typeof reduced.addListener==='function')
    reduced.addListener(function(){if(!motionOptIn)startFilm();});
  startFilm();
})();