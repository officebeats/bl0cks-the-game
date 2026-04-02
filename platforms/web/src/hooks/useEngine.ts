"use client";

import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * useEngine - Custom hook to manage the Web Engine sequence
 *
 * Handles interaction with the Engine Bridge API (Next.js route).
 * Tracks UI state, engine metrics, and session tokens.
 *
 * Performance:
 *  - AbortController cancels stale in-flight requests
 *  - Session ref avoids stale closures in callbacks
 *  - Stable callback references via useCallback with empty deps
 */

interface EngineState {
  state: unknown;
  _engine: unknown;
  session: unknown;
}

export default function useEngine() {
  const [state, setState] = useState<unknown>(null);
  const [engineStats, setEngineStats] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for session avoids recreating callbacks on every session update
  const sessionRef = useRef<unknown>(null);
  // Ref for abort controller to cancel stale requests
  const abortRef = useRef<AbortController | null>(null);

  const callEngine = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, session: sessionRef.current }),
        signal: controller.signal,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown Engine Error');
      }

      setState(result.state);
      setEngineStats(result._engine);
      sessionRef.current = result.session;

      return result.state;
    } catch (err: unknown) {
      // Ignore aborted requests — a newer request is in flight
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null;
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useEngine Action Error]:', err);
      setError(message);
      return null;
    } finally {
      // Only clear loading if this request wasn't aborted
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const startLevel = useCallback((levelId = '01', romId = 'chicago') => {
    return callEngine('START_LEVEL', { levelId, romId });
  }, [callEngine]);

  const sendAction = useCallback((input: string) => {
    return callEngine('SEND_ACTION', { input });
  }, [callEngine]);

  const refreshState = useCallback(() => {
    return callEngine('GET_STATE');
  }, [callEngine]);

  return useMemo(() => ({
    state,
    engineStats,
    loading,
    error,
    startLevel,
    sendAction,
    refreshState,
  }), [state, engineStats, loading, error, startLevel, sendAction, refreshState]);
}
