import { useEffect, useRef } from "react";

/**
 * Reveals descendants marked with `.reveal` as they scroll into view.
 * Purely presentational; degrades to visible when IntersectionObserver is absent.
 *
 * Watches for `.reveal` elements added to the DOM after the initial scan too
 * (e.g. cards rendered once async data — like Supabase query results — resolves),
 * so late-arriving content still fades in instead of staying invisible forever.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    if (typeof IntersectionObserver === "undefined") {
      const markAllVisible = () => {
        root.querySelectorAll<HTMLElement>(".reveal").forEach((n) => n.classList.add("is-visible"));
      };
      markAllVisible();
      const fallback = new MutationObserver(markAllVisible);
      fallback.observe(root, { childList: true, subtree: true });
      return () => fallback.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const observeNode = (n: HTMLElement) => observer.observe(n);

    root.querySelectorAll<HTMLElement>(".reveal").forEach(observeNode);

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".reveal")) observeNode(node);
          node.querySelectorAll<HTMLElement>(".reveal").forEach(observeNode);
        });
      }
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return ref;
}