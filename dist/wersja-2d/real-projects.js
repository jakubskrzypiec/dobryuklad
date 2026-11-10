(() => {
  const dialog=document.querySelector('#real-project-dialog');
  if(!dialog || typeof dialog.showModal!=='function')return;
  const source=document.querySelector('script[src*="real-projects.js"]');
  const base=new URL('assets/real-projects/',source&&source.src?source.src:document.baseURI);
  const photos=[
    {file:'dom-nowoczesny-01.webp',title:'Salon — strefa wypoczynku'},
    {file:'dom-nowoczesny-02.webp',title:'Komunikacja'},
    {file:'dom-nowoczesny-03.webp',title:'Salon ze schodami'},
    {file:'dom-nowoczesny-04.webp',title:'Salon — detal strefy wypoczynku'},
    {file:'dom-nowoczesny-05.webp',title:'Jadalnia i kuchnia'}
  ];
  const image=dialog.querySelector('#real-project-image');
  const title=dialog.querySelector('#real-project-title');
  const counter=dialog.querySelector('[data-project-counter]');
  let index=0,trigger=null;
  function show(value){
    index=(value+photos.length)%photos.length;
    const photo=photos[index];
    image.src=new URL(photo.file,base).href;
    image.alt='Dom nowoczesny — '+photo.title.toLowerCase()+', autorska wizualizacja studia Dobry Układ';
    title.textContent=photo.title;
    counter.textContent=String(index+1).padStart(2,'0')+' / '+String(photos.length).padStart(2,'0');
  }
  document.querySelectorAll('[data-project-open]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();trigger=link;show(Number(link.dataset.projectOpen));dialog.showModal();
  }));
  dialog.querySelector('[data-project-close]').addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-project-prev]').addEventListener('click',()=>show(index-1));
  dialog.querySelector('[data-project-next]').addEventListener('click',()=>show(index+1));
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'){event.preventDefault();show(index+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();show(index-1);}
  });
  dialog.addEventListener('close',()=>{if(trigger)trigger.focus({preventScroll:true});});
})();
