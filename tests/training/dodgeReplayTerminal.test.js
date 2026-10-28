import {expect,it} from 'vitest';
import {createDodgeReplay} from '../../src/training/dodge/replay.js';
const snapshot=time=>({level:5,elapsed:time,projectiles:Object.freeze([])});
const zero=Object.freeze({x:0,z:0});
it('accepts only a real monotonic terminal state, seals once and leaves previous snapshots immutable',()=>{
 const replay=createDodgeReplay();replay.capture(snapshot(1),zero);const before=replay.snapshot();
 expect(replay.capture(snapshot(1.025),zero)).toBe(false);
 expect(replay.finish(snapshot(.9),zero)).toBe(false);
 expect(replay.finish(snapshot(1.025),{x:NaN,z:0})).toBe(false);
 replay.mark({time:1.025,variant:'arcane_bolt',id:'projectile-1'});
 expect(replay.finish(snapshot(1.025),{x:1,z:2},.7)).toBe(true);
 const final=replay.snapshot();expect(final.frames.at(-1)).toMatchObject({time:1.025,player:{x:1,z:2},angle:.7});
 expect(final.markers[0].time).toBe(final.frames.at(-1).time);
 expect(replay.finish(snapshot(1.025),zero)).toBe(false);expect(replay.capture(snapshot(2),zero)).toBe(false);
 replay.mark({time:2,variant:'cage',id:'late'});expect(replay.snapshot()).toEqual(final);
 expect(before.frames).toHaveLength(1);expect(before.frames[0].player).toEqual(zero);expect(before.markers).toHaveLength(0);
 expect(Object.isFrozen(final.frames.at(-1).player)).toBe(true);
});
it('replaces a same-time sample without duplicating it or mutating old snapshots, and clear starts a new recording',()=>{
 const replay=createDodgeReplay();replay.capture(snapshot(0),zero);const before=replay.snapshot();
 expect(replay.finish(snapshot(0),{x:1,z:1},1)).toBe(true);
 expect(replay.snapshot().frames).toHaveLength(1);expect(before.frames[0].angle).toBe(0);
 const final=replay.snapshot();replay.clear();expect(replay.capture(snapshot(0),zero)).toBe(true);expect(replay.snapshot().counts).toEqual({});
 expect(final.frames[0].player).toEqual({x:1,z:1});
});
it('keeps the frame limit, six-second window and marker bound when an extra terminal sample is appended',()=>{
 const replay=createDodgeReplay();
 for(let n=0;n<=2000;n++){replay.capture(snapshot(n*.05),zero);replay.mark({time:n*.05,variant:'arcane_bolt',id:`projectile-${n}`});}
 expect(replay.finish(snapshot(100.025),zero)).toBe(true);
 const final=replay.snapshot();expect(final.frames.length).toBeLessThanOrEqual(121);
 expect(final.frames.at(-1).time).toBe(100.025);expect(final.frames.at(-1).time-final.frames[0].time).toBeLessThanOrEqual(6);
 expect(final.markers.length).toBeLessThanOrEqual(160);expect(final.markers.every(marker=>marker.time>=100.025-6)).toBe(true);
});
