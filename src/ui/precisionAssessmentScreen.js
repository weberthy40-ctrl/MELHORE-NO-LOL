import { createPrecisionAssessmentFlow,createPrecisionDiagnosticResult,calculatePrecisionGuidedAssessment } from '../training/assessment/precisionAssessment.js';
import { createPrecisionPractice,PRECISION_VARIANTS } from '../training/precision/practice.js';
import { createSession } from '../training/session.js';
import { createRandom } from '../core/random.js';
import { element,link } from './elements.js';
/** No official score or repository is available to this transient diagnostic. */
export function mountPrecisionAssessment({screen,core,loadPreview=()=>import('../game3d/mountPreview.js')}){
 const document=screen.ownerDocument,window=document.defaultView,host=element(document,'section','assessment');screen.append(host);
 const flow=createPrecisionAssessmentFlow();let active=true,revision=0,round=null;
 function button(text,action){const b=element(document,'button','button',text);b.type='button';b.addEventListener('click',action);return b;}
 function clean(){revision++;round?.preview?.dispose();round?.practice.dispose();round?.session.dispose();round=null;}
 function footer(){const actions=element(document,'div','actions');actions.append(button('Refazer avaliação',()=>{clean();flow.reset();intro();}),link(document,'Voltar ao menu','/','button'));return actions;}
 function intro(){host.replaceChildren(element(document,'p','lead','Três rodadas de 20 segundos ativos com uma sequência mista de alvos. Dificuldades 2, 5 e 8: tamanho, velocidade e pressão mudam com o nível. Esquerdo acerta; ESC pausa. Os resultados ficam apenas nesta visita.'),button('Iniciar avaliação',()=>{if(flow.start())begin();}));}
 function failure(error){if(!active)return;core.errors.report(error,{source:'assessment.precision'});clean();flow.fail();host.replaceChildren(element(document,'p','status-note','Avaliação interrompida. Não foi possível sugerir um nível.'),footer());}
 function summary(){
  const s=flow.snapshot(),completed=s.state==='completed';host.replaceChildren(element(document,'h2','',completed?'Resultado da avaliação — Precisão de Clique':`Resumo da tentativa ${s.results.length} de 3`));
  const result=completed?calculatePrecisionGuidedAssessment(s.results):null;
  for(const r of result?.perAttempt.length?result.perAttempt:s.results)host.append(element(document,'p','muted',`Tentativa ${r.index} · ${PRECISION_VARIANTS[r.variant].label} · Dificuldade ${r.level} · ${r.activeSeconds} s · ${r.hits} acertos · ${r.misses} erros · ${r.clicksEligible} cliques · Precisão: ${r.accuracy===null?'—':(r.accuracy*100).toFixed(1)+'%'}${r.qi===undefined||r.qi===null?'':` · Nota diagnóstica: ${r.qi}/100`}`));
  if(completed){
   if(result.status==='recommended')host.append(element(document,'p','record-value',`Nível inicial sugerido para treino: ${result.recommendedStartingLevel}/10`),link(document,'Treinar nesse nível',`/train/precision/${result.recommendedStartingLevel}`,'button'));
   else host.append(element(document,'p','status-note',`Não foi possível sugerir um nível. ${result.reason}`));
   host.append(element(document,'p','status-note','Sugestão provisória baseada em três testes curtos de 20 segundos; não altera seu nível pessoal no Perfil. Notas diagnósticas, separadas dos scores oficiais de 60 segundos.'));
  }else host.append(button('Próxima tentativa',()=>{if(flow.next())begin();}));host.append(footer());
 }
 function begin(){
  clean();const token=revision,{index,preset}=flow.snapshot(),session=createSession({timeLimit:20,events:core.events,metadata:{origin:'diagnostic',modality:'precision',index,...preset}});let movement;
  const practice=createPrecisionPractice({...preset,events:core.events,attemptId:session.snapshot().id,rng:createRandom(window.crypto.getRandomValues(new Uint32Array(1))[0]),playerPosition:()=>movement?.snapshot().position??{x:0,z:0}});
  const status=element(document,'p','muted','Preparando arena...'),stage=element(document,'div','stage'),pause=button('Pausar',()=>{if(session.snapshot().state==='paused')session.resume();else session.pause();});pause.disabled=true;
  const cancel=button('Cancelar avaliação',()=>{clean();flow.cancel();host.replaceChildren(element(document,'p','muted','Avaliação cancelada. Nenhum diagnóstico foi salvo.'),footer());});
  host.replaceChildren(element(document,'h2','',`Precisão de Clique · Avaliação · Tentativa ${index}/3 · Dificuldade ${preset.level}`),status,pause,cancel,stage);round={session,practice};
  function update(){
   if(!active||token!==revision)return;const s=session.snapshot(),p=practice.snapshot();if(s.state==='running')flow.running();
   status.textContent=`${s.state==='countdown'?`Começar em ${Math.ceil(s.countdown-s.preparation)}`:s.state==='paused'?'Pausado':`Restam ${(20-s.elapsed).toFixed(1)} s`} · ${p.hits} acertos · ${p.misses} erros · ${p.clicksEligible} cliques · Precisão: ${p.accuracy===null?'—':(p.accuracy*100).toFixed(1)+'%'}`;pause.textContent=s.state==='paused'?'Retomar':'Pausar';
   if(s.state==='running'&&s.elapsed>=20){practice.stop();session.finish('diagnostic-time');const result=createPrecisionDiagnosticResult({session,practice,index});if(!flow.finishRound(result))throw new Error('Invalid diagnostic transition.');clean();summary();}
  }
  const report=error=>{if(active&&token===revision)failure(error);};
  Promise.resolve().then(loadPreview).then(({mountPreview})=>{
   if(!active||token!==revision)return;const preview=mountPreview(stage,{events:core.events,session,exercise:practice,onTick:update,onError:report});if(!active||token!==revision){preview.dispose();return;}round.preview=preview;movement=preview.movement;
   if(!practice.start())throw new Error('No visible diagnostic target.');session.start();pause.disabled=false;update();
  }).catch(report);
 }
 intro();return {dispose(){if(!active)return;active=false;clean();flow.cancel();host.remove();}};
}
