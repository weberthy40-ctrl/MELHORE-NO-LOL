const median=values=>{const v=[...values].sort((a,b)=>a-b);return (v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2;};
/** Counts per physical inch; this is meaningful only for unadjusted pointer input. */
export function estimateDpi(samples,distanceCm){
 if(!Number.isFinite(distanceCm)||distanceCm<2||distanceCm>50||!Array.isArray(samples)||samples.length<3||samples.length>10)throw new TypeError('Faça pelo menos três passagens de 2 a 50 cm.');
 const values=samples.map(s=>{
  if(!s?.raw||![s.netX,s.pathX,s.pathY].every(Number.isFinite)||s.pathX<100||s.pathY<0||Math.abs(s.netX)>s.pathX+1e-6||Math.abs(s.netX)/s.pathX<.9||s.pathY/s.pathX>.2)throw new TypeError('Repita em linha reta, sem voltar, usando entrada bruta.');
  return Math.abs(s.netX)*2.54/distanceCm;
 });
 const dpi=median(values),spread=(Math.max(...values)-Math.min(...values))/dpi;
 return Object.freeze({dpi:Math.round(dpi),spread,stable:spread<=.08,samples:values.length,distanceCm});
}
/** Compare settings on equal geometry using Fitts throughput, with an explicit error penalty. */
export function scoreDpiTrial({times,errors,width,height,distances},radius=22){
 if(!Array.isArray(times)||times.length!==10||!times.every(n=>Number.isFinite(n)&&n>0)||!Array.isArray(distances)||distances.length!==10||!distances.every(n=>Number.isFinite(n)&&n>=0)||!Number.isInteger(errors)||errors<0||![width,height,radius].every(n=>Number.isFinite(n)&&n>0))throw new TypeError('Complete os dez alvos.');
 const medianMs=median(times.slice(1)),accuracy=10/(10+errors),bits=distances.slice(1).reduce((sum,d)=>sum+Math.log2(1+d/(radius*2)),0),seconds=times.slice(1).reduce((sum,t)=>sum+t,0)/1000;
 return Object.freeze({medianMs,accuracy,score:bits/seconds*accuracy**2});
}
export function compareDpiCandidates(trials){
 const grouped=new Map();
 for(const t of trials){if(!Number.isInteger(t.dpi)||t.dpi<100||t.dpi>32000||!Number.isFinite(t.lolSpeed)||t.lolSpeed<0||t.lolSpeed>100)throw new TypeError('Configuração inválida.');const metric=scoreDpiTrial(t),key=`${t.dpi}:${t.lolSpeed}`;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push({...t,...metric});}
 const candidates=[...grouped.values()].map(rows=>({dpi:rows[0].dpi,lolSpeed:rows[0].lolSpeed,count:rows.length,score:median(rows.map(r=>r.score)),medianMs:median(rows.map(r=>r.medianMs)),accuracy:rows.reduce((n,r)=>n+r.accuracy,0)/rows.length,geometry:`${rows[0].width}:${rows[0].height}`}));
 const repeated=candidates.length>=2&&candidates.every(c=>c.count>=3),sameConditions=new Set(trials.map(t=>`${t.width}:${t.height}:${t.dpr}:${t.lolSpeed}`)).size<=1,enough=repeated&&sameConditions;
 candidates.sort((a,b)=>b.score-a.score);const gap=enough?(candidates[0].score-candidates[1].score)/candidates[1].score:0;
 return {candidates,status:!sameConditions?'different-conditions':!enough?'collecting':gap<.05?'tie':'recommended',best:enough&&gap>=.05?candidates[0]:null,gap};
}
