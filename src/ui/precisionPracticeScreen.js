import { createPrecisionPractice,PRECISION_VARIANTS } from '../training/precision/practice.js';
import { mountSaveAttempt } from './saveAttempt.js';
import { calculatePrecisionScore } from '../training/precision/score.js';
import { precisionDifficulty } from '../training/precision/difficulty.js';
import { createPrecisionAttempt } from '../training/precision/attempt.js';
import { createRandom } from '../training/dodge/random.js';
import { createSession } from '../training/session.js';
import { element,link } from './elements.js';
export function mountPrecisionPractice({screen,core,timed=false,initialLevel=1,repository,loadPreview=()=>import('../game3d/mountPreview.js')}){
 const document=screen.ownerDocument,window=document.defaultView,host=element(document,'section','precision-practice'),select=element(document,'select'),label=element(document,'label','','Variante ');
 for(const [id,variant]of Object.entries(PRECISION_VARIANTS)){const option=element(document,'option','',variant.label);option.value=id;select.append(option);}label.append(select);const controls=element(document,'div','data-controls');controls.append(label);
 const levelSelect=element(document,'select');for(let n=1;n<=10;n++){const option=element(document,'option','',String(n));option.value=String(n);levelSelect.append(option);}levelSelect.value=String(initialLevel);if(timed){const levelLabel=element(document,'label','','Nível ');levelLabel.append(levelSelect);controls.append(levelLabel);}
 const result=element(document,'section','precision-result');result.hidden=true;
 const start=element(document,'button','button primary',timed?'Iniciar treino':'Iniciar prática'),restart=element(document,'button','button',timed?'Reiniciar treino':'Reiniciar prática'),pause=element(document,'button','button','Pausar'),back=link(document,'Voltar','/levels','button');for(const b of [start,restart,pause])b.type='button';
 const abandon=element(document,'button','button','Abandonar treino');abandon.type='button';abandon.hidden=!timed;abandon.addEventListener('click',()=>{current?.attempt?.abandon();current?.update();});controls.append(abandon);
 const hud=element(document,'p','muted','Acertos: 0 · Erros: 0 · Cliques válidos: 0 · Precisão observada: —'),notice=element(document,'p','status-note','Preparando arena...'),stage=element(document,'div','stage');
 controls.append(start,restart,pause,back);host.append(controls,hud,notice,stage,result);screen.append(host);
 let active=true,generation=0,current=null;
 function clean(){generation++;current?.preview?.dispose();current?.attempt?.dispose();current?.exercise.dispose();current?.session.dispose();current=null;}
 function setup(autoStart=false){
   clean();const token=generation;const chosenLevel=Number(levelSelect.value),config=precisionDifficulty(timed?chosenLevel:4,select.value);
   result.hidden=true;result.replaceChildren();select.disabled=levelSelect.disabled=false;
   const session=createSession({countdown:timed?3:0,timeLimit:timed?60:null,events:core.events,metadata:{origin:timed?'precision-official':'precision-practice',level:timed?chosenLevel:null,variant:select.value}});
   let movement;const exercise=createPrecisionPractice({...config,events:core.events,attemptId:session.snapshot().id,clock:timed?()=>session.snapshot().elapsed:undefined,variant:select.value,rng:createRandom(window.crypto.getRandomValues(new Uint32Array(1))[0]),playerPosition:()=>movement?.snapshot().position??{x:0,z:0}});
   const attempt=timed?createPrecisionAttempt({session,practice:exercise,level:chosenLevel,variant:select.value}):null;let summarized=false;
   current={session,exercise,attempt};start.disabled=restart.disabled=pause.disabled=true;abandon.disabled=true;notice.textContent='Preparando arena...';
   function update(){if(!active||token!==generation)return;const s=exercise.snapshot(),phase=session.snapshot().state;
     hud.textContent=`${phase==='countdown'?`COMEÇA EM ${Math.ceil(session.snapshot().countdown-session.snapshot().preparation)}`:phase==='paused'?'PAUSADO':`${Math.max(0,60-session.snapshot().elapsed).toFixed(0)}s`}   •   ${s.hits} ACERTOS   •   ${s.misses} ERROS   •   ${s.expired} PERDIDOS   •   ${s.accuracy===null?'—':(s.accuracy*100).toFixed(0)+'%'}`;

     if(s.fallback)notice.textContent='Espaço limitado: quantidade ou movimento dos alvos reduzidos para manter posições seguras. Ajuste a câmera e reinicie se necessário.';
     const completed=attempt?.evaluate();
     if(completed&&!summarized){summarized=true;result.hidden=false;pause.disabled=true;abandon.disabled=true;select.disabled=levelSelect.disabled=false;
       result.append(element(document,'h2','',completed.endReason==='completed'?'Treino concluído':'Treino abandonado'),element(document,'p','muted',`Nível ${completed.level} · ${PRECISION_VARIANTS[completed.variant].label} · ${completed.elapsedActiveSeconds.toFixed(1)} s · ${completed.hits} acertos · ${completed.misses} erros · ${completed.clicksEligible} cliques válidos`));
       if(completed.endReason==='completed'){
         const score=calculatePrecisionScore(completed);
         result.append(element(document,'h2','',score.status==='scored'?`Pontuação desta tentativa: ${score.score}/100`:'Pontuação indisponível nesta tentativa'));
         if(score.status==='scored')mountSaveAttempt({container:result,repository,metrics:completed,score,core,isActive:()=>active&&token===generation});
         for(const c of score.components)result.append(element(document,'p','muted',`${c.name}: ${c.contribution.toFixed(1)} / ${c.weight}`));
         if(score.smallSample)result.append(element(document,'p','status-note','Poucos acertos: interprete a nota com cautela. A precisão isolada não mede produtividade.'));
         result.append(element(document,'p','status-note','Referências de produtividade provisórias; compare apenas tentativas da mesma variante e nível.'));
       }
       const replay=element(document,'button','button','Jogar novamente');replay.type='button';replay.addEventListener('click',()=>setup(true));result.append(replay);
     }
     pause.textContent=phase==='paused'?'Retomar':'Pausar';
   }
   current.update=update;
   const onError=error=>{if(!active||token!==generation)return;core.errors.report(error,{source:'precision.practice'});clean();notice.textContent='Não foi possível iniciar a prática. Volte ao menu ou tente reiniciar.';restart.disabled=false;};
   Promise.resolve().then(loadPreview).then(({mountPreview})=>{
     if(!active||token!==generation)return;const preview=mountPreview(stage,{events:core.events,session,exercise,onTick:update,onError});
     if(!active||token!==generation){preview.dispose();return;}current.preview=preview;movement=preview.movement;
     start.disabled=false;restart.disabled=false;notice.textContent=timed?`Alvos maiores, reposição imediata. Acerte em até ${config.maxLifetime.toFixed(2)} s; alvos expirados são substituídos. Nível ${chosenLevel}: ${config.speed.toFixed(1)} u/s.`: 'Prática técnica sem nota ou histórico. Esquerdo: alvo; direito: movimento; ESC: pausa. A câmera pode ser ajustada; alvos existentes não são teleportados para acompanhar o enquadramento.';
     if(autoStart)begin();else update();
   }).catch(onError);
 }
 function begin(){if(!current)return;if(current.exercise.start()){current.session.start();start.disabled=true;pause.disabled=false;if(timed){select.disabled=levelSelect.disabled=true;abandon.disabled=false;}}else if(current.exercise.snapshot().targets.length===0)notice.textContent='Não há posição visível segura para um alvo. Ajuste a câmera e reinicie.';}
 start.addEventListener('click',begin);restart.addEventListener('click',()=>setup(true));pause.addEventListener('click',()=>{if(!current)return;if(current.session.snapshot().state==='paused')current.session.resume();else current.session.pause();});
 select.addEventListener('change',()=>setup());levelSelect.addEventListener('change',()=>setup());
 setup();return {dispose(){if(!active)return;active=false;clean();host.remove();}};
}
