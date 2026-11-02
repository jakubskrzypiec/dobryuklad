const shopFilters=[...document.querySelectorAll('[data-shop-filter]')];
const shopCards=[...document.querySelectorAll('[data-product-category]')];
function filterShop(category){
  shopFilters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shopFilter===category)));
  shopCards.forEach(card=>{card.hidden=category!=='all'&&!card.dataset.productCategory.split(' ').includes(category);});
  document.querySelectorAll('[data-shop-group]').forEach(group=>{group.hidden=![...group.querySelectorAll('[data-product-category]')].some(card=>!card.hidden);});
  const editorial=document.querySelector('.shop-editorial');
  if(editorial)editorial.hidden=category!=='all';
  const total=shopCards.filter(card=>!card.hidden).length;
  const status=document.querySelector('[data-shop-result]');
  if(status)status.textContent=`${total} ${total===1?'produkt':total>=2&&total<=4?'produkty':'produktów'}`;
}
shopFilters.forEach(button=>button.addEventListener('click',()=>filterShop(button.dataset.shopFilter)));
document.querySelector('[data-show-publications]')?.addEventListener('click',()=>filterShop('all'));
