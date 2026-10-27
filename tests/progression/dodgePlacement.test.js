import { it,expect } from 'vitest';
import { saveDodgeAssessment,readDodgePlacement,advanceDodgePlacement,DODGE_PLACEMENT_KEY } from '../../src/progression/dodgePlacement.js';
import { createBackup,parseBackup,restoreMissingPreferences } from '../../src/persistence/backup.js';
import { diagnosticRound,seedDodgePlacement } from '../fixtures/dodgePlacement.js';
import { modernDodge } from '../fixtures/modernDodge.js';
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};
it('requires a completed current assessment, persists its assigned level and restores through backups',()=>{
 const storage=memory(),results=[1,2,3].map(i=>diagnosticRound(i));expect(readDodgePlacement(storage)).toBeNull();expect(()=>saveDodgeAssessment(storage,results.slice(0,2))).toThrow();expect(readDodgePlacement(storage)).toBeNull();expect(saveDodgeAssessment(storage,results).level).toBe(20);expect(readDodgePlacement(storage).level).toBe(20);
 const backup=parseBackup(createBackup({preferences:{[DODGE_PLACEMENT_KEY]:readDodgePlacement(storage)}})),restored=memory();expect(restoreMissingPreferences(restored,backup.preferences).applied).toBe(1);expect(readDodgePlacement(restored)).toEqual(readDodgePlacement(storage));
});
it('rejects corrupt or obsolete placement without discarding old attempts',()=>{
 const storage=memory();storage.setItem(DODGE_PLACEMENT_KEY,'{}');expect(readDodgePlacement(storage)).toBeNull();storage.setItem(DODGE_PLACEMENT_KEY,JSON.stringify({version:1,rulesetVersion:'dodge-v7'}));expect(readDodgePlacement(storage)).toBeNull();expect(()=>saveDodgeAssessment(null,[1,2,3].map(i=>diagnosticRound(i)))).toThrow();
});
it('advances one level only for a saved qualifying current Normal round and is idempotent',()=>{
 const storage=memory();seedDodgePlacement(storage,1);for(const record of [modernDodge({elapsed:10,hits:3,resolved:5}),modernDodge({mode:'survival'}),modernDodge({rulesetVersion:'dodge-v7'}),modernDodge({date:'2025-12-01T00:00:00.000Z'})])expect(advanceDodgePlacement(storage,record).level).toBe(1);
 const success=modernDodge();expect(advanceDodgePlacement(storage,success).level).toBe(2);expect(advanceDodgePlacement(storage,success).level).toBe(2);expect(advanceDodgePlacement(storage,{...modernDodge({level:2}),level:21}).level).toBe(2);seedDodgePlacement(storage,20);expect(advanceDodgePlacement(storage,modernDodge({level:20})).level).toBe(20);
});
it('keeps the previous twenty-level placement usable after the readability rebalance',()=>{
 const storage=memory();seedDodgePlacement(storage,5);const value=JSON.parse(storage.getItem(DODGE_PLACEMENT_KEY));storage.setItem(DODGE_PLACEMENT_KEY,JSON.stringify({...value,rulesetVersion:'dodge-v8'}));expect(readDodgePlacement(storage)).toMatchObject({level:5,rulesetVersion:'dodge-v9'});
});
