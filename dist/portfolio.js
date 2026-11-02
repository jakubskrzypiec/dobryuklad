/* Placeholder galleries: filters, search, and navigation without fabricated project data. */
const normalizePortfolioText=value=>value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/ł/g,'l');
document.querySelectorAll('[data-gallery]').forEach(gallery=>{
  const buttons=[...gallery.querySelectorAll('[data-gallery-filter]')];
  const style=gallery.querySelector('[data-gallery-style]');
  const search=gallery.querySelector('[data-gallery-search]');
  const cards=[...gallery.querySelectorAll('.gallery-card')];
  const grid=gallery.querySelector('.gallery-grid');
  const result=gallery.querySelector('[data-gallery-result]');
  const empty=gallery.querySelector('[data-gallery-empty]');
  let category='all';
  function update(){
    const query=normalizePortfolioText(search?.value.trim()||'');
    let visible=0;
    cards.forEach(card=>{
      const matches=(category==='all'||card.dataset.category===category)&&(!style||style.value==='all'||card.dataset.style===style.value)&&(!query||normalizePortfolioText(card.dataset.search).includes(query));
      card.hidden=!matches;if(matches)visible++;
    });
    grid.classList.toggle('is-filtered',category!=='all'||(style&&style.value!=='all')||!!query);
    empty.hidden=visible>0;
    const noun=document.body.dataset.portfolioKind==='realizacje'?(visible===1?'realizację':'realizacje'):(visible===1?'projekt':'projekty');
    const countLabel=visible===1?'miejsce':visible>=2&&visible<=4?'miejsca':'miejsc';
    result.textContent=`${visible} ${countLabel} na ${noun}`;
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.galleryFilter;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));
  style?.addEventListener('change',update);search?.addEventListener('input',update);update();
});
if(document.querySelector('[data-detail-title]')){
  const params=new URLSearchParams(location.search);
  const kind=params.get('typ')==='realizacje'?'realizacje':'projekty';
  const max=kind==='realizacje'?3:8;
  const raw=params.get('nr')||'1';
  const number=/^\d{1,2}$/.test(raw)?Math.min(max,Math.max(1,Number(raw))):1;
  const title=(kind==='realizacje'?'Realizacja ':'Projekt ')+String(number).padStart(2,'0');
  document.querySelector('[data-detail-title]').textContent=title;
  document.title=title+' — DOBRY UKŁAD';
  document.querySelectorAll('[data-detail-gallery]').forEach(link=>{link.href=kind+'.html';if(link.closest('.portfolio-breadcrumb'))link.textContent=kind==='realizacje'?'Realizacje':'Projekty';});
  const prev=document.querySelector('[data-detail-prev]'),next=document.querySelector('[data-detail-next]');
  prev.href=`projekt.html?typ=${kind}&nr=${number===1?max:number-1}`;
  next.href=`projekt.html?typ=${kind}&nr=${number===max?1:number+1}`;
  if(kind==='realizacje'){prev.textContent='Poprzednia realizacja';next.textContent='Następna realizacja';}
}
