// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {mountDodgeReplayReview} from '../../src/ui/dodgeReplayReview.js';

const flush=()=>Promise.resolve();
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function recording(markers=[]){
 return {frames:[10,10.4,11.1,12,13,16].map(time=>({time,player:{x:0,z:0},angle:0,snapshot:{kind:'dodge',level:4,elapsed:time,projectiles:[]}})),markers,counts:{}};
}
function mount(data=recording(),loader){
 const dialog=document.createElement('dialog'),container=document.createElement('div');dialog.open=true;dialog.append(container);document.body.append(dialog);
 const renderer={presentFrame:vi.fn(),dispose:vi.fn()},mountPreview=vi.fn(()=>renderer),loadPreview=loader??vi.fn(async()=>({mountPreview}));
 const view=mountDodgeReplayReview({container,recording:data,loadPreview});
 return {dialog,container,view,renderer,mountPreview,loadPreview,open:()=>container.querySelector('.replay-open').click()};
}
let frames;
beforeEach(()=>{
 frames=new Map();let id=0;
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{frames.set(++id,callback);return id;});
 vi.spyOn(window,'cancelAnimationFrame').mockImplementation(id=>frames.delete(id));
});
afterEach(()=>{document.body.replaceChildren();vi.restoreAllMocks();});

describe('contact navigation',()=>{
 it('lists only captured contacts chronologically, keeping simultaneous contacts independently accessible',async()=>{
  const data=recording([{time:16.01,variant:'cage'},{time:12.7,variant:'cage'},{time:11.8,variant:'arcane_bolt'},{time:9.99,variant:'cage'},{time:11.8,variant:'sun_beam'},{time:10,variant:'artillery'},{time:16,variant:'flame_circle'}]);
  const original=structuredClone(data),m=mount(data);m.open();await flush();
  const buttons=[...m.container.querySelectorAll('.replay-event')];
  expect(buttons).toHaveLength(5);expect(m.container.querySelectorAll('.replay-marker')).toHaveLength(5);
  expect(buttons.map(b=>b.textContent.match(/· ([\d.]+) s/)[1])).toEqual(['10.00','11.80','11.80','12.70','16.00']);
  for(const button of buttons){expect(button.tagName).toBe('BUTTON');expect(button.type).toBe('button');expect(button.getAttribute('aria-pressed')).toBe('false');}
  buttons[1].focus();expect(document.activeElement).toBe(buttons[1]);buttons[1].click();
  expect(m.renderer.presentFrame).toHaveBeenLastCalledWith(data.frames[1]);
  expect(m.container.querySelector('input').value).toBe('1');expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  buttons[2].click();expect(buttons[1].getAttribute('aria-pressed')).toBe('false');expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
  expect(data).toEqual(original);m.view.dispose();
 });
 it('clamps the lead-in to the first frame, uses a frame at or before the target, and supports the last contact',async()=>{
  const data=recording([{time:10,variant:'arcane_bolt'},{time:12.7,variant:'cage'},{time:16,variant:'cage'}]),m=mount(data);m.open();await flush();
  const buttons=m.container.querySelectorAll('.replay-event');
  for(const [n,index]of [[0,0],[1,2],[2,4]]){buttons[n].click();expect(m.renderer.presentFrame).toHaveBeenLastCalledWith(data.frames[index]);expect(m.container.querySelector('input').value).toBe(String(index));}
  expect(m.container.querySelector('.replay-status').textContent).toContain('13.00 s');m.view.dispose();
 });
 it('pauses playback on contact selection or manual scrub, and clears contact selection on manual scrub',async()=>{
  const m=mount(recording([{time:12.7,variant:'cage'}]));m.open();await flush();
  const play=m.container.querySelector('.replay-controls button'),event=m.container.querySelector('.replay-event'),slider=m.container.querySelector('input');
  play.click();expect(frames.size).toBe(1);expect(play.textContent).toBe('Pausar revisão');
  event.click();expect(frames.size).toBe(0);expect(window.cancelAnimationFrame).toHaveBeenCalled();expect(play.textContent).toBe('Reproduzir');
  play.click();expect(frames.size).toBe(1);slider.value='3';slider.dispatchEvent(new Event('input'));
  expect(frames.size).toBe(0);expect(event.getAttribute('aria-pressed')).toBe('false');expect(m.renderer.presentFrame).toHaveBeenLastCalledWith(expect.objectContaining({time:12}));m.view.dispose();
 });
 it('advances playback at the default half speed and respects speed changes on subsequent frames',async()=>{
  const data=recording();data.frames=[0,.04,.09,.14,.19,.24,.29].map(time=>({...data.frames[0],time,snapshot:{...data.frames[0].snapshot,elapsed:time}}));
  const m=mount(data);m.open();await flush();const speed=m.container.querySelector('select'),play=m.container.querySelector('.replay-controls button');
  expect(speed.value).toBe('0.5');expect(speed.selectedOptions[0].textContent).toBe('0.5×');
  function advance(time){const [id,callback]=frames.entries().next().value;frames.delete(id);callback(time);}
  play.click();advance(0);advance(100);
  expect(m.renderer.presentFrame).toHaveBeenLastCalledWith(data.frames[1]);
  speed.value='1';speed.dispatchEvent(new Event('change'));advance(200);
  expect(m.renderer.presentFrame).toHaveBeenLastCalledWith(data.frames[3]);
  speed.value='0.25';speed.dispatchEvent(new Event('change'));advance(300);
  expect(m.renderer.presentFrame).toHaveBeenLastCalledWith(data.frames[3]);advance(400);
  expect(m.renderer.presentFrame).toHaveBeenLastCalledWith(data.frames[4]);m.view.dispose();expect(frames.size).toBe(0);
 });
 it('shows an explicit empty state, including when every marker lies outside the captured interval',()=>{
  const m=mount(recording([{time:9,variant:'cage'},{time:17,variant:'cage'}]));
  expect(m.container.querySelector('.replay-empty').textContent).toBe('Nenhum contato registrado neste trecho.');
  expect(m.container.querySelectorAll('.replay-event')).toHaveLength(0);m.view.dispose();
  const empty=mount({frames:[],markers:[],counts:{}});expect(empty.container.querySelector('.replay-open').disabled).toBe(true);empty.view.dispose();
 });
});

describe('replay resource and error ownership',()=>{
 it('disposes each opened renderer and playback, including on close/reopen and repeated disposal',async()=>{
  const data=recording([{time:12,variant:'cage'}]);data.counts={cage:1};const m=mount(data);
  m.open();await flush();m.container.querySelector('.replay-controls button').click();m.open();
  expect(frames.size).toBe(0);expect(m.renderer.dispose).toHaveBeenCalledTimes(1);expect(m.dialog.classList.contains('reviewing')).toBe(false);
  m.open();await flush();expect(m.mountPreview).toHaveBeenCalledTimes(2);m.view.dispose();m.view.dispose();
  expect(m.renderer.dispose).toHaveBeenCalledTimes(2);expect(m.container.children).toHaveLength(0);expect(frames.size).toBe(0);
 });
 it('does not mount a late import from a closed generation or after disposal',async()=>{
  const first=deferred(),second=deferred(),loader=vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),m=mount(recording(),loader),staleMount=vi.fn();
  m.open();m.open();m.open();first.resolve({mountPreview:staleMount});await flush();expect(staleMount).not.toHaveBeenCalled();
  m.view.dispose();second.resolve({mountPreview:staleMount});await flush();expect(staleMount).not.toHaveBeenCalled();
 });
 it('ignores rejection and renderer error callbacks from a closed generation, while retaining current errors through seeking',async()=>{
  const stale=deferred(),renderer={presentFrame:vi.fn(),dispose:vi.fn()},factory=vi.fn(()=>renderer),loader=vi.fn().mockReturnValueOnce(stale.promise).mockResolvedValue({mountPreview:factory}),m=mount(recording([{time:12,variant:'cage'}]),loader);
  m.open();m.open();m.open();await flush();stale.reject(new Error('old import'));await flush();
  const message=m.container.querySelector('.replay-error');expect(message.hidden).toBe(true);
  const oldError=factory.mock.calls[0][1].onError;m.open();m.open();await flush();oldError();expect(message.hidden).toBe(true);
  factory.mock.calls[1][1].onError();expect(message.hidden).toBe(false);expect(message.textContent).toContain('indisponível');
  m.container.querySelector('.replay-event').click();expect(message.textContent).toContain('indisponível');expect(m.container.querySelector('.replay-status').textContent).toContain('10.40 s');
  m.view.dispose();const previous=message.textContent;factory.mock.calls[1][1].onError();expect(message.textContent).toBe(previous);
 });
 it('shows a current import failure without erasing event navigation',async()=>{
  const m=mount(recording([{time:12,variant:'cage'}]),async()=>{throw new Error('unavailable');});m.open();await flush();
  expect(m.container.querySelector('.replay-error').textContent).toBe('Não foi possível abrir a revisão.');expect(m.container.querySelector('.replay-error').hidden).toBe(false);
  m.container.querySelector('.replay-event').click();expect(m.container.querySelector('input').value).toBe('1');m.view.dispose();
 });
});
