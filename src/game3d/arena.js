import * as THREE from 'three';
import { ARENA } from './spatial.js';
import { disposeObject } from './resources.js';
export function createArena() {
  const group = new THREE.Group();
  const floor = new THREE.MeshStandardMaterial({ color: 0x3d5365, roughness: 0.94 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x243748, roughness: 1 });
  const moss = new THREE.MeshStandardMaterial({ color: 0x244846, roughness: 1 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x66cbee, emissive: 0x15455c });
  const box = (w,h,d,x,y,z,material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
    mesh.position.set(x,y,z); group.add(mesh); return mesh;
  };
  box(ARENA.width + 2*ARENA.margin, 0.6, ARENA.length + 10, 0, -0.65, 0, moss);
  box(ARENA.width, 0.5, ARENA.length, 0, -0.25, 0, floor);
  for (let z = -18; z <= 18; z += 3) {
    box(ARENA.width, 0.015, 0.035, 0, 0.012, z, stone);
    for (const x of [-3,3]) box(0.035, 0.015, 3, x, 0.012, z, stone);
  }
  for (const side of [-1,1]) {
    box(0.3, 0.35, ARENA.length, side*(ARENA.width/2+0.15), 0, 0, stone);
    for (const z of [-16,-8,8,16]) {
      const x = side*(ARENA.width/2+3);
      box(1.1, 2.2, 1.1, x, 0.5, z, stone);
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), glow);
      crystal.position.set(x,2.1,z); group.add(crystal);
    }
  }
  let disposed = false;
  return { group, dispose() { if (disposed) return; disposed = true; disposeObject(group); } };
}
