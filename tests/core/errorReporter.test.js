import { describe, expect, it, vi } from 'vitest';
import { createErrorReporter } from '../../src/core/errorReporter.js';

describe('error reporter', () => {
  it('preserves technical origin and severity in an immutable local record', () => {
    const onReport = vi.fn();
    const errors = createErrorReporter({ onReport });
    const error = new TypeError('initialization failed');
    const record = errors.report(error, { source: 'initialization', recoverable: false });
    expect(record).toMatchObject({
      id: 'error-1', name: 'TypeError', message: error.message,
      source: 'initialization', recoverable: false, occurrences: 1, stack: error.stack,
    });
    expect(onReport).toHaveBeenCalledExactlyOnceWith(record);
    expect(() => { record.source = 'outside'; }).toThrow(TypeError);
    expect(() => errors.getErrors().push(record)).toThrow(TypeError);
  });

  it('deduplicates repeated errors without duplicate notifications', () => {
    const onReport = vi.fn();
    const errors = createErrorReporter({ onReport });
    const first = errors.report(new Error('same'), { source: 'module' });
    const second = errors.report(new Error('same'), { source: 'module' });
    expect(second.id).toBe(first.id);
    expect(second.occurrences).toBe(2);
    expect(errors.getErrors()).toEqual([second]);
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(first.occurrences).toBe(1);
  });

  it('keeps different origins or severities as distinct failures', () => {
    const errors = createErrorReporter();
    errors.report('failure', { source: 'first' });
    errors.report('failure', { source: 'second' });
    errors.report('failure', { source: 'first', recoverable: false });
    expect(errors.getErrors()).toHaveLength(3);
  });

  it('records a reporting failure without recursively notifying the same listener', () => {
    const onReport = vi.fn(() => { throw new Error('report listener failed'); });
    const errors = createErrorReporter({ onReport });
    expect(() => errors.report(new Error('original'))).not.toThrow();
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(errors.getErrors()).toHaveLength(2);
    expect(errors.getErrors()[1]).toMatchObject({ source: 'errors.onReport', message: 'report listener failed' });
  });
});
