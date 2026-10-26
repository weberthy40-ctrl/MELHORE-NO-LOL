import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '../../src/core/eventBus.js';

describe('event bus', () => {
  it('delivers payloads in registration order and isolates channels', () => {
    const events = createEventBus();
    const order = [];
    events.on('ready', (payload) => order.push(['first', payload]));
    events.on('ready', (payload) => order.push(['second', payload]));
    const other = vi.fn();
    events.on('other', other);
    expect(events.emit('ready', { active: true })).toBe(2);
    expect(order).toEqual([['first', { active: true }], ['second', { active: true }]]);
    expect(other).not.toHaveBeenCalled();
    expect(events.emit('unknown')).toBe(0);
  });

  it('supports unsubscribe and off, including independent repeated registrations', () => {
    const events = createEventBus();
    const listener = vi.fn();
    const unsubscribe = events.on('ready', listener);
    events.on('ready', listener);
    unsubscribe();
    unsubscribe();
    events.emit('ready');
    expect(listener).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(events.off('ready', listener)).toBe(1);
    expect(events.off('ready', listener)).toBe(0);
    events.emit('ready');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('removes a once listener before calling it, including recursive emission', () => {
    const events = createEventBus();
    const once = vi.fn(() => events.emit('ready'));
    events.once('ready', once);
    events.emit('ready');
    events.emit('ready');
    expect(once).toHaveBeenCalledTimes(1);
  });

  it('reports failure of one listener and still invokes the others', () => {
    const onListenerError = vi.fn();
    const events = createEventBus({ onListenerError });
    const error = new Error('first failed');
    const remaining = vi.fn();
    events.on('ready', () => { throw error; });
    events.on('ready', remaining);
    expect(events.emit('ready')).toBe(2);
    expect(onListenerError).toHaveBeenCalledExactlyOnceWith(error, 'ready');
    expect(remaining).toHaveBeenCalledTimes(1);
  });

  it('throws aggregated unhandled errors after delivering other listeners', () => {
    const events = createEventBus();
    const remaining = vi.fn();
    events.on('ready', () => { throw new Error('failed'); });
    events.on('ready', remaining);
    expect(() => events.emit('ready')).toThrow(AggregateError);
    expect(remaining).toHaveBeenCalledTimes(1);
  });

  it('clears one or all channels and respects removal during dispatch', () => {
    const events = createEventBus();
    const removed = vi.fn();
    events.on('ready', () => events.off('ready', removed));
    events.on('ready', removed);
    const other = vi.fn();
    events.on('other', other);
    events.emit('ready');
    expect(removed).not.toHaveBeenCalled();
    events.clear('ready');
    expect(events.emit('ready')).toBe(0);
    events.emit('other');
    expect(other).toHaveBeenCalledTimes(1);
    events.clear();
    expect(events.emit('other')).toBe(0);
  });

  it('does not deliver new listeners until the next emission', () => {
    const events = createEventBus();
    const late = vi.fn();
    events.once('ready', () => events.on('ready', late));
    events.emit('ready');
    expect(late).not.toHaveBeenCalled();
    events.emit('ready');
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('validates names and listeners', () => {
    const events = createEventBus();
    expect(() => events.on('', () => {})).toThrow(TypeError);
    expect(() => events.once('ready', null)).toThrow(TypeError);
  });
});
