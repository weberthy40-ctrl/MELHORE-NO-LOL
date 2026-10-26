import { readonlySnapshot } from '../snapshot.js';
import { safeDelta } from '../movement.js';
import { createRandom } from '../../core/random.js';
import { REFLEX_VARIANTS,REFLEX_CUES,reflexDifficulty } from './difficulty.js';
/** A bounded balanced bag, randomly choosing among slots that do not exceed three repeats. */
export function createCueBag(variant,rng){
 if(!Object.hasOwn(REFLEX_VARIANTS,variant))throw new TypeError('Invalid reflex variant.');
 const counts=variant==='integrated'?{Space:2,KeyQ:2,KeyW:2,KeyE:2,KeyR:2,KeyF:1,KeyJ:1,MouseGreen:2,MouseBlue:2,MouseStop:2,go:2,noGo:2}:variant==='mixed'?{Space:2,KeyQ:2,KeyW:2,KeyE:2,KeyR:2,ArrowUp:1,ArrowDown:1,ArrowLeft:1,ArrowRight:1,go:2,noGo:2}:variant==='simple'?{Space:5}:variant==='choice'?{KeyF:4,KeyJ:4}:variant==='inhibition'?{go:8,noGo:4}:{ArrowUp:4,ArrowDown:4,ArrowLeft:4,ArrowRight:4},bag=[];
 while(Object.values(counts).some(n=>n>0)){
  const choices=Object.keys(counts).filter(key=>{
   if(counts[key]===0)return false;if(variant==='simple')return true;
   let tail=0;for(let i=bag.length-1;i>=0&&bag[i]===key;i--)tail++;if(tail>=3)return false;
   const after={...counts,[key]:counts[key]-1},remaining=Object.values(after).reduce((n,v)=>n+v,0);
   return Object.entries(after).every(([other,count])=>count<=3*(remaining-count+1)-(other===key?tail+1:0));
  });
  if(!choices.length)throw new Error('No balanced cue ordering is possible.');
  const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Invalid reflex RNG.');const key=choices[Math.floor(n*choices.length)];bag.push(key);counts[key]--;
 }
 return Object.freeze(bag);
}
export function summarizeReactions(rounds,extraAnticipations=0){
 const times=rounds.filter(r=>r.status==='correct'&&r.reactionMs!==null).map(r=>r.reactionMs),sorted=[...times].sort((a,b)=>a-b),correct=rounds.filter(r=>['correct','inhibited'].includes(r.status)).length,opportunities=rounds.length+extraAnticipations;
 return readonlySnapshot({opportunities,presented:rounds.filter(r=>r.presented).length,correct,wrong:rounds.filter(r=>r.status==='wrong').length,omissions:rounds.filter(r=>r.status==='missed').length,commissions:rounds.filter(r=>r.status==='commission').length,anticipations:rounds.filter(r=>r.status==='anticipated').length+extraAnticipations,inhibited:rounds.filter(r=>r.status==='inhibited').length,goPresented:rounds.filter(r=>r.presented&&['go','MouseGreen','MouseBlue'].includes(r.cue)).length,noGoPresented:rounds.filter(r=>r.presented&&['noGo','MouseStop'].includes(r.cue)).length,accuracy:opportunities?correct/opportunities:null,reactionTimes:times,meanMs:times.length?times.reduce((n,v)=>n+v,0)/times.length:null,bestMs:sorted[0]??null,medianMs:sorted.length?(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2:null});
}
/** Waiting uses shared simulation delta; latency uses an injected monotonic presentation clock. */
export function createReflexExercise({variant='simple',level=1,technical=true,rng=createRandom(),now,isRunning=()=>true,events,attemptId}={}){
 if(typeof now!=='function')throw new TypeError('A monotonic clock is required.');const config=reflexDifficulty(level,variant,{technical});let state='idle',phase='idle',rounds=[],bag=[],slot=0,delay=0,waited=0,inter=0,extraAnticipations=0,cue=null,presentedAt=null,lastRaw=now(),pausedAt=lastRaw,pausedTotal=0,lastResume=lastRaw,running=false;
 if(!Number.isFinite(lastRaw)||lastRaw<0)throw new TypeError('Invalid monotonic clock.');
 function raw(){const value=now();if(!Number.isFinite(value)||value<lastRaw)throw new TypeError('Invalid monotonic clock.');lastRaw=value;return value;}
 const activeAt=time=>time-pausedTotal-(running?0:time-pausedAt);
 function sampleDelay(){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new TypeError('Invalid reflex RNG.');return config.waitMin+n*(config.waitMax-config.waitMin);}
 function next(){if(config.rounds!==null&&rounds.length>=config.rounds){state='completed';phase='completed';cue=null;return;}if(slot>=bag.length){bag=createCueBag(variant,rng);slot=0;}cue=bag[slot];delay=sampleDelay();waited=0;phase='waiting';presentedAt=null;}
 function finish(status,reactionMs=null,response=null){if(!['waiting','cue-visible'].includes(phase))return false;rounds.push(readonlySnapshot({index:rounds.length+1,cue,status,response,reactionMs,presented:phase==='cue-visible',delayMs:delay,responseWindow:config.responseWindow}));slot++;phase='inter-round';inter=0;presentedAt=null;events?.emit('reflex:response',readonlySnapshot({attemptId,status,index:rounds.length}));return true;}
 function expire(time){if(phase==='cue-visible'&&activeAt(time)-presentedAt>=config.responseWindow){finish(REFLEX_CUES[cue].answer===null?'inhibited':'missed');return true;}return false;}
 return {kind:'reflex',config,snapshot:()=>readonlySnapshot({state,phase,variant,config,round:rounds.length+1,rounds,summary:summarizeReactions(rounds,extraAnticipations),cue:['cue-pending','cue-visible'].includes(phase)?REFLEX_CUES[cue]:null,partialRound:state==='stopped'&&phase==='cue-visible'&&presentedAt!==null?{cue,presented:true,excluded:true}:null}),
 start(){if(state!=='idle')return false;state='active';next();return true;},
 setRunning(value){const time=raw();if(Boolean(value)===running)return;if(value){pausedTotal+=time-pausedAt;lastResume=time;}else pausedAt=time;running=Boolean(value);},
 present(){if(state!=='active'||phase!=='cue-pending'||!running||!isRunning())return false;presentedAt=activeAt(raw());phase='cue-visible';return true;},
 respond(code,timestamp=now()){
  if(state!=='active'||!running||!isRunning()||!REFLEX_VARIANTS[variant].keys.includes(code)||!Number.isFinite(timestamp)||timestamp<lastResume||timestamp>now()+1)return false;
  if(phase==='waiting'){
   if(variant==='inhibition'){extraAnticipations++;waited=0;delay=sampleDelay();return true;}
   return finish('anticipated',null,code);
  }
  if(phase!=='cue-visible'||expire(timestamp))return false;const latency=activeAt(timestamp)-presentedAt;if(!Number.isFinite(latency)||latency<0||latency>=config.responseWindow)return false;
  return finish(REFLEX_CUES[cue].answer===null?'commission':REFLEX_CUES[cue].answer===code?'correct':'wrong',REFLEX_CUES[cue].answer===null?null:latency,code);
 },
 update(delta){if(state!=='active'||!running||!isRunning())return;const dt=safeDelta(delta)*1000;if(!dt)return;const time=raw();if(phase==='waiting'){waited+=dt;if(waited>=delay)phase='cue-pending';}else if(phase==='cue-visible')expire(time);else if(phase==='inter-round'){inter+=dt;if(inter>=config.interRound)next();}},
 stop(){if(state==='disposed')return;state='stopped';},dispose(){state='disposed';phase='disposed';cue=null;},
 };
}
