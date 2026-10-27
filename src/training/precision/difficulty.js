import { PRECISION_VARIANTS } from './practice.js';
export const PRECISION_LEVELS=Object.freeze([
 [1,1.05,4],[2,1,5],[3,.95,6],[4,.9,7],[5,.84,8.2],
 [6,.78,9.4],[7,.7,10.6],[8,.62,11.8],[9,.55,13],[10,.48,14.5],
].map(([level,radius,speed])=>Object.freeze({level,radius,speed})));
export function precisionDifficulty(level,variant){
 const profile=PRECISION_LEVELS.find(p=>p.level===level);if(!profile||!Object.hasOwn(PRECISION_VARIANTS,variant))throw new TypeError('Escolha variante e nível 1–10 válidos.');
 return Object.freeze({...profile,maxLifetime:1.6-(level-1)*.105,speed:PRECISION_VARIANTS[variant].moving?profile.speed:0,variant});
}
