import { pointsForAttempt } from '../progression/skillRating.js';
import { createAttemptRecord } from '../persistence/attemptRecord.js';
import { element } from './elements.js';
export function mountSaveAttempt({container,repository,metrics,score,core,isActive,onSaved=()=>{}}){
  const record=createAttemptRecord(metrics,score),document=container.ownerDocument;
  const status=element(document,'p','status-note','Salvando...');status.setAttribute('role','status');
  const points=element(document,'p','attempt-rating-points',`${new Intl.NumberFormat('pt-BR').format(pointsForAttempt(record))} pontos de desempenho · entram na média da sua patente.`);
  const retry=element(document,'button','button','Tentar novamente');retry.type='button';retry.hidden=true;
  let pending=false;
  async function save(){
    if(pending)return;pending=true;status.textContent='Salvando...';retry.hidden=true;
    try{await repository.saveCompletedAttempt(record);if(isActive())status.textContent='Salvo neste dispositivo';onSaved(record);
      if(record.modality==='kiting'&&repository.reconcileKitingAchievements){
        try{const result=await repository.reconcileKitingAchievements();if(isActive()&&result.newlyUnlocked.length)container.append(element(document,'p','status-note',`Conquista desbloqueada: ${result.newlyUnlocked.map(a=>a.title).join(', ')}`));}
        catch(error){core.errors.report(error,{source:'persistence.achievements'});if(isActive())container.append(element(document,'p','status-note','Tentativa salva. Não foi possível atualizar as conquistas; abra o painel para tentar novamente.'));}
      }
    }
    catch(error){core.errors.report(error,{source:'persistence.save'});if(isActive()){status.textContent='Não foi possível salvar neste dispositivo.';retry.hidden=false;}}
    finally{pending=false;}
  }
  retry.addEventListener('click',save);container.append(points,status,retry);save();
}
