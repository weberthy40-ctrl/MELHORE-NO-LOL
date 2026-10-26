import { ARENA,isInsideArena } from '../../game3d/spatial.js';
import { safeDelta } from '../movement.js';
import { readonlySnapshot } from '../snapshot.js';
import { createRandom } from '../../core/random.js';
export const PRECISION_VARIANTS=Object.freeze({
 mixed:Object.freeze({label:'Precisão mista',count:1,moving:true}),
 'single-static':Object.freeze({label:'Alvo estático',count:1,moving:false}),
 'single-moving':Object.freeze({label:'Alvo móvel',count:1,moving:true}),
 'multi-static':Object.freeze({label:'Múltiplos alvos',count:3,moving:false}),
 'multi-moving':Object.freeze({label:'Múltiplos alvos móveis',count:3,moving:true}),
});
export function reflectedPosition(x,direction,min,max,speed,delta){
 if(![x,direction,min,max,speed].every(Number.isFinite)||min>=max||speed<0)throw new TypeError('Invalid reflected trajectory.');
 const span=max-min,phase=((direction>=0?x-min:2*span-(x-min))+speed*safeDelta(delta))%(2*span);
 return {x:phase<=span?min+phase:max-(phase-span),direction:phase<span?1:-1};
}
/** Target data and counters are independent of DOM, renderer and official persistence. */
export function createPrecisionPractice({variant='single-static',rng=createRandom(),radius=1,speed=6,maxLifetime=null,level=1,patternSeconds=5,playerPosition=()=>ARENA.center,clock,events,attemptId}={}){
 const config=PRECISION_VARIANTS[variant];if(typeof rng!=='function'||!Number.isInteger(level)||level<1||level>10||!Number.isFinite(patternSeconds)||patternSeconds<=0||!Object.hasOwn(PRECISION_VARIANTS,variant)||!Number.isFinite(radius)||radius<=0||radius>2||!Number.isFinite(speed)||speed<0||(maxLifetime!==null&&(!Number.isFinite(maxLifetime)||maxLifetime<.3)))throw new TypeError('Invalid precision configuration.');
 const patternsSeen=new Set();
 let pattern=variant==='mixed'?'single-static':variant,patternElapsed=0,bag=[];
 const activeConfig=()=>{const c=PRECISION_VARIANTS[pattern];return {...c,count:variant==='mixed'&&c.count>1?Math.min(5,2+Math.floor(level/3)):c.count};};
 let state='idle',hits=0,misses=0,expired=0,sequence=0,targets=[],fallback=false,visible=()=>true,histogram=Array(6).fill(0);
 const snapshot=()=>readonlySnapshot({kind:'precision',state,variant,pattern,patternElapsed,patternsSeen:[...patternsSeen],hits,misses,expired,clicksEligible:hits+misses,accuracy:hits+misses?hits/(hits+misses):null,targets,fallback,histogram:clock?histogram:null});
 function valid(candidate){
   const {position,minX,maxX}=candidate,player=playerPosition();
   if(!isInsideArena(position)||minX<ARENA.bounds.minX+radius||maxX>ARENA.bounds.maxX-radius||Math.abs(position.z)>ARENA.length/2-radius)return false;
   const nearest=Math.max(minX,Math.min(maxX,player.x));if(Math.hypot(nearest-player.x,position.z-player.z)<radius+1.1)return false;
   if(targets.some(target=>Math.abs(target.position.z-position.z)<2*radius+.6&&Math.max(minX,target.minX)<=Math.min(maxX,target.maxX)+2*radius+.5))return false;
   return visible(candidate,targets);
 }
 function spawn(preferFirst=false,staticFallback=false){
   for(let attempt=0;attempt<32;attempt++){
     let x,z;
     if(preferFirst&&attempt===0){x=-3;z=-3;}else{const rx=rng(),rz=rng();if(![rx,rz].every(n=>Number.isFinite(n)&&n>=0&&n<1))throw new TypeError('Invalid target RNG.');x=(rx-.5)*12;z=(rz-.5)*24;}
     const moving=activeConfig().moving&&!staticFallback;
     const candidate={age:0,position:{x,z},radius,moving,minX:x-(moving?2:0),maxX:x+(moving?2:0),direction:1};
     if(valid(candidate)){const target={...candidate,id:`target-${++sequence}`};targets.push(target);return true;}
   }
   if(activeConfig().moving&&activeConfig().count===1&&!staticFallback){fallback=true;return spawn(preferFirst,true);}
   return false;
 }
 function changePattern(){
  if(!bag.length){bag=['single-static','single-moving','multi-static','multi-moving'];for(let i=bag.length-1;i>0;i--){const r=rng();if(!Number.isFinite(r)||r<0||r>=1)throw new TypeError('Invalid target RNG.');const j=Math.floor(r*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.at(-1)===pattern)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];}
  pattern=bag.pop();patternElapsed=0;targets=[];for(let i=0;i<activeConfig().count;i++)if(!spawn(i===0))break;fallback=targets.length<activeConfig().count;if(targets.length)patternsSeen.add(pattern);
 }
 return {kind:'precision',snapshot,setProjectionValidator(validator){if(state==='active')throw new Error('Cannot change spawn rules during practice.');if(typeof validator!=='function')throw new TypeError('A projection validator is required.');visible=validator;},
   start(){if(state!=='idle')return false;if(variant==='mixed')changePattern();else for(let i=0;i<config.count;i++)if(!spawn(i===0))break;fallback=fallback||targets.length<activeConfig().count;state=targets.length?'active':'stopped';if(targets.length)patternsSeen.add(pattern);return targets.length>0;},
   hit(id){if(state!=='active'||!targets.some(t=>t.id===id))return false;if(clock){const time=clock();if(!Number.isFinite(time)||time<0||time>60)throw new TypeError('Invalid hit time.');histogram[Math.min(5,Math.floor(time/10))]++;}const position={...targets.find(t=>t.id===id).position};targets=targets.filter(t=>t.id!==id);hits++;if(!spawn())fallback=true;events?.emit('precision:hit',readonlySnapshot({attemptId,targetId:id,position}));return true;},
   miss(){if(state!=='active')return false;misses++;return true;},
   update(delta){if(state!=='active')return;const dt=safeDelta(delta);if(variant==='mixed'){patternElapsed+=dt;if(patternElapsed>=patternSeconds)changePattern();}for(const target of [...targets]){if(maxLifetime!==null)target.age+=dt;if(maxLifetime!==null&&target.age>=maxLifetime){targets=targets.filter(t=>t.id!==target.id);expired++;if(!spawn())fallback=true;continue;}if(target.moving){const next=reflectedPosition(target.position.x,target.direction,target.minX,target.maxX,speed,delta);target.position.x=next.x;target.direction=next.direction;}}},
   stop(){if(state==='disposed')return;state='stopped';targets=[];},
   reset(){if(state==='disposed')return;state='idle';hits=misses=expired=0;histogram=Array(6).fill(0);targets=[];fallback=false;patternElapsed=0;bag=[];patternsSeen.clear();},
   dispose(){state='disposed';targets=[];},
 };
}
