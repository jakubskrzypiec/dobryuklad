// A module or GPU failure leaves the complete photographic hero usable.
import('./walkthrough.js?v=hero-2').catch(error=>{
 console.error('Could not load the interior preview:',error);
 document.body.classList.remove('walkthrough-active');
 const status=document.querySelector('.walkthrough-loading');if(status)status.hidden=true;
});
