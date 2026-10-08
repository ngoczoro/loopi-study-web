import { Link2 } from "lucide-react";
import { FileBadge } from "../chat/MessageAttachments";
import { formatFileSize, formatSharedDate } from "../chat/chatFormat";

export function MediaGrid({ items, onOpenImage, columns = 3 }) {
  return (
    <div
      className="grid gap-1.5 px-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpenImage(item)}
          className="aspect-square overflow-hidden rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}

export function FileRow({ item }) {
  return (
    <a
      href={item.url}
      download={item.name}
      className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/40 transition-colors"
    >
      <FileBadge name={item.name} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground flex justify-between gap-2">
          <span>{formatFileSize(item.size)}</span>
          <span>{formatSharedDate(item.createdAt)}</span>
        </p>
      </div>
    </a>
  );
}

export function LinkRow({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/40 transition-colors"
    >
      <span className="h-10 w-10 rounded-lg border border-border inline-flex items-center justify-center text-muted-foreground shrink-0">
        <Link2 className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{item.url}</p>
        <p className="text-xs flex justify-between gap-2">
          <span className="text-primary truncate">{item.name}</span>
          <span className="text-muted-foreground shrink-0">{formatSharedDate(item.createdAt)}</span>
        </p>
      </div>
    </a>
  );
}

export function SharedEmpty({ label }) {
  return <p className="px-4 text-xs text-muted-foreground">{label}</p>;
}
