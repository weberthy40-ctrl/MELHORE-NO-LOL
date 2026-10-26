import { describe, expect, it, vi } from 'vitest';
import { createStateStore } from '../../src/core/stateStore.js';

describe('state store', () => {
  it('copies and deeply freezes the initial snapshot', () => {
    const input = { lifecycle: 'created', error: { details: ['first'] } };
    const store = createStateStore(input);
    input.error.details.push('external');
    expect(store.getState()).toEqual({ lifecycle: 'created', error: { details: ['first'] } });
    expect(() => { store.getState().error.details.push('mutation'); }).toThrow(TypeError);
    expect(() => { store.getState().lifecycle = 'running'; }).toThrow(TypeError);
  });

  it('notifies only real changes with current and previous snapshots', () => {
    const store = createStateStore({ lifecycle: 'created', error: null });
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState({ error: null, lifecycle: 'created' });
    expect(listener).not.toHaveBeenCalled();
    store.setState((state) => ({ ...state, lifecycle: 'initializing' }));
    expect(listener).toHaveBeenCalledExactlyOnceWith(
      { lifecycle: 'initializing', error: null }, { lifecycle: 'created', error: null },
    );
  });

  it('cancels subscriptions independently and clears listeners', () => {
    const store = createStateStore({ value: 0 });
    const removed = vi.fn();
    const retained = vi.fn();
    const unsubscribe = store.subscribe(removed);
    store.subscribe(retained);
    unsubscribe();
    unsubscribe();
    store.setState({ value: 1 });
    expect(removed).not.toHaveBeenCalled();
    expect(retained).toHaveBeenCalledTimes(1);
    store.clear();
    store.setState({ value: 2 });
    expect(retained).toHaveBeenCalledTimes(1);
  });

  it('orders reentrant updates after delivering the current change', () => {
    const store = createStateStore({ value: 0 });
    const observed = [];
    store.subscribe(({ value }) => {
      if (value === 1) store.setState({ value: 2 });
    });
    store.subscribe(({ value }) => observed.push(value));
    store.setState({ value: 1 });
    expect(observed).toEqual([1, 2]);
    expect(store.getState().value).toBe(2);
  });

  it('reports subscriber failures without skipping remaining subscribers', () => {
    const onListenerError = vi.fn();
    const store = createStateStore({ value: 0 }, { onListenerError });
    const error = new Error('observer failed');
    const remaining = vi.fn();
    store.subscribe(() => { throw error; });
    store.subscribe(remaining);
    store.setState({ value: 1 });
    expect(onListenerError).toHaveBeenCalledExactlyOnceWith(error);
    expect(remaining).toHaveBeenCalledTimes(1);
  });

  it('does not silently swallow failures when no reporter is provided', () => {
    const store = createStateStore({ value: 0 });
    const remaining = vi.fn();
    store.subscribe(() => { throw new Error('broken'); });
    store.subscribe(remaining);
    expect(() => store.setState({ value: 1 })).toThrow(AggregateError);
    expect(remaining).toHaveBeenCalledTimes(1);
  });

  it('rejects unsupported or circular state without changing the snapshot', () => {
    const store = createStateStore({ value: 1 });
    const circular = {};
    circular.self = circular;
    for (const next of [{ value: NaN }, { value: new Date() }, circular, { value: undefined }]) {
      expect(() => store.setState(next)).toThrow(TypeError);
    }
    expect(store.getState()).toEqual({ value: 1 });
    expect(() => store.subscribe(null)).toThrow(TypeError);
  });
});
