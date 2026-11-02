// Import failures also leave a usable classic view instead of an endless loader.
import('./walkthrough.js?v=1').catch(error=>{
 console.error('Could not load the interior preview:',error);
 const status=document.querySelector('.walkthrough-loading');
 if(status){status.hidden=false;status.textContent='Podgląd wnętrza jest niedostępny. Możesz otworzyć klasyczny widok strony.';}
});
