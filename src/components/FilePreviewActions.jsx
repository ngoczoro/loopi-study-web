import { Download } from "lucide-react";
import { previewFile, downloadFile } from "@/utils/file-preview";

export function FilePreviewActions({ item }) {
  if (!item?.fileUrl) return null;

  if (item.previewable) {
    return (
      <button
        type="button"
        title="Preview file"
        onClick={() => previewFile(item)}
        className="text-sm text-primary hover:underline break-all text-left"
      >
        {item.fileName || "Open preview"}
      </button>
    );
  }

  if (item.previewNotSupported && item.downloadable) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Preview not supported yet</p>
        <button
          type="button"
          onClick={() => downloadFile(item)}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Download className="h-3.5 w-3.5" />
          Download file
        </button>
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">This file cannot be previewed.</p>
  );
}
