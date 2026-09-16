import seal from "@/assets/ibg-seal.png";
import academy from "@/assets/ibg-academy.png";
import { cn } from "@/lib/utils";

export function IbgSeal({ className }: { className?: string }) {
  return (
    <img
      src={seal}
      alt="India Bartenders' Guild official seal"
      width={768}
      height={768}
      className={cn("h-10 w-10 object-contain", className)}
    />
  );
}

export function IbgAcademyLogo({ className }: { className?: string }) {
  return (
    <img
      src={academy}
      alt="IBG Academy logo"
      width={900}
      height={573}
      loading="lazy"
      decoding="async"
      className={cn("h-20 w-auto object-contain", className)}
    />
  );
}

export function IbgWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <IbgSeal className="h-10 w-10 object-contain transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110" />
      <span className="leading-none">
        <span className="block font-display text-lg font-semibold tracking-wide text-foreground">
          IBG Academy
        </span>
        <span className="block text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
          India Bartenders' Guild
        </span>
      </span>
    </span>
  );
}
