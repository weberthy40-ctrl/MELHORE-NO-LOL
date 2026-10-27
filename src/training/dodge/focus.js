import { difficultyFor } from './difficulty.js';
export const DODGE_FOCUSES=Object.freeze({
 mixed:Object.freeze({label:'Esquiva mista',instruction:'Leia a origem e encontre espaço entre as habilidades.',goal:8}),
 micro:Object.freeze({label:'Passos curtos',instruction:'Saia da linha do disparo com poucos passos e pare quando estiver seguro. Use S para interromper o movimento.',goal:8}),
 sidestep:Object.freeze({label:'Saída perpendicular',instruction:'Cruze a menor largura do feixe durante o aviso; evite correr ao longo dele.',goal:8}),
 direction:Object.freeze({label:'Mudança de direção',instruction:'Observe a conjuração e mude de direção para responder à próxima salva, em vez de manter o mesmo trajeto.',goal:8}),
});
/** Goal drills alter the practiced skills, never the movement speed or official scoring. */
export function dodgeFocusProfile(level,focus='mixed'){
 if(!Object.hasOwn(DODGE_FOCUSES,focus))throw new TypeError('Invalid dodge focus.');const base=difficultyFor(level);
 if(focus==='mixed')return base;
 if(focus==='micro')return Object.freeze({...base,focus,weights:Object.freeze({arcane_bolt:1}),interval:Math.max(.45,base.interval),capacity:Math.min(3,base.capacity),comboChance:0});
 if(focus==='sidestep')return Object.freeze({...base,focus,weights:Object.freeze({sun_beam:1}),interval:Math.max(1.05,base.interval),capacity:Math.min(3,base.capacity),comboChance:level>=6?.25:0,comboSize:1});
 return Object.freeze({...base,focus,weights:Object.freeze({arcane_bolt:3,artillery:1}),interval:Math.max(1.4,base.interval),comboChance:1,comboSize:2,comboDelay:.16,peakCooldown:1.3});
}
export function recommendedDodgeFocus(variant){return variant==='sun_beam'?'sidestep':variant==='arcane_bolt'?'micro':'direction';}
