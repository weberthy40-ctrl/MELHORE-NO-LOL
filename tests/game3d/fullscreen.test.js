// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { mountFullscreen } from '../../src/game3d/fullscreen.js';
it('enters fullscreen from its button, preserves it on replay and offers an explicit exit',async()=>{
 const root=document.documentElement;Object.defineProperty(document,'fullscreenElement',{configurable:true,writable:true,value:null});root.requestFullscreen=vi.fn(async()=>{document.fullscreenElement=root;document.dispatchEvent(new Event('fullscreenchange'));});document.exitFullscreen=vi.fn(async()=>{document.fullscreenElement=null;document.dispatchEvent(new Event('fullscreenchange'));});
 const stage=document.createElement('div'),first=mountFullscreen(stage);stage.querySelector('button').click();await Promise.resolve();expect(root.requestFullscreen).toHaveBeenCalledOnce();expect(stage.textContent).toContain('Sair da tela cheia');first.dispose();expect(document.exitFullscreen).not.toHaveBeenCalled();const replay=mountFullscreen(stage);document.dispatchEvent(new Event('fullscreenchange'));stage.querySelector('button').click();await Promise.resolve();expect(document.exitFullscreen).toHaveBeenCalledOnce();replay.dispose();expect(stage.children).toHaveLength(0);delete root.requestFullscreen;delete document.exitFullscreen;
});
