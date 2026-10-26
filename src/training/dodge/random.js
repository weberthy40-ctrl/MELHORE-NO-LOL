import { VARIANTS } from './projectiles.js';
import { createRandom } from '../../core/random.js';
export { createRandom } from '../../core/random.js';
export function createSelector({weights={fast:1,slow:1},maxRepeat=3,rng=createRandom()}={}) {
  const entries=Object.entries(weights);
  if(!entries.length||entries.some(([id,w])=>!Object.hasOwn(VARIANTS,id)||!Number.isFinite(w)||w<=0)||!Number.isInteger(maxRepeat)||maxRepeat<1)throw new TypeError('Invalid attack selection.');
  let last=null,repeats=0;
  return ()=>{
    const candidates=entries.filter(([id])=>entries.length===1||id!==last||repeats<maxRepeat);
    const random=rng();if(!Number.isFinite(random)||random<0||random>=1)throw new TypeError('RNG must return [0,1).');
    let value=random*candidates.reduce((sum,[,w])=>sum+w,0), selected=candidates.at(-1)[0];
    for(const [id,w] of candidates){value-=w;if(value<0){selected=id;break;}}
    repeats=selected===last?repeats+1:1;last=selected;return selected;
  };
}
