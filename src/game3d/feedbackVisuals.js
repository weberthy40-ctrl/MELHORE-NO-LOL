import * as THREE from 'three';
/** Four pooled cosmetic rings, driven only by confirmed events and the existing frame loop. */
export function createFeedbackVisuals({scene,events,attemptId,position,enabled=true,reducedMotion=false}){
 if(!enabled)return {update(){},dispose(){}};
 const geometry=new THREE.RingGeometry(.3,.4,24),group=new THREE.Group(),pool=[];scene.add(group);let cursor=0,disposed=false;
 for(let i=0;i<4;i++){const material=new THREE.MeshBasicMaterial({color:0xc4efff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}),mesh=new THREE.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.visible=false;mesh.raycast=()=>{};group.add(mesh);pool.push({mesh,remaining:0});}
 function show(event){if(disposed||!enabled||event.attemptId!==attemptId)return;const p=event.position??position();if(!p||![p.x,p.z].every(Number.isFinite))return;const item=pool[cursor++%pool.length];item.remaining=.3;item.mesh.material.color.setHex(event.amount?0xff6982:0xc4efff);item.mesh.position.set(p.x,.04,p.z);item.mesh.scale.setScalar(1);item.mesh.visible=true;}
 const subscriptions=events?['precision:hit','kiting:confirmed','kiting:damage','dodge:damage','reflex:response'].map(name=>events.on(name,show)):[];
 return {move(position){show({attemptId,position});},update(dt){if(disposed||dt<=0)return;for(const item of pool){if(!item.remaining)continue;item.remaining=Math.max(0,item.remaining-dt);item.mesh.visible=item.remaining>0;item.mesh.material.opacity=item.remaining/.3*.7;item.mesh.scale.setScalar(reducedMotion?1:1+(1-item.remaining/.3)*2);}},dispose(){if(disposed)return;disposed=true;subscriptions.forEach(unsubscribe=>unsubscribe());group.removeFromParent();for(const item of pool)item.mesh.material.dispose();geometry.dispose();group.clear();}};
}
