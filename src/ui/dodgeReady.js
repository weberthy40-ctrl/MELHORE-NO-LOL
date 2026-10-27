import { element } from './elements.js';
/** Session remains idle until assets are ready and the player explicitly starts. */
export function mountDodgeReady({screen,stage,session,title='Pronto para desviar?',onStart=()=>{}}){
 const document=screen.ownerDocument,panel=element(document,'section','arena-ready'),card=element(document,'div','arena-ready-card');
 const heading=element(document,'h2','',title),help=element(document,'p','muted','Entre em tela cheia se preferir. Clique em Iniciar quando estiver pronto.'),button=element(document,'button','button primary','Iniciar desafio'),status=element(document,'p','ready-status','Carregando arena…');
 button.type='button';button.disabled=true;panel.setAttribute('aria-label','Preparação da arena');card.append(heading,help,button,status);panel.append(card);screen.append(panel);let disposed=false;
 const update=()=>{const ready=['ready','basic'].includes(stage.dataset.visuals)&&!stage.querySelector('.preview-error');button.disabled=!ready;status.textContent=ready?'Direito · mover   Espaço · centralizar   ESC · pausar':'Carregando arena…';};
 const observer=new document.defaultView.MutationObserver(update);observer.observe(stage,{attributes:true,attributeFilter:['data-visuals'],childList:true});update();
 function dispose(){if(disposed)return;disposed=true;observer.disconnect();panel.remove();}
 button.addEventListener('click',()=>{if(button.disabled||session.snapshot().state!=='idle')return;if(session.start()){dispose();onStart();const canvas=stage.querySelector('canvas');if(canvas){canvas.tabIndex=-1;canvas.focus({preventScroll:true});}}});
 return {dispose};
}
