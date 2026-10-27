import { element,link } from './elements.js';
import { MODALITIES } from './routes.js';
import { loadSkillOverview } from '../progression/profileOverview.js';
import { createDodgeProgress } from '../progression/dodgeProgress.js';
import { createPrecisionProgress } from '../progression/precisionProgress.js';
import { createKitingProgress } from '../progression/kitingProgress.js';
import { createReflexProgress } from '../progression/reflexProgress.js';
import { overallSkillRating,RANKS } from '../progression/skillRating.js';
import { readDodgePlacement } from '../progression/dodgePlacement.js';
import { formatDate } from './formatters.js';
const factories={dodge:createDodgeProgress,precision:createPrecisionProgress,kiting:createKitingProgress,reflex:createReflexProgress};
const number=n=>new Intl.NumberFormat('pt-BR').format(n);
export function mountProfile({screen,repository}){
 const document=screen.ownerDocument,host=element(document,'section','profile-dashboard'),overall=element(document,'section','overall-rank'),grid=element(document,'div','profile-grid');host.append(overall,grid);screen.append(host);let active=true;
 const ratings=new Map(),states=new Map(MODALITIES.map(m=>[m.id,'loading']));
 function updateOverall(){
  overall.replaceChildren(element(document,'span','eyebrow','PATENTE GERAL'));
  if([...states.values()].includes('loading')){overall.append(element(document,'h2','','Calculando seus pontos…'));return;}
  const value=overallSkillRating([...ratings.values()]);overall.style.setProperty('--rank-color',value.rank?.color??'#aec1bd');
  overall.append(element(document,'h2','',value.rank?.name??'Seu próximo treino vale pontos'),element(document,'strong','overall-points',value.points===null?'—':`${number(value.points)} pontos`),element(document,'p','muted',value.covered?`Média das habilidades treinadas · ${value.covered}/4 avaliadas${value.provisional?' · classificação provisória':''}`:'Conclua um treino oficial para receber sua primeira patente.'));
  if([...states.values()].includes('error'))overall.append(element(document,'p','status-note','Algumas habilidades não puderam ser carregadas; esta média está incompleta.'));
 }
 updateOverall();
 for(const mode of MODALITIES){
  const card=element(document,'article','skill-card');card.dataset.mode=mode.id;card.append(element(document,'span','mode-icon',mode.icon),element(document,'h2','',mode.title));const content=element(document,'div');content.append(element(document,'p','muted','Carregando…'));card.append(content);grid.append(card);
  async function load(){states.set(mode.id,'loading');updateOverall();try{
   const overview=await loadSkillOverview({repository,modality:mode.id,createProgress:factories[mode.id]});if(!active)return;
   const {total}=overview.progress,rating=overview.rating;ratings.set(mode.id,rating);states.set(mode.id,'ready');content.replaceChildren();card.style.setProperty('--rank-color',rating.rank?.color??'#aec1bd');
   const badge=element(document,'p','rank-badge',rating.rank?.name??'Sem patente'),gauge=element(document,'div','skill-gauge'),value=element(document,'strong','',rating.points===null?'—':number(rating.points));gauge.style.setProperty('--progress',`${(rating.points??0)/100}%`);gauge.append(value,element(document,'span','','PONTOS'));
   const progress=element(document,'progress','rank-progress');progress.max=1;progress.value=rating.rank?.progress??0;progress.setAttribute('aria-label',rating.rank?.next?`Progresso para ${rating.rank.next.name}`:'Progresso da patente');
   const next=rating.rank?.next?`${number(rating.rank.remaining)} pontos para ${rating.rank.next.name}`:rating.rank?'Topo da escala do treinador':'Seu primeiro treino começa agora.';
   const numbers=element(document,'div','skill-numbers');for(const [label,text]of [['TREINOS',total],['MELHOR NOTA',overview.bestScore===null?'—':`${overview.bestScore}/100`]]){const stat=element(document,'div');stat.append(element(document,'strong','',String(text)),element(document,'span','',label));numbers.append(stat);}
   let destination=`/train/${mode.id}/${overview.latest?.level??1}`,action=total?'Continuar treinando →':'Começar treino →';
   if(mode.id==='dodge'){let placement;try{placement=readDodgePlacement(document.defaultView.localStorage);}catch{placement=null;}destination=placement?'/play/dodge/normal':'/assessment/dodge';action=placement?`Continuar no nível ${placement.level} →`:'Fazer avaliação →';}
   content.append(badge,gauge,progress,element(document,'p','rank-next',next),element(document,'p','rank-sample',rating.samples?`${rating.provisional?'Patente provisória · ':''}${rating.samples} treino${rating.samples===1?'':'s'} na média`:''),numbers,element(document,'p','skill-latest',overview.latest?`Último treino · ${formatDate(overview.latest.completedAt)}`:''),link(document,action,destination,'button primary'));
   const links=element(document,'div','skill-links');for(const [title,path]of [['Histórico','history'],['Evolução','evolution'],['Recordes','records'],['Conquistas','achievements']])links.append(link(document,title,`/${path}/${mode.id}`));content.append(links);updateOverall();
  }catch{if(!active)return;states.set(mode.id,'error');ratings.delete(mode.id);updateOverall();content.replaceChildren(element(document,'p','status-note','Dados indisponíveis.'));const retry=element(document,'button','button','Tentar novamente');retry.type='button';retry.addEventListener('click',load);content.append(retry);}}
  load();
 }
 const explanation=element(document,'details','profile-explanation');explanation.append(element(document,'summary','','Como meus pontos e minha patente funcionam?'),element(document,'p','muted','Cada treino salvo gera uma estimativa de 0 a 10.000 pontos, considerando dificuldade, desempenho e amostra real de jogo. A patente usa a média ponderada dos 20 treinos mais recentes de cada habilidade, com mais peso para os recentes. Repetir um nível fácil não soma pontos de experiência.'),element(document,'p','muted','A patente geral é a média das habilidades com treinos. Ela fica provisória enquanto faltar alguma habilidade ou houver menos de cinco treinos por habilidade. Todo o histórico continua salvo. Patentes são internas ao treinador; não representam elo do LoL ou certificação profissional.'));
 const table=element(document,'table','rank-table'),head=element(document,'thead'),row=element(document,'tr');row.append(element(document,'th','','Patente'),element(document,'th','','Pontos mínimos'));head.append(row);table.append(head);const body=element(document,'tbody');for(const rank of RANKS){const r=element(document,'tr');r.append(element(document,'td','',rank.name),element(document,'td','',number(rank.minimum)));body.append(r);}table.append(body);explanation.append(table);host.append(explanation);
 return {dispose(){active=false;host.remove();}};
}
