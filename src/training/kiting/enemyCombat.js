import { readonlySnapshot } from '../snapshot.js';
import { sweptCircle } from '../dodge/collision.js';
export function createEnemyCombat({config,events,attemptId,damageEnabled=true}){
 let health=config.playerHealth,damageTaken=0,damageEvents=0,invulnerability=0,time=0,sequence=0,lastDamage=null,dodgedShots=0,shots=[],playerAt={x:0,z:0};
 function damage(amount,from,kind){if(!damageEnabled||health<=0||invulnerability>0)return;const applied=Math.min(health,amount);health-=applied;damageTaken+=applied;damageEvents++;invulnerability=.25;lastDamage={at:time,amount:applied,from:{...from},kind};events?.emit('kiting:damage',readonlySnapshot({attemptId,health,maxHealth:config.playerHealth,...lastDamage,position:{...playerAt}}));}
 return {snapshot:()=>readonlySnapshot({health,maxHealth:config.playerHealth,damageTaken,damageEvents,defeated:health<=0,lastDamage,dodgedShots,enemyShots:shots}),
 update(dt,enemies,previous,player){if(health<=0)return true;playerAt={...player};time+=dt;invulnerability=Math.max(0,invulnerability-dt);
  const remaining=[];for(const shot of shots){const next={x:shot.position.x+shot.direction.x*shot.speed*dt,z:shot.position.z+shot.direction.z*shot.speed*dt};shot.age+=dt;if(sweptCircle({x:shot.position.x-previous.x,z:shot.position.z-previous.z},{x:next.x-player.x,z:next.z-player.z},(config.playerRadius??.45)+shot.radius)!==null){damage(shot.damage,shot.position,'ranged');}else if(shot.age>=3){dodgedShots++;}else{shot.position=next;remaining.push(shot);}}
  shots=remaining;if(health<=0){shots=[];return true;}
  for(const enemy of enemies){
   enemy.attackCooldown=Math.max(0,(enemy.attackCooldown??0)-dt);const ranged=enemy.enemyKind==='ranged',range=ranged?config.rangedRange:config.meleeRange,distance=Math.hypot(player.x-enemy.position.x,player.z-enemy.position.z);
   if(enemy.attackPhase==='windup'){
    enemy.attackRemaining=Math.max(0,enemy.attackRemaining-dt);if(enemy.attackRemaining<=1e-9){enemy.attackPhase='recovery';if(ranged&&distance<=range+.8&&shots.length<32){const travel=Math.hypot(player.x-enemy.position.x,player.z-enemy.position.z)/config.enemyProjectileSpeed,lead=config.predictiveShots?travel*.9:0,aim=config.predictiveShots?{x:player.x+Math.max(-config.playerSpeed,Math.min(config.playerSpeed,(player.x-previous.x)/dt))*lead,z:player.z+Math.max(-config.playerSpeed,Math.min(config.playerSpeed,(player.z-previous.z)/dt))*lead}:enemy.attackAim,dx=aim.x-enemy.position.x,dz=aim.z-enemy.position.z,n=Math.hypot(dx,dz)||1;shots.push({id:`enemy-shot-${++sequence}`,position:{...enemy.position},direction:{x:dx/n,z:dz/n},radius:.23,speed:config.enemyProjectileSpeed,damage:config.rangedDamage,age:0});events?.emit('kiting:enemy-shot',readonlySnapshot({attemptId,from:enemy.position,to:aim}));}else if(!ranged&&distance<=range)damage(config.meleeDamage,enemy.position,'melee');}
   }else if(enemy.attackCooldown<=1e-9&&distance<=range){enemy.attackPhase='windup';enemy.attackRemaining=config.enemyWindup;enemy.attackCooldown=ranged?config.rangedInterval:config.meleeInterval;enemy.attackAim={...player};}
   if(health<=0){shots=[];return true;}
  }return false;
 },stop(){shots=[];}};
}
