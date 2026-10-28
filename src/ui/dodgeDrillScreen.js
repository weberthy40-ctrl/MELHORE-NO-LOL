import { createSession } from '../training/session.js';
import { createTechnicalDodge } from '../training/dodge/technicalDodge.js';
import { dodgeFocusProfile } from '../training/dodge/focus.js';
import { mountDodgeReady } from './dodgeReady.js';
import { element,link } from './elements.js';

/** A finite practice series; no repository, score or placement service is available here. */
export function mountDodgeDrill({screen,core,loadPreview=()=>import('../game3d/mountPreview.js')}){
 const document=screen.ownerDocument,host=element(document,'section','dodge-drill');screen.append(host);
 let active=true,revision=0,current;
 function clean(){revision++;const old=current;current=null;old?.unsubscribe?.();old?.ready?.dispose();old?.preview?.dispose();old?.exercise.dispose();old?.session.dispose();}
 function setup(){
  clean();const token=revision;
  const session=createSession({countdown:0,timeLimit:45,events:core.events,metadata:{origin:'dodge-drill',focus:'sidestep',level:5}});
  const exercise=createTechnicalDodge({level:5,profile:dodgeFocusProfile(5,'sidestep'),events:core.events,attemptId:session.snapshot().id,isRunning:()=>session.snapshot().state==='running'});
  const status=element(document,'p','dodge-drill-status','Preparando série…'),controls=element(document,'div','drill-controls'),stage=element(document,'div','stage'),result=element(document,'section','dodge-drill-result');result.hidden=true;
  const goal=element(document,'p','drill-goal','Cruze a menor largura do feixe durante o aviso. Evite correr ao longo dele. 45 s · padrão fixo de nível 5 · sem eliminação por contatos.');
  const pause=element(document,'button','button','Pausar');pause.type='button';pause.disabled=true;
  controls.append(status,pause,link(document,'Sair da série','/train/dodge','button'));host.replaceChildren(goal,controls,stage,result);
  const state=current={session,exercise};let completed=false;
  function update(){
   if(!active||token!==revision)return;
   const s=session.snapshot(),m=exercise.snapshot();
   status.textContent=`${s.state==='idle'?'Pronto':s.state==='paused'?'Pausado':s.state==='completed'?'Concluído':'Em execução'} · ${s.elapsed.toFixed(1)} / 45 s · ${m.avoided} ameaças evitadas · ${m.impacts} contatos`;
   pause.disabled=s.state==='idle';pause.textContent=s.state==='paused'?'Retomar':'Pausar';
   if(!completed&&s.elapsed>=45){
    completed=true;session.finish('drill-time');pause.hidden=true;
    result.hidden=false;result.tabIndex=-1;
    result.append(element(document,'span','eyebrow','SÉRIE TÉCNICA CONCLUÍDA'),element(document,'h2','','Saída lateral do feixe'),element(document,'p','record-value',`${m.avoided} ameaças evitadas · ${m.impacts} contatos`),element(document,'p','muted',`45 segundos ativos · ${m.shots} feixes lançados. Nem todo feixe lançado representa uma ameaça resolvida contra você.`),element(document,'p','status-note',m.impacts?'Na próxima série, observe o aviso e atravesse a largura do feixe antes do contato.':'Repita buscando passos curtos e uma posição segura; esta série não comprova domínio do padrão.'),element(document,'p','muted','Prática temporária: não gera nota, pontos ou histórico e não altera seu nível Normal.'));
    const repeat=element(document,'button','button primary','Repetir série');repeat.type='button';repeat.addEventListener('click',()=>{if(active&&token===revision)setup();});result.append(repeat,link(document,'Voltar à esquiva','/train/dodge','button'));result.focus();
   }
  }
  pause.addEventListener('click',()=>{if(!active||token!==revision)return;if(session.snapshot().state==='paused'){session.resume();stage.querySelector('canvas')?.focus({preventScroll:true});}else session.pause();update();});
  state.unsubscribe=core.events.on('session:changed',s=>{if(s.id===session.snapshot().id)update();});
  state.ready=mountDodgeReady({screen,stage,session,title:'Série técnica · saída lateral',onStart:update});
  function failure(error){if(!active||token!==revision)return;core.errors.report(error,{source:'dodge.drill'});clean();host.replaceChildren(element(document,'p','status-note','Série interrompida. Nenhum resultado foi atribuído.'),link(document,'Voltar à esquiva','/train/dodge','button'));}
  Promise.resolve().then(loadPreview).then(({mountPreview})=>{
   if(!active||token!==revision)return;
   const preview=mountPreview(stage,{session,exercise,events:core.events,onTick:update,onError:failure});
   if(!active||token!==revision){preview.dispose();return;}state.preview=preview;update();
  }).catch(failure);
 }
 setup();return {dispose(){if(!active)return;active=false;clean();host.remove();}};
}
