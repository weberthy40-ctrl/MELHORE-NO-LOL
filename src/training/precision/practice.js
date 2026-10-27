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
export function createPrecisionPractice({variant='single-static',rng=createRandom(),radius=1,speed=6,maxLifetime=null,level=1,playerPosition=()=>ARENA.center,clock,events,attemptId}={}){
 const config=PRECISION_VARIANTS[variant];if(typeof rng!=='function'||!Number.isInteger(level)||level<1||level>10||!Object.hasOwn(PRECISION_VARIANTS,variant)||!Number.isFinite(radius)||radius<=0||radius>2||!Number.isFinite(speed)||speed<0||(maxLifetime!==null&&(!Number.isFinite(maxLifetime)||maxLifetime<.3)))throw new TypeError('Invalid precision configuration.');
 const patternsSeen=new Set();
 let pattern=variant==='mixed'?'single-static':variant,patternElapsed=0,bag=[],groupTotal=0,groupsCompleted=0,priority=false,orderErrors=0;
 const activeConfig=()=>{const c=PRECISION_VARIANTS[pattern];return {...c,count:variant==='mixed'?4+Math.floor((level-1)*6/9):c.count};};
 let state='idle',hits=0,misses=0,expired=0,sequence=0,targets=[],fallback=false,visible=()=>true,histogram=Array(6).fill(0);
 const snapshot=()=>readonlySnapshot({kind:'precision',state,variant,pattern,patternElapsed,patternsSeen:[...patternsSeen],sequenceVersion:variant==='mixed'?'clear-group-v4':'legacy',priority,orderErrors,nextTargetId:priority?targets[0]?.id??null:null,groupTotal,groupRemaining:targets.length,groupsCompleted,hits,misses,expired,clicksEligible:hits+misses,accuracy:hits+misses?hits/(hits+misses):null,targets,fallback,histogram:clock?histogram:null});
 function valid(candidate){
   const {position,minX,maxX,radius:r,minZ=position.z,maxZ=position.z}=candidate,player=playerPosition();
   if(!isInsideArena(position)||minX<ARENA.bounds.minX+r||maxX>ARENA.bounds.maxX-r||minZ<ARENA.bounds.minZ+r||maxZ>ARENA.bounds.maxZ-r)return false;
   const nearest=Math.max(minX,Math.min(maxX,player.x));if(Math.hypot(nearest-player.x,Math.max(minZ,Math.min(maxZ,player.z))-player.z)<r+1.1)return false;
   if(targets.some(target=>Math.max(minZ,target.minZ??target.position.z)<=Math.min(maxZ,target.maxZ??target.position.z)+r+target.radius+.35&&Math.max(minX,target.minX)<=Math.min(maxX,target.maxX)+r+target.radius+.35))return false;
   return visible(candidate,targets);
 }
 function spawn(preferFirst=false,staticFallback=false){
   for(let attempt=0;attempt<32;attempt++){
     let x,z;
     if(preferFirst&&attempt===0){x=-3;z=-3;}else{const rx=rng(),rz=rng();if(![rx,rz].every(n=>Number.isFinite(n)&&n>=0&&n<1))throw new TypeError('Invalid target RNG.');x=(rx-.5)*(variant==='mixed'?22:12);z=variant==='mixed'?-5+rz*15:(rz-.5)*24;}
     const moving=activeConfig().moving&&!staticFallback;
     const motion=variant==='mixed'&&moving?(pattern==='single-moving'?'orbit':'zigzag'):'linear',extent=moving?(variant==='mixed'?.9:2):0,r=variant==='mixed'&&pattern==='multi-static'?radius*(.82+rng()*.28):radius;
     const candidate={age:0,position:{x:x+(motion==='orbit'?extent:0),z},center:{x,z},motion,motionTime:0,radius:r,moving,minX:x-extent,maxX:x+extent,minZ:z-(motion==='linear'?0:extent),maxZ:z+(motion==='linear'?0:extent),direction:1,zDirection:1};
     if(valid(candidate)){const target={...candidate,id:`target-${++sequence}`,order:targets.length+1};targets.push(target);return true;}
   }
   if(activeConfig().moving&&(activeConfig().count===1||variant==='mixed')&&!staticFallback){fallback=true;return spawn(preferFirst,true);}
   return false;
 }
 function changePattern(){
  if(!bag.length){bag=['single-static','single-moving','multi-static','multi-moving'];for(let i=bag.length-1;i>0;i--){const r=rng();if(!Number.isFinite(r)||r<0||r>=1)throw new TypeError('Invalid target RNG.');const j=Math.floor(r*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.at(-1)===pattern)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];}
  pattern=bag.pop();priority=(groupsCompleted+1)%(level>=7?2:3)===0;patternElapsed=0;targets=[];for(let i=0;i<activeConfig().count;i++)if(!spawn(i===0))break;fallback=targets.length<activeConfig().count;groupTotal=targets.length;if(targets.length)patternsSeen.add(pattern);
 }
 return {kind:'precision',snapshot,setProjectionValidator(validator){if(state==='active')throw new Error('Cannot change spawn rules during practice.');if(typeof validator!=='function')throw new TypeError('A projection validator is required.');visible=validator;},
   start(){if(state!=='idle')return false;if(variant==='mixed')changePattern();else for(let i=0;i<config.count;i++)if(!spawn(i===0))break;fallback=fallback||targets.length<activeConfig().count;state=targets.length?'active':'stopped';if(targets.length)patternsSeen.add(pattern);return targets.length>0;},
   hit(id){if(state!=='active'||!targets.some(t=>t.id===id))return false;if(priority&&targets[0].id!==id){misses++;orderErrors++;return false;}if(clock){const time=clock();if(!Number.isFinite(time)||time<0||time>60)throw new TypeError('Invalid hit time.');histogram[Math.min(5,Math.floor(time/10))]++;}const position={...targets.find(t=>t.id===id).position};targets=targets.filter(t=>t.id!==id);hits++;if(variant==='mixed'){if(!targets.length){groupsCompleted++;changePattern();}}else if(!spawn())fallback=true;events?.emit('precision:hit',readonlySnapshot({attemptId,targetId:id,position}));return true;},
   miss(){if(state!=='active')return false;misses++;return true;},
   update(delta){if(state!=='active')return;const dt=safeDelta(delta);if(variant==='mixed')patternElapsed+=dt;for(const target of [...targets]){if(maxLifetime!==null)target.age+=dt;if(maxLifetime!==null&&target.age>=maxLifetime&&!target.overdue){expired++;if(variant==='mixed')target.overdue=true;else{targets=targets.filter(t=>t.id!==target.id);if(!spawn())fallback=true;continue;}}if(target.moving&&target.motion==='orbit'){target.motionTime+=dt;const a=target.motionTime*speed*.65/.9;target.position.x=target.center.x+Math.cos(a)*.9;target.position.z=target.center.z+Math.sin(a)*.9;}else if(target.moving){if(target.motion==='zigzag'){const nextZ=reflectedPosition(target.position.z,target.zDirection,target.minZ,target.maxZ,speed*.63,delta);target.position.z=nextZ.x;target.zDirection=nextZ.direction;}const next=reflectedPosition(target.position.x,target.direction,target.minX,target.maxX,speed,delta);target.position.x=next.x;target.direction=next.direction;}}},
   stop(){if(state==='disposed')return;state='stopped';targets=[];},
   reset(){if(state==='disposed')return;state='idle';hits=misses=expired=0;histogram=Array(6).fill(0);targets=[];fallback=false;patternElapsed=groupTotal=groupsCompleted=orderErrors=0;priority=false;bag=[];patternsSeen.clear();},
   dispose(){state='disposed';targets=[];},
 };
}
