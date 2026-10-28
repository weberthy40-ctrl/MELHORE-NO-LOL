import { VARIANTS } from './projectiles.js';
/** A six-second in-memory ring at 20 Hz, plus the real terminal sample; no storage or scoring. */
export function createDodgeReplay({seconds=6,sampleInterval=.05}={}){
 if(!Number.isFinite(seconds)||seconds<1||seconds>8||!Number.isFinite(sampleInterval)||sampleInterval<.04||sampleInterval>.2)throw new TypeError('Invalid replay window.');
 const limit=Math.ceil(seconds/sampleInterval)+1;
 let frames=[],markers=[],last=-Infinity,counts={},finished=false;
 function capture(snapshot,player,angle=0,terminal=false){
  const time=snapshot?.elapsed;
  if(finished||!Number.isFinite(time)||time<0||time<last||!Array.isArray(snapshot.projectiles)||snapshot.projectiles.length>20||![player?.x,player?.z,angle].every(Number.isFinite)||!terminal&&time-last<sampleInterval-1e-8)return false;
  const frame=Object.freeze({time,player:Object.freeze({...player}),angle,snapshot:Object.freeze({kind:'dodge',level:snapshot.level,elapsed:time,projectiles:snapshot.projectiles})});
  // Same-time terminal state replaces the sample without mutating an earlier snapshot.
  if(time===last)frames[frames.length-1]=frame;else frames.push(frame);
  last=time;
  while(frames.length>limit||frames[0]?.time<time-seconds-1e-8)frames.shift();
  markers=markers.filter(m=>m.time>=time-seconds);
  return true;
 }
 return {
  capture(snapshot,player,angle=0){return capture(snapshot,player,angle);},
  finish(snapshot,player,angle=0){if(!capture(snapshot,player,angle,true))return false;finished=true;return true;},
  mark({time,variant,id}){if(finished||!Number.isFinite(time)||typeof variant!=='string'||!Object.hasOwn(VARIANTS,variant))return;counts[variant]=(counts[variant]??0)+1;markers.push(Object.freeze({time,variant,id}));markers=markers.slice(-160);},
  snapshot:()=>Object.freeze({frames:Object.freeze([...frames]),markers:Object.freeze([...markers]),counts:Object.freeze({...counts}),seconds}),
  clear(){frames=[];markers=[];counts={};last=-Infinity;finished=false;},
 };
}
