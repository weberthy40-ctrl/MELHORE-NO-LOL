export function mountFullscreen(container){
 const document=container.ownerDocument,button=document.createElement('button');button.className='button fullscreen-toggle';button.type='button';button.textContent='⛶ Tela cheia';button.hidden=!document.documentElement.requestFullscreen;
 const host=container.closest('.training-screen')??container;host.append(button);let disposed=false;if(!container.hasAttribute('tabindex'))container.tabIndex=-1;
 function change(){if(disposed)return;button.textContent=document.fullscreenElement?'Sair da tela cheia':'⛶ Tela cheia';}
 async function toggle(){try{const transition=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();container.focus({preventScroll:true});await transition;}catch{if(!disposed)button.textContent='Tela cheia indisponível';}}
 button.addEventListener('click',toggle);document.addEventListener('fullscreenchange',change);change();
 // Fullscreen belongs to the document, so replaying/rebuilding an arena preserves it.
 return {dispose(){disposed=true;button.removeEventListener('click',toggle);document.removeEventListener('fullscreenchange',change);button.remove();}};
}
