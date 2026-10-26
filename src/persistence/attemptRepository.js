import { readBackupData,mergeBackupData } from './backup.js';
import { reconcileKitingAchievements } from './kitingAchievements.js';
import { StorageError,validateAttemptRecord,canonicalRecord } from './attemptRecord.js';
import { readonlySnapshot } from '../training/snapshot.js';
export const DATABASE_NAME='moba-training';
export const DATABASE_VERSION=2;
/** Native IndexedDB. Schema upgrades are additive; no deletion/reset path. */
export function createAttemptRepository({indexedDB=globalThis.indexedDB,databaseName=DATABASE_NAME}={}){
  let db=null,opening=null,disposed=false;
  function open(){
    if(disposed)return Promise.reject(new StorageError('Repositório encerrado.','CLOSED'));
    if(db)return Promise.resolve(db);if(opening)return opening;
    if(!indexedDB)return Promise.reject(new StorageError('IndexedDB indisponível.','UNAVAILABLE'));
    opening=new Promise((resolve,reject)=>{
      let failed=false;let request;
      try{request=indexedDB.open(databaseName,DATABASE_VERSION);}catch(error){reject(error);return;}
      request.onupgradeneeded=()=>{
        const database=request.result;
        if(!database.objectStoreNames.contains('achievements'))database.createObjectStore('achievements',{keyPath:'id'});
        const store=database.objectStoreNames.contains('attempts')?request.transaction.objectStore('attempts'):database.createObjectStore('attempts',{keyPath:'attemptId'});
        for(const name of ['modality','mode','level','completedAt'])if(!store.indexNames.contains(name))store.createIndex(name,name,{unique:false});
      };
      request.onerror=()=>{failed=true;reject(request.error??new StorageError('Falha ao abrir o banco.'));};
      request.onblocked=()=>{failed=true;reject(new StorageError('Banco bloqueado por outra aba. Feche a outra aba para tentar novamente.','BLOCKED'));};
      request.onsuccess=()=>{
        const database=request.result;
        if(disposed||failed){database.close();if(disposed)reject(new StorageError('Repositório encerrado.','CLOSED'));return;}
        db=database;db.onversionchange=()=>{database.close();if(db===database)db=null;};resolve(db);
      };
    }).finally(()=>{opening=null;});return opening;
  }
  async function saveCompletedAttempt(record){
    const snapshot=readonlySnapshot(validateAttemptRecord(record));const database=await open();
    return new Promise((resolve,reject)=>{
      let transaction;try{transaction=database.transaction('attempts','readwrite');}catch(error){reject(error);return;}
      let result='saved',failure;
      transaction.oncomplete=()=>resolve(Object.freeze({status:result,attemptId:snapshot.attemptId}));
      transaction.onerror=()=>{};
      transaction.onabort=()=>reject(failure??transaction.error??new StorageError('A transação foi cancelada.','ABORTED'));
      const store=transaction.objectStore('attempts'),request=store.get(snapshot.attemptId);
      request.onsuccess=()=>{
        if(request.result){
          if(canonicalRecord(request.result)===canonicalRecord(snapshot))result='already_saved';
          else{failure=new StorageError('Outra tentativa com este ID já está salva.','CONFLICT');transaction.abort();}
        }else store.add(snapshot);
      };
    });
  }
  async function getAttemptById(attemptId){const database=await open();return new Promise((resolve,reject)=>{
    const transaction=database.transaction('attempts','readonly'),request=transaction.objectStore('attempts').get(attemptId);let record;
    request.onsuccess=()=>{record=request.result;};transaction.oncomplete=()=>resolve(record?readonlySnapshot(record):null);
    transaction.onabort=()=>reject(transaction.error??new StorageError('Leitura cancelada.'));
  });}
  async function listCompletedAttempts({mode,level,variant,modality='dodge',offset=0,limit=10}={}){
    if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>100)throw new StorageError('Paginação inválida.','INVALID_QUERY');
    const database=await open();return new Promise((resolve,reject)=>{
      const transaction=database.transaction('attempts','readonly'),request=transaction.objectStore('attempts').index('completedAt').openCursor(null,'prev');
      const items=[];let matched=0,invalid=0;
      request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const r=cursor.value;
        try{validateAttemptRecord(r);}catch{invalid++;cursor.continue();return;}
        if(r.modality===modality&&(!mode||r.mode===mode)&&(!variant||r.variant===variant)&&(level===undefined||r.level===level)){if(matched++>=offset&&items.length<limit)items.push(readonlySnapshot(r));}
        cursor.continue();
      };
      transaction.oncomplete=()=>resolve(Object.freeze({items:Object.freeze(items),total:matched,invalid,offset,limit}));
      transaction.onabort=()=>reject(transaction.error??new StorageError('Consulta cancelada.'));
    });
  }
  async function scanCompletedAttempts({mode,level,variant,modality='dodge',onRecord}={}){
    if(typeof onRecord!=='function')throw new StorageError('Consumidor de leitura obrigatório.','INVALID_QUERY');
    const database=await open();return new Promise((resolve,reject)=>{
      const transaction=database.transaction('attempts','readonly'),request=transaction.objectStore('attempts').index('completedAt').openCursor(null,'prev');let total=0,invalid=0,failure;
      request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const record=cursor.value;
        try{validateAttemptRecord(record);}catch{invalid++;cursor.continue();return;}
        if(record.modality===modality&&(!mode||record.mode===mode)&&(!variant||record.variant===variant)&&(level===undefined||record.level===level)){
          try{onRecord(readonlySnapshot(record));total++;}catch(error){failure=error;transaction.abort();return;}
        }cursor.continue();
      };
      transaction.oncomplete=()=>resolve(Object.freeze({total,invalid}));transaction.onabort=()=>reject(failure??transaction.error??new StorageError('Varredura cancelada.'));
    });
  }
  return {open,saveCompletedAttempt,async exportBackupData(){return readBackupData(await open());},async previewBackup(data){return mergeBackupData(await open(),data,{preview:true});},async mergeBackup(data){const result=await mergeBackupData(await open(),data);try{await reconcileKitingAchievements(await open());return {...result,achievementsReconciled:true};}catch{return {...result,achievementsReconciled:false};}},async reconcileKitingAchievements(){return reconcileKitingAchievements(await open());},getAttemptById,listCompletedAttempts,scanCompletedAttempts,
    async countCompletedAttempts(filters){return (await listCompletedAttempts({...filters,limit:1})).total;},
    close(){disposed=true;db?.close();db=null;},
  };
}
