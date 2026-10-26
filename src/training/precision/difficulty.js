import { PRECISION_VARIANTS } from './practice.js';
export const PRECISION_LEVELS=Object.freeze([
 [1,.9,1.4],[2,.85,1.6],[3,.8,1.8],[4,.75,2],[5,.7,2.2],
 [6,.65,2.4],[7,.6,2.6],[8,.55,2.8],[9,.5,3],[10,.45,3.2],
].map(([level,radius,speed])=>Object.freeze({level,radius,speed})));
export function precisionDifficulty(level,variant){
 const profile=PRECISION_LEVELS.find(p=>p.level===level);if(!profile||!Object.hasOwn(PRECISION_VARIANTS,variant))throw new TypeError('Escolha variante e nível 1–10 válidos.');
 return Object.freeze({...profile,speed:PRECISION_VARIANTS[variant].moving?profile.speed:0,variant});
}
