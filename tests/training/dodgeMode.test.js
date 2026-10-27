import { describe,it,expect } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { createSession } from '../../src/training/session.js';
import { createDodgeMode } from '../../src/training/dodge/mode.js';
function attempt(mode='normal',level=1){
  const core=createCore(),session=createSession({countdown:0,timeLimit:null,events:core.events});
  const rules=createDodgeMode({session,mode,level,events:core.events});session.start();
  const hit=id=>core.events.emit('dodge:impact',{id,attemptId:session.snapshot().id});
  const advance=duration=>{for(let i=0;i<Math.round(duration*10);i++){session.update(.1);rules.evaluate();}};
  return {core,session,rules,hit,advance};
}
describe('dodge mode rules',()=>{
  it('uses three lives with unlimited time in all levels; voluntary completion fires once',()=>{
    for(let level=1;level<=10;level++){
      const a=attempt('normal',level);expect(a.rules.snapshot().lives).toBe(3);a.advance(125);expect(a.rules.snapshot()).toMatchObject({outcome:null,lives:3,duration:null});a.rules.complete();
      expect(a.rules.snapshot()).toMatchObject({outcome:'completed',lives:3});a.hit('late');expect(a.rules.snapshot().lives).toBe(3);a.rules.dispose();a.core.dispose();
    }
  });
  it('deduplicates hits, preserves immunity and freezes immunity during pause',()=>{
    const a=attempt();a.hit('first');a.hit('first');a.hit('simultaneous');expect(a.rules.snapshot().lives).toBe(2);
    a.session.pause();a.advance(10);expect(a.rules.snapshot().protectionRemaining).toBe(.75);a.session.resume();a.advance(.8);a.hit('second');expect(a.rules.snapshot().lives).toBe(1);
    a.advance(.8);a.hit('third');expect(a.rules.snapshot().outcome).toBe('defeat');a.rules.dispose();a.core.dispose();
  });
  it('survival has one life and never wins after sixty or 120 seconds',()=>{
    const a=attempt('survival');a.advance(125);expect(a.rules.snapshot().outcome).toBeNull();expect(a.rules.snapshot().elapsed).toBeGreaterThan(120);
    a.hit('first');expect(a.rules.snapshot()).toMatchObject({lives:0,outcome:'defeat'});const elapsed=a.rules.snapshot().elapsed;
    a.advance(10);a.hit('late');expect(a.rules.snapshot().elapsed).toBe(elapsed);a.rules.dispose();a.core.dispose();
  });
  it('rejects late hits from another attempt and treats leaving as abandonment',()=>{
    const a=attempt('survival');a.core.events.emit('dodge:impact',{id:'old',attemptId:'other'});expect(a.rules.snapshot().lives).toBe(1);
    a.rules.abandon();expect(a.rules.snapshot().outcome).toBe('abandoned');a.rules.dispose();a.core.dispose();
  });
  it('ends on the fatal hit even beyond the former time limit',()=>{
    const a=attempt();a.hit('one');a.advance(1);a.hit('two');a.advance(118.9);a.session.update(.1);a.hit('three');a.rules.evaluate();
    expect(a.rules.snapshot().outcome).toBe('defeat');expect(a.rules.snapshot().elapsed).toBeCloseTo(120);a.rules.dispose();a.core.dispose();
  });
});
