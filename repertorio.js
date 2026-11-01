// Node.js 18+ Netlify Function, no dependencies. Reads the public Google Doc as .txt.
const DOC_ID='145VmYOiV2q1DVNb_8EPpWi0peWxbxS9lBQj45RVUheA';
function normalize(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function isMoment(line){
  const s=normalize(line);
  return /^(entrada (do|dos|da|das|de) |saida (do|dos|da|das|de) |comunhao$|assinatura|ofertorio|salmo|aclamacao|procissao|aliancas$|musica reserva$|pos comunhao|preludio|encerramento)/.test(s);
}
function parseDocument(text){
  const lines=String(text).replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
  const songs=[];let curr=null;let raw=[];
  const flush=()=>{
    if(!curr)return;
    while(raw.length&&!raw[0].trim())raw.shift();
    while(raw.length&&!raw[raw.length-1].trim())raw.pop();
    if(!raw.length)return;
    let header=raw.shift().trim();let title=header,artist='';
    if(header.includes(' - ')){const idx=header.lastIndexOf(' - ');title=header.slice(0,idx).trim();artist=header.slice(idx+3).trim()}
    // Serei Teu uses a standalone artist line.
    if(normalize(title)==='serei teu'&&raw[0]&&/shalom/i.test(raw[0]))artist=raw.shift().trim();
    while(raw.length&&!raw[0].trim())raw.shift();
    const lyric=raw.join('\n').replace(/\n{3,}/g,'\n\n');
    songs.push({moment:curr,title,artist,text:lyric});
  };
  for(const line of lines){if(isMoment(line.trim())){flush();curr=line.trim();raw=[]}else if(curr)raw.push(line)}flush();
  if(songs.length<3)throw Error('Estrutura do Google Docs não reconhecida.');
  return songs;
}
exports.handler=async ()=>{
  try{
    const url='https://docs.google.com/document/d/'+DOC_ID+'/export?format=txt';
    const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; MusicRepertoire/1.0)'}});
    if(!response.ok)throw Error('Google Docs respondeu '+response.status+'. O documento precisa estar acessível para leitura por link.');
    const content=await response.text();
    if(/^\s*<!doctype html|^\s*<html/i.test(content))throw Error('Google Docs retornou uma página de autenticação.');
    const songs=parseDocument(content);
    return {statusCode:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=30'},body:JSON.stringify({songs,source:'Google Docs',checkedAt:new Date().toISOString()})};
  }catch(err){return {statusCode:502,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify({error:err.message})}}
};
// Export parser for unit tests.
exports.parseDocument=parseDocument;
