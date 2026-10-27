// @vitest-environment jsdom
import { it,expect } from 'vitest';
import { mountArenaInputGuard } from '../../src/game3d/arenaInputGuard.js';
it('blocks contextual and back/forward mouse actions across fullscreen margins, without consuming left clicks or surviving exit',()=>{
 const screen=document.createElement('main'),outside=document.createElement('aside');document.body.append(screen,outside);const dispose=mountArenaInputGuard(screen),context=target=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});target.dispatchEvent(e);return e.defaultPrevented;};
 expect(context(screen)).toBe(true);expect(context(outside)).toBe(false);Object.defineProperty(document,'fullscreenElement',{configurable:true,value:document.documentElement});expect(context(outside)).toBe(true);
 for(const button of [0,3,4]){const e=new MouseEvent('mousedown',{button,bubbles:true,cancelable:true});outside.dispatchEvent(e);expect(e.defaultPrevented).toBe(button!==0);}dispose();expect(context(screen)).toBe(false);expect(context(outside)).toBe(false);delete document.fullscreenElement;screen.remove();outside.remove();
});
