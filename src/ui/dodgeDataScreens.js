import { MAX_DODGE_LEVEL } from '../training/dodge/constants.js';
import { loadSkillOverview } from '../progression/profileOverview.js';
import { createReflexProgress,prepareReflexEvolution } from '../progression/reflexProgress.js';
import { REFLEX_VARIANTS } from '../training/reflex/difficulty.js';
import { createKitingProgress,prepareKitingEvolution } from '../progression/kitingProgress.js';
import { KITING_VARIANTS } from '../training/kiting/difficulty.js';
import { element,link } from './elements.js';
import { formatDate,formatDuration } from './formatters.js';
import { createPrecisionProgress,preparePrecisionEvolution } from '../progression/precisionProgress.js';
import { PRECISION_VARIANTS } from '../training/precision/practice.js';
import { createDodgeProgress,prepareEvolution } from '../progression/dodgeProgress.js';
const recordLabel=record=>record.modality==='reflex'?REFLEX_VARIANTS[record.variant]?.label??'Exercício indisponível':record.modality==='kiting'?KITING_VARIANTS[record.variant]?.label??'Exercício indisponível':record.modality==='precision'?PRECISION_VARIANTS[record.variant]?.label??'Variante indisponível':modeLabel(record.mode);
const outcomeLabel=record=>record.endReason==='victory'?'Vitória':record.endReason==='completed'?'Concluído':'Derrota';
const modeLabel=mode=>mode==='normal'?'Normal':'Sobrevivência';
function details(document,record){
 const detail=element(document,'details','attempt-details'),summary=element(document,'summary','','Detalhes');detail.append(summary);
 if(record.modality==='reflex')detail.append(element(document,'p','muted',`${record.metrics.summary.correct}/${record.metrics.summary.opportunities} respostas corretas · ${record.metrics.summary.omissions} omissões · ${record.metrics.summary.anticipations} antecipações · Média correta: ${record.metrics.summary.meanMs===null?'—':Math.round(record.metrics.summary.meanMs)+' ms'}`));
 else if(record.modality==='kiting')detail.append(element(document,'p','muted',`${record.metrics.health!==undefined?`Vida ${record.metrics.health}/${record.metrics.maxHealth} · Dano recebido ${record.metrics.damageTaken} · `:''}${record.metrics.config?.targetCount??1} alvo(s) · ${record.metrics.shots} disparos · ${record.metrics.hits} acertos · ${record.metrics.cancellations} cancelamentos · ${record.metrics.totalDistanceMoved.toFixed(1)} u · ${record.metrics.rhythmCycles}/${record.metrics.rhythmOpportunities} ciclos com movimento · Fator de atividade: ${(record.score.activityGate*100).toFixed(0)}%`));
 else if(record.modality==='precision')detail.append(element(document,'p','muted',`Acertos: ${record.metrics.hits} · Erros: ${record.metrics.misses} · Precisão observada: ${record.metrics.accuracy===null?'—':(record.metrics.accuracy*100).toFixed(1)+'%'}`));
 else detail.append(element(document,'p','muted',`Tempo ativo: ${formatDuration(record.metrics.elapsedActiveSeconds)} · Impactos válidos: ${record.metrics.validHits} · Ameaças evitadas: ${record.metrics.threatsDodged}`));
 if(record.modality==='dodge'&&record.score.consistencyAvailable===false)detail.append(element(document,'p','status-note','Consistência sem amostra suficiente; parcela sem pontos.'));
 for(const c of record.score.components)detail.append(element(document,'p','muted',`${c.name}: ${c.contribution.toFixed(1)} / ${c.weight}`));
 detail.append(element(document,'p','muted',`Registro v${record.recordSchemaVersion} · ${record.metrics.metricsVersion} · ${record.score.scoringVersion} · Calibração: ${record.metrics.rulesetVersion??record.metrics.config?.configVersion??record.metrics.sequenceVersion??'anterior'}`));return detail;
}
function chart(document,points,mode,title='Evolução de Esquiva'){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 800 300');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${title}: ${mode==='normal'?'pontuação 0 a 100':'tempo ativo em segundos'}`);svg.classList.add('evolution-chart');
 const maximum=mode==='normal'?100:Math.max(1,...points.map(p=>p.value))*1.1;
 function node(tag,attributes,text){const n=document.createElementNS(svg.namespaceURI,tag);for(const [key,value]of Object.entries(attributes))n.setAttribute(key,String(value));if(text!==undefined)n.textContent=text;svg.append(n);return n;}
 node('line',{x1:60,y1:20,x2:60,y2:250,stroke:'#748da3'});node('line',{x1:60,y1:250,x2:770,y2:250,stroke:'#748da3'});
 for(const fraction of [0,.5,1]){const y=250-fraction*220;node('line',{x1:60,y1:y,x2:770,y2:y,stroke:'#34495e'});node('text',{x:52,y:y+4,'text-anchor':'end',fill:'#b5c5d5','font-size':13},mode==='normal'?String(maximum*fraction):formatDuration(maximum*fraction));}
 node('text',{x:410,y:288,'text-anchor':'middle',fill:'#b5c5d5','font-size':14},'Tentativas em ordem cronológica');
 let path=[],version=null;
 function flush(){if(path.length>1)node('polyline',{points:path.join(' '),fill:'none',stroke:'#80c7ff','stroke-width':2});path=[];}
 points.forEach((p,index)=>{const context=`${p.scoringVersion}:${p.calibrationVersion??'legacy'}`;if(version!==context){flush();version=context;}const x=points.length===1?415:60+index/(points.length-1)*710,y=250-p.value/maximum*220;path.push(`${x},${y}`);
   const circle=node('circle',{cx:x,cy:y,r:4,fill:'#bddfff'}),title=document.createElementNS(svg.namespaceURI,'title');title.textContent=`${formatDate(p.date)}: ${mode==='normal'?p.value+'/100':formatDuration(p.value)}`;circle.append(title);
 });flush();return svg;
}
/** All access through the repository; epochs invalidate stale asynchronous responses. */
export function mountDodgeData({screen,kind,repository,modality='dodge'}){
 const precision=modality==='precision',kiting=modality==='kiting',reflex=modality==='reflex',training=precision||kiting||reflex,name=precision?'Precisão de Clique':kiting?'Kiting':reflex?'Reflexos e Reação':'Esquiva',variants=reflex?REFLEX_VARIANTS:kiting?KITING_VARIANTS:PRECISION_VARIANTS;
 const createProgress=reflex?createReflexProgress:kiting?createKitingProgress:precision?createPrecisionProgress:createDodgeProgress;
 const document=screen.ownerDocument,box=element(document,'section','data-section');screen.append(box);
 let active=true,epoch=0,page=0;
 const controls=element(document,'div','data-controls'),content=element(document,'div','data-content');
 const mode=element(document,'select'),level=element(document,'select');
 function option(select,value,text){const n=element(document,'option','',text);n.value=value;select.append(n);}
 if(kind==='history')option(mode,'','Todos');if(training){for(const [id,v]of Object.entries(variants))option(mode,id,v.label);}else{option(mode,'normal','Normal');option(mode,'survival','Sobrevivência');}
 if(['history','records'].includes(kind))option(level,'','Todos');for(let n=1;n<=(training?10:MAX_DODGE_LEVEL);n++)option(level,String(n),String(n));
 for(const [labelText,select]of [[training?'Variante':'Modo',mode],['Nível',level]]){const label=element(document,'label','',`${labelText} `);label.append(select);controls.append(label);}
 if(!['profile','achievements'].includes(kind))box.append(controls);box.append(content);
 const query=()=>({... (training?{modality,variant:mode.value||undefined}:{mode:mode.value||undefined}),level:level.value?Number(level.value):undefined});
 function table(records){
   const wrapper=element(document,'div','table-wrapper'),table=element(document,'table'),head=element(document,'thead'),row=element(document,'tr'),body=element(document,'tbody');
   for(const label of ['Data',training?'Variante / nível':'Modo / nível','Resultado','Tempo ativo','Nota salva','Mais']){const th=element(document,'th','',label);th.scope='col';row.append(th);}head.append(row);
   for(const record of records){const tr=element(document,'tr');for(const text of [formatDate(record.completedAt),`${recordLabel(record)} · ${record.level}`,outcomeLabel(record),formatDuration(record.metrics.elapsedActiveSeconds),`${record.score.score}/100`])tr.append(element(document,'td','',text));const td=element(document,'td');td.append(details(document,record));tr.append(td);body.append(tr);}
   table.append(head,body);wrapper.append(table);return wrapper;
 }
 async function load(){
   const request=++epoch;content.replaceChildren(element(document,'p','muted','Carregando dados deste dispositivo...'));
   try{
     if(kind==='history'||kind==='evolution'){
       const response=await repository.listCompletedAttempts({...query(),offset:kind==='history'?page*10:0,limit:kind==='history'?10:30});if(!active||request!==epoch)return;
       content.replaceChildren();if(response.invalid)content.append(element(document,'p','status-note',`${response.invalid} registros incompatíveis não foram exibidos.`));
       if(!response.items.length){content.append(element(document,'p','muted',kind==='history'&&!mode.value&&!level.value?`Nenhuma tentativa de ${name} salva neste dispositivo`:'Nenhum resultado para estes filtros'));return;}
       if(kind==='evolution'){
         const points=reflex?prepareReflexEvolution(response.items,{variant:mode.value,level:Number(level.value),limit:30}):kiting?prepareKitingEvolution(response.items,{variant:mode.value,level:Number(level.value),limit:30}):precision?preparePrecisionEvolution(response.items,{variant:mode.value,level:Number(level.value),limit:30}):prepareEvolution(response.items,{mode:mode.value,level:Number(level.value),limit:30});content.append(element(document,'p','muted',`Últimas ${points.length} tentativas · ${training||mode.value==='normal'?'Nota final salva (0–100)':'Tempo ativo (segundos)'}`),chart(document,points,training?'normal':mode.value,`Evolução de ${name}`));
         if(new Set(points.map(p=>`${p.scoringVersion}:${p.calibrationVersion??'legacy'}`)).size>1)content.append(element(document,'p','status-note','Mudança de pontuação ou calibração: séries separadas; comparação limitada.'));
         if(training){
           const progress=createProgress();await repository.scanCompletedAttempts({...query(),onRecord:r=>progress.add(r)});if(!active||request!==epoch)return;const stats=progress.snapshot().stats;
           content.append(element(document,'p','muted',`Resumo de todas as ${stats.total} tentativas do filtro: melhor ${stats.bestScore}/100 · média ${stats.meanScore.toFixed(1)}/100 · mais recente ${stats.latestScore}/100. ${kiting?`Média das últimas cinco: ${stats.recentFiveMean.toFixed(1)}/100. `:''}Gráfico limitado às últimas ${points.length}.`));
           const accuracy=points.filter(p=>p.accuracy!==null).map(p=>({...p,value:p.accuracy}));
           if(reflex)content.append(element(document,'p','muted','Tempos de reação só são apresentados nos detalhes quando existem respostas corretas válidas.'));
           else if(accuracy.length)content.append(element(document,'h2','',kiting?'Eficiência dos ataques (%)':'Precisão observada (%)'),chart(document,accuracy,'normal',kiting?'Evolução da eficiência dos ataques':'Evolução da precisão observada'));else content.append(element(document,'p','muted','Métrica de precisão indisponível para estas tentativas.'));
         }
         content.append(table([...response.items].reverse()));
       }else{
         content.append(table(response.items));const pagination=element(document,'div','actions');
         const previous=element(document,'button','button','Anterior'),next=element(document,'button','button','Próxima');previous.type=next.type='button';previous.disabled=page===0;next.disabled=(page+1)*10>=response.total;
         previous.addEventListener('click',()=>{page--;load();});next.addEventListener('click',()=>{page++;load();});pagination.append(previous,element(document,'span','muted',`Página ${page+1} · ${response.total} tentativas`),next);content.append(pagination);
       }
     }else{
       const overview=kind==='profile'?await loadSkillOverview({repository,modality,createProgress}):null;const progress=createProgress();const response=overview??await repository.scanCompletedAttempts({...(['profile','achievements'].includes(kind)?(training?{modality}:{}):query()),onRecord:record=>progress.add(record)});if(!active||request!==epoch)return;
       let result=overview?.progress??progress.snapshot();if(kiting&&kind==='achievements'){const permanent=await repository.reconcileKitingAchievements();if(!active||request!==epoch)return;result={...result,achievements:permanent.achievements};}content.replaceChildren();if(response?.invalid)content.append(element(document,'p','status-note',`${response.invalid} registros incompatíveis não foram interpretados.`));
       if(kind==='records'){
         if(!result.records.length)content.append(element(document,'p','muted','Ainda não há recordes neste modo/nível'));
         const grid=element(document,'div','mode-grid');for(const record of [...result.records].sort((a,b)=>a.level-b.level)){
           const card=element(document,'article','mode-card');card.append(element(document,'h2','',`${recordLabel(record)} · Nível ${record.level}`),element(document,'p','record-value',(training||record.mode==='normal')?`${record.score.score}/100`:formatDuration(record.metrics.elapsedActiveSeconds)),element(document,'p','muted',`${outcomeLabel(record)} · ${formatDate(record.completedAt)} · Nota ${record.score.score}/100`),details(document,record));grid.append(card);
         }content.append(grid);
       }else if(kind==='achievements'){
         content.append(element(document,'p','muted',`${result.achievements.filter(a=>a.unlocked).length} de 6 conquistas`));const grid=element(document,'div','mode-grid');for(const achievement of result.achievements){const card=element(document,'article','mode-card');card.append(element(document,'h2','',achievement.title),element(document,'p','muted',achievement.description),element(document,'p','muted',achievement.progress??''),element(document,'p','status-note',achievement.unlocked?`Conquistada em ${formatDate(achievement.completedAt)}`:'Bloqueada'));grid.append(card);}content.append(grid);
       }else{
         const rating=result.rating;const recordDetails=element(document,'details');recordDetails.append(element(document,'summary','','Melhores resultados por contexto'));for(const r of result.records)recordDetails.append(element(document,'p','muted',`${recordLabel(r)} · Nível ${r.level}: ${r.modality==='dodge'&&r.mode==='survival'?`${formatDuration(r.metrics.elapsedActiveSeconds)} sobrevividos · `:''}${r.score.score}/100`));if(result.records.length)content.append(recordDetails);content.append(element(document,'p','muted',`${result.total} sessões oficiais concluídas e salvas`));if(overview?.latest){const last=overview.latest;content.append(element(document,'p','muted',`Último treino: ${formatDate(last.completedAt)} · ${recordLabel(last)} · Nível ${last.level} · Nota salva ${last.score.score}/100`));}content.append(element(document,'h2','',`Seu nível de habilidade — ${name}`),element(document,'p','record-value',rating.rating===null?'Ainda não classificado':`Nível ${rating.rating}/${training?10:MAX_DODGE_LEVEL}`),element(document,'p','muted',reflex?'Estimativa provisória. Usa somente as três sessões oficiais mais recentes de Reação Simples por dificuldade, com mediana de pelo menos 60. Outros exercícios não entram.':kiting?'Estimativa provisória: três sessões recentes da referência atual na mesma dificuldade, com mediana de pelo menos 60. Cada calibração de combate, ondas anteriores e alvo parado usa amostras separadas.':precision?'Estimativa provisória. Três sessões recentes do treino misto na mesma calibração e dificuldade, com mediana de pelo menos 60 e duas notas de pelo menos 60. Até completar a amostra nova, a referência anterior é preservada.':'Estimativa provisória. Na calibração atual, exige três tentativas Normal recentes na mesma dificuldade, duas com pelo menos 30 s e mediana de pelo menos 60 pontos. Referências antigas mantêm suas próprias regras. Sobrevivência não influencia esta classificação.'),link(document,'Escolher um treino',`/train/${modality}/${overview?.latest?.level??1}`,'button'));
       }
     }
   }catch{
     if(!active||request!==epoch)return;content.replaceChildren(element(document,'p','status-note','Não foi possível consultar os dados deste dispositivo.'));
     const retry=element(document,'button','button','Tentar novamente');retry.type='button';retry.addEventListener('click',load);content.append(retry);
   }
 }
 function filter(){page=0;load();}
 mode.addEventListener('change',filter);level.addEventListener('change',filter);load();
 return {dispose(){active=false;epoch++;mode.removeEventListener('change',filter);level.removeEventListener('change',filter);box.remove();}};
}
