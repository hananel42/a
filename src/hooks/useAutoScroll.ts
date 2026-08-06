import { useRef, useEffect, useState, useCallback } from "react";

interface UseAutoScrollOptions {
  dependencies?: any[];
  atBottomThreshold?: number;
}

/**
 * Custom hook for smooth chat scrolling with intelligent user-intent detection.
 *
 * Behavior:
 * - Auto-scrolls to bottom when content/streaming/thinking updates ONLY when user is at the bottom.
 * - Instantly pauses auto-scroll the exact microsecond the user scrolls up (even by 1 pixel or 1 wheel tick).
 * - Re-enables auto-scroll ONLY when user scrolls back to the very bottom (<= 20px) or clicks scroll down.
 * - Exposes scrollToBottom for manual actions (like clicking the "scroll down" button).
 */
export function useAutoScroll({
  dependencies = [],
  atBottomThreshold = 20,
}: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [showScrollDown, setShowScrollDown] = useState(false);
  const autoScrollEnabledRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const isProgrammaticRef = useRef(false);

  // Helper to calculate distance to bottom
  const getDistanceToBottom = useCallback(() => {
    if (!scrollRef.current) return 0;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    return scrollHeight - (scrollTop + clientHeight);
  }, []);

  // Programmatic scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollRef.current) return;
    autoScrollEnabledRef.current = true;
    setShowScrollDown(false);
    isProgrammaticRef.current = true;

    const targetTop = scrollRef.current.scrollHeight;
    if (smooth) {
      scrollRef.current.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    } else {
      scrollRef.current.scrollTop = targetTop;
    }

    lastScrollTopRef.current = scrollRef.current.scrollTop;

    setTimeout(
      () => {
        isProgrammaticRef.current = false;
      },
      smooth ? 350 : 50,
    );
  }, []);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const currentScrollTop = scrollRef.current.scrollTop;
    const distanceToBottom = getDistanceToBottom();
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current - 1;

    if (isProgrammaticRef.current) {
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    if (isScrollingUp) {
      // User is scrolling UP -> immediately disable auto-scroll
      autoScrollEnabledRef.current = false;
      setShowScrollDown(true);
    } else {
      // User is scrolling DOWN or standing still
      if (distanceToBottom <= atBottomThreshold) {
        // Reached the bottom -> re-enable auto-scroll
        autoScrollEnabledRef.current = true;
        setShowScrollDown(false);
      } else {
        // Not at bottom -> show button
        setShowScrollDown(true);
      }
    }

    lastScrollTopRef.current = currentScrollTop;
  }, [getDistanceToBottom, atBottomThreshold]);

  // User input gesture handlers (mouse wheel, touch, keyboard) for instant reaction
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        // Scroll wheel UP
        autoScrollEnabledRef.current = false;
        setShowScrollDown(true);
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        if (currentY > touchStartY + 2) {
          // Touch swipe down = scrolling content UP
          autoScrollEnabledRef.current = false;
          setShowScrollDown(true);
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "PageUp", "Home"].includes(e.key)) {
        autoScrollEnabledRef.current = false;
        setShowScrollDown(true);
      }
    };

    scrollEl.addEventListener("wheel", onWheel, { passive: true });
    scrollEl.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollEl.addEventListener("touchmove", onTouchMove, { passive: true });
    scrollEl.addEventListener("keydown", onKeyDown, { passive: true });

    return () => {
      scrollEl.removeEventListener("wheel", onWheel);
      scrollEl.removeEventListener("touchstart", onTouchStart);
      scrollEl.removeEventListener("touchmove", onTouchMove);
      scrollEl.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Initial scroll to bottom on mount
  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  // Auto-scroll on dependency updates (messages, streaming, thinking)
  useEffect(() => {
    if (autoScrollEnabledRef.current && scrollRef.current) {
      isProgrammaticRef.current = true;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      lastScrollTopRef.current = scrollRef.current.scrollTop;
      setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 50);
    }
  }, dependencies);

  // ResizeObserver for DOM content size changes (e.g. thinking block expanding, tool expand/collapse, code blocks, images)
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const resizeObserver = new ResizeObserver(() => {
      if (autoScrollEnabledRef.current && scrollRef.current) {
        isProgrammaticRef.current = true;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        lastScrollTopRef.current = scrollRef.current.scrollTop;
        setTimeout(() => {
          isProgrammaticRef.current = false;
        }, 50);
      }
    });

    resizeObserver.observe(contentEl);
    return () => resizeObserver.disconnect();
  }, []);

  return {
    scrollRef,
    contentRef,
    showScrollDown,
    scrollToBottom,
    handleScroll,
  };
}
