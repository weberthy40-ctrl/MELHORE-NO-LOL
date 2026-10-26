import { validateAttemptRecord } from '../persistence/attemptRecord.js';
import { readonlySnapshot } from '../training/snapshot.js';
export const ACHIEVEMENTS=Object.freeze([
 ['first','Primeiros Passos','Conclua uma tentativa oficial de Esquiva.'],
 ['victory','Primeira Vitória','Vença uma tentativa de Esquiva Normal.'],
 ['untouched','Intocável','Vença Normal com zero impactos válidos.'],
 ['survival30','Sobrevivente 30','Sobreviva por pelo menos 30 segundos.'],
 ['survival60','Sobrevivente 60','Sobreviva por pelo menos 60 segundos.'],
 ['explorer','Explorador da Esquiva','Conclua tentativas em três níveis distintos.'],
].map(([id,title,description])=>Object.freeze({id,title,description})));
const chronological=(a,b)=>{const dateOrder=Date.parse(a.completedAt)-Date.parse(b.completedAt);return dateOrder||(a.attemptId<b.attemptId?-1:a.attemptId>b.attemptId?1:0);};
export function eligibleRecord(record){if(record?.modality!=='dodge')return false;try{validateAttemptRecord(record);return true;}catch{return false;}}
export function compareRecord(a,b){
  const primary=a.mode==='survival'?b.metrics.elapsedActiveSeconds-a.metrics.elapsedActiveSeconds:b.score.score-a.score.score;
  return primary||(a.mode==='survival'?b.score.score-a.score.score:0)||chronological(a,b);
}
/** Streaming aggregation retains 20 recordists, 30 rating samples and 10 first-level dates. */
export function createDodgeProgress(){
 const records=new Map(),evidence=new Map(),levelFirst=new Map(),first=new Map();let total=0;
 function mark(id,record){if(!first.has(id)||chronological(record,first.get(id))<0)first.set(id,record);}
 return {add(record){
   if(!eligibleRecord(record))return;total++;
   const key=`${record.mode}:${record.level}`;if(!records.has(key)||compareRecord(record,records.get(key))<0)records.set(key,record);
   mark('first',record);
   if(record.mode==='normal'&&record.endReason==='victory'){mark('victory',record);if(record.metrics.validHits===0)mark('untouched',record);}
   if(record.mode==='survival'){if(record.metrics.elapsedActiveSeconds>=30)mark('survival30',record);if(record.metrics.elapsedActiveSeconds>=60)mark('survival60',record);}
   if(!levelFirst.has(record.level)||chronological(record,levelFirst.get(record.level))<0)levelFirst.set(record.level,record);
   if(record.mode==='normal'){
     if(!evidence.has(record.level))evidence.set(record.level,{count:0,recent:[]});const item=evidence.get(record.level);item.count++;item.recent.push(record);item.recent.sort((a,b)=>chronological(b,a));item.recent=item.recent.slice(0,3);
   }
 },snapshot(){
   const explorer=[...levelFirst.values()].sort(chronological)[2];if(explorer)mark('explorer',explorer);
   const evidenceByLevel=Array.from({length:10},(_,index)=>{
     const level=index+1,item=evidence.get(level)??{count:0,recent:[]},wins=item.recent.filter(r=>r.endReason==='victory').length;
     const median=item.recent.length===3?item.recent.map(r=>r.score.score).sort((a,b)=>a-b)[1]:null;
     return {level,count:item.count,attemptIds:item.recent.map(r=>r.attemptId),wins,median,demonstrated:item.recent.length===3&&wins>=2&&median>=60};
   });
   const rating=evidenceByLevel.filter(e=>e.demonstrated).at(-1)?.level??null;
   return readonlySnapshot({total,records:[...records.values()],achievements:ACHIEVEMENTS.map(a=>({...a,unlocked:first.has(a.id),completedAt:first.get(a.id)?.completedAt??null})),rating:{ratingVersion:'1',rating,status:rating===null?'insufficient-data':'classified',totalEligibleAttempts:[...evidence.values()].reduce((n,e)=>n+e.count,0),evidenceByLevel}});
 }};
}
export function calculateDodgeProgress(attempts){const progress=createDodgeProgress(),seen=new Set();for(const attempt of attempts){if(seen.has(attempt?.attemptId))continue;seen.add(attempt?.attemptId);progress.add(attempt);}return progress.snapshot();}
export function prepareEvolution(attempts,{mode='normal',level=1,limit=30}={}){
 if(!['normal','survival'].includes(mode)||!Number.isInteger(level)||level<1||level>10||![10,30,100].includes(limit))throw new TypeError('Invalid evolution filters.');
 const seen=new Set();return readonlySnapshot(attempts.filter(r=>eligibleRecord(r)&&r.mode===mode&&r.level===level&&!seen.has(r.attemptId)&&seen.add(r.attemptId)).sort((a,b)=>chronological(b,a)).slice(0,limit).reverse().map(r=>({attemptId:r.attemptId,date:r.completedAt,mode,level,value:mode==='normal'?r.score.score:r.metrics.elapsedActiveSeconds,score:r.score.score,outcome:r.endReason,scoringVersion:r.score.scoringVersion})));
}
