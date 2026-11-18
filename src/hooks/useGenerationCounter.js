import { useCallback, useEffect, useRef, useState } from "react";

const STEP_MS = 180; // pace while counting up to what the server has ready
const FINISH_STEP_MS = 70; // faster catch-up once the result has arrived
const FINISH_MAX_MS = 2500; // never hold the result back longer than this

const IDLE = { active: false, total: 0, target: 0, shown: 0, stage: null, finishing: false };

/**
 * Counts generated questions/cards up one at a time while a quiz or deck is generated.
 *   start(total)       when the request starts
 *   update(progress)   as `onProgress` (server events: { stage, ready, total })
 *   await finish(n)    when the result is in: counts on to n (what came back), then resolves
 *   reset()            on failure or after finish
 *   label              text for the loading button ("Generating question 3/5", "AI is writing…")
 * The count never goes past what the server reports until the result arrives.
 */
export function useGenerationCounter(noun = "questions") {
  const [state, setState] = useState(IDLE);
  const finishResolve = useRef(null);

  useEffect(() => {
    if (!state.active) return undefined;
    const goal = state.finishing ? state.total : state.target;
    if (state.shown >= goal) {
      if (state.finishing && finishResolve.current) {
        finishResolve.current();
        finishResolve.current = null;
      }
      return undefined;
    }
    const timer = setTimeout(
      () => setState((current) => ({ ...current, shown: current.shown + 1 })),
      state.finishing ? FINISH_STEP_MS : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [state]);

  const start = useCallback((total) => {
    setState({ ...IDLE, active: true, total, stage: "reading" });
  }, []);

  const update = useCallback((progress) => {
    setState((current) =>
      current.active
        ? {
            ...current,
            stage: progress.stage,
            total: progress.total ?? current.total,
            target: Math.max(current.target, progress.ready ?? current.target),
          }
        : current,
    );
  }, []);

  // `finalTotal`: how many questions/cards actually came back (can be fewer than asked).
  const finish = useCallback(
    (finalTotal) =>
      new Promise((resolve) => {
        const done = () => {
          clearTimeout(safety);
          resolve();
        };
        const safety = setTimeout(done, FINISH_MAX_MS);
        finishResolve.current = done;
        setState((current) => {
          const total = Number.isInteger(finalTotal) ? finalTotal : current.total;
          return { ...current, finishing: true, total, shown: Math.min(current.shown, total) };
        });
      }),
    [],
  );

  const reset = useCallback(() => {
    finishResolve.current = null;
    setState(IDLE);
  }, []);

  const singular = noun === "cards" ? "card" : "question";
  let label = null;
  if (state.active) {
    const { shown, target, total, stage, finishing } = state;
    const next = Math.min(shown + 1, total);
    if (finishing && shown >= total) label = `Done ${total}/${total}`;
    else if (shown < (finishing ? total : target)) label = `Generating ${singular} ${next}/${total}`;
    else if (stage === "ai") label = `AI is writing ${singular} ${next}/${total}…`;
    else if (stage === "wording") label = `Polishing the wording ${shown}/${total}…`;
    else if (stage === "reading") label = "Reading your notes…";
    else label = `Generating ${singular} ${next}/${total}`;
  }

  return { start, update, finish, reset, label };
}
