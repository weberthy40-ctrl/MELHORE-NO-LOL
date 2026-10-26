import { element,link } from './elements.js';
import { MODALITIES } from './routes.js';
import { loadSkillOverview } from '../progression/profileOverview.js';
import { createDodgeProgress } from '../progression/dodgeProgress.js';
import { createPrecisionProgress } from '../progression/precisionProgress.js';
import { createKitingProgress } from '../progression/kitingProgress.js';
import { createReflexProgress } from '../progression/reflexProgress.js';
import { formatDate } from './formatters.js';
const factories={dodge:createDodgeProgress,precision:createPrecisionProgress,kiting:createKitingProgress,reflex:createReflexProgress};
export function mountProfile({screen,repository}){
 const document=screen.ownerDocument,host=element(document,'section','profile-dashboard'),grid=element(document,'div','profile-grid');host.append(grid);screen.append(host);let active=true;
 for(const mode of MODALITIES){
  const card=element(document,'article','skill-card');card.dataset.mode=mode.id;card.append(element(document,'span','mode-icon',mode.icon),element(document,'h2','',mode.title));const content=element(document,'div');content.append(element(document,'p','muted','Carregando…'));card.append(content);grid.append(card);
  async function load(){try{
   const overview=await loadSkillOverview({repository,modality:mode.id,createProgress:factories[mode.id]});if(!active)return;
   const {total,rating}=overview.progress,level=rating.rating;content.replaceChildren();
   const gauge=element(document,'div','skill-gauge'),value=element(document,'strong','',level===null?'—':String(level));gauge.style.setProperty('--progress',`${(level??0)*10}%`);gauge.append(value,element(document,'span','',level===null?'SEM NÍVEL':'NÍVEL / 10'));
   const numbers=element(document,'div','skill-numbers');for(const [label,text]of [['TREINOS',total],['MELHOR NOTA',overview.bestScore===null?'—':`${overview.bestScore}/100`]]){const stat=element(document,'div');stat.append(element(document,'strong','',String(text)),element(document,'span','',label));numbers.append(stat);}
   content.append(gauge,numbers,element(document,'p','skill-latest',overview.latest?`Último treino · ${formatDate(overview.latest.completedAt)}`:'Seu primeiro treino começa agora.'),link(document,total?'Continuar treinando →':'Começar treino →',`/train/${mode.id}/${overview.latest?.level??1}`,'button primary'));
   const links=element(document,'div','skill-links');for(const [title,path]of [['Histórico','history'],['Evolução','evolution'],['Recordes','records'],['Conquistas','achievements']])links.append(link(document,title,`/${path}/${mode.id}`));content.append(links);
  }catch{if(!active)return;content.replaceChildren(element(document,'p','status-note','Dados indisponíveis.'));const retry=element(document,'button','button','Tentar novamente');retry.type='button';retry.addEventListener('click',load);content.append(retry);}}
  load();
 }
 const explanation=element(document,'details','profile-explanation');explanation.append(element(document,'summary','','Como meu nível é calculado?'),element(document,'p','muted','Cada habilidade tem seu próprio nível, baseado em três treinos oficiais recentes na mesma dificuldade. Esquiva usa o modo Normal; precisão usa o treino misto; kiting usa ondas; reflexo usa teclado e mouse. Após três sessões do modo novo, ele passa a ser a referência; até lá, preservamos a referência anterior. As demais variantes continuam registradas no histórico. Todos os níveis ficam disponíveis para treinar.'));host.append(explanation);
 return {dispose(){active=false;host.remove();}};
}
