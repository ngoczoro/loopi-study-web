import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Sparkles } from "lucide-react";

export default function FloatingAssistantButton() {
  const location = useLocation();

  if (location.pathname.startsWith("/assistant")) return null;

  return (
    <Link
      to="/assistant"
      aria-label="Open AI Study Assistant"
      className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary p-3.5 text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:bottom-6 md:right-6"
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
