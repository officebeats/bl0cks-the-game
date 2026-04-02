/**
 * BL0CKS Engine Event Emitter
 *
 * Lightweight pub/sub for engine → platform communication.
 * No external dependencies. Supports wildcard subscriptions.
 *
 * Performance: Unsubscribe uses in-place splice (O(n)) instead of
 * filter (O(n) allocation) to avoid GC pressure on hot paths.
 */
export class EventBus {
  #listeners = new Map();
  #wildcardListeners = [];

  /**
   * Subscribe to a specific event or wildcard ('*').
   * @param {string} event - Event name or '*' for all events
   * @param {function} callback - Handler function (payload, eventName)
   * @returns {function} Unsubscribe function
   */
  on(event, callback) {
    if (event === '*') {
      this.#wildcardListeners.push(callback);
      return () => {
        const idx = this.#wildcardListeners.indexOf(callback);
        if (idx !== -1) this.#wildcardListeners.splice(idx, 1);
      };
    }

    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    const fns = this.#listeners.get(event);
    fns.push(callback);

    return () => {
      const arr = this.#listeners.get(event);
      if (arr) {
        const idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      }
    };
  }

  /**
   * Subscribe to an event, but auto-unsubscribe after the first firing.
   * @param {string} event
   * @param {function} callback
   * @returns {function} Unsubscribe function
   */
  once(event, callback) {
    const unsub = this.on(event, (...args) => {
      unsub();
      callback(...args);
    });
    return unsub;
  }

  /**
   * Emit an event to all subscribers.
   * @param {string} event - Event name
   * @param {*} payload - Event data
   */
  emit(event, payload) {
    const fns = this.#listeners.get(event);
    if (fns) {
      // Iterate over a snapshot to handle unsubscribe-during-emit safely
      const snapshot = fns.slice();
      for (const fn of snapshot) {
        try { fn(payload, event); } catch (err) {
          console.error(`[EventBus] Error in listener for "${event}":`, err);
        }
      }
    }
    for (const fn of this.#wildcardListeners) {
      try { fn(payload, event); } catch (err) {
        console.error(`[EventBus] Error in wildcard listener for "${event}":`, err);
      }
    }
  }

  /**
   * Remove all listeners. Used for cleanup.
   */
  removeAll() {
    this.#listeners.clear();
    this.#wildcardListeners.length = 0;
  }
}
