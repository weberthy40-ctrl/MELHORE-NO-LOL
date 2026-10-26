/**
 * Synchronous, framework-independent events. Every registration is independent.
 * An unhandled listener failure is thrown after the remaining listeners run.
 * @param {{onListenerError?: (error: unknown, event: string) => void}} [options]
 */
export function createEventBus({ onListenerError } = {}) {
  const channels = new Map();

  function subscribe(name, listener, once) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('An event name is required.');
    if (typeof listener !== 'function') throw new TypeError('An event listener must be a function.');
    if (!channels.has(name)) channels.set(name, new Set());
    const entry = { listener, once };
    channels.get(name).add(entry);
    return () => remove(name, entry);
  }

  function remove(name, entry) {
    const channel = channels.get(name);
    if (!channel) return false;
    const removed = channel.delete(entry);
    if (!channel.size) channels.delete(name);
    return removed;
  }

  return Object.freeze({
    on: (name, listener) => subscribe(name, listener, false),
    once: (name, listener) => subscribe(name, listener, true),
    off(name, listener) {
      let count = 0;
      for (const entry of [...(channels.get(name) ?? [])]) {
        if (entry.listener === listener && remove(name, entry)) count += 1;
      }
      return count;
    },
    emit(name, payload) {
      const entries = [...(channels.get(name) ?? [])];
      const failures = [];
      let delivered = 0;
      for (const entry of entries) {
        if (!channels.get(name)?.has(entry)) continue;
        if (entry.once) remove(name, entry);
        delivered += 1;
        try {
          entry.listener(payload);
        } catch (error) {
          if (onListenerError) {
            try { onListenerError(error, name); } catch (reportError) { failures.push(reportError); }
          } else failures.push(error);
        }
      }
      if (failures.length) throw new AggregateError(failures, `Listeners for ${name} failed.`);
      return delivered;
    },
    clear(name) {
      if (name === undefined) channels.clear();
      else channels.delete(name);
    },
  });
}
