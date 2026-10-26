import { validateKitingRecord } from '../persistence/kitingRecord.js';
import { readonlySnapshot } from '../training/snapshot.js';
import { KITING_VARIANTS } from '../training/kiting/difficulty.js';
export const KITING_ACHIEVEMENTS=readonlySnapshot([
 ['first-session','Primeiros Passos','Conclua e salve uma sessão válida.'],['five-sessions','Ritmo de Treino','Conclua e salve cinco sessões válidas.'],['twenty-five-sessions','Veterano do Kiting','Conclua e salve 25 sessões válidas.'],['score-eighty','Bom Controle','Alcance nota oficial de pelo menos 80.'],['score-ninety-five','Precisão Magistral','Alcance nota oficial de pelo menos 95.'],['all-variants','Treino Completo','Conclua e salve uma sessão de cada exercício.'],
].map(([key,title,description])=>({id:`kiting:${key}`,title,description})));
const chronological=(a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt)||(a.attemptId<b.attemptId?-1:a.attemptId>b.attemptId?1:0);
export function eligibleKiting(r){try{validateKitingRecord(r);return true;}catch{return false;}}
function compare(a,b){const efficiencyA=a.metrics.shots?a.metrics.hits/a.metrics.shots:null,efficiencyB=b.metrics.shots?b.metrics.hits/b.metrics.shots:null;return b.score.score-a.score.score||b.metrics.hits-a.metrics.hits||(efficiencyA!==null&&efficiencyB!==null?efficiencyB-efficiencyA:0)||chronological(a,b);}
/** Streaming aggregation retains 30 rating samples, 30 recordists and 25 earliest dates. */
export function createKitingProgress(){
 let total=0,sum=0,best=null;const latest=[],earliest=[],records=new Map(),first=new Map(),variants=new Map(),evidence=new Map();
 const mark=(id,r)=>{const key=`kiting:${id}`;if(!first.has(key)||chronological(r,first.get(key))<0)first.set(key,r);};
 return {add(r){if(!eligibleKiting(r))return;total++;sum+=r.score.score;best=best===null?r.score.score:Math.max(best,r.score.score);latest.push(r);latest.sort((a,b)=>chronological(b,a));latest.length=Math.min(5,latest.length);earliest.push(r);earliest.sort(chronological);earliest.length=Math.min(25,earliest.length);
  const key=`${r.variant}:${r.level}`;if(!records.has(key)||compare(r,records.get(key))<0)records.set(key,r);
  if(r.score.score>=80)mark('score-eighty',r);if(r.score.score>=95)mark('score-ninety-five',r);if(!variants.has(r.variant)||chronological(r,variants.get(r.variant))<0)variants.set(r.variant,r);
  if(r.variant==='static'){if(!evidence.has(r.level))evidence.set(r.level,{count:0,recent:[]});const e=evidence.get(r.level);e.count++;e.recent.push(r);e.recent.sort((a,b)=>chronological(b,a));e.recent.length=Math.min(3,e.recent.length);}
 },snapshot(){
  for(const [index,id]of [[0,'first-session'],[4,'five-sessions'],[24,'twenty-five-sessions']])if(earliest[index])mark(id,earliest[index]);const all=[...variants.values()].sort(chronological);if(all.length===3)mark('all-variants',all[2]);
  const evidenceByLevel=Array.from({length:10},(_,i)=>{const e=evidence.get(i+1)??{count:0,recent:[]},scores=e.recent.map(r=>r.score.score),median=scores.length===3?[...scores].sort((a,b)=>a-b)[1]:null;return {level:i+1,count:e.count,attemptIds:e.recent.map(r=>r.attemptId),scores,median,demonstrated:scores.length===3&&median>=60};}),rating=evidenceByLevel.filter(e=>e.demonstrated).at(-1)?.level??null;
  return readonlySnapshot({total,records:[...records.values()],achievements:KITING_ACHIEVEMENTS.map(a=>({...a,unlocked:first.has(a.id),completedAt:first.get(a.id)?.completedAt??null,progress:a.id==='kiting:all-variants'?`${variants.size}/3 exercícios`:[['kiting:first-session',1],['kiting:five-sessions',5],['kiting:twenty-five-sessions',25]].some(([id])=>id===a.id)?`${total} sessões válidas`:null})),stats:{total,bestScore:best,meanScore:total?sum/total:null,latestScore:latest[0]?.score.score??null,recentFiveMean:latest.length?latest.reduce((n,r)=>n+r.score.score,0)/latest.length:null},rating:{ratingVersion:'1',rating,status:rating===null?'insufficient-data':'classified',referenceVariant:'static',evidenceByLevel}});
 }};
}
export function calculateKitingProgress(attempts){const p=createKitingProgress(),seen=new Set();for(const r of attempts){if(seen.has(r?.attemptId))continue;seen.add(r?.attemptId);p.add(r);}return p.snapshot();}
export function prepareKitingEvolution(attempts,{variant='static',level=1,limit=30}={}){
 if(!Object.hasOwn(KITING_VARIANTS,variant)||!Number.isInteger(level)||level<1||level>10||![10,30,100].includes(limit))throw new TypeError('Invalid kiting filters.');const seen=new Set();return readonlySnapshot(attempts.filter(r=>eligibleKiting(r)&&r.variant===variant&&r.level===level&&!seen.has(r.attemptId)&&seen.add(r.attemptId)).sort((a,b)=>chronological(b,a)).slice(0,limit).reverse().map(r=>({attemptId:r.attemptId,date:r.completedAt,variant,level,value:r.score.score,accuracy:r.metrics.shots?r.metrics.hits/r.metrics.shots*100:null,score:r.score.score,outcome:r.endReason,scoringVersion:r.score.scoringVersion})));
}
