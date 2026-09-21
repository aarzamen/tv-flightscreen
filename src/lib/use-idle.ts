import { useEffect, useState } from "react";

const EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "touchstart",
  "touchmove",
] as const;

/** Fade unused chrome after the deck sits untouched. Map pan/zoom counts. */
export function useIdleChrome(delayMs = 4800, paused = false) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (paused) {
      setIdle(false);
      return;
    }
    if (typeof window === "undefined") return;
    let timer = 0;
    const ping = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), delayMs);
    };
    ping();
    const opts: AddEventListenerOptions = { passive: true };
    for (const name of EVENTS) window.addEventListener(name, ping, opts);
    return () => {
      window.clearTimeout(timer);
      for (const name of EVENTS) window.removeEventListener(name, ping);
    };
  }, [delayMs, paused]);

  return idle;
}
