// @vitest-environment jsdom
import { it,expect } from 'vitest';
import { mountDodgeReady } from '../../src/ui/dodgeReady.js';
import { createSession } from '../../src/training/session.js';
it('holds an idle session while assets load, then starts once with no countdown and releases its controls',async()=>{
 const screen=document.createElement('main'),stage=document.createElement('div');screen.append(stage);document.body.append(screen);stage.dataset.visuals='loading';const session=createSession({countdown:0}),ready=mountDodgeReady({screen,stage,session});const start=screen.querySelector('button');expect(start.disabled).toBe(true);for(let n=0;n<100;n++)session.update(.1);expect(session.snapshot()).toMatchObject({state:'idle',elapsed:0});start.click();expect(session.snapshot().state).toBe('idle');stage.dataset.visuals='ready';await Promise.resolve();expect(start.disabled).toBe(false);start.click();expect(session.snapshot()).toMatchObject({state:'running',elapsed:0,countdown:0});expect(screen.querySelector('.arena-ready')).toBeNull();session.update(.1);expect(session.snapshot().elapsed).toBe(.1);ready.dispose();session.dispose();screen.remove();
});
