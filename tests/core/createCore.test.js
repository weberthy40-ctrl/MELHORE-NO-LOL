import { describe, expect, it, vi } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { LifecycleError } from '../../src/core/lifecycle.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((success, failure) => { resolve = success; reject = failure; });
  return { promise, resolve, reject };
}

describe('application core and lifecycle', () => {
  it('exposes only read operations for its explicitly defined initial state', () => {
    const core = createCore();
    expect(core.state.getState()).toEqual({ lifecycle: 'created', error: null });
    expect(core.state.setState).toBeUndefined();
    core.dispose();
  });

  it('initializes once, starts, stops and restarts through permitted transitions', async () => {
    const core = createCore();
    const observed = [];
    const eventStates = [];
    core.state.subscribe((state) => observed.push(state.lifecycle));
    core.events.on('lifecycle:changed', (change) => eventStates.push(change.current));
    await core.lifecycle.initialize();
    core.lifecycle.start();
    core.lifecycle.start();
    core.lifecycle.stop();
    core.lifecycle.stop();
    core.lifecycle.start();
    core.dispose();
    core.dispose();
    expect(observed).toEqual(['initializing', 'ready', 'running', 'stopped', 'running', 'disposed']);
    expect(eventStates).toEqual(observed);
    expect(core.state.getState().lifecycle).toBe('disposed');
  });

  it('shares the same pending initialization promise and invokes the initializer only once', async () => {
    const core = createCore();
    const wait = deferred();
    const initializer = vi.fn(() => wait.promise);
    const first = core.lifecycle.initialize(initializer);
    const second = core.lifecycle.initialize(initializer);
    expect(first).toBe(second);
    await Promise.resolve();
    expect(initializer).toHaveBeenCalledTimes(1);
    wait.resolve();
    await first;
    expect(core.state.getState().lifecycle).toBe('ready');
    core.dispose();
  });

  it('does not run another initializer when already ready, running or stopped', async () => {
    const core = createCore();
    const initializer = vi.fn();
    await core.lifecycle.initialize(initializer);
    await core.lifecycle.initialize(initializer);
    core.lifecycle.start();
    await core.lifecycle.initialize(initializer);
    core.lifecycle.stop();
    await core.lifecycle.initialize(initializer);
    core.lifecycle.start();
    expect(initializer).toHaveBeenCalledTimes(1);
    expect(core.state.getState().lifecycle).toBe('running');
    core.dispose();
  });

  it('rejects invalid transitions and operations after disposal', async () => {
    const core = createCore();
    expect(() => core.lifecycle.start()).toThrow(LifecycleError);
    expect(() => core.lifecycle.stop()).toThrow(LifecycleError);
    await expect(core.lifecycle.initialize(null)).rejects.toThrow(TypeError);
    expect(core.state.getState().lifecycle).toBe('created');
    core.dispose();
    expect(() => core.lifecycle.start()).toThrow(LifecycleError);
    expect(() => core.lifecycle.stop()).toThrow(LifecycleError);
    await expect(core.lifecycle.initialize()).rejects.toThrow(LifecycleError);
  });

  it('cleans initialized resources exactly once in reverse registration order', async () => {
    const core = createCore();
    const cleaned = [];
    await core.lifecycle.initialize(({ addCleanup }) => {
      addCleanup(() => cleaned.push('first'));
      return () => cleaned.push('last');
    });
    core.lifecycle.start();
    core.lifecycle.stop();
    expect(cleaned).toEqual([]);
    core.dispose();
    core.dispose();
    expect(cleaned).toEqual(['last', 'first']);
  });

  it('reports initialization failure, preserves origin and releases partial resources', async () => {
    const core = createCore();
    const cleanup = vi.fn();
    const error = new Error('module could not initialize');
    await expect(core.lifecycle.initialize(({ addCleanup }) => {
      addCleanup(cleanup);
      throw error;
    })).rejects.toBe(error);
    expect(core.state.getState()).toMatchObject({
      lifecycle: 'error', error: { source: 'lifecycle.initialize', recoverable: false, message: error.message },
    });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(() => core.lifecycle.start()).toThrow(LifecycleError);
    await expect(core.lifecycle.initialize()).rejects.toThrow(LifecycleError);
    core.dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('invalidates a pending initialization and disposes resources returned later', async () => {
    const core = createCore();
    const wait = deferred();
    const lateCleanup = vi.fn();
    const partialCleanup = vi.fn();
    const promise = core.lifecycle.initialize(({ addCleanup }) => {
      addCleanup(partialCleanup);
      return wait.promise;
    });
    await Promise.resolve();
    core.dispose();
    expect(partialCleanup).toHaveBeenCalledTimes(1);
    wait.resolve(lateCleanup);
    await expect(promise).rejects.toThrow('cancelled');
    expect(lateCleanup).toHaveBeenCalledTimes(1);
    expect(core.state.getState().lifecycle).toBe('disposed');
  });

  it('does not invoke an initializer if disposed before its microtask begins', async () => {
    const core = createCore();
    const initializer = vi.fn();
    const promise = core.lifecycle.initialize(initializer);
    core.dispose();
    await expect(promise).rejects.toThrow('cancelled');
    expect(initializer).not.toHaveBeenCalled();
    expect(core.state.getState().lifecycle).toBe('disposed');
  });

  it('keeps a rejected initialization from changing a disposed application', async () => {
    const core = createCore();
    const wait = deferred();
    const promise = core.lifecycle.initialize(() => wait.promise);
    await Promise.resolve();
    core.dispose();
    wait.reject(new Error('late failure'));
    await expect(promise).rejects.toThrow('late failure');
    expect(core.state.getState()).toEqual({ lifecycle: 'disposed', error: null });
    expect(core.errors.getErrors()).toHaveLength(0);
  });

  it('communicates recoverable errors while keeping the application running', async () => {
    const core = createCore();
    await core.lifecycle.initialize();
    core.lifecycle.start();
    const listener = vi.fn();
    core.events.on('error:reported', listener);
    const record = core.errors.report(new Error('optional module'), { source: 'module', recoverable: true });
    expect(core.state.getState()).toEqual({ lifecycle: 'running', error: record });
    expect(listener).toHaveBeenCalledExactlyOnceWith(record);
    core.dispose();
  });

  it('transitions fatal errors to error and releases resources before disposal', async () => {
    const core = createCore();
    const cleanup = vi.fn();
    await core.lifecycle.initialize(() => cleanup);
    core.lifecycle.start();
    const record = core.errors.report(new Error('fatal'), { source: 'module', recoverable: false });
    expect(core.state.getState()).toEqual({ lifecycle: 'error', error: record });
    expect(cleanup).toHaveBeenCalledTimes(1);
    core.dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('does not let external fatal failure during initialization later become ready', async () => {
    const core = createCore();
    const wait = deferred();
    const cleanup = vi.fn();
    const promise = core.lifecycle.initialize(() => wait.promise);
    await Promise.resolve();
    core.errors.report(new Error('external fatal'), { source: 'module', recoverable: false });
    wait.resolve(cleanup);
    await expect(promise).rejects.toThrow('cancelled');
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(core.state.getState().lifecycle).toBe('error');
    core.dispose();
  });

  it('releases all resources even when one cleanup fails', async () => {
    const core = createCore();
    const remaining = vi.fn();
    await core.lifecycle.initialize(({ addCleanup }) => {
      addCleanup(remaining);
      return () => { throw new Error('cleanup failed'); };
    });
    expect(() => core.dispose()).not.toThrow();
    expect(remaining).toHaveBeenCalledTimes(1);
    expect(core.errors.getErrors()).toEqual([
      expect.objectContaining({ message: 'cleanup failed', source: 'lifecycle.cleanup', recoverable: true }),
    ]);
    expect(core.state.getState().lifecycle).toBe('disposed');
  });

  it('clears subscribers and listeners after emitting the final disposed state', async () => {
    const core = createCore();
    const subscriber = vi.fn();
    const listener = vi.fn();
    core.state.subscribe(subscriber);
    core.events.on('custom', listener);
    await core.lifecycle.initialize();
    core.dispose();
    expect(subscriber.mock.calls.at(-1)[0].lifecycle).toBe('disposed');
    const calls = subscriber.mock.calls.length;
    core.events.emit('custom');
    core.errors.report(new Error('diagnostic after disposal'));
    expect(listener).not.toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalledTimes(calls);
    expect(core.state.getState()).toEqual({ lifecycle: 'disposed', error: null });
  });

  it('reports event and state subscriber failures without notification recursion', async () => {
    const core = createCore();
    const remaining = vi.fn();
    core.events.on('custom', () => { throw new Error('event failed'); });
    core.events.on('custom', remaining);
    core.events.on('error:reported', () => { throw new Error('error event failed'); });
    core.events.emit('custom');
    expect(remaining).toHaveBeenCalledTimes(1);
    expect(core.errors.getErrors()).toEqual([
      expect.objectContaining({ source: 'events.custom' }),
      expect.objectContaining({ source: 'events.error:reported' }),
    ]);
    const unsubscribe = core.state.subscribe(() => { throw new Error('state failed'); });
    await core.lifecycle.initialize();
    unsubscribe();
    expect(core.errors.getErrors()).toContainEqual(expect.objectContaining({ source: 'state.subscribe' }));
    core.dispose();
  });

  it('handles a fatal error raised inside an error notification without recursion', async () => {
    const core = createCore();
    const cleanup = vi.fn();
    await core.lifecycle.initialize(() => cleanup);
    core.lifecycle.start();
    const notification = vi.fn(() => core.errors.report(new Error('nested fatal'), {
      source: 'nested', recoverable: false,
    }));
    core.events.on('error:reported', notification);
    core.errors.report(new Error('recoverable first'), { source: 'outer' });
    expect(notification).toHaveBeenCalledTimes(1);
    expect(core.state.getState()).toMatchObject({
      lifecycle: 'error', error: { message: 'nested fatal', source: 'nested', recoverable: false },
    });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(core.errors.getErrors()).toHaveLength(2);
    core.dispose();
  });

  it('preserves the fatal cause when resource cleanup also fails', async () => {
    const core = createCore();
    await expect(core.lifecycle.initialize(({ addCleanup }) => {
      addCleanup(() => { throw new Error('secondary cleanup'); });
      throw new Error('primary failure');
    })).rejects.toThrow('primary failure');
    expect(core.state.getState()).toMatchObject({
      lifecycle: 'error', error: { message: 'primary failure', recoverable: false },
    });
    expect(core.errors.getErrors()).toEqual([
      expect.objectContaining({ message: 'primary failure', recoverable: false }),
      expect.objectContaining({ message: 'secondary cleanup', recoverable: true }),
    ]);
    core.errors.report(new Error('later recoverable'));
    expect(core.state.getState().error.message).toBe('primary failure');
    core.dispose();
  });

  it('rejects new subscriptions after disposal while keeping inspection safe', () => {
    const core = createCore();
    core.dispose();
    const callback = vi.fn();
    expect(() => core.state.subscribe(callback)).toThrow(LifecycleError);
    expect(() => core.events.on('custom', callback)).toThrow(LifecycleError);
    expect(() => core.events.once('custom', callback)).toThrow(LifecycleError);
    expect(core.events.emit('custom')).toBe(0);
    expect(() => core.events.clear()).not.toThrow();
    expect(core.state.getState().lifecycle).toBe('disposed');
    core.dispose();
    expect(callback).not.toHaveBeenCalled();
  });

  it('preserves event transition order when state subscribers request a new transition', async () => {
    const core = createCore();
    const changes = [];
    core.events.on('lifecycle:changed', ({ current }) => changes.push(current));
    core.state.subscribe(({ lifecycle }) => {
      if (lifecycle === 'running') core.lifecycle.stop();
    });
    await core.lifecycle.initialize();
    core.lifecycle.start();
    expect(core.state.getState().lifecycle).toBe('stopped');
    expect(changes).toEqual(['initializing', 'ready', 'running', 'stopped']);
    core.dispose();
  });

  it('delivers queued transition events before clearing listeners on reentrant disposal', async () => {
    const core = createCore();
    const changes = [];
    core.events.on('lifecycle:changed', ({ current }) => changes.push(current));
    core.state.subscribe(({ lifecycle }) => {
      if (lifecycle === 'running') core.dispose();
    });
    await core.lifecycle.initialize();
    core.lifecycle.start();
    expect(core.state.getState().lifecycle).toBe('disposed');
    expect(changes).toEqual(['initializing', 'ready', 'running', 'disposed']);
    expect(core.events.emit('lifecycle:changed', { current: 'fake' })).toBe(0);
  });
});
