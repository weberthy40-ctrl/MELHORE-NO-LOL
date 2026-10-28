import { element,link } from './elements.js';
import { VARIANTS } from '../training/dodge/projectiles.js';
const tips={arcane_bolt:'Disparo arcano: passos curtos e mudança de direção depois da conjuração.',sun_beam:'Feixe: saia pela lateral mais próxima durante o aviso.',artillery:'Bombardeio: deixe o centro do marcador antes do impacto.',flame_circle:'Fogo: procure a saída mais curta do círculo.',cage:'Gaiola: o centro é seguro; evite atravessar a borda ativa.'};
/** Reconstructs captured world positions; never resumes or mutates the original session. */
export function mountDodgeReplayReview({container,recording,loadPreview=()=>import('../game3d/mountPreview.js')}){
 const doc=container.ownerDocument,win=doc.defaultView,frames=recording.frames;
 const button=element(doc,'button','button replay-open','Rever últimos 6 s'),panel=element(doc,'section','replay-review');
 button.type='button';button.disabled=frames.length<2;panel.hidden=true;container.prepend(button);container.append(panel);
 const dialog=container.closest('dialog'),top=Object.entries(recording.counts).sort((a,b)=>b[1]-a[1])[0];
 let drill,tip,beamPractice;
 if(top){
  drill=link(doc,'Repetir nível na Sobrevivência',`/play/dodge/survival/${frames.at(-1)?.snapshot.level??1}`,'button focus-recommendation');container.insertBefore(drill,button.nextSibling);
  tip=element(doc,'p','status-note',tips[top[0]]??'Observe a conjuração e mude a direção antes da chegada da habilidade.');container.append(tip);
 }
 let active=true,preview=null,frameId=null,playing=false,last=null,index=0,playhead=frames[0]?.time??0,generation=0;
 const stage=element(doc,'div','stage replay-stage'),controls=element(doc,'div','replay-controls'),play=element(doc,'button','button','Reproduzir'),slider=element(doc,'input'),speed=element(doc,'select'),status=element(doc,'p','muted replay-status'),error=element(doc,'p','status-note replay-error');
 play.type='button';slider.type='range';slider.min='0';slider.max=String(Math.max(0,frames.length-1));slider.step='1';slider.value='0';slider.setAttribute('aria-label','Instante da revisão');
 error.hidden=true;error.setAttribute('role','status');
 for(const value of [.25,.5,1]){const option=element(doc,'option','',`${value}×`);option.value=String(value);speed.append(option);}speed.value='0.5';speed.setAttribute('aria-label','Velocidade da revisão');
 controls.append(play,speed,slider);panel.append(element(doc,'h3','','Revisão da esquiva'),element(doc,'p','muted','Posições da simulação nos últimos segundos. Os pontos vermelhos marcam contatos. Esta revisão fica apenas em memória.'),stage,controls,status,error);
 const timeline=element(doc,'div','replay-timeline'),start=frames[0]?.time??0,end=frames.at(-1)?.time??start;
 // The captured interval is authoritative: no invented frame for a later impact.
 const markers=recording.markers.filter(marker=>Number.isFinite(marker.time)&&marker.time>=start&&marker.time<=end).slice().sort((a,b)=>a.time-b.time);
 const events=element(doc,'ol','replay-events');events.setAttribute('aria-label','Contatos registrados neste trecho');
 const eventButtons=[];
 for(const marker of markers){
  const label=VARIANTS[marker.variant]?.label??'Contato',dot=element(doc,'span','replay-marker');dot.style.left=`${(marker.time-start)/Math.max(.001,end-start)*100}%`;dot.title=`${label} · ${marker.time.toFixed(2)} s`;dot.setAttribute('aria-hidden','true');timeline.append(dot);
  const item=element(doc,'li'),event=element(doc,'button','button replay-event',`${label} · ${marker.time.toFixed(2)} s — Rever 1 s antes`);event.type='button';event.setAttribute('aria-pressed','false');eventButtons.push(event);item.append(event);events.append(item);
  event.addEventListener('click',()=>{
   if(!active||panel.hidden)return;
   stop();const target=Math.max(start,marker.time-1);let next=0;
   while(next<frames.length-1&&frames[next+1].time<=target)next++;
   selectEvent(event);present(next);
  });
 }
 panel.insertBefore(timeline,controls);
 panel.append(element(doc,'h4','','Rever um contato'),markers.length?events:element(doc,'p','muted replay-empty','Nenhum contato registrado neste trecho.'));
 if(markers.some(marker=>marker.variant==='sun_beam')){beamPractice=link(doc,'Praticar saída lateral · 45 s','/drill/dodge/sidestep','button beam-practice-link');panel.append(beamPractice);}
 function selectEvent(selected){for(const event of eventButtons)event.setAttribute('aria-pressed',String(event===selected));}
 function stop(){playing=false;last=null;if(frameId!==null)win.cancelAnimationFrame(frameId);frameId=null;play.textContent='Reproduzir';}
 function present(next){index=Math.max(0,Math.min(frames.length-1,next));const frame=frames[index];if(!frame)return;slider.value=String(index);status.textContent=`${frame.time.toFixed(2)} s da tentativa · ${(frame.time-start).toFixed(2)} / ${(end-start).toFixed(2)} s de revisão`;preview?.presentFrame?.(frame);}
 function tick(time){frameId=null;if(!active||!playing||panel.hidden)return;if(last!==null)playhead+=Math.max(0,Math.min(.1,(time-last)/1000))*Number(speed.value);last=time;let next=index;while(next<frames.length-1&&frames[next+1].time<=playhead)next++;if(next!==index)present(next);if(playhead>=end){present(frames.length-1);stop();return;}frameId=win.requestAnimationFrame(tick);}
 play.addEventListener('click',()=>{if(!active||panel.hidden||!frames.length)return;if(playing){stop();return;}if(index===frames.length-1)present(0);playhead=frames[index].time;playing=true;play.textContent='Pausar revisão';last=null;frameId=win.requestAnimationFrame(tick);});
 slider.addEventListener('input',()=>{if(!active||panel.hidden)return;stop();selectEvent(null);present(Number(slider.value));});
 button.addEventListener('click',async()=>{
  if(!active)return;
  panel.hidden=!panel.hidden;dialog?.classList.toggle('reviewing',!panel.hidden);
  if(panel.hidden){stop();preview?.dispose();preview=null;generation++;button.textContent='Rever últimos 6 s';return;}
  button.textContent='Fechar revisão';error.hidden=true;error.textContent='';present(index);const token=++generation;
  const current=()=>active&&token===generation&&!panel.hidden;
  try{
   const {mountPreview}=await loadPreview();if(!current())return;
   preview=mountPreview(stage,{controls:false,fullscreenControls:false,exercise:{kind:'dodge',snapshot:()=>frames[index].snapshot},onError:()=>{if(current()){error.textContent='Revisão 3D indisponível neste navegador.';error.hidden=false;}}});present(index);
  }catch{if(current()){error.textContent='Não foi possível abrir a revisão.';error.hidden=false;}}
 });
 return {dispose(){if(!active)return;active=false;generation++;dialog?.classList.remove('reviewing');stop();preview?.dispose();button.remove();drill?.remove();tip?.remove();beamPractice?.remove();panel.remove();}};
}
