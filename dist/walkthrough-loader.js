// Keep text and links usable on module failure, without substituting a photograph.
import('./walkthrough.js?v=courtyard-6').catch(error=>{
 console.error('Could not load the interior preview:',error);
 document.body.classList.remove('walkthrough-active');
 const stage=document.querySelector('.walkthrough-stage');if(stage)stage.style.setProperty('--photo-reveal','1');
 const status=document.querySelector('.walkthrough-loading');if(status)status.hidden=true;
});
