import { describe,it,expect } from 'vitest';
import { recordFixture } from '../fixtures/record.js';
import { calculateDodgeProgress,prepareEvolution,ACHIEVEMENTS } from '../../src/progression/dodgeProgress.js';
function record({id='one',level=1,score=94,date='2026-10-01T00:00:00.000Z',mode='normal',duration=60}={}){
 const r=structuredClone(recordFixture(id));r.completedAt=date;r.level=r.metrics.level=r.score.level=level;r.mode=r.metrics.mode=r.score.mode=mode;r.score.score=score;
 r.score.components.forEach(c=>{c.contribution*=score/94;c.index=c.contribution/c.weight;});
 if(mode==='survival'){
   r.endReason=r.metrics.endReason='defeat';r.metrics.validHits=r.metrics.threatsHit=1;r.metrics.threatsQualified=r.metrics.attacksEmitted=6;
   r.metrics.elapsedActiveSeconds=duration;r.metrics.stationarySeconds=duration-2;r.metrics.buckets[1].hit=1;r.metrics.buckets[1].qualified=3;r.metrics.buckets.forEach(b=>b.stationarySeconds=(duration-2)/2);
 }
 return r;
}
describe('read-only local progress',()=>{
 it('rates each difficulty using three recent distinct attempts and can downgrade',()=>{
  const a=record({id:'a',level:5,date:'2026-10-01T00:00:00.000Z'}),b=record({id:'b',level:5,date:'2026-10-02T00:00:00.000Z'}),c=record({id:'c',level:5,date:'2026-10-03T00:00:00.000Z'});
  expect(calculateDodgeProgress([a,b]).rating.rating).toBeNull();expect(calculateDodgeProgress([c,b,a,a]).rating.rating).toBe(5);
  const d=record({id:'d',level:5,score:0,date:'2026-10-04T00:00:00.000Z'}),e=record({id:'e',level:5,score:59,date:'2026-10-05T00:00:00.000Z'});
  expect(calculateDodgeProgress([a,b,c,d,e]).rating.rating).toBeNull();
 });
 it('uses saved Normal score and Survival duration with stable earliest ties',()=>{
  const a=record({id:'old',score:60}),b=record({id:'new',score:90,date:'2026-10-02T00:00:00.000Z'});
  const short=record({id:'short',mode:'survival',duration:30,score:90}),long=record({id:'long',mode:'survival',duration:60,score:40});
  const r=calculateDodgeProgress([long,b,a,short]);expect(r.records.find(r=>r.mode==='normal').attemptId).toBe('new');expect(r.records.find(r=>r.mode==='survival').attemptId).toBe('long');
 });
 it('has exactly six achievements derived from all distinct levels and explicit zero hits',()=>{
  expect(ACHIEVEMENTS).toHaveLength(6);
  const records=[record({id:'1',level:1}),record({id:'2',level:2}),record({id:'3',level:3}),record({id:'4',mode:'survival',duration:59.999})];
  let result=calculateDodgeProgress(records);expect(result.achievements.filter(a=>a.unlocked)).toHaveLength(5);
  result=calculateDodgeProgress([...records,record({id:'5',mode:'survival',duration:60})]);expect(result.achievements.every(a=>a.unlocked)).toBe(true);
 });
 it('limits evolution after filtering and keeps ascending historical order and saved scores',()=>{
  const records=Array.from({length:120},(_,i)=>record({id:String(i).padStart(3,'0'),level:i%2+1}));
  const points=prepareEvolution(records,{mode:'normal',level:1,limit:30});expect(points).toHaveLength(30);expect(points[0].attemptId).toBe('060');expect(points.at(-1).attemptId).toBe('118');expect(points[0].value).toBe(94);expect(Object.isFrozen(points)).toBe(true);
 });
});
