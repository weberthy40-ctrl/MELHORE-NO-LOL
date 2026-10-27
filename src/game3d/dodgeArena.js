import * as THREE from 'three';
import { DODGE_ARENA } from './spatial.js';
import { cloneModel } from './sceneAssets.js';
import { disposeObject } from './resources.js';
/** Quiet stone lane, grass shoulders and instanced CC0 scenery outside the play bounds. */
export function createDodgeArena({quality='alto'}={}){
 const group=new THREE.Group(),art=new THREE.Group();group.name='Dodge arena 28 × 44';group.add(art);let upgraded=false,disposed=false;
 const shadow=quality!=='leve',mat=(color,roughness=.94)=>new THREE.MeshStandardMaterial({color,roughness});
 const grass=mat(0x344b3d),foundation=mat(0x283e42),stone=mat(0x6a786f),trim=mat(0x718277),inlay=mat(0x7d8a77),water=new THREE.MeshStandardMaterial({color:0x245661,roughness:.3,metalness:.2});
 function mesh(geometry,material,x=0,y=0,z=0){const node=new THREE.Mesh(geometry,material);node.position.set(x,y,z);node.castShadow=node.receiveShadow=shadow;node.raycast=()=>{};group.add(node);return node;}
 function plane(w,h,material,x,y,z){const node=mesh(new THREE.PlaneGeometry(w,h),material,x,y,z);node.rotation.x=-Math.PI/2;node.castShadow=false;return node;}
 plane(68,80,grass,0,-.12,0);plane(DODGE_ARENA.width,DODGE_ARENA.length,grass,0,-.075,0);plane(20.2,44,foundation,0,-.07,0);
 const shape=new THREE.Shape();shape.moveTo(-.945,-.5);shape.lineTo(.945,-.5);shape.lineTo(.945,.5);shape.lineTo(-.945,.5);shape.closePath();const tile=new THREE.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.04,bevelThickness:.03});tile.rotateX(-Math.PI/2);
 const paving=new THREE.InstancedMesh(tile,stone,420),dummy=new THREE.Object3D(),color=new THREE.Color();let seed=712,tileIndex=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let row=0;row<40;row++)for(let column=0;column<(row%2?11:10);column++){const half=row%2&&(column===0||column===10),x=row%2?(column===0?-9.5:column===10?9.5:-10+column*2):-9+column*2;dummy.position.set(x,-.09,-21.45+row*1.1);dummy.rotation.set(0,0,0);dummy.scale.set(half?.48:1,1,1);dummy.updateMatrix();paving.setMatrixAt(tileIndex,dummy.matrix);color.setScalar(.77+random()*.17);paving.setColorAt(tileIndex++,color);}paving.receiveShadow=shadow;paving.raycast=()=>{};paving.computeBoundingSphere();group.add(paving);
 for(const side of [-1,1]){
  mesh(new THREE.BoxGeometry(.18,.16,44.4),trim,side*14.2,-.015,0);mesh(new THREE.BoxGeometry(28.6,.16,.18),trim,0,-.015,side*22.2);
  plane(2.8,62,water,side*26,-.075,0);plane(.05,44,inlay,side*10.1,.005,0);plane(5,5,foundation,0,-.06,side*24.5);
 }
 for(const z of [-15,0,15]){const marker=mesh(new THREE.BoxGeometry(.7,.025,.7),inlay,0,-.008,z);marker.rotation.y=Math.PI/4;}
 function place(template,height,x,z,angle=0){if(!template)return;const node=cloneModel(template),bounds=new THREE.Box3().setFromObject(node),s=height/Math.max(.1,bounds.max.y-bounds.min.y);node.scale.setScalar(s);node.position.set(x,-bounds.min.y*s,z);node.rotation.y=angle;art.add(node);}
 function instances(template,positions){
  if(!template||!positions.length)return;template.scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(template.scene),height=Math.max(.1,bounds.max.y-bounds.min.y),rootInverse=new THREE.Matrix4().copy(template.scene.matrixWorld).invert(),relative=new THREE.Matrix4(),world=new THREE.Matrix4();
  template.scene.traverse(node=>{if(!node.isMesh)return;const materials=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material.clone();for(const m of [materials].flat())m.roughness=.96;
   const batch=new THREE.InstancedMesh(node.geometry.clone(),materials,positions.length);relative.multiplyMatrices(rootInverse,node.matrixWorld);
   positions.forEach((p,i)=>{const s=p.height/height;dummy.position.set(p.x,-bounds.min.y*s-.1,p.z);dummy.rotation.set(0,p.angle??0,0);dummy.scale.setScalar(s);dummy.updateMatrix();world.multiplyMatrices(dummy.matrix,relative);batch.setMatrixAt(i,world);});batch.castShadow=batch.receiveShadow=shadow;batch.raycast=()=>{};batch.computeBoundingSphere();art.add(batch);
  });
 }
 return {group,applyAssets(assets){if(disposed||upgraded)return;upgraded=true;
  for(const side of [-1,1]){
   for(const z of [-18,-6,6,18]){place(assets.pillar,2.5,side*18.3,z);if(Math.abs(z)===18)place(assets.banner,2.2,side*18.3,z+.5,side*Math.PI/2);}
   for(const z of [-12,0,12])place(assets.barrier,.55,side*15.1,z,Math.PI/2);
   for(const x of [-5,5])place(assets.torch,1.7,x,side*24.2);place(assets.pillar,5,0,side*28);
  }
  const treesA=[],treesB=[],rocks=[],reeds=[],rows=quality==='leve'?7:12;
  for(const side of [-1,1])for(let n=0;n<rows;n++){
   const z=-27+n*54/(rows-1),p={x:side*(21+(n%3)*.7),z,height:5.7+(n%4)*.65,angle:n*.73};(n%2?treesA:treesB).push(p);
   rocks.push({x:side*(17.5+(n%2)*.8),z:z+1.7,height:1.1+(n%3)*.35,angle:n});reeds.push({x:side*24.4,z:z-1,height:1.4,angle:n*.6});
  }
  for(const side of [-1,1])for(const x of [-15,-8,8,15])treesA.push({x,z:side*29.5,height:6.4,angle:x*.3});
  instances(assets.treeA,treesA);instances(assets.treeB,treesB);instances(assets.rock,rocks);instances(assets.reeds,reeds);
 },update(){},dispose(){if(disposed)return;disposed=true;disposeObject(group);}};
}
