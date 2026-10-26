import { element } from './elements.js';
import { loadCameraSettings,saveCameraSettings } from '../settings/cameraSettings.js';
export function mountSettings(screen) {
  const document=screen.ownerDocument;
  let storage;try{storage=document.defaultView.localStorage;}catch{storage=null;}
  const prefs=loadCameraSettings(storage);
  const form=element(document,'form','mode-card');
  const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=prefs.edgePanEnabled;
  const label=element(document,'label','',' Movimentar câmera pelas bordas');label.prepend(toggle);
  const speed=document.createElement('input');speed.type='range';speed.min='50';speed.max='200';speed.step='10';speed.value=String(prefs.edgePanSpeed*100);
  const speedLabel=element(document,'label','setting-speed','Velocidade da câmera pelas bordas ');speedLabel.append(speed);
  const value=element(document,'output','','');
  function update(){speed.disabled=!toggle.checked;value.textContent=`${speed.value}%${speed.value==='100'?' (Padrão)':''}`;}
  speed.addEventListener('input',update);toggle.addEventListener('change',update);update();
  const save=element(document,'button','button primary','Salvar preferências');save.type='submit';
  const status=element(document,'p','status-note','');status.setAttribute('role','status');
  form.addEventListener('submit',event=>{event.preventDefault();try{saveCameraSettings(storage,{edgePanEnabled:toggle.checked,edgePanSpeed:Number(speed.value)/100});status.textContent='Preferências salvas.';}catch{status.textContent='Não foi possível salvar. O armazenamento do navegador está indisponível.';}});
  form.append(label,speedLabel,value,save,status);screen.append(form);
}
