import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Sparkles } from "lucide-react";

const STORAGE_KEY = "loopi.assistantBubblePosition";
const EDGE_MARGIN = 8;
const DRAG_THRESHOLD = 5;

const readStoredPosition = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value?.right) && Number.isFinite(value?.bottom) ? value : null;
  } catch {
    return null;
  }
};

const clampPosition = (position, element) => {
  if (!position || !element) return position;
  const maxRight = window.innerWidth - element.offsetWidth - EDGE_MARGIN;
  const maxBottom = window.innerHeight - element.offsetHeight - EDGE_MARGIN;
  return {
    right: Math.min(Math.max(position.right, EDGE_MARGIN), Math.max(maxRight, EDGE_MARGIN)),
    bottom: Math.min(Math.max(position.bottom, EDGE_MARGIN), Math.max(maxBottom, EDGE_MARGIN)),
  };
};

export default function FloatingAssistantButton() {
  const location = useLocation();
  const buttonRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [position, setPosition] = useState(readStoredPosition);

  const hidden =
    location.pathname.startsWith("/assistant") ||
    (location.pathname.startsWith("/groups/") &&
      new URLSearchParams(location.search).get("view") === "call");

  useEffect(() => {
    if (hidden) return undefined;
    const handleResize = () => setPosition((current) => clampPosition(current, buttonRef.current));
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hidden]);

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.bottom,
      moved: false,
    };
  }, []);

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setPosition(
      clampPosition({ right: drag.right - dx, bottom: drag.bottom - dy }, buttonRef.current),
    );
  }, []);

  const handlePointerUp = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      if (!drag.moved) return;
      suppressClickRef.current = true;
      if (position) localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    },
    [position],
  );

  const handleClick = useCallback((event) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
  }, []);

  if (hidden) return null;

  return (
    <Link
      ref={buttonRef}
      to="/assistant"
      aria-label="Open AI Study Assistant"
      title="Drag to move"
      draggable={false}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      style={position ? { right: position.right, bottom: position.bottom } : undefined}
      className="group fixed bottom-5 right-5 z-50 inline-flex touch-none select-none items-center gap-2 rounded-full bg-primary p-3.5 text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:cursor-grabbing md:bottom-6 md:right-6"
    >
      <span className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-primary/25 [animation-duration:2.5s]" />
      <span className="relative">
        <MessageCircle className="h-5 w-5" />
        <Sparkles className="absolute -right-1.5 -top-1.5 h-3 w-3" />
      </span>
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 md:block">
        Ask AI
      </span>
    </Link>
  );
}
