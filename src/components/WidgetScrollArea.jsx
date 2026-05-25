import { cn } from "../lib/utils";

/** ~52px row + 8px gap × 2 between 3 rows */
export const TASK_LIST_SCROLL_MAX = "max-h-[calc(3*3.25rem+1rem)]";

/** ~60px row + 12px gap × 2 between 3 rows */
export const DEADLINE_LIST_SCROLL_MAX = "max-h-[calc(3*3.75rem+1.5rem)]";

const VISIBLE_ITEMS = 3;

/**
 * Internal scroll for dashboard widgets — shows ~3 items, scrolls the rest.
 */
export function WidgetScrollArea({
  children,
  itemCount = 0,
  maxHeightClass,
  listClassName,
  scrollHint = "Scroll for more",
}) {
  const scrollable = itemCount > VISIBLE_ITEMS;

  return (
    <div className="relative min-h-0">
      <div
        className={cn(
          listClassName,
          "overflow-x-hidden overscroll-y-contain",
          scrollable && "overflow-y-auto widget-scroll-area pr-1",
          scrollable && maxHeightClass,
        )}
      >
        {children}
      </div>

      {scrollable ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-5 h-6 bg-gradient-to-t from-card via-card/70 to-transparent"
            aria-hidden
          />
          <p className="text-[10px] text-center text-muted-foreground/70 mt-1.5 select-none">
            {scrollHint}
          </p>
        </>
      ) : null}
    </div>
  );
}
