import { validateAttemptRecord,canonicalRecord,StorageError } from './attemptRecord.js';
import { assertRecordData } from './storageError.js';
import { readonlySnapshot } from '../training/snapshot.js';
import { SETTINGS_KEY } from '../settings/cameraSettings.js';
import { PREFERENCES_KEY,validatePreferences } from '../settings/preferences.js';
import { MOUSE_SETTINGS_KEY,validateMouseSettings } from '../tools/mouse/calculator.js';
import { calculateKitingProgress,KITING_ACHIEVEMENTS } from '../progression/kitingProgress.js';
export const BACKUP_MAX_BYTES=10*1024*1024;
export const PREFERENCE_KEYS=Object.freeze([SETTINGS_KEY,PREFERENCES_KEY,MOUSE_SETTINGS_KEY]);
const timestamp=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
function forbidDangerousKeys(value){if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){if(['__proto__','constructor','prototype'].includes(key))throw new StorageError('Campo de backup não permitido.','INVALID_BACKUP');forbidDangerousKeys(value[key]);}}
export function validateBackupPreference(key,value){
 if(key===PREFERENCES_KEY)return validatePreferences(value);if(key===MOUSE_SETTINGS_KEY)return validateMouseSettings(value);
 if(key===SETTINGS_KEY&&value&&typeof value.edgePanEnabled==='boolean'&&typeof value.edgePanSpeed==='number'&&Number.isFinite(value.edgePanSpeed)&&value.edgePanSpeed>=.5&&value.edgePanSpeed<=2)return Object.freeze({edgePanEnabled:value.edgePanEnabled,edgePanSpeed:value.edgePanSpeed});throw new StorageError('Preferência de backup incompatível.','INVALID_BACKUP');
}
export function validateBackup(data){
 assertRecordData(data);forbidDangerousKeys(data);
 if(data?.app!=='moba-training'||data.backupVersion!==1||!timestamp(data.exportedAt)||data.schemaVersions?.database!==2||data.schemaVersions?.record!==1||!Array.isArray(data.attempts)||data.attempts.length>10000||!Array.isArray(data.achievements)||data.achievements.length>6||!data.preferences||typeof data.preferences!=='object'||Array.isArray(data.preferences))throw new StorageError('Formato ou versão de backup incompatível.','INVALID_BACKUP');
 const seen=new Set();for(const r of data.attempts){validateAttemptRecord(r);if(!timestamp(r.completedAt)||seen.has(r.attemptId))throw new StorageError('ID duplicado ou data inválida no backup.','INVALID_BACKUP');seen.add(r.attemptId);}
 const supported=new Map(calculateKitingProgress(data.attempts).achievements.map(a=>[a.id,a])),ids=new Set();for(const a of data.achievements){if(a?.schemaVersion!==1||a.modality!=='kiting'||!KITING_ACHIEVEMENTS.some(c=>c.id===a.id)||!supported.get(a.id)?.unlocked||!timestamp(a.completedAt)||ids.has(a.id))throw new StorageError('Conquista de backup incompatível.','INVALID_BACKUP');ids.add(a.id);}
 for(const [key,value]of Object.entries(data.preferences))validateBackupPreference(key,value);
 return readonlySnapshot(data);
}
export function parseBackup(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>BACKUP_MAX_BYTES)throw new StorageError('Backup excede o limite de 10 MiB.','INVALID_BACKUP');let data;try{data=JSON.parse(text);}catch{throw new StorageError('Arquivo JSON inválido.','INVALID_BACKUP');}return validateBackup(data);}
export function createBackup({attempts=[],achievements=[],preferences={},exportedAt=new Date().toISOString()}={}){const backup=validateBackup({app:'moba-training',backupVersion:1,exportedAt,schemaVersions:{database:2,record:1},attempts,achievements,preferences});const text=JSON.stringify(backup,null,2);if(new TextEncoder().encode(text).length>BACKUP_MAX_BYTES)throw new StorageError('Os dados excedem 10 MiB.','INVALID_BACKUP');return text;}
export function readBackupPreferences(storage){const result={};if(!storage)return result;for(const key of PREFERENCE_KEYS){const raw=storage.getItem(key);if(raw!==null)result[key]=validateBackupPreference(key,JSON.parse(raw));}return result;}
/** Merge-only: existing local preferences are always preserved; partial failures are explicit. */
export function restoreMissingPreferences(storage,preferences){let applied=0,skipped=0;const failures=[];for(const [key,value]of Object.entries(preferences)){try{const valid=validateBackupPreference(key,value);if(storage.getItem(key)!==null){skipped++;continue;}storage.setItem(key,JSON.stringify(valid));applied++;}catch{failures.push(key);}}return Object.freeze({applied,skipped,failures:Object.freeze(failures)});}
export function readBackupData(database){return new Promise((resolve,reject)=>{const tx=database.transaction(['attempts','achievements'],'readonly'),attempts=tx.objectStore('attempts').getAll(),achievements=tx.objectStore('achievements').getAll();tx.oncomplete=()=>resolve({attempts:attempts.result,achievements:achievements.result});tx.onabort=()=>reject(tx.error??new StorageError('Exportação interrompida.'));});}
export function mergeBackupData(database,data,{preview=false}={}){
 const backup=validateBackup(data);return new Promise((resolve,reject)=>{
  const tx=database.transaction(['attempts','achievements'],preview?'readonly':'readwrite'),counts={added:0,identical:0,conflicts:0,achievementsAdded:0},conflictIds=[];let failure;
  function insert(storeName,record,key){const store=tx.objectStore(storeName),request=store.get(key);request.onsuccess=()=>{try{const existing=request.result;if(existing){if(canonicalRecord(existing)===canonicalRecord(record))counts.identical++;else{counts.conflicts++;conflictIds.push(key);}}else{if(storeName==='attempts')counts.added++;else counts.achievementsAdded++;if(!preview)store.add(record);}}catch(error){failure=error;tx.abort();}};}
  for(const r of backup.attempts)insert('attempts',r,r.attemptId);for(const a of backup.achievements)insert('achievements',a,a.id);
  tx.oncomplete=()=>resolve(readonlySnapshot({...counts,conflictIds,preview}));tx.onerror=()=>{};tx.onabort=()=>reject(failure??tx.error??new StorageError('Importação cancelada.','ABORTED'));
 });
}
