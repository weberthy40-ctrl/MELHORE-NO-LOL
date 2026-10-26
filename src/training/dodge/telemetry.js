import { MOVEMENT_SPEED } from '../movement.js';
import { sweptCircle } from './collision.js';
import { PLAYER_RADIUS } from './projectiles.js';
import { readonlySnapshot } from '../snapshot.js';
export const METRICS_VERSION='dodge-metrics-v1';
const KEYS=['qualified','dodged','hit','ignored','distance','movementSeconds','stationarySeconds'];
/** Bounded active identities and 120 compacted time buckets; no per-frame log. */
export function createDodgeTelemetry({session,mode,level,events}) {
  const attemptId=session.snapshot().id,active=new Map(),buckets=[];
  let emitted=0,qualified=0,dodged=0,hit=0,ignored=0,nonThreatening=0,distance=0,movementSeconds=0,stationarySeconds=0,riskDistance=0,highestId=0,risk=false,pendingEnd=null,final=null,disposed=false;
  function bucket(time=session.snapshot().elapsed){
    const start=Math.floor(Math.max(0,time-1e-8)/5)*5;
    if(!buckets.length||buckets.at(-1).start<start)buckets.push({start,end:start+5,...Object.fromEntries(KEYS.map(k=>[k,0]))});
    if(buckets.length>120){const first=buckets.shift(),next=buckets[0];next.start=first.start;for(const key of KEYS)next[key]+=first[key];}
    return buckets.find(b=>b.start<=start&&b.end>start)??buckets.at(-1);
  }
  function qualify(id){const item=active.get(id);if(item&&!item.qualified){item.qualified=true;qualified++;bucket().qualified++;}return item;}
  function accept(event){return !final&&!disposed&&event.attemptId===attemptId;}
  const unsubscribes=[
    events.on('dodge:spawn',event=>{if(!accept(event))return;const id=Number(event.id.split('-').at(-1));if(!Number.isInteger(id)||id<=highestId)return;highestId=id;emitted++;active.set(event.id,{qualified:false});}),
    events.on('dodge:trajectory',event=>{
      if(!accept(event)||!active.has(event.id))return;
      const start={x:event.from.x-event.playerFrom.x,z:event.from.z-event.playerFrom.z},end={x:event.to.x-event.playerTo.x,z:event.to.z-event.playerTo.z};
      if(sweptCircle(start,end,PLAYER_RADIUS+event.radius+1)!==null){qualify(event.id);risk=true;}
    }),
    events.on('dodge:damage',event=>{if(!accept(event))return;const item=qualify(event.attackId);if(!item)return;hit++;bucket().hit++;active.delete(event.attackId);}),
    events.on('dodge:impact',event=>{if(!accept(event))return;const item=qualify(event.id);if(!item)return;ignored++;bucket().ignored++;active.delete(event.id);}),
    events.on('dodge:removed',event=>{if(!accept(event))return;const item=active.get(event.id);if(!item)return;
      if(event.reason==='expired'){if(item.qualified){dodged++;bucket().dodged++;}else nonThreatening++;active.delete(event.id);}
    }),
    events.on('dodge:finished',event=>{if(accept(event)||(!final&&!disposed&&event.id===attemptId))pendingEnd=event.outcome;}),
  ];
  function collect(){return {attemptId,mode,level,metricsVersion:METRICS_VERSION,terminal:Boolean(pendingEnd),endReason:pendingEnd,elapsedActiveSeconds:session.snapshot().elapsed,
    attacksEmitted:emitted,threatsQualified:qualified,threatsDodged:dodged,threatsHit:hit,validHits:hit,contactsIgnored:ignored,attacksNonThreatening:nonThreatening,threatsUnresolved:[...active.values()].filter(v=>v.qualified).length,
    totalDistanceMoved:distance,activeMovementSeconds:movementSeconds,stationarySeconds,riskDistance,bucketSeconds:5,buckets};}
  return {isFinal:()=>Boolean(final),snapshot:()=>final??readonlySnapshot(collect()),
    step(dt,from,to){
      if(final||disposed)return;
      if(Number.isFinite(dt)&&dt>0&&dt<=.1+1e-8&&[from?.x,from?.z,to?.x,to?.z].every(Number.isFinite)){
        const moved=Math.hypot(to.x-from.x,to.z-from.z),measured=moved<=MOVEMENT_SPEED*dt+1e-6?moved:0,seconds=Math.min(dt,measured/MOVEMENT_SPEED);
        distance+=measured;movementSeconds+=seconds;stationarySeconds+=dt-seconds;if(risk)riskDistance+=measured;
        let start=session.snapshot().elapsed-dt;
        while(start<session.snapshot().elapsed-1e-10){const end=Math.min(session.snapshot().elapsed,(Math.floor((start+1e-8)/5)+1)*5),share=(end-start)/dt,b=bucket(end);b.distance+=measured*share;b.movementSeconds+=seconds*share;b.stationarySeconds+=(dt-seconds)*share;start=end;}
      }
      risk=false;if(pendingEnd){final=readonlySnapshot(collect());active.clear();}
    },
    dispose(){if(disposed)return;disposed=true;unsubscribes.forEach(fn=>fn());active.clear();},
  };
}
