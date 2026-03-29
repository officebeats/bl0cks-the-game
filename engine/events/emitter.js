/**
 * BL0CKS Engine Event Emitter
 * 
 * Lightweight pub/sub for engine → platform communication.
 * No external dependencies. Supports wildcard subscriptions.
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
        this.#wildcardListeners = this.#wildcardListeners.filter(fn => fn !== callback);
      };
    }

    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);

    return () => {
      const fns = this.#listeners.get(event);
      if (fns) {
        this.#listeners.set(event, fns.filter(fn => fn !== callback));
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
      for (const fn of fns) {
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
    this.#wildcardListeners = [];
  }
}
