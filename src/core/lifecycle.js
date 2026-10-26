const TRANSITIONS = Object.freeze({
  created: Object.freeze(['initializing', 'error', 'disposed']),
  initializing: Object.freeze(['ready', 'error', 'disposed']),
  ready: Object.freeze(['running', 'stopped', 'error', 'disposed']),
  running: Object.freeze(['stopped', 'error', 'disposed']),
  stopped: Object.freeze(['running', 'error', 'disposed']),
  error: Object.freeze(['disposed']),
  disposed: Object.freeze([]),
});

/** Controlled operation failure, distinct from a fatal application error. */
export class LifecycleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LifecycleError';
  }
}

/**
 * Technical application lifecycle; running does not represent a game session.
 * @param {{stateStore: object, events: object, errors: object, onDispose?: Function}} services
 */
export function createLifecycle({ stateStore, events, errors, onDispose = () => {} }) {
  const cleanups = new Set();
  let pendingInitialization = null;
  let epoch = 0;
  const pendingTransitions = [];
  let transitionDepth = 0;
  let emittingTransitions = false;
  let disposing = false;
  let disposalPending = false;
  const status = () => stateStore.getState().lifecycle;

  function finishDisposal() {
    if (disposalPending && !disposing && !transitionDepth && !emittingTransitions) {
      disposalPending = false;
      onDispose();
    }
  }

  function flushTransitions() {
    if (transitionDepth || emittingTransitions) return;
    emittingTransitions = true;
    try {
      while (pendingTransitions.length) {
        events.emit('lifecycle:changed', pendingTransitions.shift());
      }
    } finally {
      emittingTransitions = false;
      finishDisposal();
    }
  }

  function transition(next, error = stateStore.getState().error) {
    const previous = status();
    if (previous === next) return stateStore.getState();
    if (!TRANSITIONS[previous].includes(next)) {
      throw new LifecycleError(`Cannot transition from ${previous} to ${next}.`);
    }
    pendingTransitions.push(Object.freeze({ previous, current: next }));
    transitionDepth += 1;
    try {
      stateStore.setState({ lifecycle: next, error });
    } finally {
      transitionDepth -= 1;
      flushTransitions();
    }
    return stateStore.getState();
  }

  function runCleanup(cleanup, source) {
    try { cleanup(); } catch (error) { errors.report(error, { source, recoverable: true }); }
  }

  function releaseResources() {
    const resources = [...cleanups].reverse();
    cleanups.clear();
    for (const cleanup of resources) runCleanup(cleanup, 'lifecycle.cleanup');
  }

  function addCleanup(cleanup) {
    if (typeof cleanup !== 'function') throw new TypeError('Cleanup must be a function.');
    if (['disposed', 'error'].includes(status())) runCleanup(cleanup, 'lifecycle.lateCleanup');
    else cleanups.add(cleanup);
    return () => cleanups.delete(cleanup);
  }

  function fail(record) {
    if (['error', 'disposed'].includes(status())) return;
    epoch += 1;
    transition('error', record);
    releaseResources();
  }

  function initialize(initializer = () => {}) {
    const current = status();
    if (current === 'initializing') return pendingInitialization;
    if (['ready', 'running', 'stopped'].includes(current)) return Promise.resolve(stateStore.getState());
    if (current !== 'created') {
      return Promise.reject(new LifecycleError(`Cannot initialize an application in ${current}.`));
    }
    if (typeof initializer !== 'function') return Promise.reject(new TypeError('Initializer must be a function.'));
    const runEpoch = ++epoch;
    pendingInitialization = Promise.resolve().then(async () => {
      if (runEpoch !== epoch || status() !== 'initializing') {
        throw new LifecycleError('Application initialization was cancelled.');
      }
      try {
        const cleanup = await initializer(Object.freeze({ addCleanup }));
        if (cleanup !== undefined) addCleanup(cleanup);
        if (runEpoch !== epoch || status() !== 'initializing') {
          throw new LifecycleError('Application initialization was cancelled.');
        }
        const snapshot = transition('ready');
        if (['error', 'disposed'].includes(snapshot.lifecycle)) {
          throw new LifecycleError('Application initialization was cancelled.');
        }
        return snapshot;
      } catch (error) {
        if (runEpoch === epoch && status() === 'initializing') {
          errors.report(error, { source: 'lifecycle.initialize', recoverable: false });
        }
        throw error;
      }
    });
    transition('initializing');
    return pendingInitialization;
  }

  return Object.freeze({
    initialize,
    start() {
      if (status() === 'running') return stateStore.getState();
      if (!['ready', 'stopped'].includes(status())) {
        throw new LifecycleError(`Cannot start an application in ${status()}.`);
      }
      return transition('running');
    },
    stop() {
      if (status() === 'stopped') return stateStore.getState();
      if (!['ready', 'running'].includes(status())) {
        throw new LifecycleError(`Cannot stop an application in ${status()}.`);
      }
      return transition('stopped');
    },
    fail,
    dispose() {
      if (status() === 'disposed') return;
      epoch += 1;
      disposalPending = true;
      disposing = true;
      try {
        transition('disposed');
        releaseResources();
      } finally {
        disposing = false;
        finishDisposal();
      }
    },
  });
}
