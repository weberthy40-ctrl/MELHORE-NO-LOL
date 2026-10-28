import { loadPreferences } from '../settings/preferences.js';
import { element } from './elements.js';
/** Session remains idle until assets are ready and the player explicitly starts. */
export function mountDodgeReady({screen,stage,session,title='Pronto para desviar?',onStart=()=>{}}){
 const document=screen.ownerDocument,panel=element(document,'section','arena-ready'),card=element(document,'div','arena-ready-card');
 const heading=element(document,'h2','',title),help=element(document,'p','muted','Entre em tela cheia se preferir. Clique em Iniciar quando estiver pronto.'),button=element(document,'button','button primary','Iniciar desafio'),status=element(document,'p','ready-status','Carregando arena…');
 let storage;try{storage=document.defaultView.localStorage;}catch{storage=null;}
 const bindings=loadPreferences(storage),controls=element(document,'section','ready-controls'),list=element(document,'dl');
 controls.setAttribute('aria-label','Mobilidade e câmera');
 controls.append(element(document,'h3','','Seu kit de esquiva'),element(document,'p','muted','Leia a conjuração e saia da trajetória antes do contato. Aponte o cursor para a direção desejada.'));
 for(const [key,label,purpose]of [['Direito','Mover','Clique no chão para escolher o destino.'],[bindings.stopKey.replace('Key',''),'Parar','Interrompa o movimento para ajustar seus passos.'],[bindings.dashKey.replace('Key',''),'Dash','Faça um avanço rápido na direção do cursor.'],[bindings.flashKey.replace('Key',''),'Flash','Desloque-se instantaneamente na direção do cursor.']]){
  const row=element(document,'div','ready-control'),term=element(document,'dt');term.append(element(document,'kbd','',key),document.createTextNode(` ${label}`));row.append(term,element(document,'dd','',purpose));list.append(row);
 }
 controls.append(list,element(document,'p','ready-camera','Câmera: Y trava/libera · Espaço centraliza · Roda ajusta o zoom · ESC pausa.'));
 button.type='button';button.disabled=true;panel.setAttribute('aria-label','Preparação da arena');card.append(heading,help,controls,button,status);panel.append(card);screen.append(panel);let disposed=false;
 const update=()=>{const ready=['ready','basic'].includes(stage.dataset.visuals)&&!stage.querySelector('.preview-error');button.disabled=!ready;status.textContent=ready?'Arena pronta. O tempo só começa ao iniciar.':'Carregando arena…';};
 const observer=new document.defaultView.MutationObserver(update);observer.observe(stage,{attributes:true,attributeFilter:['data-visuals'],childList:true});update();
 function dispose(){if(disposed)return;disposed=true;observer.disconnect();panel.remove();}
 button.addEventListener('click',()=>{if(disposed||button.disabled||session.snapshot().state!=='idle')return;if(session.start()){dispose();onStart();const canvas=stage.querySelector('canvas');if(canvas){canvas.tabIndex=-1;canvas.focus({preventScroll:true});}}});
 return {dispose};
}
