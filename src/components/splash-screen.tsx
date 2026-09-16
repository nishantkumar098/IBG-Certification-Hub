import { useLayoutEffect, useState } from "react";
import { IbgSeal } from "@/components/ibg-logo";

const SPLASH_SESSION_KEY = "ibg-splash-shown";
const BAR_DURATION_MS = 1100;
const FADE_DURATION_MS = 350;

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    if (window.sessionStorage.getItem(SPLASH_SESSION_KEY)) {
      setVisible(false);
      return;
    }
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");

    const fadeTimer = window.setTimeout(() => setFadingOut(true), BAR_DURATION_MS);
    const hideTimer = window.setTimeout(
      () => setVisible(false),
      BAR_DURATION_MS + FADE_DURATION_MS,
    );
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background"
      style={{
        transition: `opacity ${FADE_DURATION_MS}ms ease-out`,
        opacity: fadingOut ? 0 : 1,
      }}
    >
      <IbgSeal className="h-16 w-16 animate-float" />
      <div className="h-[3px] w-40 overflow-hidden rounded-full bg-border">
        <div className="ibg-splash-bar-fill h-full w-full rounded-full bg-primary" />
      </div>
    </div>
  );
}
