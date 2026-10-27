import { attackPosition,pointSegmentDistance,PLAYER_RADIUS } from './geometry.js';
const near=(p,center,radius)=>{
 if(p.shape==='circle'||p.shape==='ring')return Math.hypot(p.origin.x-center.x,p.origin.z-center.z)<=radius+p.radius+PLAYER_RADIUS;
 const from=attackPosition(p,p.age),to=p.shape==='beam'?{x:from.x+p.direction.x*p.length,z:from.z+p.direction.z*p.length}:attackPosition(p,Math.min(p.ttl,p.age+4));
 return pointSegmentDistance(center,from,to)<=radius+p.radius+PLAYER_RADIUS;
};
/** A readable cage encounter has room for at most two/three narrow traveling shots. */
export function allowsCageCombination(candidate,active,player,level){
 const cages=active.filter(p=>p.shape==='ring'),budget=level<=12?2:3;
 if(candidate.shape==='ring'){
  if(cages.length)return false;
  const relevant=active.filter(p=>near(p,candidate.origin,candidate.radius));
  return relevant.length<=1&&relevant.every(p=>p.shape==='bolt'&&p.radius<=.6);
 }
 const cage=cages.find(p=>Math.hypot(player.x-p.origin.x,player.z-p.origin.z)<=p.radius+PLAYER_RADIUS+.3);
 if(!cage)return true;
 if(candidate.shape!=='bolt'||candidate.radius>.6)return false;
 return active.filter(p=>p.shape==='bolt'&&near(p,cage.origin,cage.radius)).length<budget;
}
