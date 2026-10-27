import { saveDodgeAssessment } from '../progression/dodgePlacement.js';
import { MAX_DODGE_LEVEL } from '../training/dodge/constants.js';
import { createDodgeAssessmentFlow,calculateDodgeGuidedAssessment,DIAGNOSTIC_VERSION } from '../training/assessment/dodgeAssessment.js';
import { createSession } from '../training/session.js';
import { createDodgeMode } from '../training/dodge/mode.js';
import { createDodgeTelemetry } from '../training/dodge/telemetry.js';
import { createTechnicalDodge } from '../training/dodge/technicalDodge.js';
import { createRandom } from '../training/dodge/random.js';
import { element,link } from './elements.js';
import { formatDuration } from './formatters.js';
/** Dedicated in-memory flow. No repository or official scoring is available here. */
export function mountDodgeAssessment({screen,core,loadPreview=()=>import('../game3d/mountPreview.js')}){
 const document=screen.ownerDocument,window=document.defaultView,host=element(document,'section','assessment');screen.append(host);
 const flow=createDodgeAssessmentFlow();let active=true,revision=0,round=null;
 function button(text,action){const b=element(document,'button','button',text);b.type='button';b.addEventListener('click',action);return b;}
 function cleanupRound(){revision++;if(!round)return;round.preview?.dispose();round.unsubscribe?.();round.rules.dispose();round.metrics.dispose();round.exercise.dispose();round.session.dispose();round=null;}
 function footer(){const actions=element(document,'div','actions');actions.append(button('Refazer avaliação',()=>{cleanupRound();flow.reset();introduction();}),link(document,'Voltar ao menu','/','button'));return actions;}
 function introduction(){host.replaceChildren(element(document,'p','lead','Três tentativas de até 40 segundos, com três vidas cada, nas dificuldades 2, 10 e 18. Clique direito move; ESC pausa. Ao concluir, seu nível é salvo neste dispositivo e o Normal abre diretamente nele.'),button('Iniciar avaliação',()=>{if(flow.start())beginRound();}));}
 function showError(error){if(!active)return;core.errors.report(error,{source:'assessment.dodge'});flow.fail();cleanupRound();host.replaceChildren(element(document,'p','status-note','Não foi possível concluir a avaliação. Nenhuma conclusão foi atribuída.'),footer());}
 function summary(){
   const state=flow.snapshot();host.replaceChildren();
   host.append(element(document,'h2','',state.state==='completed'?'Resultado da avaliação — Esquiva':`Resumo da tentativa ${state.results.at(-1).index} de 3`));
   for(const r of state.results)host.append(element(document,'p','muted',`Tentativa ${r.index} · Dificuldade ${r.level} · ${formatDuration(r.activeSeconds)} · ${r.hits} impactos · ${r.verifiedDodges}/${r.eligibleThreats} ameaças resolvidas evitadas · ${r.endReason==='diagnostic-time'?'Concluída por tempo':'Encerrada por vidas'}`));
   if(state.state==='completed'){
     const result=calculateDodgeGuidedAssessment(state.results);
     if(result.status==='recommended'){
       host.append(element(document,'p','record-value',`Nível inicial sugerido para treino: ${result.recommendedStartingLevel}/${MAX_DODGE_LEVEL}`));
       for(const r of result.perAttempt)host.append(element(document,'p','muted',`Dificuldade ${r.level}: nota diagnóstica ${r.qi}/100`));
       const enter=()=>{try{saveDodgeAssessment(window.localStorage,state.results);window.location.hash=`/play/dodge/normal/${result.recommendedStartingLevel}`;}catch{message.textContent='Sua avaliação terminou, mas não foi possível salvar. Permita armazenamento local e tente novamente.';retry.hidden=false;}};const message=element(document,'p','status-note','Abrindo seu nível no modo Normal…'),retry=button('Salvar avaliação e iniciar Normal',enter);retry.hidden=true;host.append(message,retry);enter();
     }else host.append(element(document,'p','status-note',`Não foi possível sugerir um nível. ${result.explanation} ${result.evidenceWarnings.join(' ')}`));
     host.append(element(document,'p','status-note','A avaliação define o ponto de partida. Sua patente no perfil considera as tentativas oficiais salvas; não é o elo do LoL.'));
   }else host.append(button('Próxima tentativa',()=>{if(flow.next())beginRound();}));
   host.append(footer());
 }
 function beginRound(){
   cleanupRound();const generation=revision,state=flow.snapshot(),level=state.level,index=state.index;
   const session=createSession({timeLimit:40,events:core.events,metadata:{origin:'diagnostic',index,level}});
   const rules=createDodgeMode({session,mode:'diagnostic',level,events:core.events});
   const metrics=createDodgeTelemetry({session,mode:'diagnostic',level,events:core.events});
   const exercise=createTechnicalDodge({level,mode:'diagnostic',attemptId:session.snapshot().id,events:core.events,rng:createRandom(window.crypto.getRandomValues(new Uint32Array(1))[0]),isRunning:()=>session.snapshot().state==='running',getVitals:()=>({lives:rules.snapshot().lives,maxLives:3}),canSpawn:()=>session.snapshot().elapsed<40});
   const heading=element(document,'h2','',`Tentativa ${index} de 3 · Dificuldade ${level}`),status=element(document,'p','muted','Preparando...'),pause=button('Pausar',()=>{if(session.snapshot().state==='paused')session.resume();else session.pause();});
   const cancel=button('Cancelar avaliação',()=>{flow.cancel();cleanupRound();host.replaceChildren(element(document,'p','muted','Avaliação cancelada. Nenhum diagnóstico foi salvo.'),footer());});
   const actions=element(document,'div','session-hud');actions.append(status,pause,cancel);const stage=element(document,'div','stage');host.replaceChildren(heading,actions,stage);
   function update(){
     if(!active||generation!==revision)return;const s=session.snapshot();if(s.state==='running')flow.running();
     status.textContent=s.state==='countdown'?`Começar em ${Math.ceil(s.countdown-s.preparation)}`:`${s.state==='paused'?'Pausado':'Tempo restante'} · ${Math.max(0,40-s.elapsed).toFixed(1)} s · ${rules.snapshot().lives} vidas`;
     pause.textContent=s.state==='paused'?'Retomar':'Pausar';rules.evaluate();
     if(rules.snapshot().outcome&&metrics.isFinal()){
       const outcome=rules.snapshot(),m=metrics.snapshot();
       const result={origin:'diagnostic',diagnosticVersion:DIAGNOSTIC_VERSION,attemptId:s.id,index,level,durationTarget:40,activeSeconds:m.elapsedActiveSeconds,initialLives:3,finalLives:outcome.lives,hits:m.validHits,eligibleThreats:m.threatsDodged+m.threatsHit+m.contactsIgnored,verifiedDodges:m.threatsDodged,endReason:outcome.outcome,complete:true};
       if(!flow.finishRound(result)){showError(new Error('Invalid diagnostic transition.'));return;}
       cleanupRound();summary();
     }
   }
   const unsubscribe=core.events.on('session:changed',()=>{if(session.snapshot().state==='running')flow.running();});round={session,rules,metrics,exercise,unsubscribe};session.start();update();
   const reportError=error=>{if(active&&generation===revision)showError(error);};
   Promise.resolve().then(loadPreview).then(({mountPreview})=>{if(!active||generation!==revision)return;const preview=mountPreview(stage,{events:core.events,session,exercise,onStep:(...args)=>metrics.step(...args),onTick:update,onError:reportError});if(active&&generation===revision)round.preview=preview;else preview.dispose();}).catch(reportError);
 }
 introduction();return {dispose(){if(!active)return;active=false;flow.cancel();cleanupRound();host.remove();}};
}
