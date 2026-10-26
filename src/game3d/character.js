import * as THREE from 'three';
import { ARENA, isInsideArena } from './spatial.js';
import { disposeObject } from './resources.js';
/** Passive visual, facing +Z at zero rotation. Appearance defines no hitbox. */
export function createCharacter({ position = ARENA.center, rotation = 0, scale = 1, reducedMotion = false } = {}) {
  if (!isInsideArena(position) || !Number.isFinite(rotation) || !Number.isFinite(scale) || scale <= 0) throw new TypeError('Invalid character pose.');
  const group = new THREE.Group();
  const armor = new THREE.MeshStandardMaterial({ color: 0x81b8d1, metalness: 0.25, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x213449 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe9bb74 });
  const limbs=[],parts=[];
  function part(w,h,d,x,y,z,material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
    mesh.position.set(x,y,z);mesh.updateMatrix();const rest=mesh.matrix.clone(),proxy=new THREE.Mesh(mesh.geometry,mesh.material);
    // Selection occlusion uses the original rest pose, independent of decorative animation.
    mesh.raycast=(raycaster,hits)=>{proxy.matrixWorld.multiplyMatrices(group.matrixWorld,rest);THREE.Mesh.prototype.raycast.call(proxy,raycaster,hits);};
    parts.push({mesh,rest});group.add(mesh);return mesh;
  }
  for (const side of [-1,1]) {
    limbs.push({mesh:part(0.32,0.7,0.4,side*0.22,0.35,0,dark),side,arm:false});
    limbs.push({mesh:part(0.36,0.58,0.42,side*0.64,1.25,0,armor),side,arm:true});
    part(0.45,0.25,0.5,side*0.61,1.65,0,gold);
  }
  part(0.88,0.8,0.5,0,1.15,0,armor);
  part(0.46,0.48,0.46,0,1.9,0,armor);
  part(0.34,0.13,0.04,0,1.94,0.25,gold);
  part(0.28,0.32,0.08,0,1.25,0.29,gold);
  part(0.72,0.9,0.08,0,1.12,-0.3,dark);
  let disposed = false,phase=0;
  function setPose({ x, z }, angle = group.rotation.y) {
    if (![x,z,angle].every(Number.isFinite)) throw new TypeError('Invalid visual pose.');
    group.position.set(x,ARENA.groundY,z); group.rotation.y = angle;
  }
  setPose(position,rotation); group.scale.setScalar(scale);
  return { group, setPose, animate({moving=false,attackPhase,state='running'}={},delta=0){
    if(disposed||state==='paused'||delta<=0&&['running','countdown'].includes(state))return;
    if(reducedMotion||!['running','countdown'].includes(state)){for(const limb of limbs)limb.mesh.rotation.x=0;return;}
    phase+=Math.min(.1,Math.max(0,delta))*9;
    for(const limb of limbs){const walk=moving?Math.sin(phase)*.28*limb.side*(limb.arm?-1:1):0,attack=limb.arm?(attackPhase==='windup'?-.5:attackPhase==='recovery'?.2:0):0;limb.mesh.rotation.x=walk+attack;}
  }, dispose() { if (disposed) return; disposed = true; disposeObject(group);limbs.length=parts.length=0; } };
}
