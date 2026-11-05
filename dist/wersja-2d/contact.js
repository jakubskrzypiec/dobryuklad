const inquiry=document.querySelector('#project-inquiry');
if(inquiry){
 const input=inquiry.querySelector('#inquiry-files'),list=inquiry.querySelector('#attachment-list'),error=inquiry.querySelector('#attachment-error'),status=inquiry.querySelector('#inquiry-status'),button=inquiry.querySelector('[type="submit"]');
 const selectedScope=new URLSearchParams(location.search).get('zakres');
 const scopeField=inquiry.querySelector('[name=scope]');
 if([...scopeField.options].some(option=>option.value===selectedScope))scopeField.value=selectedScope;
 let files=[];
 const mime={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
 function render(){list.replaceChildren();files.forEach((file,index)=>{const li=document.createElement('li'),text=document.createElement('span'),remove=document.createElement('button');text.textContent=file.name+' · '+(file.size/1024/1024).toFixed(1)+' MB';remove.type='button';remove.textContent='Usuń';remove.setAttribute('aria-label','Usuń załącznik: '+file.name);remove.addEventListener('click',()=>{files.splice(index,1);render();});li.append(text,remove);list.append(li);});}
 input.addEventListener('change',()=>{error.textContent='';const selected=[...input.files];input.value='';if(!selected.length)return;const next=[...files,...selected];let problem='';if(next.length>5)problem='Możesz dołączyć maksymalnie 5 plików.';else if(next.some(f=>!mime[f.name.split('.').pop().toLowerCase()]))problem='Wybierz pliki PDF, JPG, PNG lub WEBP.';else if(next.some(f=>f.size>5*1024*1024))problem='Pojedynczy plik może mieć maksymalnie 5 MB.';else if(next.reduce((sum,f)=>sum+f.size,0)>15*1024*1024)problem='Łączny rozmiar załączników nie może przekroczyć 15 MB.';if(problem){error.textContent=problem;return;}files=next;status.textContent='';render();});
 inquiry.addEventListener('submit',async event=>{
   event.preventDefault();if(!inquiry.reportValidity())return;button.disabled=true;status.textContent='Przygotowujemy wiadomość…';
   try{const fields=Object.fromEntries(new FormData(inquiry));const body=ContactDraft.message(fields);
    if(files.length||body.length>1600){const attachments=await Promise.all(files.map(async file=>({name:file.name,type:mime[file.name.split('.').pop().toLowerCase()],bytes:new Uint8Array(await file.arrayBuffer())})));const blob=new Blob([ContactDraft.draft(fields,attachments)],{type:'message/rfc822'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Dobry-Uklad-zapytanie.eml';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='Szkic wiadomości jest gotowy. Otwórz pobrany plik „Dobry-Uklad-zapytanie.eml” w aplikacji pocztowej, sprawdź treść i załączniki, a następnie wyślij. Wiadomość nie została jeszcze wysłana.';}
    else{location.href='mailto:'+ContactDraft.recipient+'?subject='+encodeURIComponent('Zapytanie o projekt wnętrza')+'&body='+encodeURIComponent(body);status.textContent='Wiadomość jest gotowa do otwarcia w Twojej poczcie. Sprawdź ją i wyślij w aplikacji pocztowej. Jeśli aplikacja się nie otworzyła, napisz bezpośrednio na adres studia podany obok.';}
    status.focus();
   }catch{status.textContent='Nie udało się przygotować wiadomości. Spróbuj ponownie lub napisz bezpośrednio na adres studia.';}finally{button.disabled=false;}
 });
 button.disabled=false;
}
