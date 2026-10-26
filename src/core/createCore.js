import { createStateStore } from './stateStore.js';
import { createEventBus } from './eventBus.js';
import { createErrorReporter } from './errorReporter.js';
import { createLifecycle, LifecycleError } from './lifecycle.js';

/** Compose the technical services without depending on the DOM or Three.js. */
export function createCore() {
  let lifecycle;
  let errors;
  const stateStore = createStateStore({ lifecycle: 'created', error: null }, {
    onListenerError: (error) => errors.report(error, { source: 'state.subscribe', recoverable: true }),
  });
  const events = createEventBus({
    onListenerError: (error, name) => errors.report(error, { source: `events.${name}`, recoverable: true }),
  });
  errors = createErrorReporter({
    onFatal: (record) => lifecycle.fail(record),
    onReport(record) {
      const status = stateStore.getState().lifecycle;
      if (status === 'disposed') return;
      if (record.recoverable && status !== 'error') stateStore.setState({ ...stateStore.getState(), error: record });
      events.emit('error:reported', record);
    },
  });
  lifecycle = createLifecycle({
    stateStore,
    events,
    errors,
    onDispose() {
      stateStore.clear();
      events.clear();
    },
  });
  function ensureActive() {
    if (stateStore.getState().lifecycle === 'disposed') {
      throw new LifecycleError('Cannot subscribe to a disposed application.');
    }
  }
  const state = Object.freeze({
    getState: stateStore.getState,
    subscribe(listener) {
      ensureActive();
      return stateStore.subscribe(listener);
    },
  });
  const publicEvents = Object.freeze({
    ...events,
    on(name, listener) {
      ensureActive();
      return events.on(name, listener);
    },
    once(name, listener) {
      ensureActive();
      return events.once(name, listener);
    },
  });
  return Object.freeze({ state, events: publicEvents, errors, lifecycle, dispose: lifecycle.dispose });
}
