// Execute com: node check.cjs (sem dependências).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function elemento() {
  return { attrs: {}, events: {}, value: '25', setAttribute(k,v) { this.attrs[k]=v; }, removeAttribute(k) { delete this.attrs[k]; }, addEventListener(k,fn) { this.events[k]=fn; } };
}
const paginas = ['curriculo','projetos','scrum','lin0'].map(id => ({id, hidden:false, querySelector:()=>({focus(){}})}));
const links = paginas.map(({id}) => Object.assign(elemento(),{hash:`#${id}`}));
const ids = Object.fromEntries(['trilha','controle-som','mutar-som','volume','valor-volume','aviso-som','diminuir-volume','aumentar-volume'].map(id=>[id,elemento()]));
const audio = Object.assign(ids.trilha,{paused:true,muted:false,async play(){this.paused=false;},pause(){this.paused=true;}});
const docEvents={}; let hashchange;
const ctx = {document:{body:{dataset:{}},querySelectorAll:s=>s==='.pagina'?paginas:links,getElementById:id=>ids[id],addEventListener:(e,f)=>{docEvents[e]=f;}},location:{hash:'#conteudo'},window:{addEventListener:(e,f)=>{hashchange=f;},scrollTo(){}}};
vm.runInNewContext(fs.readFileSync(`${__dirname}/docs/index.js`,'utf8'),ctx);
(async()=>{
  await Promise.resolve();
  assert.equal(audio.paused,false,'Tentativa de reprodução automática');
  for(const [hash,id] of [['#scrum','scrum'],['#lin0','lin0'],['#projetos','projetos'],['#conteudo','projetos'],['#invalido','curriculo']]){
    ctx.location.hash=hash;hashchange({});
    assert.deepEqual(paginas.filter(p=>!p.hidden).map(p=>p.id),[id]);
    assert.deepEqual(links.filter(l=>l.attrs['aria-current']==='page').map(l=>l.hash),[`#${id}`]);
    assert.equal(ctx.document.body.dataset.pagina,id);
  }
  const click=id=>ids[id].events.click();
  ids.volume.value='70';ids.volume.events.input();assert.equal(audio.volume,.7);
  click('mutar-som');assert.equal(audio.muted,true);assert.equal(audio.volume,.7);
  click('mutar-som');assert.equal(audio.muted,false);
  for(let i=0;i<20;i++)click('aumentar-volume');assert.equal(audio.volume,1);
  for(let i=0;i<20;i++)click('diminuir-volume');assert.equal(audio.volume,0);assert.equal(audio.muted,true);
  click('mutar-som');assert.ok(audio.volume>0);assert.equal(audio.muted,false);
  click('controle-som');assert.equal(audio.paused,true);
  docEvents.pointerdown({target:{closest:()=>null}});assert.equal(audio.paused,true,'Pausa manual não reinicia na navegação');
  await click('controle-som');assert.equal(audio.paused,false);
  click('controle-som');audio.play=async()=>{throw Error('bloqueado');};
  await click('controle-som');assert.match(ids['aviso-som'].textContent,/Não foi possível/);
  assert.equal(ids['controle-som'].attrs['aria-pressed'],'false');
  console.log('OK: quatro páginas, temas, navegação, autoplay, pausa, volume 0–100%, mudo/restauração e falha de áudio.');
})().catch(e=>{console.error(e);process.exitCode=1;});
