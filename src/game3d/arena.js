import * as THREE from 'three';
import { disposeObject } from './resources.js';

// Original painted stone/grass surface. A single texture replaces hundreds of floor draw calls.
function paintGround(document) {
  if (!document?.defaultView?.CanvasRenderingContext2D) return null;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=2048;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  let seed=179;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle='#3c593d';ctx.fillRect(0,0,1024,2048);
  for(let i=0;i<26000;i++){const x=random()*1024,y=random()*2048,r=2+random()*14;ctx.fillStyle=['#405d3e','#4e6543','#324d37','#68704a'][i%4];ctx.globalAlpha=.3;ctx.beginPath();ctx.ellipse(x,y,r,r*.6,0,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  for(let row=0;row<47;row++)for(let col=0;col<14;col++){
    const x=224+col*42+(row%2)*20,y=row*46;
    if(x>810||x<245+Math.sin(row*.3)*25||x>775+Math.sin(row*.3)*25)continue;
    const shade=Math.floor(79+random()*34);ctx.fillStyle=`rgb(${shade},${shade+12},${shade+4})`;
    ctx.beginPath();ctx.roundRect(x+random()*3,y+2,38+random()*2,40,3);ctx.fill();
    ctx.strokeStyle='#b3b69b30';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+4,y+5);ctx.lineTo(x+33,y+5);ctx.stroke();
    if(random()<.38){ctx.strokeStyle='#364a34';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+14,y+6);ctx.lineTo(x+20,y+22);ctx.lineTo(x+16,y+36);ctx.stroke();}
    for(let n=0;n<5;n++){ctx.fillStyle='#687e4770';ctx.beginPath();ctx.ellipse(x+random()*38,y+random()*40,random()*9,random()*4,0,0,7);ctx.fill();}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
export function createArena({document=globalThis.document}={}) {
  const group=new THREE.Group(),texture=paintGround(document);
  const stone=new THREE.MeshStandardMaterial({color:0x78877e,roughness:1});
  const bark=new THREE.MeshStandardMaterial({color:0x4b4030,roughness:1});
  const leaves=[0x1b4938,0x24553c,0x305d3c].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(50,76),new THREE.MeshStandardMaterial({color:texture?0xffffff:0x52704b,map:texture,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.035;ground.receiveShadow=true;group.add(ground);
  const surround=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshStandardMaterial({color:0x283e30,roughness:1}));surround.rotation.x=-Math.PI/2;surround.position.y=-.08;group.add(surround);
  const mesh=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
  for(const side of [-1,1])for(let i=0;i<16;i++){
    const z=-32+i*4.3,x=side*(12+Math.sin(i*7)*1.8);
    const rock=mesh(new THREE.DodecahedronGeometry(.85+(i%3)*.25,0),stone,x,.4,z);rock.scale.set(1,.7,1.4);rock.rotation.y=i;
    const tx=side*(16+(i%3)*1.7);mesh(new THREE.CylinderGeometry(.17,.3,2,7),bark,tx,.8,z);
    for(let tier=0;tier<3;tier++)mesh(new THREE.ConeGeometry(2.5-tier*.5,3.5,9),leaves[i%3],tx,2.4+tier*1.25,z);
    if(i%3===1){
      const post=mesh(new THREE.CylinderGeometry(.35,.55,1.7,8),stone,side*10.4,.7,z);
      const flame=mesh(new THREE.SphereGeometry(.32,12,8),new THREE.MeshBasicMaterial({color:0xffc369}),post.position.x,1.8,z);flame.scale.y=1.7;
      mesh(new THREE.ConeGeometry(.48,.35,12,1,true),bark,post.position.x,1.5,z);
    }
  }
  // Decorative reeds and a glowing boundary remain outside the playable collision rectangle.
  const reed=new THREE.MeshStandardMaterial({color:0x739343,side:THREE.DoubleSide});
  for(const side of [-1,1])for(let i=0;i<45;i++){
    const grass=mesh(new THREE.ConeGeometry(.14,.8+(i%4)*.18,3),reed,side*(10.3+(i%4)*.22),.35,-25+i*1.1);grass.rotation.z=side*.18;
  }
  // Batch static scenery: trees, stones and reeds share GPU draw calls.
  const batches=new Map();for(const child of [...group.children]){const key=child.geometry.type+JSON.stringify(child.geometry.parameters)+child.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);}
  for(const batch of batches.values()){if(batch.length<2)continue;const first=batch[0],instances=new THREE.InstancedMesh(first.geometry,first.material,batch.length);for(const [index,child]of batch.entries()){child.updateMatrix();instances.setMatrixAt(index,child.matrix);group.remove(child);if(child.geometry!==first.geometry)child.geometry.dispose();}instances.computeBoundingSphere();group.add(instances);}
  let disposed=false;
  return {group,dispose(){if(disposed)return;disposed=true;disposeObject(group);texture?.dispose();}};
}
