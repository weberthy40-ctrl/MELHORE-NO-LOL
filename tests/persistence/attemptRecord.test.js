import { describe,it,expect } from 'vitest';
import { recordFixture } from '../fixtures/record.js';
import { validateAttemptRecord,canonicalRecord } from '../../src/persistence/attemptRecord.js';
import { createAttemptRepository } from '../../src/persistence/attemptRepository.js';
describe('completed record boundary',()=>{
 it('preserves versioned frozen metrics and score without recalculating on read',()=>{
   const r=recordFixture();expect(validateAttemptRecord(r)).toBe(r);expect(r.score.score).toBe(94);expect(Object.isFrozen(r.metrics.buckets)).toBe(true);
   expect(canonicalRecord({a:1,b:2})).toBe(canonicalRecord({b:2,a:1}));
 });
 it('rejects unscorable, abandoned, conflicting identities and nonfinite records',()=>{
   const r=recordFixture();
   for(const bad of [{...r,endReason:'abandoned'},{...r,attemptId:'wrong'},{...r,score:{...r.score,status:'unscorable',score:null}},{...r,metrics:{...r.metrics,threatsUnresolved:-1}},{...r,metrics:{...r.metrics,elapsedActiveSeconds:Infinity}}])expect(()=>validateAttemptRecord(bad)).toThrow();
   const cycle=structuredClone(r);cycle.extra=cycle;expect(()=>validateAttemptRecord(cycle)).toThrow('cíclicos');
 });
 it('fails only on operation in environments with no IndexedDB',async()=>{
   const repository=createAttemptRepository({indexedDB:null});
   await expect(repository.open()).rejects.toMatchObject({code:'UNAVAILABLE'});repository.close();await expect(repository.open()).rejects.toMatchObject({code:'CLOSED'});
 });
 it('allows retry after an explicit opening failure without deleting the database',async()=>{
   let calls=0;
   const indexedDB={open(){calls++;const request={};queueMicrotask(()=>request.onerror());return request;}};
   const repository=createAttemptRepository({indexedDB});
   await expect(repository.open()).rejects.toThrow();await expect(repository.open()).rejects.toThrow();expect(calls).toBe(2);repository.close();
 });
});
