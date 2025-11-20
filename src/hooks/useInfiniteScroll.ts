import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = <T>(
  items: T[],
  itemsPerPage: number = 10,
  options: UseInfiniteScrollOptions = {}
) => {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { threshold = 0.1, rootMargin = '100px' } = options;

  useEffect(() => {
    const start = 0;
    const end = page * itemsPerPage;
    const newItems = items.slice(start, end);
    setDisplayedItems(newItems);
    setHasMore(end < items.length);
  }, [items, page, itemsPerPage]);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold, rootMargin }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadMore, threshold, rootMargin]);

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
  }, []);

  return {
    displayedItems,
    hasMore,
    loadMoreRef,
    reset,
  };
};
