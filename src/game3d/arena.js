import * as THREE from 'three';
import { disposeObject } from './resources.js';
import { ARENA } from './spatial.js';
import { cloneModel } from './sceneAssets.js';
function canvasTexture(document,width,height,paint){
 if(!document?.defaultView?.CanvasRenderingContext2D)return null;const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');if(!ctx)return null;paint(ctx);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
function paintGround(document){
 return canvasTexture(document,1024,2048,ctx=>{
  let seed=179;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle='#253c32';ctx.fillRect(0,0,1024,2048);
  for(let i=0;i<12000;i++){const x=random()*1024,y=random()*2048,r=2+random()*13;ctx.fillStyle=['#37513e','#465c42','#1d332d','#2a4233'][i%4];ctx.globalAlpha=.28;ctx.beginPath();ctx.ellipse(x,y,r,r*.6,0,0,7);ctx.fill();}ctx.globalAlpha=1;
  for(let row=0;row<65;row++)for(let col=0;col<22;col++){
   const x=232+col*26+(row%2)*13,y=row*32;if(x<250+Math.sin(row*.19)*18||x>780+Math.sin(row*.19)*18)continue;
   const shade=Math.floor(76+random()*30),gradient=ctx.createLinearGradient(x,y,x+24,y+30);gradient.addColorStop(0,`rgb(${shade+15},${shade+23},${shade+10})`);gradient.addColorStop(1,`rgb(${shade-5},${shade+4},${shade-4})`);ctx.fillStyle=gradient;
   ctx.beginPath();ctx.moveTo(x+3,y+2);ctx.lineTo(x+23,y+1);ctx.lineTo(x+25,y+26);ctx.lineTo(x+19,y+30);ctx.lineTo(x+1,y+28);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#b7c4a336';ctx.beginPath();ctx.moveTo(x+4,y+3);ctx.lineTo(x+22,y+3);ctx.stroke();
   if(random()<.28){ctx.strokeStyle='#20382b99';ctx.beginPath();ctx.moveTo(x+10,y+2);ctx.lineTo(x+15,y+14);ctx.lineTo(x+12,y+28);ctx.stroke();}
   if(random()<.7){ctx.fillStyle='#63834660';ctx.beginPath();ctx.ellipse(x+random()*24,y+random()*30,3+random()*7,2+random()*3,0,0,7);ctx.fill();}
  }
  // A subtle engraved seal gives the arena a distinct center without affecting hitboxes.
  ctx.save();ctx.translate(512,1024);ctx.scale(1024/50,2048/76);ctx.strokeStyle='#d9c18d65';ctx.lineWidth=.07;
  for(const r of [5.4,5.7,6.5]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<16;i++){ctx.save();ctx.rotate(i*Math.PI/8);ctx.beginPath();ctx.moveTo(0,-5.75);ctx.lineTo(.15,-6);ctx.lineTo(0,-6.3);ctx.lineTo(-.15,-6);ctx.closePath();ctx.stroke();ctx.restore();}ctx.restore();
 });
}
function waterTexture(document){return canvasTexture(document,256,512,ctx=>{
 ctx.fillStyle='#164e59';ctx.fillRect(0,0,256,512);ctx.strokeStyle='#64c6ba55';ctx.lineWidth=1.5;
 for(let row=0;row<22;row++){ctx.beginPath();for(let x=0;x<=256;x+=8){const y=row*25+Math.sin(x*.065+row)*7;if(!x)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
});}
export function createArena({document=globalThis.document,quality='alto'}={}){
 const group=new THREE.Group(),textures=[],models=new THREE.Group();group.add(models);
 const texture=paintGround(document),waterMap=waterTexture(document);if(texture)textures.push(texture);if(waterMap){waterMap.wrapS=waterMap.wrapT=THREE.RepeatWrapping;waterMap.repeat.set(1,7);textures.push(waterMap);}
 const floorMaterial=new THREE.MeshStandardMaterial({color:texture?0xffffff:0x52614a,map:texture,roughness:.93});
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(50,76),floorMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-.035;ground.receiveShadow=true;group.add(ground);const artLayer=new THREE.Group();group.add(artLayer);
 const stone=new THREE.MeshStandardMaterial({color:0x66766c,roughness:.97}),bark=new THREE.MeshStandardMaterial({color:0x44362c,roughness:1}),grass=new THREE.MeshStandardMaterial({color:0x71864b,roughness:1});
 const foliage=[0x194a39,0x24583c,0x315c3f].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
 const water=new THREE.MeshStandardMaterial({color:0x4c8e9a,map:waterMap,roughness:.24,metalness:.25,emissive:0x092127,emissiveIntensity:.12});
 const glow=new THREE.MeshBasicMaterial({color:0xffce87});
 const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(Math.abs(x)>=9?Math.sign(x)*(Math.abs(x)+(ARENA.width-18)/2):x,y,z);m.castShadow=m.receiveShadow=true;m.userData.foliage=foliage.includes(mat);group.add(m);return m;};
 for(const side of [-1,1]){
  const river=add(new THREE.PlaneGeometry(3,72),water,side*13,-.012,0);river.rotation.x=-Math.PI/2;river.castShadow=false;
  for(let i=0;i<12;i++){
   const z=-30+i*5.5,x=side*(16.5+Math.sin(i*3.2)*1.4),height=3.4+(i%3)*.6;
   add(new THREE.CylinderGeometry(.2,.35,height*.7,7),bark,x,height*.3,z);
   if(i%3){for(let tier=0;tier<3;tier++)add(new THREE.ConeGeometry(2.2-tier*.45,3.2,9),foliage[i%3],x,height*.65+tier*.9,z);}
   else{for(let crown=0;crown<3;crown++){const canopy=add(new THREE.IcosahedronGeometry(1.7,1),foliage[crown],x+Math.cos(crown*2)*.7,height+Math.sin(crown)*.2,z+Math.sin(crown*2)*.7);canopy.scale.y=.85;}}
   const rock=add(new THREE.DodecahedronGeometry(.6+(i%3)*.15,0),stone,side*(11+Math.sin(i*7)*.35),.28,z);rock.scale.set(1,.65,1.5);rock.rotation.y=i;
   if(i%4===1){add(new THREE.CylinderGeometry(.3,.45,1.7,8),stone,side*10.4,.7,z);const flame=add(new THREE.SphereGeometry(.2,10,8),glow,side*10.4,1.7,z);flame.scale.y=1.8;flame.castShadow=false;}
  }
  for(let i=0;i<72;i++){const reed=add(new THREE.ConeGeometry(.09,.65+(i%5)*.1,3),grass,side*(11.4+(i%5)*.2),.3,-33+i*.92);reed.rotation.z=side*.18;}
 }
 // Static plants and rocks are instanced; detail does not add one draw call per blade of grass.
 const batches=new Map();for(const child of [...group.children]){if(!child.isMesh)continue;const key=child.geometry.type+JSON.stringify(child.geometry.parameters)+child.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);}
 for(const batch of batches.values()){if(batch.length<2)continue;const first=batch[0],instances=new THREE.InstancedMesh(first.geometry,first.material,batch.length);instances.castShadow=instances.receiveShadow=true;instances.userData.foliage=Boolean(first.userData.foliage);for(const [i,child]of batch.entries()){child.updateMatrix();instances.setMatrixAt(i,child.matrix);group.remove(child);if(child.geometry!==first.geometry)child.geometry.dispose();}instances.computeBoundingSphere();group.add(instances);}
 let disposed=false,upgraded=false;
 function place(template,height,x,z,angle=0){const model=cloneModel(template),box=new THREE.Box3().setFromObject(model),s=height/Math.max(.1,box.max.y-box.min.y);model.scale.setScalar(s);model.rotation.y=angle;model.position.set(Math.abs(x)>=9?Math.sign(x)*(Math.abs(x)+(ARENA.width-18)/2):x,-box.min.y*s,z);models.add(model);}
 return {group,applyAssets(assets){if(disposed||upgraded)return;upgraded=true;
  if(assets.stone){const map=assets.stone.clone();map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(4,11);map.anisotropy=4;map.needsUpdate=true;textures.push(map);const paving=new THREE.Mesh(new THREE.PlaneGeometry(ARENA.width+2,76),new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.045,roughness:.94,color:0xb6c2c5}));paving.rotation.x=-Math.PI/2;paving.position.y=-.018;paving.receiveShadow=true;artLayer.add(paving);
   const inlayMaterial=new THREE.MeshStandardMaterial({color:0x839b9f,metalness:.55,roughness:.65,transparent:true,opacity:.6}),inlay=new THREE.Mesh(new THREE.RingGeometry(2.6,2.64,96),inlayMaterial);inlay.rotation.x=-Math.PI/2;inlay.position.y=.001;artLayer.add(inlay);
   for(const side of [-1,1]){const curb=new THREE.Mesh(new THREE.BoxGeometry(.16,.1,76),stone);curb.position.set(side*(ARENA.width/2+.35),.025,0);curb.receiveShadow=true;artLayer.add(curb);}
  }
  if(assets.canopy){group.traverse(n=>{if(n.userData.foliage)n.visible=false;});const map=assets.canopy.clone();map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true;textures.push(map);const geo=new THREE.PlaneGeometry(7.2,7.2),mat=new THREE.MeshStandardMaterial({map,alphaTest:.35,side:THREE.DoubleSide,roughness:1,color:0xabc6b2}),forest=new THREE.InstancedMesh(geo,mat,48),dummy=new THREE.Object3D();let index=0;
   for(const side of [-1,1])for(let i=0;i<12;i++)for(let layer=0;layer<2;layer++){dummy.position.set(side*(20.5+Math.sin(i*3.2)*1.4),3.1+layer*.65,-30+i*5.5);dummy.rotation.set(-Math.PI/2,0,i*.79+layer*1.6);const scale=.85+(i%3)*.12-layer*.12;dummy.scale.set(scale,scale,scale);dummy.updateMatrix();forest.setMatrixAt(index,dummy.matrix);forest.setColorAt(index++,new THREE.Color().setHSL(.34,.12,.78+(i%4)*.05));}forest.castShadow=forest.receiveShadow=true;forest.computeBoundingSphere();artLayer.add(forest);
  }

  for(const side of [-1,1]){
   for(const z of [-14,0,14]){place(assets.pillar,2.8,side*10.5,z);place(assets.banner,2.25,side*10.5,z+.5,side*Math.PI/2);if(quality==='alto')place(assets.rubble,.55,side*11.1,z+2.5);}
   for(const z of [-12,-4,4,12])place(assets.barrier,1,side*10.3,z,Math.PI/2);
   for(const z of [-12,4])place(assets.torch,1.8,side*9.8,z);
  }
  for(const z of [-22,22])place(assets.pillar,4.5,0,z);
 },update(dt){if(disposed||quality==='leve'||!waterMap||dt<=0)return;waterMap.offset.y=(waterMap.offset.y+dt*.025)%1;},dispose(){if(disposed)return;disposed=true;disposeObject(group);for(const t of textures)t.dispose();}};
}
