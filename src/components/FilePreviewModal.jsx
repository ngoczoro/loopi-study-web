import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileWarning,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilePreviewStore } from "@/lib/filePreviewStore";
import {
  getDocPreview,
  getExcelPreview,
  getTextPreview,
} from "@/services/contentService";
import { downloadFile, resolveFileExtension } from "@/utils/file-preview";
import { Skeleton } from "@/components/skeleton";
import { ScrollArea } from "@/components/scroll-area";
import { Button } from "@/components/button";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const PDF_EXTENSIONS = new Set(["pdf"]);
const DOC_EXTENSIONS = new Set(["doc", "docx"]);
const EXCEL_EXTENSIONS = new Set(["xls", "xlsx"]);
const TEXT_EXTENSIONS = new Set(["txt"]);
const UNSUPPORTED_EXTENSIONS = new Set(["ppt", "pptx"]);

function PreviewLoading() {
  return (
    <div className="flex flex-col gap-3 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[60vh] w-full" />
    </div>
  );
}

function PreviewError({ message, onDownload }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center min-h-[40vh]">
      <FileWarning className="h-12 w-12 text-destructive" />
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      {onDownload ? (
        <Button variant="outline" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download file
        </Button>
      ) : null}
    </div>
  );
}

function ImagePreview({ item }) {
  return (
    <div className="flex items-center justify-center p-4 md:p-8 min-h-[50vh] bg-muted/20">
      <img
        src={item.fileUrl}
        alt={item.fileName || "Image preview"}
        className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg"
      />
    </div>
  );
}

function TextPreviewPanel({ item }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getTextPreview(item.id)
      .then((data) => {
        if (!active) return;
        setText(data.text ?? "");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.data?.message || "Unable to load text preview.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item.id]);

  if (loading) return <PreviewLoading />;
  if (error) {
    return (
      <PreviewError message={error} onDownload={() => downloadFile(item)} />
    );
  }

  return (
    <ScrollArea className="h-[75vh] w-full">
      <pre className="p-6 text-sm font-mono whitespace-pre-wrap break-words text-foreground">
        {text}
      </pre>
    </ScrollArea>
  );
}

function DocPreviewPanel({ item }) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getDocPreview(item.id)
      .then((data) => {
        if (!active) return;
        setHtml(data.html ?? "");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.data?.message || "Unable to load document preview.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item.id]);

  if (loading) return <PreviewLoading />;
  if (error) {
    return (
      <PreviewError message={error} onDownload={() => downloadFile(item)} />
    );
  }

  return (
    <ScrollArea className="h-[75vh] w-full">
      <article
        className="prose prose-sm md:prose-base dark:prose-invert max-w-none p-6 md:p-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </ScrollArea>
  );
}

function ExcelPreviewPanel({ item }) {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getExcelPreview(item.id)
      .then((data) => {
        if (!active) return;
        setSheets(data.sheets ?? []);
        setActiveSheet(0);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.data?.message || "Unable to load spreadsheet preview.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item.id]);

  if (loading) return <PreviewLoading />;
  if (error) {
    return (
      <PreviewError message={error} onDownload={() => downloadFile(item)} />
    );
  }

  const rows = sheets[activeSheet]?.rows ?? [];

  return (
    <div className="flex flex-col h-[75vh]">
      {sheets.length > 1 ? (
        <div className="flex gap-2 p-3 border-b border-border overflow-x-auto">
          {sheets.map((sheet, index) => (
            <button
              key={sheet.name}
              type="button"
              onClick={() => setActiveSheet(index)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeSheet === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      ) : null}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <table className="w-full min-w-max border-collapse text-sm">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="border-b border-border/60">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="px-3 py-2 align-top border-r border-border/40 last:border-r-0"
                    >
                      {cell ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}

function PdfPreviewPanel({ item }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
    setPageNumber(1);
    setLoading(false);
    setError("");
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoading(false);
    setError("Unable to load PDF preview.");
  }, []);

  return (
    <div className="flex flex-col h-[75vh]">
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[80px] text-center">
            {numPages ? `${pageNumber} / ${numPages}` : "—"}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-muted/20">
        <div className="flex justify-center p-4 md:p-8 min-h-full">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-20">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading PDF...
            </div>
          ) : null}
          {error ? (
            <PreviewError
              message={error}
              onDownload={() => downloadFile(item)}
            />
          ) : (
            <Document
              file={item.fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-lg"
                renderTextLayer
                renderAnnotationLayer
              />
            </Document>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function UnsupportedPreviewPanel({ item }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center min-h-[40vh]">
      <FileWarning className="h-12 w-12 text-muted-foreground" />
      <div>
        <p className="text-base font-medium text-foreground">
          Preview not supported yet
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          This file type cannot be previewed in the app yet.
        </p>
      </div>
      <Button onClick={() => downloadFile(item)}>
        <Download className="h-4 w-4 mr-2" />
        Download file
      </Button>
    </div>
  );
}

function PreviewContent({ item }) {
  const extension = resolveFileExtension(item);

  if (UNSUPPORTED_EXTENSIONS.has(extension) || item.previewNotSupported) {
    return <UnsupportedPreviewPanel item={item} />;
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return <ImagePreview item={item} />;
  }

  if (TEXT_EXTENSIONS.has(extension)) {
    return <TextPreviewPanel item={item} />;
  }

  if (DOC_EXTENSIONS.has(extension)) {
    return <DocPreviewPanel item={item} />;
  }

  if (EXCEL_EXTENSIONS.has(extension)) {
    return <ExcelPreviewPanel item={item} />;
  }

  if (PDF_EXTENSIONS.has(extension)) {
    return <PdfPreviewPanel item={item} />;
  }

  return (
    <PreviewError
      message="This file cannot be previewed."
      onDownload={() => downloadFile(item)}
    />
  );
}

export function FilePreviewModal() {
  const { item, isOpen, closePreview } = useFilePreviewStore();

  const title = useMemo(
    () => item?.fileName || item?.title || "File preview",
    [item],
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closePreview()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-2 md:inset-6 z-[101] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
            <div className="min-w-0">
              <Dialog.Title className="text-sm md:text-base font-semibold truncate">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground truncate">
                In-app preview
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item?.downloadable ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(item)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              ) : null}
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {item ? <PreviewContent item={item} key={item.id} /> : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
