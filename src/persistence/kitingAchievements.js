import { createKitingProgress } from '../progression/kitingProgress.js';
import { StorageError } from './storageError.js';
import { readonlySnapshot } from '../training/snapshot.js';
/** One transaction observes persisted attempts and adds missing permanent unlocks. */
export function reconcileKitingAchievements(database){
 return new Promise((resolve,reject)=>{
  const tx=database.transaction(['attempts','achievements'],'readwrite'),progress=createKitingProgress(),store=tx.objectStore('achievements'),request=tx.objectStore('attempts').openCursor();let output,failure;
  request.onsuccess=()=>{const cursor=request.result;if(cursor){progress.add(cursor.value);cursor.continue();return;}
   const derived=progress.snapshot().achievements,existing=store.getAll();existing.onsuccess=()=>{
    const known=new Map(existing.result.filter(r=>r.modality==='kiting').map(r=>[r.id,r])),newlyUnlocked=[];
    for(const a of derived){const previous=known.get(a.id);if(previous&&(!Number.isFinite(Date.parse(previous.completedAt))||previous.schemaVersion!==1)){failure=new StorageError('Conquista de Kiting incompatível.','INVALID_RECORD');tx.abort();return;}
     if(a.unlocked&&!previous){const saved={schemaVersion:1,modality:'kiting',id:a.id,completedAt:a.completedAt};store.add(saved);known.set(a.id,saved);newlyUnlocked.push(a);}
    }
    output=readonlySnapshot({achievements:derived.map(a=>({...a,unlocked:known.has(a.id),completedAt:known.get(a.id)?.completedAt??null})),newlyUnlocked});
   };
  };
  tx.oncomplete=()=>resolve(output);tx.onerror=()=>{};tx.onabort=()=>reject(failure??tx.error??new StorageError('Não foi possível salvar as conquistas.','ABORTED'));
 });
}
