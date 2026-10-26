/** Clone and freeze the plain data supported by the application state. */
function immutableCopy(value, ancestors = new Set()) {
  if (value === null || ['string', 'boolean'].includes(typeof value)) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || ancestors.has(value)) {
    throw new TypeError('State must contain finite, acyclic plain data.');
  }
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError('State must contain plain objects or arrays.');
  }
  const nextAncestors = new Set(ancestors).add(value);
  const copy = Array.isArray(value)
    ? value.map((item) => immutableCopy(item, nextAncestors))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, immutableCopy(item, nextAncestors)]));
  return Object.freeze(copy);
}

function equalData(left, right) {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length
    && keys.every((key) => Object.hasOwn(right, key) && equalData(left[key], right[key]));
}

/**
 * Observable plain-data store. Its writer belongs to the owner; consumers receive
 * getState/subscribe only. Notifications are queued to preserve reentrant order.
 * @param {object} initialState
 * @param {{onListenerError?: (error: unknown) => void}} [options]
 */
export function createStateStore(initialState, { onListenerError } = {}) {
  let snapshot = immutableCopy(initialState);
  const listeners = new Set();
  const pending = [];
  let notifying = false;

  function setState(value) {
    const next = immutableCopy(typeof value === 'function' ? value(snapshot) : value);
    if (equalData(snapshot, next)) return snapshot;
    const previous = snapshot;
    snapshot = next;
    pending.push({ next, previous });
    if (notifying) return snapshot;
    notifying = true;
    const failures = [];
    try {
      while (pending.length) {
        const change = pending.shift();
        for (const listener of [...listeners]) {
          if (!listeners.has(listener)) continue;
          try {
            listener(change.next, change.previous);
          } catch (error) {
            if (onListenerError) {
              try { onListenerError(error); } catch (reportError) { failures.push(reportError); }
            } else failures.push(error);
          }
        }
      }
    } finally {
      notifying = false;
    }
    if (failures.length) throw new AggregateError(failures, 'State subscribers failed.');
    return snapshot;
  }

  return Object.freeze({
    getState: () => snapshot,
    setState,
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('A state listener must be a function.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clear: () => listeners.clear(),
  });
}
