// Cole este arquivo em script.google.com, implante como Aplicativo da Web.
// Executar como: você | Quem tem acesso: Qualquer pessoa.
// O endpoint é SOMENTE LEITURA. Faça as edições no Google Docs original.
const DOC_ID = '145VmYOiV2q1DVNb_8EPpWi0peWxbxS9lBQj45RVUheA';
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function isMoment(t){return /^(entrada (do|dos|da|das|de) |saida (do|dos|da|das|de) |comunhao$|assinatura|ofertorio|salmo|aclamacao|procissao|aliancas$|musica reserva$|pos comunhao|preludio|encerramento)/.test(norm(t))}
function toSongs(text){
 const lines=String(text).replace(/\r/g,'').split('\n');const result=[];let mom=null,body=[];
 function flush(){if(!mom)return;while(body.length&&!body[0].trim())body.shift();while(body.length&&!body[body.length-1].trim())body.pop();if(!body.length)return;
 let head=body.shift().trim(),title=head,artist='';const idx=head.lastIndexOf(' - ');
 if(idx>=0){title=head.slice(0,idx).trim();artist=head.slice(idx+3).trim()}
 if(norm(title)==='serei teu'&&body[0]&&/shalom/i.test(body[0]))artist=body.shift().trim();
 while(body.length&&!body[0].trim())body.shift();result.push({moment:mom,title,artist,text:body.join('\n').replace(/\n{3,}/g,'\n\n')})}
 lines.forEach(line=>{if(isMoment(line.trim())){flush();mom=line.trim();body=[]}else if(mom)body.push(line)});flush();return result;
}
function doGet(e){
 const callback=String((e.parameter&&e.parameter.callback)||'');
 // JSONP for browser access without cross-origin credentials.
 if(!/^[a-zA-Z_$][\w$]*$/.test(callback))return ContentService.createTextOutput('Invalid callback').setMimeType(ContentService.MimeType.TEXT);
 let data;
 try{const text=DocumentApp.openById(DOC_ID).getBody().getText();const songs=toSongs(text);if(songs.length<3)throw Error('Documento sem seções reconhecidas.');data={songs,source:'Google Docs',checkedAt:new Date().toISOString()}}
 catch(err){data={error:String(err.message||err)}}
 const json=JSON.stringify(data).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
