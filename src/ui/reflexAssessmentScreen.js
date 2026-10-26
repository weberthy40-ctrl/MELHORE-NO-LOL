import { createReflexAssessmentFlow,calculateReflexGuidedAssessment } from '../training/assessment/reflexAssessment.js';
import { mountReflex } from './reflexScreen.js';
import { element,link } from './elements.js';
export function mountReflexAssessment({screen,core,loadPreview}){
 const document=screen.ownerDocument,host=element(document,'section','assessment');screen.append(host);const flow=createReflexAssessmentFlow();let active=true,round=null;
 function button(text,action){const b=element(document,'button','button',text);b.type='button';b.addEventListener('click',action);return b;}
 function clean(){round?.dispose();round=null;}
 function footer(){const actions=element(document,'div','actions');actions.append(button('Refazer avaliação',()=>{clean();flow.reset();intro();}),link(document,'Voltar ao menu','/','button'));return actions;}
 function intro(){host.replaceChildren(element(document,'p','lead','Desafio misto / habilidades, mouse e freio: três etapas de 20 segundos, nos níveis 3, 6 e 9. A recomendação é provisória e independente do Perfil. ESC pausa; Cancelar encerra a avaliação sem salvar.'),button('Iniciar avaliação',()=>{if(flow.start())begin();}));}
 function summary(){const s=flow.snapshot(),done=s.state==='completed',result=done?calculateReflexGuidedAssessment(s.results):null;host.replaceChildren(element(document,'h2','',done?'Resultado da avaliação — Reflexos e Reação':`Resumo da tentativa ${s.results.length} de 3`));
  for(const r of s.results)host.append(element(document,'p','muted',`Etapa ${r.index} · Nível ${r.level} · ${r.elapsedActiveSeconds} s · ${r.summary.correct}/${r.summary.opportunities} respostas corretas · ${r.summary.omissions} omissões · ${r.summary.anticipations} antecipações · Média correta: ${r.summary.meanMs===null?'—':Math.round(r.summary.meanMs)+' ms'}`));
  if(done){for(const p of result.perAttempt)host.append(element(document,'p','muted',`Nível ${p.level}: ${p.indicator===null?'evidência insuficiente':`indicador ${p.indicator.toFixed(1)}/100 · ${p.demonstrated?'referência demonstrada':'referência não demonstrada'}`}`));if(result.status==='recommended')host.append(element(document,'p','record-value',`Nível inicial sugerido: ${result.recommendedStartingLevel}/10`),link(document,'Treinar neste nível',`/train/reflex/${result.recommendedStartingLevel}`,'button'));else host.append(element(document,'p','status-note',`Não foi possível sugerir um nível. ${result.reason}`));host.append(element(document,'p','status-note','Sugestão provisória de ponto de partida; não altera sua classificação no Perfil. Exige três oportunidades completas e indicador de pelo menos 65 em cada referência demonstrada.'),link(document,'Ver todos os níveis','/levels','button'));}
  else host.append(button('Próxima tentativa',()=>{if(flow.next())begin();}));host.append(footer());
 }
 function begin(){clean();const {index,preset}=flow.snapshot(),roundHost=element(document,'section');host.replaceChildren(element(document,'h2','',`Avaliação · Etapa ${index}/3 · Desafio misto · Nível ${preset.level}`),button('Cancelar avaliação',()=>{clean();flow.cancel();host.replaceChildren(element(document,'p','muted','Avaliação cancelada; nenhum resultado foi salvo.'),footer());}),roundHost);
  round=mountReflex({screen:roundHost,core,timed:true,initialLevel:preset.level,diagnosticIndex:index,loadPreview,onDiagnosticResult:result=>{if(!active)return;flow.running();if(!flow.finishRound(result)){clean();flow.fail();host.replaceChildren(element(document,'p','status-note','Dados diagnósticos inválidos. Nenhum nível foi sugerido.'),footer());return;}clean();summary();}});
 }
 intro();return {dispose(){if(!active)return;active=false;clean();flow.cancel();host.remove();}};
}
