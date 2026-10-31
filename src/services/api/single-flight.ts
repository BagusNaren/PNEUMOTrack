export interface SingleFlightGate {
  isLocked: () => boolean;
  reset: () => void;
  run: (action: () => void | Promise<unknown>) => Promise<boolean>;
  navigate: (
    action: () => boolean | void | Promise<boolean | void>,
  ) => Promise<boolean>;
}

/**
 * Guards UI actions and screen transitions against rapid double-taps.
 * `run` releases its lock when the action settles; `navigate` keeps the lock
 * held after a successful transition until `reset()` is called on screen focus.
 */
export function createSingleFlightGate(): SingleFlightGate {
  let locked = false;

  return {
    isLocked: () => locked,
    reset: () => {
      locked = false;
    },
    run: async (action) => {
      if (locked) return false;
      locked = true;
      try {
        await action();
        return true;
      } finally {
        locked = false;
      }
    },
    navigate: async (action) => {
      if (locked) return false;
      locked = true;
      try {
        const result = await action();
        if (result === false) {
          locked = false;
          return false;
        }
        return true;
      } catch (error) {
        locked = false;
        throw error;
      }
    },
  };
}
