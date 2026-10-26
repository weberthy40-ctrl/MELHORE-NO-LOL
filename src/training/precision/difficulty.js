import { PRECISION_VARIANTS } from './practice.js';
export const PRECISION_LEVELS=Object.freeze([
 [1,1.15,4],[2,1.1,4.8],[3,1.05,5.6],[4,1,6.4],[5,.95,7.2],
 [6,.9,8],[7,.85,8.8],[8,.8,9.6],[9,.75,10.4],[10,.7,11.2],
].map(([level,radius,speed])=>Object.freeze({level,radius,speed})));
export function precisionDifficulty(level,variant){
 const profile=PRECISION_LEVELS.find(p=>p.level===level);if(!profile||!Object.hasOwn(PRECISION_VARIANTS,variant))throw new TypeError('Escolha variante e nível 1–10 válidos.');
 return Object.freeze({...profile,maxLifetime:1.6-(level-1)*.105,speed:PRECISION_VARIANTS[variant].moving?profile.speed:0,variant});
}
