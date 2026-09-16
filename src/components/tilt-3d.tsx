import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps a card in a pointer-driven 3D tilt (perspective rotateX/rotateY),
 * GPU-accelerated via CSS transforms only — no WebGL, so it's cheap enough
 * to use on every card in a grid.
 *
 * Touch devices have no hover, so pointer tracking is skipped there and a
 * quick tap "pop" (scale + brief tilt) stands in for the depth cue instead.
 */
export function Tilt3D({
  children,
  className,
  style,
  strength = 10,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || reducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateZ(0)`;
    });
  }

  function handlePointerLeave() {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transform = "";
  }

  function handleTouchTap() {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    el.style.transform = "perspective(900px) rotateX(-4deg) scale(0.98)";
    window.setTimeout(() => {
      if (ref.current) ref.current.style.transform = "";
    }, 180);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handleTouchTap}
      className={cn(
        "transition-transform duration-200 ease-out [transform-style:preserve-3d]",
        className,
      )}
      style={{ willChange: "transform", ...style }}
    >
      {children}
    </div>
  );
}
