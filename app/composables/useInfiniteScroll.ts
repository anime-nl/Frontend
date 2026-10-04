/**
 * Re-fires onIntersect every time the sentinel element becomes visible, for infinite-scroll /
 * "load more" UIs. Owns the IntersectionObserver's lifecycle (including teardown on unmount);
 * the caller decides when to start() - typically once its own initial load has resolved - and
 * calls rearm() after each subsequent load finishes, so the observer notices the sentinel again
 * once it has settled back into position.
 * @param sentinel Template ref to the sentinel element to observe
 * @param onIntersect Called whenever the sentinel becomes visible
 * @param options.rootMargin How far outside the viewport to trigger early, as a CSS margin
 * @returns start - begins observing the sentinel; rearm - re-observes it after a load
 */
export function useInfiniteScroll(
    sentinel: Readonly<Ref<HTMLElement | null>>,
    onIntersect: () => void,
    options: {rootMargin: string}
) {
    let observer: IntersectionObserver | null = null

    function start() {
        if (!sentinel.value) return

        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) onIntersect()
            },
            {rootMargin: options.rootMargin}
        )
        observer.observe(sentinel.value)
    }

    function rearm() {
        if (!observer || !sentinel.value) return
        observer.unobserve(sentinel.value)
        observer.observe(sentinel.value)
    }

    onUnmounted(() => observer?.disconnect())

    return {start, rearm}
}
