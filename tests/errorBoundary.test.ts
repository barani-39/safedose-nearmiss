import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

describe('SafeDose React ErrorBoundary Component', () => {
  it('initializes with clean non-error state and renders children', () => {
    const boundary = new ErrorBoundary({ children: React.createElement('span', null, 'Normal Content') });
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();

    const rendered = ReactDOMServer.renderToString(boundary.render() as React.ReactElement);
    expect(rendered).toContain('Normal Content');
  });

  it('updates state to hasError: true via getDerivedStateFromError', () => {
    const error = new Error('Simulated clinical UI render fault');
    const newState = ErrorBoundary.getDerivedStateFromError(error);

    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(error);
  });

  it('renders safe clinical fallback UI without leaking raw stack trace', () => {
    const error = new Error('Database connection string failure with stack trace');
    error.stack = 'Error: Database connection\n    at internalFunction (/app/secret/internal.ts:12:34)';

    const boundary = new ErrorBoundary({ children: React.createElement('div', null, 'Child') });
    boundary.state = { hasError: true, error };

    const rendered = ReactDOMServer.renderToString(boundary.render() as React.ReactElement);

    // Verifies friendly user-facing messages
    expect(rendered).toContain('Something went wrong while loading this section');
    expect(rendered).toContain('Your report data has not been intentionally changed');
    expect(rendered).toContain('Try Again');
    expect(rendered).toContain('Return to SafeDose Home');

    // Verifies raw stack trace is NOT leaked to user
    expect(rendered).not.toContain('/app/secret/internal.ts');
    expect(rendered).not.toContain('internalFunction');
  });

  it('renders custom fallback node when fallback prop is provided', () => {
    const customFallback = React.createElement('div', { id: 'custom-error' }, 'Custom Department Fallback');
    const boundary = new ErrorBoundary({
      children: React.createElement('div', null, 'Child'),
      fallback: customFallback,
    });
    boundary.state = { hasError: true, error: new Error('Fault') };

    const rendered = ReactDOMServer.renderToString(boundary.render() as React.ReactElement);
    expect(rendered).toContain('Custom Department Fallback');
    expect(rendered).toContain('id="custom-error"');
  });

  it('resets error state and triggers onReset callback upon user recovery request', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onResetSpy = vi.fn();
    const boundary = new ErrorBoundary({
      children: React.createElement('div', null, 'Child'),
      onReset: onResetSpy,
    });

    // Enter error state
    boundary.state = { hasError: true, error: new Error('Transient error') };
    expect(boundary.state.hasError).toBe(true);

    // Trigger user retry reset
    boundary.handleReset();

    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
    expect(onResetSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('safely captures error details in componentDidCatch without crashing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boundary = new ErrorBoundary({ children: React.createElement('div', null, 'Child') });

    const error = new TypeError('Cannot read properties of undefined');
    boundary.componentDidCatch(error, { componentStack: '\n    in FaultyWidget\n    in div' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SafeDose ErrorBoundary]'),
      expect.objectContaining({
        name: 'TypeError',
        message: 'Cannot read properties of undefined',
      })
    );

    consoleSpy.mockRestore();
  });
});
