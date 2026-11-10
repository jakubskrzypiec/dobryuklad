(() => {
  const allowed=['grid','dots','grain'];
  let selected='grid';
  try{const saved=localStorage.getItem('dobryuklad-background');if(allowed.includes(saved))selected=saved;}catch(_){}
  function apply(value){
    if(!allowed.includes(value))return;
    document.body.dataset.background=value;
    document.querySelectorAll('[data-background-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.backgroundChoice===value)));
    try{localStorage.setItem('dobryuklad-background',value);}catch(_){}
  }
  apply(selected);
  document.querySelectorAll('[data-background-choice]').forEach(button=>button.addEventListener('click',()=>apply(button.dataset.backgroundChoice)));
  const hide=document.querySelector('[data-hide-background-control]');if(hide)hide.addEventListener('click',()=>{document.querySelector('.background-preview-control').hidden=true;});
})();
