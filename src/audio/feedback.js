import { createAudioManager } from './audioManager.js';
export function mountAudioFeedback({root,core,preferences}){
 const window=root.ownerDocument.defaultView,manager=createAudioManager({AudioContextClass:window.AudioContext??window.webkitAudioContext,...preferences});
 const unlock=()=>{void manager.unlock();};root.addEventListener('pointerdown',unlock);root.addEventListener('keydown',unlock);
 const subscriptions=[core.events.on('precision:hit',()=>manager.play('hit')),core.events.on('kiting:confirmed',()=>manager.play('hit')),core.events.on('kiting:damage',()=>manager.play('impact')),core.events.on('dodge:damage',()=>manager.play('impact')),core.events.on('reflex:response',r=>manager.play(['correct','inhibited'].includes(r.status)?'correct':'wrong')),core.events.on('session:changed',s=>{if(['paused','abandoned','completed','disposed'].includes(s.state))manager.stopAll();})];
 return {setPreferences:p=>manager.setPreferences(p),stopAll:()=>manager.stopAll(),dispose(){subscriptions.forEach(unsubscribe=>unsubscribe());root.removeEventListener('pointerdown',unlock);root.removeEventListener('keydown',unlock);manager.dispose();}};
}
