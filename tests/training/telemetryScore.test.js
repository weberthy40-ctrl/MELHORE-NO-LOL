import { describe,it,expect } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { createSession } from '../../src/training/session.js';
import { createDodgeTelemetry,METRICS_VERSION } from '../../src/training/dodge/telemetry.js';
import { calculateDodgeScore } from '../../src/training/dodge/score.js';
function collector(){const core=createCore(),session=createSession({countdown:0,events:core.events});session.start();const metrics=createDodgeTelemetry({session,events:core.events,mode:'normal',level:1});
const emit=(type,payload)=>core.events.emit(`dodge:${type}`,{attemptId:session.snapshot().id,...payload});return {core,session,metrics,emit};}
describe('authoritative threat telemetry',()=>{
  it('does not turn far, pending or abandoned attacks into dodges',()=>{
    const a=collector();a.emit('spawn',{id:'projectile-1'});a.emit('removed',{id:'projectile-1',reason:'expired'});a.emit('spawn',{id:'projectile-2'});
    a.emit('trajectory',{id:'projectile-2',radius:.2,from:{x:-2,z:1},to:{x:2,z:1},playerFrom:{x:0,z:0},playerTo:{x:0,z:0}});
    a.emit('finished',{id:a.session.snapshot().id,outcome:'abandoned'});a.metrics.step(0,{x:0,z:0},{x:0,z:0});
    expect(a.metrics.snapshot()).toMatchObject({attacksEmitted:2,attacksNonThreatening:1,threatsQualified:1,threatsUnresolved:1,threatsDodged:0,endReason:'abandoned'});a.metrics.dispose();a.core.dispose();
  });
  it('counts a real dodge once, accepted damage once and immune contact separately',()=>{
    const a=collector();
    for(let i=1;i<=3;i++){
      const id=`projectile-${i}`;a.emit('spawn',{id});a.emit('trajectory',{id,radius:.3,from:{x:-3,z:1},to:{x:3,z:1},playerFrom:{x:0,z:0},playerTo:{x:0,z:0}});
      if(i===1)a.emit('removed',{id,reason:'expired'});
      if(i===2){a.emit('damage',{attackId:id});a.emit('impact',{id});}
      if(i===3)a.emit('impact',{id});
    }
    expect(a.metrics.snapshot()).toMatchObject({threatsQualified:3,threatsDodged:1,threatsHit:1,validHits:1,contactsIgnored:1,threatsUnresolved:0});
    a.metrics.dispose();a.core.dispose();
  });
  it('freezes terminal data and ignores resets or events from an old attempt',()=>{
    const a=collector();a.session.update(.1);a.metrics.step(.1,{x:0,z:0},{x:10,z:0});a.emit('spawn',{id:'projectile-1'});
    a.emit('finished',{id:a.session.snapshot().id,outcome:'defeat'});a.metrics.step(0,{x:0,z:0},{x:0,z:0});const final=a.metrics.snapshot();
    a.emit('spawn',{id:'projectile-2'});expect(a.metrics.snapshot()).toBe(final);expect(final.totalDistanceMoved).toBe(0);expect(Object.isFrozen(final.buckets)).toBe(true);expect(()=>JSON.stringify(final)).not.toThrow();a.metrics.dispose();a.core.dispose();
  });
});
function sample(){return {attemptId:'test',mode:'normal',level:1,metricsVersion:METRICS_VERSION,terminal:true,endReason:'victory',elapsedActiveSeconds:60,attacksEmitted:5,threatsQualified:5,threatsDodged:5,threatsHit:0,validHits:0,contactsIgnored:0,attacksNonThreatening:0,threatsUnresolved:0,totalDistanceMoved:14,activeMovementSeconds:2,stationarySeconds:58,riskDistance:4,
buckets:[{start:0,end:30,qualified:3,dodged:3,hit:0,ignored:0,distance:7,movementSeconds:1,stationarySeconds:29},{start:30,end:60,qualified:2,dodged:2,hit:0,ignored:0,distance:7,movementSeconds:1,stationarySeconds:29}]};}
describe('versioned score',()=>{
  it('computes a known value without mutating input',()=>{
    const m=sample(),before=structuredClone(m),score=calculateDodgeScore(m);expect(score.status).toBe('scored');expect(score.score).toBe(94);expect(m).toEqual(before);expect(calculateDodgeScore(m)).toEqual(score);expect(Object.isFrozen(score.components[0])).toBe(true);
  });
  it('refuses abandonment, missing samples and inconsistent windows',()=>{
    expect(calculateDodgeScore({...sample(),endReason:'abandoned'}).score).toBeNull();
    expect(calculateDodgeScore({...sample(),buckets:[]}).status).toBe('unscorable');
    expect(calculateDodgeScore({...sample(),metricsVersion:'unknown'}).status).toBe('unscorable');
    expect(calculateDodgeScore({...sample(),elapsedActiveSeconds:Infinity}).status).toBe('unscorable');
  });
  it('requires more than one resolved window instead of fabricating consistency',()=>{
    const m=sample();m.buckets=[{...m.buckets[0],end:60,qualified:5,dodged:5,distance:14,movementSeconds:2,stationarySeconds:58}];
    const s=calculateDodgeScore(m);expect(s.score).toBeNull();expect(s.reasons.join()).toContain('amostra insuficiente');
  });
});

it('survival time normalization is monotonic and mode weights stay fixed',()=>{
  const results=[20,60,120].map(time=>{
    const m=sample();m.mode='survival';m.endReason='defeat';m.elapsedActiveSeconds=time;m.validHits=1;m.threatsHit=1;m.threatsQualified=6;m.attacksEmitted=6;
    m.buckets[1].hit=1;m.buckets[1].qualified=3;m.stationarySeconds=time-2;
    m.buckets[0].end=time/2;m.buckets[1].start=time/2;m.buckets[1].end=time;
    m.buckets.forEach(b=>b.stationarySeconds=time/2-1);
    return calculateDodgeScore(m);
  });
  results.forEach(r=>{expect(r.status).toBe('scored');expect(r.components.reduce((n,c)=>n+c.weight,0)).toBe(100);});
  expect(results[0].components[0].index).toBeLessThan(results[1].components[0].index);expect(results[1].components[0].index).toBeLessThan(results[2].components[0].index);
});
