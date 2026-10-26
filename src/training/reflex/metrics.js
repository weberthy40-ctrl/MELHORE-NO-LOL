import { REFLEX_VARIANTS,REFLEX_CUES,reflexDifficulty } from './difficulty.js';
import { summarizeReactions } from './exercise.js';
export const REFLEX_METRICS_VERSION='reflex-metrics-v1';
export function validReflexMetrics(m,{official=true}={}){
 if(!m||m.modality!=='reflex'||m.metricsVersion!==REFLEX_METRICS_VERSION||!Object.hasOwn(REFLEX_VARIANTS,m.variant)||typeof m.attemptId!=='string'||!m.attemptId.trim()||!Array.isArray(m.rounds)||m.rounds.length>250||!Number.isInteger(m.extraAnticipations)||m.extraAnticipations<0||(!['inhibition'].includes(m.variant)&&m.extraAnticipations!==0))return false;
 if(official&&(m.origin!=='official'||!m.terminal||m.endReason!=='completed'||m.elapsedActiveSeconds!==60))return false;
 let config;try{config=reflexDifficulty(m.level,m.variant);}catch{return false;}
 if(!m.config||Object.entries(config).some(([key,value])=>m.config[key]!==value))return false;
 const cues={integrated:['Space','KeyQ','KeyW','KeyE','KeyR','KeyF','KeyJ','MouseGreen','MouseBlue','MouseStop','go','noGo'],mixed:['Space','KeyQ','KeyW','KeyE','KeyR','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','go','noGo'],simple:['Space'],choice:['KeyF','KeyJ'],inhibition:['go','noGo'],direction:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']}[m.variant];
 for(const [i,r]of m.rounds.entries()){
  if(r?.index!==i+1||!cues.includes(r.cue)||!['correct','wrong','missed','anticipated','inhibited','commission'].includes(r.status)||r.responseWindow!==config.responseWindow||!Number.isFinite(r.delayMs)||r.delayMs<config.waitMin||r.delayMs>config.waitMax)return false;
  const timed=['correct','wrong'].includes(r.status),acted=timed||r.status==='commission'||r.status==='anticipated';
  if(typeof r.presented!=='boolean'||r.presented===(r.status==='anticipated')||(acted?!REFLEX_VARIANTS[m.variant].keys.includes(r.response):r.response!==null)||(timed?(!Number.isFinite(r.reactionMs)||r.reactionMs<0||r.reactionMs>=config.responseWindow):r.reactionMs!==null))return false;
  if(['mixed','integrated'].includes(m.variant)){
   if(r.status!=='anticipated'&&(REFLEX_CUES[r.cue].answer===null?!['inhibited','commission'].includes(r.status):!['correct','wrong','missed'].includes(r.status)))return false;
  }else if(m.variant==='inhibition'){
   if(r.status==='anticipated'||(REFLEX_CUES[r.cue].answer===null?!['inhibited','commission'].includes(r.status):!['correct','missed'].includes(r.status)))return false;
  }else if(['inhibited','commission'].includes(r.status))return false;
  const expected=REFLEX_CUES[r.cue].answer;if(timed&&((r.status==='correct')!==(r.response===expected)))return false;
 }
 const summary=summarizeReactions(m.rounds,m.extraAnticipations);
 return m.summary&&Object.entries(summary).every(([key,value])=>Array.isArray(value)?Array.isArray(m.summary[key])&&value.length===m.summary[key].length&&value.every((v,i)=>v===m.summary[key][i]):m.summary[key]===value);
}
