/* Pure MIME helpers shared by the contact form and its validation checks. */
(function(root){
  const recipient='dobryuklad.koszalin@gmail.com';
  function base64(bytes){let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);return btoa(binary);}
  const encode=text=>base64(new TextEncoder().encode(text));
  const wrap=value=>(value.match(/.{1,76}/g)||[]).join('\r\n');
  function message(fields){const value=(key,fallback='Do ustalenia')=>String(fields[key]||fallback);return `Dzień dobry,\n\n${value('message','')}\n\nImię i nazwisko: ${value('name')}\nE-mail: ${value('email')}\nTelefon: ${value('phone','Nie podano')}\nLokalizacja: ${value('location')}\nTyp inwestycji: ${value('type')}\nPowierzchnia: ${fields.area?value('area')+' m²':'Do ustalenia'}\nZakres współpracy: ${value('scope')}\nPlanowany termin: ${value('date')}`;}
  function draft(fields,files,boundary='dobry-uklad-'+Date.now()){
    const lines=['X-Unsent: 1','To: '+recipient,'Reply-To: '+String(fields.email||'').replace(/[\r\n]/g,''),'Subject: =?UTF-8?B?'+encode('Zapytanie o projekt wnętrza')+'?=','MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(encode(message(fields)))];
    files.forEach(file=>{const name=encodeURIComponent(file.name.replace(/[\r\n]/g,'')).replace(/'/g,'%27');lines.push('--'+boundary,'Content-Type: '+file.type,'Content-Disposition: attachment; filename*=UTF-8\'\''+name,'Content-Transfer-Encoding: base64','',wrap(base64(file.bytes)));});
    lines.push('--'+boundary+'--','');return lines.join('\r\n');
  }
  const api={recipient,message,draft};if(typeof module==='object'&&module.exports)module.exports=api;else root.ContactDraft=api;
})(typeof window!=='undefined'?window:globalThis);
