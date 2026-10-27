import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
const base=`${import.meta.env.BASE_URL}assets/kaykit/`;
let pending;
const artBase=`${import.meta.env.BASE_URL}assets/arena/`;
/** A bounded CPU cache (two actors, five props and two art textures), shared across scene reentries. */
export function loadSceneAssets(){
 if(!pending){const loader=new GLTFLoader();pending=Promise.all(['ranger.glb','knight.glb','barrier.glb','pillar_decorated.glb','rubble_large.glb','banner_patternA_blue.glb','torch_lit.glb'].map(file=>loader.loadAsync(base+file))).then(async([ranger,knight,barrier,pillar,rubble,banner,torch])=>{const t=new THREE.TextureLoader(),art=await Promise.allSettled(['stone.webp','canopy.webp'].map(file=>t.loadAsync(artBase+file)));return {ranger,knight,barrier,pillar,rubble,banner,torch,stone:art[0].status==='fulfilled'?art[0].value:null,canopy:art[1].status==='fulfilled'?art[1].value:null};}).catch(error=>{pending=undefined;throw error;});}
 return pending;
}
export function cloneModel(template){
 const object=cloneSkeleton(template.scene);
 object.traverse(node=>{if(node.isMesh){node.geometry=node.geometry.clone();node.material=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material.clone();node.castShadow=node.receiveShadow=true;node.raycast=()=>{};}});
 return object;
}
export function createAnimatedModel(template,{enemy=false,caster=false,ranged=false}={}){
 const root=cloneModel(template),mixer=new THREE.AnimationMixer(root),actions=new Map(template.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));
 const equipment=caster?[]:ranged?['1H_Crossbow']:enemy?['1H_Sword','Round_Shield']:['1H_Crossbow'];
 root.traverse(node=>{if(node.isMesh)node.visible=/^(Rogue_|Knight_)/.test(node.name)||equipment.includes(node.name);});
 root.traverse(node=>{if(node.isMesh&&node.material?.isMeshStandardMaterial){node.material.roughness=.7;node.material.metalness=.15;if(!enemy&&node.name==='Rogue_Head_Hooded')node.material.color.setHex(0x709caa);}});
 let active;function play(name){const next=actions.get(name)??actions.get('Idle');if(next===active||!next)return;if(active){active.fadeOut(.12);next.reset().fadeIn(.12).play();}else next.reset().play();active=next;}
 const proportions=[];root.traverse(node=>{if(node.isBone){const factor=node.name==='head'?[.49,.59,.49]:node.name.startsWith('upperleg')?[1,1.28,1]:node.name==='spine'?[1,1.12,1]:null;if(factor)proportions.push({node,base:node.scale.clone(),factor});}});function anatomy(){for(const {node,base,factor}of proportions)node.scale.set(base.x*factor[0],base.y*factor[1],base.z*factor[2]);}play('Idle');mixer.update(0);anatomy();root.updateMatrixWorld(true);const bounds=new THREE.Box3();root.traverse(node=>{if(node.isSkinnedMesh)node.skeleton.update();if(node.isMesh&&node.visible&&/^(Rogue_|Knight_)/.test(node.name)){node.computeBoundingBox?.();bounds.expandByObject(node);}});const height=bounds.max.y-bounds.min.y,scale=2.45/Math.max(.1,height);root.scale.multiplyScalar(scale);root.scale.x*=.84;root.scale.z*=.84;root.position.y-=bounds.min.y*scale;
 return {root,update({moving,attackPhase,reducedMotion},dt){if(reducedMotion)return;if(attackPhase==='windup'){const cast=enemy&&!ranged&&!caster?[...actions.keys()].find(n=>n.includes('Melee_Attack')):'1H_Ranged_Shoot';play(cast??'Idle');}else play(moving?'Running_A':'Idle');mixer.update(Math.min(.1,Math.max(0,dt))*(moving?1.2:1));anatomy();},dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);}};
}
