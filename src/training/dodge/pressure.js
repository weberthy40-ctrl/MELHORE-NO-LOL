/** Bounded, practice-only adaptation. Only resolved threats, never harmless shots, count. */
export function createPressureDirector({intensity=1,adaptive=false}={}){
 if(!Number.isFinite(intensity)||intensity<1||intensity>1.8||typeof adaptive!=='boolean')throw new TypeError('Invalid practice pressure.');
 const maximum=intensity,minimum=adaptive?.75:intensity;let current=adaptive?Math.max(minimum,intensity*.85):intensity,window=[],adjustments=0,lastChange=0;
 return {observe(avoided,time){if(!adaptive||typeof avoided!=='boolean'||!Number.isFinite(time)||time<lastChange)return;window.push(avoided);window=window.slice(-8);if(window.length<8||time-lastChange<5)return;const ratio=window.filter(Boolean).length/window.length,step=ratio>=.875?.08:ratio<=.5?-.12:0,next=Math.max(minimum,Math.min(maximum,current+step));if(Math.abs(next-current)>1e-8){current=next;adjustments++;}lastChange=time;window=[];},snapshot:()=>Object.freeze({adaptive,current,minimum,maximum,adjustments})};
}
