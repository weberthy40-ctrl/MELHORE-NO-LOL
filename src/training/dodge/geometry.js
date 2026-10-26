import { sweptCircle } from './collision.js';
export const PLAYER_RADIUS=.45;
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
export function pointSegmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,d=dx*dx+dz*dz,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/d)):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);}
export function segmentDistance(a,b,c,d){
 const rx=b.x-a.x,rz=b.z-a.z,sx=d.x-c.x,sz=d.z-c.z,den=rx*sz-rz*sx;
 if(Math.abs(den)>1e-12){const qx=c.x-a.x,qz=c.z-a.z,t=(qx*sz-qz*sx)/den,u=(qx*rz-qz*rx)/den;if(t>=0&&t<=1&&u>=0&&u<=1)return 0;}
 return Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));
}
/** Collision and telemetry use the same world-space shape, including the ring's safe center. */
export function trajectoryTouches(e,margin=0){
 const radius=PLAYER_RADIUS+margin;
 if(e.shape==='beam')return segmentDistance(e.playerFrom,e.playerTo,e.from,e.to)<=radius+e.radius;
 if(e.shape==='ring'){const wall=(e.wallWidth??.22)+radius,min=pointSegmentDistance(e.from,e.playerFrom,e.playerTo),max=Math.max(Math.hypot(e.playerFrom.x-e.from.x,e.playerFrom.z-e.from.z),Math.hypot(e.playerTo.x-e.from.x,e.playerTo.z-e.from.z));return min<=e.radius+wall&&max>=Math.max(0,e.radius-wall);}
 return sweptCircle({x:e.from.x-e.playerFrom.x,z:e.from.z-e.playerFrom.z},{x:e.to.x-e.playerTo.x,z:e.to.z-e.playerTo.z},e.radius+radius)!==null;
}
export function attackPosition(p,age){const distance=p.speed*Math.max(0,age-(p.windup??0));return {x:p.origin.x+p.direction.x*distance,z:p.origin.z+p.direction.z*distance};}
/** Clip player motion to the damaging interval; warnings never deal damage. */
export function attackTrajectory(p,ageStart,ageEnd,playerFrom,playerTo){
 const start=Math.max(ageStart,p.windup??0),end=Math.min(ageEnd,p.ttl);if(end<=start)return null;
 const dt=ageEnd-ageStart,from=attackPosition(p,start),to=p.shape==='beam'?{x:from.x+p.direction.x*p.length,z:from.z+p.direction.z*p.length}:attackPosition(p,end);
 return {shape:p.shape,wallWidth:p.wallWidth,radius:p.radius,from,to,playerFrom:lerp(playerFrom,playerTo,(start-ageStart)/dt),playerTo:lerp(playerFrom,playerTo,(end-ageStart)/dt)};
}
