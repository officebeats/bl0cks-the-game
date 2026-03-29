"use client";

import { useState, useCallback, useEffect } from 'react';

/**
 * useEngine - Custom hook to manage the Web Engine sequence
 * 
 * Handles interaction with the Engine Bridge API (Next.js route).
 * Tracks UI state, engine metrics, and session tokens.
 */

export default function useEngine() {
  const [state, setState] = useState<any>(null);
  const [engineStats, setEngineStats] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send an action to the server-side engine
   */
  const callEngine = useCallback(async (action: string, payload: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, session })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown Engine Error');
      }

      setState(result.state);
      setEngineStats(result._engine);
      setSession(result.session);
      
      return result.state;
    } catch (err: any) {
      console.error('[useEngine Action Error]:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const startLevel = (levelId = '01', romId = 'chicago') => {
    return callEngine('START_LEVEL', { levelId, romId });
  };

  const sendAction = (input: string) => {
    return callEngine('SEND_ACTION', { input });
  };

  const refreshState = () => {
    return callEngine('GET_STATE');
  };

  return {
    state,
    engineStats,
    loading,
    error,
    startLevel,
    sendAction,
    refreshState
  };
}
