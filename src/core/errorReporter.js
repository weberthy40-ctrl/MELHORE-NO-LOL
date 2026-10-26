/**
 * Local diagnostics only: duplicate origin/name/message/severity increments a
 * counter without emitting another notification. Nested report failures are
 * recorded without recursively notifying the failing error listener.
 * Fatal handling is separate from notifications so a fatal error raised by an
 * error listener still stops the application without recursively notifying it.
 * @param {{onReport?: (record: object) => void, onFatal?: (record: object) => void}} [options]
 */
export function createErrorReporter({ onReport, onFatal } = {}) {
  const records = new Map();
  let nextId = 1;
  let notifying = false;

  function report(error, { source = 'application', recoverable = true } = {}) {
    const name = error instanceof Error ? error.name : 'Error';
    const message = error instanceof Error ? error.message : String(error);
    const origin = String(source);
    const canRecover = Boolean(recoverable);
    const key = JSON.stringify([origin, name, message, canRecover]);
    const previous = records.get(key);
    const record = Object.freeze({
      id: previous?.id ?? `error-${nextId++}`,
      name,
      message,
      source: origin,
      recoverable: canRecover,
      occurrences: (previous?.occurrences ?? 0) + 1,
      stack: previous?.stack ?? (error instanceof Error ? error.stack ?? null : null),
    });
    records.set(key, record);
    const nested = notifying;
    notifying = true;
    try {
      if (!canRecover && onFatal) {
        try { onFatal(record); } catch (fatalHandlerError) {
          report(fatalHandlerError, { source: 'errors.onFatal', recoverable: true });
        }
      }
      if (!previous && !nested && onReport) {
        try { onReport(record); } catch (listenerError) {
          report(listenerError, { source: 'errors.onReport', recoverable: true });
        }
      }
    } finally {
      notifying = nested;
    }
    return record;
  }

  return Object.freeze({ report, getErrors: () => Object.freeze([...records.values()]) });
}
