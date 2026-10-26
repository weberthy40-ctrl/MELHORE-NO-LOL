import { mountSaveAttempt } from './saveAttempt.js';
import { createKitingPractice } from '../training/kiting/practice.js';
import { KITING_VARIANTS,kitingDifficulty } from '../training/kiting/difficulty.js';
import { createKitingAttempt } from '../training/kiting/attempt.js';
import { calculateKitingScore } from '../training/kiting/score.js';
import { createSession } from '../training/session.js';
import { createRandom } from '../core/random.js';
import { element,link } from './elements.js';
export function mountKiting({screen,core,timed=false,initialLevel=1,repository,loadPreview=()=>import('../game3d/mountPreview.js')}){
 const document=screen.ownerDocument,window=document.defaultView,host=element(document,'section','kiting-practice'),controls=element(document,'div','data-controls'),variant=element(document,'select'),level=element(document,'select');
 function button(text,action){const b=element(document,'button','button',text);b.type='button';b.addEventListener('click',action);return b;}
 for(const [id,v]of Object.entries(KITING_VARIANTS)){const option=element(document,'option','',v.label);option.value=id;variant.append(option);}for(let n=1;n<=10;n++){const option=element(document,'option','',String(n));option.value=String(n);level.append(option);}level.value=String(initialLevel);
 for(const [name,select]of [['Exercício',variant],['Nível',level]]){if(!timed&&select===level)continue;const label=element(document,'label','',`${name} `);label.append(select);controls.append(label);}
 const start=button(timed?'Iniciar treino':'Iniciar prática',begin),restart=button('Reiniciar',()=>setup(true)),pause=button('Pausar',()=>{if(current?.session.snapshot().state==='paused')current.session.resume();else current?.session.pause();}),abandon=button('Abandonar',()=>{current?.attempt?.abandon();current?.update();});abandon.hidden=!timed;
 controls.append(start,restart,pause,abandon,link(document,'Voltar','/levels','button'));
 variant.value='spacing';
 const help=element(document,'p','status-note','Esquerdo no inimigo: atacar. A + esquerdo: atacar o inimigo mais próximo do cursor. Direito: mover. Mova depois do disparo; mover antes cancela. Y: câmera · ESC: pausa.'),hud=element(document,'p','muted'),notice=element(document,'p','status-note'),bar=element(document,'progress'),stage=element(document,'div','stage'),result=element(document,'section','kiting-result');bar.max=1;bar.setAttribute('aria-label','Progresso da preparação ou recuperação do ataque');host.append(controls,help,hud,bar,notice,stage,result);screen.append(host);
 let active=true,revision=0,current=null;
 function clean(){revision++;current?.preview?.dispose();current?.attempt?.dispose();current?.practice.dispose();current?.session.dispose();current=null;}
 function setup(autoStart=false){
  clean();const token=revision,chosen=variant.value,chosenLevel=timed?Number(level.value):1,config=kitingDifficulty(chosenLevel,chosen);let movement,summarized=false;
  const session=createSession({countdown:3,timeLimit:timed?60:null,events:core.events,metadata:{origin:timed?'official':'technical',modality:'kiting',variant:chosen,level:chosenLevel}}),practice=createKitingPractice({variant:chosen,level:chosenLevel,events:core.events,attemptId:session.snapshot().id,rng:createRandom(window.crypto.getRandomValues(new Uint32Array(1))[0]),isRunning:()=>session.snapshot().state==='running',playerPosition:()=>movement?.snapshot().position??{x:0,z:0}}),attempt=timed?createKitingAttempt({session,practice,variant:chosen,level:chosenLevel}):null;
  current={session,practice,attempt};start.disabled=restart.disabled=pause.disabled=abandon.disabled=true;variant.disabled=level.disabled=false;result.replaceChildren();notice.textContent='Preparando arena...';
  function update(){
   if(!active||token!==revision)return;const s=session.snapshot(),p=practice.snapshot();hud.textContent=`${s.state==='countdown'?`COMEÇA EM ${Math.ceil(s.countdown-s.preparation)}`:s.state==='paused'?'PAUSADO':`${Math.max(0,60-s.elapsed).toFixed(0)}s`}   •   ${p.hits} ATAQUES   •   ${p.cancellations} CANCELADOS   •   ${p.lastAction}`;

   bar.value=p.phase==='windup'?1-p.windupRemaining/config.windupDuration:p.phase==='recovery'?1-p.cooldown/config.attackInterval:0;pause.textContent=s.state==='paused'?'Retomar':'Pausar';
   const finished=attempt?.evaluate();if(finished&&!summarized){summarized=true;pause.disabled=abandon.disabled=true;variant.disabled=level.disabled=false;
    result.append(element(document,'h2','',finished.endReason==='completed'?'Sessão concluída':'Sessão abandonada'),element(document,'p','muted',`${KITING_VARIANTS[chosen].label} · Nível ${chosenLevel} · ${finished.elapsedActiveSeconds.toFixed(1)} s · ${finished.shots} disparos · ${finished.hits} acertos · ${finished.cancellations} cancelamentos · ${finished.totalDistanceMoved.toFixed(1)} u · ${finished.rhythmCycles}/${finished.rhythmOpportunities} ciclos com movimento`));
    if(finished.endReason==='completed'){const score=calculateKitingScore(finished);if(score.status==='scored')mountSaveAttempt({container:result,repository,metrics:finished,score,core,isActive:()=>active&&token===revision});result.append(element(document,'h2','',score.status==='scored'?`Pontuação desta tentativa: ${score.score}/100`:'Pontuação indisponível'));for(const c of score.components)result.append(element(document,'p','muted',`${c.name}: ${c.contribution.toFixed(1)} / ${c.weight}`));result.append(element(document,'p','status-note',`Meta provisória: ${score.referenceHits} acertos · Mínimo de amostra: ${score.minSampleHits} · Fator de atividade: ${(score.activityGate*100).toFixed(0)}%. Compare apenas o mesmo exercício e nível.`));}
    result.append(button('Jogar novamente',()=>setup(true)));
   }
  }
  current.update=update;
  const error=e=>{if(!active||token!==revision)return;core.errors.report(e,{source:'kiting'});clean();notice.textContent='Não foi possível carregar o treino. Volte ao menu ou tente reiniciar.';restart.disabled=false;};
  Promise.resolve().then(loadPreview).then(({mountPreview})=>{if(!active||token!==revision)return;const preview=mountPreview(stage,{events:core.events,session,exercise:practice,onTick:update,onError:error});if(!active||token!==revision){preview.dispose();return;}current.preview=preview;movement=preview.movement;start.disabled=restart.disabled=false;notice.textContent=`Alcance: ${config.attackRange} u · Intervalo: ${config.attackInterval} s · Preparação: ${config.windupDuration} s.${timed?` Meta orientativa: ${config.referenceHits} acertos; sem derrota por meta.`:' Prática sem nota ou histórico.'}`;if(autoStart)begin();else update();}).catch(error);
 }
 function begin(){if(!current||!current.practice.start())return;current.session.start();start.disabled=true;pause.disabled=false;abandon.disabled=!timed;variant.disabled=level.disabled=timed;current.update();}
 variant.addEventListener('change',()=>setup());level.addEventListener('change',()=>setup());
 setup();return {dispose(){if(!active)return;active=false;clean();host.remove();}};
}
