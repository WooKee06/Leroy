import { useEffect, useRef } from "react";

export function useInfiniteScroll(onIntersect: () => void, hasMore: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onIntersect(),
      { rootMargin: "100px" },
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [onIntersect, hasMore]);

  return ref;
}
