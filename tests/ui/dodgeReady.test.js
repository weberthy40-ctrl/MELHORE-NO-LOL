// @vitest-environment jsdom
import { it,expect,vi,afterEach } from 'vitest';
import { PREFERENCES_KEY,DEFAULT_PREFERENCES } from '../../src/settings/preferences.js';
afterEach(()=>{vi.restoreAllMocks();localStorage.clear();});
import { mountDodgeReady } from '../../src/ui/dodgeReady.js';
import { createSession } from '../../src/training/session.js';
it('holds an idle session while assets load, then starts once with no countdown and releases its controls',async()=>{
 const screen=document.createElement('main'),stage=document.createElement('div');screen.append(stage);document.body.append(screen);stage.dataset.visuals='loading';const session=createSession({countdown:0}),ready=mountDodgeReady({screen,stage,session});const start=screen.querySelector('button');expect(start.disabled).toBe(true);for(let n=0;n<100;n++)session.update(.1);expect(session.snapshot()).toMatchObject({state:'idle',elapsed:0});start.click();expect(session.snapshot().state).toBe('idle');stage.dataset.visuals='ready';await Promise.resolve();expect(start.disabled).toBe(false);start.click();expect(session.snapshot()).toMatchObject({state:'running',elapsed:0,countdown:0});expect(screen.querySelector('.arena-ready')).toBeNull();session.update(.1);expect(session.snapshot().elapsed).toBe(.1);ready.dispose();session.dispose();screen.remove();
});

it('shows configured mobility keys before starting, without writing preferences or issuing input',()=>{
 const screen=document.createElement('main'),stage=document.createElement('div');screen.append(stage);stage.dataset.visuals='ready';
 localStorage.setItem(PREFERENCES_KEY,JSON.stringify({...DEFAULT_PREFERENCES,flashKey:'KeyF',dashKey:'KeyG',stopKey:'KeyH'}));
 const writes=vi.spyOn(Storage.prototype,'setItem'),key=vi.fn(),pointer=vi.fn();window.addEventListener('keydown',key);window.addEventListener('pointerdown',pointer);
 const session=createSession({countdown:0}),onStart=vi.fn(),ready=mountDodgeReady({screen,stage,session,onStart});const briefing=screen.querySelector('.ready-controls');
 expect([...briefing.querySelectorAll('kbd')].map(k=>k.textContent)).toEqual(['Direito','H','G','F']);
 expect(briefing.textContent).toContain('Aponte o cursor');expect(briefing.textContent).toContain('Y trava/libera');expect(briefing.textContent).toContain('ESC pausa');
 expect(briefing.querySelectorAll('a,button,input,select')).toHaveLength(0);briefing.click();expect(key).not.toHaveBeenCalled();expect(pointer).not.toHaveBeenCalled();expect(onStart).not.toHaveBeenCalled();expect(writes).not.toHaveBeenCalled();expect(session.snapshot()).toMatchObject({state:'idle',elapsed:0});
 const start=screen.querySelector('button');start.click();start.click();expect(onStart).toHaveBeenCalledTimes(1);expect(session.snapshot()).toMatchObject({state:'running',elapsed:0});ready.dispose();session.dispose();window.removeEventListener('keydown',key);window.removeEventListener('pointerdown',pointer);
});

it('falls back to default keys when access to localStorage is denied',()=>{
 vi.spyOn(window,'localStorage','get').mockImplementation(()=>{throw new DOMException('Denied','SecurityError');});
 const screen=document.createElement('main'),stage=document.createElement('div');screen.append(stage);stage.dataset.visuals='basic';const session=createSession({countdown:0}),ready=mountDodgeReady({screen,stage,session});
 expect([...screen.querySelectorAll('kbd')].map(k=>k.textContent)).toEqual(['Direito','S','E','D']);expect(screen.querySelector('button').disabled).toBe(false);expect(session.snapshot().elapsed).toBe(0);ready.dispose();session.dispose();
});

it('keeps start disabled for an arena error and disconnects readiness after disposal',async()=>{
 const screen=document.createElement('main'),stage=document.createElement('div');screen.append(stage);stage.dataset.visuals='ready';const error=document.createElement('p');error.className='preview-error';stage.append(error);
 const session=createSession({countdown:0}),onStart=vi.fn(),ready=mountDodgeReady({screen,stage,session,onStart});const start=screen.querySelector('button');expect(start.disabled).toBe(true);start.click();expect(onStart).not.toHaveBeenCalled();ready.dispose();stage.replaceChildren();await Promise.resolve();expect(start.disabled).toBe(true);expect(session.snapshot().state).toBe('idle');session.dispose();
});

it('rejects a retained enabled start button after the preparation has been disposed',()=>{
 const screen=document.createElement('main'),stage=document.createElement('div');screen.append(stage);stage.dataset.visuals='ready';
 const session=createSession({countdown:0}),onStart=vi.fn(),ready=mountDodgeReady({screen,stage,session,onStart});const start=screen.querySelector('button');
 expect(start.disabled).toBe(false);ready.dispose();start.click();expect(onStart).not.toHaveBeenCalled();expect(session.snapshot()).toMatchObject({state:'idle',elapsed:0});session.dispose();
});
