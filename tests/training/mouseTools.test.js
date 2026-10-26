import { it,expect } from 'vitest';
import { parseDpi,parseSensitivity,calculateProxyEDPI,calculateEquivalentSensitivity,saveMouseSettings } from '../../src/tools/mouse/calculator.js';
import { createMouseTest,generateMouseTargets,summarizeMouseTest,compareMouseTests } from '../../src/tools/mouse/consistency.js';
import { createRandom } from '../../src/core/random.js';
it('parses optional DPI and decimal sensitivity strictly and preserves the relative product',()=>{
 expect(calculateProxyEDPI(800,'1,5')).toBe(1200);expect(calculateEquivalentSensitivity(800,'1,5',1600)).toBe(.75);expect(calculateProxyEDPI('',1)).toBeNull();expect(parseDpi(32000)).toBe(32000);expect(parseSensitivity('0,100')).toBe(.1);
 for(const value of ['1e3','Infinity',0,99,32001,-100,'800 dpi'])expect(()=>parseDpi(value)).toThrow();for(const value of ['1.0001','NaN','1,2,3',0,10.001])expect(()=>parseSensitivity(value)).toThrow();
 const calls=[];saveMouseSettings({setItem:(...args)=>calls.push(args)},{version:1,dpi:800,sensitivity:1.5,label:'Meu jogo'});expect(calls).toHaveLength(1);expect(calls[0][0]).toBe('moba-training:mouse:v1');
});
it('generates ten bounded, separated targets in CSS pixels and pauses only active time',()=>{
 for(const width of [120,600]){const targets=generateMouseTargets({width,height:320,rng:createRandom(1)});expect(targets).toHaveLength(10);for(let i=0;i<10;i++){expect(targets[i].x).toBeGreaterThanOrEqual(30);expect(targets[i].x).toBeLessThanOrEqual(width-30);if(i)expect(Math.hypot(targets[i].x-targets[i-1].x,targets[i].y-targets[i-1].y)).toBeGreaterThanOrEqual(Math.min(width,320)*.3);}}
 let clock=0;const test=createMouseTest({width:600,height:320,context:{dpr:1},now:()=>clock,rng:createRandom(2)});test.start();test.present();test.pause();clock+=1000;test.resume();clock+=200;let s=test.snapshot();expect(test.click(s.target.id,{x:-1,y:-1})).toBe(false);expect(test.snapshot().errors).toBe(1);
 for(let i=0;i<10;i++){s=test.snapshot();expect(test.click(s.target.id,s.target)).toBe(true);expect(test.click(s.target.id,s.target)).toBe(false);if(i<9){test.present();clock+=200;}}
 expect(test.snapshot().result).toMatchObject({hits:10,errors:1,medianMs:200,dispersionMs:0});
});
it('compares exactly complete summaries and reports changed conditions without hardware claims',()=>{
 const a=summarizeMouseTest({times:Array(10).fill(200),errors:2,context:{width:600,height:320,dpr:1}}),b=summarizeMouseTest({times:Array(10).fill(180),errors:1,context:{width:600,height:320,dpr:1}});expect(compareMouseTests(a,b)).toMatchObject({status:'comparable',difference:{errors:-1,medianMs:-20,dispersionMs:0}});expect(compareMouseTests(a,{...b,context:{...b.context,dpr:2}}).status).toBe('different-conditions');expect(compareMouseTests(null,b).status).toBe('insufficient-data');expect(()=>summarizeMouseTest({times:[NaN],errors:0,context:{}})).toThrow();
});
