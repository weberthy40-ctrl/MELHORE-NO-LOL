import * as THREE from 'three';
import { VARIANTS } from '../training/dodge/projectiles.js';
import { createCharacter } from './character.js';
export function projectileHaloSize(radius,depth,fov,height){const pixel=2*Math.max(.1,depth)*Math.tan(fov*Math.PI/360)/Math.max(1,height);return Math.max(radius*2.8,pixel*32);}
/** Solid silhouettes carry the hit shape; small halos and tails are cosmetic. */
export function createDodgeVisuals(scene,{camera,container,reducedMotion=false,effects=true}={}){
 const group=new THREE.Group();group.name='Dodge spells';scene.add(group);
 const owned=new Set(),active=new Map(),pool=new Map(),casters=[];let assets=null,disposed=false,lastTime=0,actorCount=0;
 const own=value=>{owned.add(value);return value;};
 const material=(color,opacity=1)=>own(new THREE.MeshBasicMaterial({color,opacity,transparent:opacity<1,depthWrite:false,depthTest:false,side:THREE.DoubleSide,toneMapped:false}));
 const geometries={sphere:own(new THREE.SphereGeometry(1,16,12)),cone:own(new THREE.ConeGeometry(1,1,12)),crystal:own(new THREE.OctahedronGeometry(1)),box:own(new THREE.BoxGeometry(1,1,1)),disk:own(new THREE.CircleGeometry(1,64)),ring:own(new THREE.RingGeometry(.975,1,80)),trail:own(new THREE.CylinderGeometry(.12,1,1,10)),post:own(new THREE.CylinderGeometry(.7,1,1,8)),hoop:own(new THREE.TorusGeometry(1,.09,6,40)),wall:own(new THREE.RingGeometry(VARIANTS.cage.radius-VARIANTS.cage.wallWidth,VARIANTS.cage.radius+VARIANTS.cage.wallWidth,96))};
 const white=material(0xf9ffff),dark=material(0x0a1629),ink=material(0x0a1324,.65),whiteSoft=material(0xf9ffff,.65);
 const bytes=new Uint8Array(48*48*4);for(let y=0;y<48;y++)for(let x=0;x<48;x++){const at=(y*48+x)*4,r=Math.hypot(x-23.5,y-23.5)/23.5;bytes[at]=bytes[at+1]=bytes[at+2]=255;bytes[at+3]=Math.round(Math.max(0,1-r)**2*170);}const haloMap=own(new THREE.DataTexture(bytes,48,48));haloMap.needsUpdate=true;
 const styles=Object.fromEntries(Object.entries(VARIANTS).map(([id,v])=>[id,{solid:material(v.color),soft:material(v.color,.09),fill:material(v.color,.25),tail:material(v.color,.65),halo:own(new THREE.SpriteMaterial({map:haloMap,color:v.color,opacity:.55,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}))}]));
 const axis=new THREE.Vector3(0,1,0),direction=new THREE.Vector3(),projected=new THREE.Vector3();
 const arrows=container?.ownerDocument?.createElement('div');if(arrows){arrows.className='dodge-origin-alerts';arrows.setAttribute('aria-hidden','true');container.append(arrows);}
 const legend=container?.ownerDocument?.createElement('p');if(legend){legend.className='dodge-spell-legend';container.append(legend);}
 function mesh(geometry,mat,parent,name='',order=100){const value=new THREE.Mesh(geometry,mat);value.name=name;value.renderOrder=order;value.raycast=()=>{};parent.add(value);return value;}
 function floor(geometry,mat,parent,name='',order=100){const value=mesh(geometry,mat,parent,name,order);value.rotation.x=-Math.PI/2;return value;}
 function make(variant){
  const s=styles[variant],root=new THREE.Group(),warning=new THREE.Group(),effect=new THREE.Group();root.add(warning,effect);group.add(root);
  const path=mesh(geometries.box,s.soft,warning,'cast-path'),guide=mesh(geometries.box,s.solid,warning,'cast-guide'),disc=floor(geometries.disk,s.soft,warning),rim=floor(geometries.ring,s.solid,warning),clock=floor(geometries.ring,whiteSoft,warning),warningShadow=floor(geometries.ring,ink,warning);
  const geometry=variant==='heavy_lance'?geometries.crystal:variant==='needle_burst'?geometries.cone:geometries.sphere;
  const headMaterial=s.head??=own(new THREE.MeshStandardMaterial({color:VARIANTS[variant].color,emissive:VARIANTS[variant].color,emissiveIntensity:.18,roughness:.3,metalness:.15,depthWrite:false,depthTest:false,toneMapped:false}));
  const outline=mesh(geometry,dark,effect,'projectile-outline',117),body=mesh(geometry,headMaterial,effect,'projectile-head',118),core=mesh(geometries.sphere,white,effect,'projectile-core',119),tail=mesh(geometries.trail,s.tail,effect,'projectile-tail',115),hoop=mesh(geometries.hoop,whiteSoft,effect,'orb-ring',120),halo=new THREE.Sprite(s.halo);halo.renderOrder=114;halo.raycast=()=>{};effect.add(halo);
  const footprint=floor(geometries.ring,s.tail,effect,'collision-footprint',101),beam=mesh(geometries.box,s.solid,effect,'beam',110),beamCore=mesh(geometries.box,white,effect,'beam-core',111),impact=floor(geometries.disk,s.fill,effect,'impact-area'),edge=floor(geometries.ring,s.solid,effect,'impact-edge',102),pillar=mesh(geometries.cone,s.fill,effect,'fire-column',103),wall=floor(geometries.wall,s.solid,effect,'cage-wall',105),inner=floor(geometries.ring,whiteSoft,effect,'cage-inner',106),outer=floor(geometries.ring,ink,effect,'cage-outline',104);
  const posts=Array.from({length:8},()=>mesh(geometries.post,s.solid,effect,'cage-post',105)),caps=Array.from({length:8},()=>mesh(geometries.crystal,white,effect,'cage-crystal',106));
  const charge=mesh(geometries.sphere,whiteSoft,root,'cast-charge',110);
  const arrow=arrows?.ownerDocument.createElement('span');if(arrow){arrow.className='dodge-origin-arrow';arrow.hidden=true;arrow.style.color='#'+VARIANTS[variant].color.toString(16).padStart(6,'0');arrows.append(arrow);}
  return {root,warning,effect,path,guide,disc,rim,clock,warningShadow,outline,body,core,tail,hoop,halo,footprint,beam,beamCore,impact,edge,pillar,wall,inner,outer,posts,caps,charge,arrow,caster:null,variant};
 }
 function actor(ranged){let at=casters.findIndex(a=>a.group.userData.ranged===ranged);if(at>=0)return casters.splice(at,1)[0];if(actorCount>=12)return null;actorCount++;const value=createCharacter({enemy:true,caster:true,ranged,scale:.85,reducedMotion,dodge:true});if(assets)value.applyAssets(assets);return value;}
 function releaseCaster(entry){if(!entry.caster)return;entry.caster.group.removeFromParent();casters.push(entry.caster);entry.caster=null;}
 function retire(id){const e=active.get(id);e.root.visible=false;if(e.arrow)e.arrow.hidden=true;releaseCaster(e);if(!pool.has(e.variant))pool.set(e.variant,[]);pool.get(e.variant).push(e);active.delete(id);}
 function lane(node,p,width,height){const length=p.shape==='beam'?p.length:p.range;node.position.set(p.origin.x+p.direction.x*length/2,height/2+.045,p.origin.z+p.direction.z*length/2);node.rotation.y=Math.atan2(p.direction.x,p.direction.z);node.scale.set(width,height,length);}
 function circle(node,origin,radius,y=.055){node.position.set(origin.x,y,origin.z);node.scale.set(radius,radius,1);}
 function bolt(e,p,time){
  const at=p.position,r=p.radius;e.outline.visible=e.body.visible=e.core.visible=e.footprint.visible=e.halo.visible=true;
  e.body.position.set(at.x,.75,at.z);e.body.rotation.set(0,Math.atan2(p.direction.x,p.direction.z),0);e.body.scale.set(r*.86,r*.72,r*1.3);
  if(p.variant==='heavy_lance'){e.body.scale.set(r*.85,r*.7,r*2.2);e.body.position.x-=p.direction.x*r*1.2;e.body.position.z-=p.direction.z*r*1.2;}
  if(p.variant==='needle_burst'){e.body.quaternion.setFromUnitVectors(axis,direction.set(p.direction.x,0,p.direction.z));e.body.scale.set(r*.75,r*2.7,r*.75);}
  e.outline.position.copy(e.body.position);e.outline.quaternion.copy(e.body.quaternion);e.outline.scale.copy(e.body.scale).multiplyScalar(1.14);
  e.core.position.set(at.x+p.direction.x*r*.2,.8,at.z+p.direction.z*r*.2);e.core.rotation.set(0,Math.atan2(p.direction.x,p.direction.z),0);e.core.scale.set(r*.36,r*.36,r*.68);
  circle(e.footprint,at,r);e.halo.position.copy(e.body.position);const depth=camera?-projected.copy(e.body.position).applyMatrix4(camera.matrixWorldInverse).z:25,size=projectileHaloSize(r,depth,camera?.fov??44,container?.clientHeight??768);e.halo.scale.set(size,size,1);
  const length=Math.min(p.distance??0,Math.min(2.8,p.speed*.085));e.tail.visible=length>.02;e.tail.position.set(at.x-p.direction.x*(length/2+r*.3),.75,at.z-p.direction.z*(length/2+r*.3));e.tail.quaternion.setFromUnitVectors(axis,direction.set(p.direction.x,0,p.direction.z));e.tail.scale.set(r*.35,length,r*.35);
  if(p.variant==='dark_orb'){e.body.scale.setScalar(r*.9);e.outline.scale.setScalar(r*1.03);e.hoop.visible=true;e.hoop.position.copy(e.body.position);e.hoop.rotation.set(Math.PI/3,reducedMotion?0:time*2,.3);e.hoop.scale.setScalar(r*.92);e.core.scale.set(r*.35,r*.35,r*.35);}
 }
 return {applyAssets(value){assets=value;for(const a of [...casters,...[...active.values()].map(e=>e.caster).filter(Boolean)])a.applyAssets(value);},sync(snapshot){
  if(disposed)return;const time=snapshot.elapsed??lastTime+.016,dt=Math.max(0,Math.min(.1,time-lastTime));lastTime=time;
  if(legend){const label=snapshot.level>=3?'Contorno = área de impacto · Gaiola: apenas a borda causa dano':'Trajetória de apoio ativa · Saia do contorno antes do impacto';if(legend.textContent!==label)legend.textContent=label;}
  const ids=new Set(snapshot.projectiles.map(p=>p.id));for(const id of active.keys())if(!ids.has(id))retire(id);
  for(const p of snapshot.projectiles){
   if(!active.has(p.id)){const entry=pool.get(p.variant)?.pop()??make(p.variant);entry.root.visible=true;active.set(p.id,entry);}
   const e=active.get(p.id),waiting=p.phase==='warning',shape=p.shape??'bolt',progress=p.windup?Math.min(1,p.age/p.windup):1;
   e.warning.visible=waiting;e.effect.visible=!waiting;
   for(const name of ['path','guide','disc','rim','clock','warningShadow','outline','body','core','tail','hoop','halo','footprint','beam','beamCore','impact','edge','pillar','wall','inner','outer'])e[name].visible=false;
   for(const node of [...e.posts,...e.caps])node.visible=false;
   if(p.caster&&(waiting||p.age<(p.windup??0)+.12)){
    if(!e.caster){e.caster=actor(['arcane_bolt','needle_burst','heavy_lance','artillery','meteor_rain'].includes(p.variant));if(e.caster){e.caster.setAccent(VARIANTS[p.variant].color);e.root.add(e.caster.group);}}
    if(e.caster){const aim=['bolt','beam'].includes(shape)?{x:p.caster.x+p.direction.x,z:p.caster.z+p.direction.z}:p.origin;e.caster.setPose(p.caster,Math.atan2(aim.x-p.caster.x,aim.z-p.caster.z));e.caster.animate({attackPhase:waiting?'windup':null},dt);}
   }else releaseCaster(e);
   e.charge.visible=Boolean(p.caster)&&waiting;
   if(e.charge.visible){const target=shape==='circle'||shape==='ring'?p.origin:p.caster,t=shape==='circle'?progress:0;e.charge.position.set(p.caster.x+(target.x-p.caster.x)*t,1.7+Math.sin(t*Math.PI)*3,p.caster.z+(target.z-p.caster.z)*t);e.charge.scale.setScalar(.18+progress*.16);if(p.variant==='meteor_rain')e.charge.position.set(p.origin.x,9*(1-progress)+.7,p.origin.z);}
   if(e.arrow){e.arrow.hidden=true;if(waiting&&p.caster&&camera){projected.set(p.caster.x,1.5,p.caster.z).project(camera);const x=projected.x,y=-projected.y;if(Math.abs(x)>.92||Math.abs(y)>.85){const f=.9/Math.max(Math.abs(x),Math.abs(y));e.arrow.hidden=false;e.arrow.style.left=`${Math.max(4,Math.min(96,50+x*f*50))}%`;e.arrow.style.top=`${Math.max(21,Math.min(89,50+y*f*50))}%`;e.arrow.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(y,x)+Math.PI/2}rad)`;}}}
   if(shape==='bolt'||shape==='beam'){
    e.path.visible=e.guide.visible=waiting&&(shape==='beam'||(p.pathHint??'full')==='full'||p.pathHint==='brief'&&p.age<p.hintDuration);lane(e.path,p,p.radius*2,.015);lane(e.guide,p,.055,.025);
    if(!waiting&&shape==='bolt')bolt(e,p,time);
    if(!waiting&&shape==='beam'){e.beam.visible=e.beamCore.visible=true;lane(e.beam,p,p.radius*2,.15);lane(e.beamCore,p,p.radius*.55,.18);}
   }else{
    if(waiting){e.disc.visible=shape==='circle';e.rim.visible=e.clock.visible=e.warningShadow.visible=true;circle(e.disc,p.origin,p.radius);circle(e.warningShadow,p.origin,p.radius+.065,.05);circle(e.rim,p.origin,p.radius,.065);circle(e.clock,p.origin,p.radius*(.35+.65*progress),.075);}
    else if(shape==='ring'){
     e.wall.visible=e.inner.visible=e.outer.visible=true;e.wall.position.set(p.origin.x,.07,p.origin.z);e.wall.scale.setScalar(p.radius/VARIANTS.cage.radius);circle(e.inner,p.origin,p.radius-p.wallWidth,.08);circle(e.outer,p.origin,p.radius+p.wallWidth+.09,.055);
     for(let i=0;i<8;i++){const angle=i*Math.PI/4,post=e.posts[i],cap=e.caps[i];post.visible=cap.visible=true;post.position.set(p.origin.x+Math.sin(angle)*p.radius,.8,p.origin.z+Math.cos(angle)*p.radius);post.scale.set(.12,1.6,.12);cap.position.set(post.position.x,1.65,post.position.z);cap.scale.set(.14,.23,.14);}
    }else{
     e.impact.visible=e.edge.visible=e.core.visible=true;circle(e.impact,p.origin,p.radius);circle(e.edge,p.origin,p.radius,.07);e.core.position.set(p.origin.x,.18,p.origin.z);e.core.scale.set(p.radius*.45,.16,p.radius*.45);
     if(p.variant==='flame_circle'){e.pillar.visible=effects;e.pillar.position.set(p.origin.x,1.1,p.origin.z);e.pillar.scale.set(p.radius*.55,2.1,p.radius*.55);for(let i=0;i<5&&effects;i++){const node=e.posts[i],a=i*Math.PI*2/5;node.visible=true;node.position.set(p.origin.x+Math.sin(a)*p.radius*.52,.7,p.origin.z+Math.cos(a)*p.radius*.52);node.scale.set(.16,1.2+(reducedMotion?0:Math.sin(time*12+i)*.2),.16);}}
    }
   }
  }
 },dispose(){if(disposed)return;disposed=true;for(const id of active.keys())retire(id);for(const a of casters)a.dispose();casters.length=0;pool.clear();group.removeFromParent();group.clear();for(const value of owned)value.dispose();owned.clear();arrows?.remove();legend?.remove();}};
}
