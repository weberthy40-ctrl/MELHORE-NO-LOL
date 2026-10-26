import { it,expect } from 'vitest';
import { recordFixture } from '../fixtures/record.js';
import { precisionRecord } from '../fixtures/precisionRecord.js';
import { kitingRecord } from '../fixtures/kitingRecord.js';
import { reflexRecord } from '../fixtures/reflexRecord.js';
import { createBackup,parseBackup,BACKUP_MAX_BYTES,restoreMissingPreferences } from '../../src/persistence/backup.js';
import { SETTINGS_KEY } from '../../src/settings/cameraSettings.js';
import { PREFERENCES_KEY,DEFAULT_PREFERENCES } from '../../src/settings/preferences.js';
it('round trips all four official snapshots and validates only application preferences',()=>{
 const attempts=[recordFixture(),precisionRecord(),kitingRecord(),reflexRecord()],text=createBackup({attempts,preferences:{[SETTINGS_KEY]:{edgePanEnabled:true,edgePanSpeed:1},[PREFERENCES_KEY]:DEFAULT_PREFERENCES}}),restored=parseBackup(text);expect(restored.attempts).toEqual(attempts);expect(Object.isFrozen(restored)).toBe(true);
 const map=new Map([[SETTINGS_KEY,'existing']]),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};expect(restoreMissingPreferences(storage,restored.preferences)).toMatchObject({applied:1,skipped:1,failures:[]});expect(map.get(SETTINGS_KEY)).toBe('existing');
});
it('rejects future formats, duplicates, invalid metrics, malicious keys and oversized files before mutation',()=>{
 const base=JSON.parse(createBackup({attempts:[precisionRecord()]}));for(const patch of [{backupVersion:2},{app:'unknown'},{exportedAt:'bad'},{attempts:[...base.attempts,...base.attempts]},{preferences:{unknown:{}}},{achievements:[{id:'kiting:score-ninety-five',modality:'kiting',schemaVersion:1,completedAt:base.exportedAt}]}])expect(()=>parseBackup(JSON.stringify({...base,...patch}))).toThrow();
 expect(()=>parseBackup('{bad')).toThrow();expect(()=>parseBackup(' '.repeat(BACKUP_MAX_BYTES+1))).toThrow();expect(()=>parseBackup(JSON.stringify(base).replace('"preferences":{}','"preferences":{"__proto__":{}}'))).toThrow();
});
it('rejects inherited variant names and inconsistent score components without recalculating old scores',()=>{
 const r=structuredClone(precisionRecord());r.variant=r.metrics.variant=r.score.variant='toString';expect(()=>parseBackup(JSON.stringify({...JSON.parse(createBackup()),attempts:[r]}))).toThrow();
 const record=structuredClone(precisionRecord());record.score.components[0].index=0;expect(()=>parseBackup(JSON.stringify({...JSON.parse(createBackup()),attempts:[record]}))).toThrow();
});
