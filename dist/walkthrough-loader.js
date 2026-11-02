// Keep text and links usable on module failure, without substituting a photograph.
import('./walkthrough.js?v=smooth-4').catch(error=>{
 console.error('Could not load the interior preview:',error);
 document.body.classList.remove('walkthrough-active');
 const status=document.querySelector('.walkthrough-loading');if(status)status.hidden=true;
});
