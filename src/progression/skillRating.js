import { validateAttemptRecord } from '../persistence/attemptRecord.js';
import { MAX_DODGE_LEVEL } from '../training/dodge/constants.js';
import { readonlySnapshot } from '../training/snapshot.js';
export const RATING_VERSION='trainer-rating-v1';
export const RATING_WINDOW=20;
export const RANKS=Object.freeze([
 ['ferro','Ferro',0,'#a6a6a2'],['bronze','Bronze',600,'#ce9368'],['prata','Prata',1400,'#c0d5e0'],['ouro','Ouro',2300,'#eed078'],['platina','Platina',3300,'#74d9d1'],['esmeralda','Esmeralda',4400,'#68e4a4'],['diamante','Diamante',5600,'#91beff'],['mestre','Mestre',6800,'#c799ff'],['grao-mestre','Grão-Mestre',7800,'#ff8a95'],['desafiante','Desafiante',8800,'#f6cb70'],['profissional','Profissional',9600,'#b1f479'],
].map(([id,name,minimum,color])=>Object.freeze({id,name,minimum,color})));
const clamp=n=>Math.max(0,Math.min(1,n));
export function rankForPoints(points){
 if(!Number.isFinite(points)||points<0||points>10000)throw new RangeError('Pontos fora da escala.');
 const index=RANKS.findLastIndex(rank=>points>=rank.minimum),rank=RANKS[index],next=RANKS[index+1]??null;
 return readonlySnapshot({...rank,next,remaining:next?next.minimum-points:0,progress:next?(points-rank.minimum)/(next.minimum-rank.minimum):1});
}
/** A hard round needs demonstrated performance. Repeating an easy round never adds XP. */
export function pointsForAttempt(record){
 validateAttemptRecord(record);const m=record.metrics,maximum=record.modality==='dodge'?MAX_DODGE_LEVEL:10;
 const difficulty=(record.level-1)/(maximum-1),base=600+9400*difficulty**.9;
 let quality=clamp(record.score.score/90),sample=Math.min(1,m.elapsedActiveSeconds/30),context=1;
 if(record.modality==='dodge'){
  const resolved=m.threatsDodged+m.threatsHit+m.contactsIgnored;
  quality=resolved>0 ? .7*m.threatsDodged/resolved+.3*clamp(m.elapsedActiveSeconds/60):0;sample=Math.min(sample,resolved/8);
 }else if(record.modality==='precision'){sample=Math.min(sample,m.clicksEligible/20);if(record.variant!=='mixed')context=.7;}
 else if(record.modality==='kiting'){sample=Math.min(sample,m.shots/10,m.hits/6);if(record.variant!=='combat')context=.7;}
 else{sample=Math.min(sample,m.summary.presented/12);if(record.variant!=='mixed')context=.7;}
 return Math.round(base*quality*clamp(sample)*context);
}
export function createSkillRating(modality){
 const recent=[];
 return {add(record){if(record?.modality!==modality)return;try{const points=pointsForAttempt(record);if(recent.some(r=>r.attemptId===record.attemptId))return;recent.push({attemptId:record.attemptId,completedAt:record.completedAt,points});recent.sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt)||(b.attemptId>a.attemptId?1:-1));recent.splice(RATING_WINDOW);}catch{/* Invalid records never become points. */}},snapshot(){
  if(!recent.length)return readonlySnapshot({version:RATING_VERSION,points:null,rank:null,samples:0,provisional:true});
  let sum=0,weight=0;for(const [index,item]of recent.entries()){const w=.9**index;sum+=item.points*w;weight+=w;}const points=Math.round(sum/weight);
  return readonlySnapshot({version:RATING_VERSION,points,rank:rankForPoints(points),samples:recent.length,provisional:recent.length<5,latestPoints:recent[0].points});
 }};
}
export function overallSkillRating(ratings){
 const available=ratings.filter(r=>r?.points!==null&&Number.isFinite(r?.points)),points=available.length?Math.round(available.reduce((sum,r)=>sum+r.points,0)/available.length):null;
 return readonlySnapshot({version:RATING_VERSION,points,rank:points===null?null:rankForPoints(points),covered:available.length,total:4,partial:available.length<4,provisional:available.length<4||available.some(r=>r.provisional)});
}
