import { validateReflexRecord } from '../persistence/reflexRecord.js';
import { readonlySnapshot } from '../training/snapshot.js';
import { REFLEX_VARIANTS } from '../training/reflex/difficulty.js';
export const REFLEX_ACHIEVEMENTS=readonlySnapshot([
 ['first','Primeira Resposta','Conclua e salve um treino oficial.'],['ten','Atenção Constante','Conclua dez treinos oficiais distintos.'],['all','Quatro Desafios','Conclua os quatro exercícios oficiais.'],['accurate','Resposta Precisa','Acerte pelo menos 90% de cinco ou mais oportunidades.'],['ninety','Em Sintonia','Alcance nota oficial de pelo menos 90.'],['ten-seventy','Sob Pressão','Alcance nota de pelo menos 70 no nível 10.'],
].map(([key,title,description])=>({id:`reflex:${key}`,title,description})));
const chronological=(a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt)||(a.attemptId<b.attemptId?-1:a.attemptId>b.attemptId?1:0);
export function eligibleReflex(r){try{validateReflexRecord(r);return true;}catch{return false;}}
export function createReflexProgress(){
 let total=0,sum=0,best=null;const first=new Map(),variants=new Map(),earliest=[],latest=[],records=new Map(),evidence=new Map(),mixedEvidence=new Map();
 function mark(id,r){const key=`reflex:${id}`;if(!first.has(key)||chronological(r,first.get(key))<0)first.set(key,r);}
 return {add(r){if(!eligibleReflex(r))return;total++;sum+=r.score.score;best=best===null?r.score.score:Math.max(best,r.score.score);earliest.push(r);earliest.sort(chronological);earliest.length=Math.min(10,earliest.length);latest.push(r);latest.sort((a,b)=>chronological(b,a));latest.length=Math.min(5,latest.length);
  const key=`${r.variant}:${r.level}`,old=records.get(key);if(!old||r.score.score>old.score.score||(r.score.score===old.score.score&&chronological(r,old)<0))records.set(key,r);
  if(!variants.has(r.variant)||chronological(r,variants.get(r.variant))<0)variants.set(r.variant,r);if(r.metrics.summary.opportunities>=5&&r.metrics.summary.accuracy>=.9)mark('accurate',r);if(r.score.score>=90)mark('ninety',r);if(r.level===10&&r.score.score>=70)mark('ten-seventy',r);
  if(['simple','mixed'].includes(r.variant)){const pool=r.variant==='mixed'?mixedEvidence:evidence;if(!pool.has(r.level))pool.set(r.level,{count:0,recent:[]});const e=pool.get(r.level);e.count++;e.recent.push(r);e.recent.sort((a,b)=>chronological(b,a));e.recent.length=Math.min(3,e.recent.length);}
 },snapshot(){
  if(earliest[0])mark('first',earliest[0]);if(earliest[9])mark('ten',earliest[9]);const all=[...variants.values()].filter(r=>r.variant!=='mixed').sort(chronological);if(all.length===4)mark('all',all[3]);
  const reference=[...mixedEvidence.values()].some(e=>e.count>=3)?mixedEvidence:evidence,referenceVariant=reference===mixedEvidence?'mixed':'simple';
  const evidenceByLevel=Array.from({length:10},(_,i)=>{const e=reference.get(i+1)??{count:0,recent:[]},scores=e.recent.map(r=>r.score.score),median=scores.length===3?[...scores].sort((a,b)=>a-b)[1]:null;return {level:i+1,count:e.count,attemptIds:e.recent.map(r=>r.attemptId),scores,median,demonstrated:scores.length===3&&median>=60};}),rating=evidenceByLevel.filter(e=>e.demonstrated).at(-1)?.level??null;
  return readonlySnapshot({total,records:[...records.values()],achievements:REFLEX_ACHIEVEMENTS.map(a=>({...a,unlocked:first.has(a.id),completedAt:first.get(a.id)?.completedAt??null})),stats:{total,bestScore:best,meanScore:total?sum/total:null,latestScore:latest[0]?.score.score??null,recentFiveMean:latest.length?latest.reduce((n,r)=>n+r.score.score,0)/latest.length:null},rating:{ratingVersion:'1',rating,status:rating===null?'insufficient-data':'classified',referenceVariant,evidenceByLevel}});
 }};
}
export function calculateReflexProgress(attempts){const p=createReflexProgress(),seen=new Set();for(const r of attempts){if(seen.has(r?.attemptId))continue;seen.add(r?.attemptId);p.add(r);}return p.snapshot();}
export function prepareReflexEvolution(attempts,{variant='simple',level=1,limit=30}={}){
 if(!Object.hasOwn(REFLEX_VARIANTS,variant)||!Number.isInteger(level)||level<1||level>10||![10,30,100].includes(limit))throw new TypeError('Invalid reflex filters.');const seen=new Set();return readonlySnapshot(attempts.filter(r=>eligibleReflex(r)&&r.variant===variant&&r.level===level&&!seen.has(r.attemptId)&&seen.add(r.attemptId)).sort((a,b)=>chronological(b,a)).slice(0,limit).reverse().map(r=>({attemptId:r.attemptId,date:r.completedAt,variant,level,value:r.score.score,meanMs:r.metrics.summary.meanMs,accuracy:null,score:r.score.score,outcome:r.endReason,scoringVersion:r.score.scoringVersion})));
}
