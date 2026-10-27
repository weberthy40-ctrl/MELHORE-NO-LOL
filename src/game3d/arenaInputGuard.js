/** Protect only the active arena, including document-level fullscreen margins. */
export function mountArenaInputGuard(screen){
 const document=screen.ownerDocument;
 const inside=event=>screen.isConnected&&(screen.contains(event.target)||Boolean(document.fullscreenElement));
 const context=event=>{if(inside(event))event.preventDefault();};
 const navigationButton=event=>{if(inside(event)&&[3,4].includes(event.button))event.preventDefault();};
 document.addEventListener('contextmenu',context,true);
 for(const name of ['pointerdown','mousedown','mouseup','auxclick'])document.addEventListener(name,navigationButton,true);
 return ()=>{document.removeEventListener('contextmenu',context,true);for(const name of ['pointerdown','mousedown','mouseup','auxclick'])document.removeEventListener(name,navigationButton,true);};
}
