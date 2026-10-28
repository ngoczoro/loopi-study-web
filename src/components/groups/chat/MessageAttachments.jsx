import { Download, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHostname } from "@/lib/chatLinks";
import { downloadFile, openSharedFile } from "@/utils/file-preview";
import {
  formatFileSize,
  getFileBadgeColor,
  getFileExtension,
} from "./chatFormat";

export function FileBadge({ name, className }) {
  return (
    <span
      className={cn(
        "h-10 w-10 rounded-lg text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0",
        getFileBadgeColor(name),
        className,
      )}
    >
      {getFileExtension(name).slice(0, 4)}
    </span>
  );
}

export function ImageGrid({ images, onOpenImage }) {
  if (images.length === 0) return null;
  const single = images.length === 1;

  return (
    <div className={cn("grid gap-1", single ? "grid-cols-1" : "grid-cols-2")}>
      {images.map((image) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onOpenImage(image)}
          className={cn(
            "overflow-hidden rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/40",
            single ? "max-w-[280px]" : "aspect-square w-[136px]",
          )}
        >
          <img
            src={image.url}
            alt={image.name}
            loading="lazy"
            className={cn("w-full object-cover", single ? "max-h-[320px]" : "h-full")}
          />
        </button>
      ))}
    </div>
  );
}

export function FileCard({ file }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card pl-3 pr-1 py-2 w-[260px] max-w-full">
      <button
        type="button"
        onClick={() => openSharedFile(file)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left rounded-lg hover:opacity-80 transition-opacity"
      >
        <FileBadge name={file.name} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => downloadFile({ fileUrl: file.url, fileName: file.name })}
        aria-label={`Download ${file.name}`}
        title="Download"
        className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

export function LinkPreviewCard({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 w-[260px] max-w-full hover:bg-secondary/60 transition-colors"
    >
      <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
        <Link2 className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{getHostname(url)}</p>
        <p className="text-xs text-primary truncate">{url}</p>
      </div>
    </a>
  );
}
