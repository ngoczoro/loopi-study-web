"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/button";
import { downloadFile, resolveFileExtension } from "@/utils/file-preview";
import {
  getAdminContentDetail,
  getAdminDocPreview,
  getAdminExcelPreview,
  getAdminTextPreview,
} from "@/services/adminDashboardService";
import { formatAdminUserDate } from "@/lib/adminUserUtils";

const typeLabel = {
  note: "Note",
  file: "File",
  link: "Link",
};

function AdminFilePreview({ item }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [activeSheet, setActiveSheet] = useState(0);

  const extension = resolveFileExtension(item);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
          setPreview({ kind: "image" });
        } else if (extension === "pdf") {
          setPreview({ kind: "pdf" });
        } else if (extension === "txt") {
          const data = await getAdminTextPreview(item.id);
          if (!cancelled) setPreview({ kind: "text", text: data.text });
        } else if (["doc", "docx"].includes(extension)) {
          const data = await getAdminDocPreview(item.id);
          if (!cancelled) setPreview({ kind: "html", html: data.html });
        } else if (["xls", "xlsx"].includes(extension)) {
          const data = await getAdminExcelPreview(item.id);
          if (!cancelled) setPreview({ kind: "excel", sheets: data.sheets ?? [] });
        } else {
          setPreview({ kind: "unsupported" });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Unable to load file preview.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [item, extension]);

  if (loading) {
    return <Skeleton className="h-[320px] w-full rounded-xl" />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border/50 p-6 text-center space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        {item.downloadable ? (
          <Button variant="outline" onClick={() => downloadFile(item)}>
            Download file
          </Button>
        ) : null}
      </div>
    );
  }

  if (preview?.kind === "image") {
    return (
      <div className="flex justify-center p-4 bg-muted/20 rounded-xl">
        <img
          src={item.fileUrl}
          alt={item.fileName || item.title}
          className="max-h-[60vh] max-w-full object-contain rounded-lg"
        />
      </div>
    );
  }

  if (preview?.kind === "pdf") {
    return (
      <iframe
        title={item.fileName || item.title}
        src={item.fileUrl}
        className="w-full h-[min(70vh,640px)] rounded-xl border border-border/50"
      />
    );
  }

  if (preview?.kind === "text") {
    return (
      <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
        {preview.text}
      </pre>
    );
  }

  if (preview?.kind === "html") {
    return (
      <div
        className="prose prose-sm max-w-none bg-muted/20 rounded-xl p-4 max-h-[60vh] overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: preview.html }}
      />
    );
  }

  if (preview?.kind === "excel") {
    const sheets = preview.sheets ?? [];
    const rows = sheets[activeSheet]?.rows ?? [];

    return (
      <div className="rounded-xl border border-border/50 overflow-hidden max-h-[60vh] flex flex-col">
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
        <div className="overflow-auto flex-1 p-4">
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
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 p-6 text-center space-y-3">
      <p className="text-sm text-muted-foreground">
        This file type cannot be previewed in the app.
      </p>
      {item.downloadable ? (
        <Button variant="outline" onClick={() => downloadFile(item)}>
          Download file
        </Button>
      ) : null}
    </div>
  );
}

export default function AdminContentPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getAdminContentDetail(id);
    setLoading(false);

    if (result.success) {
      setItem(result.data);
      return;
    }

    setError(result.message || "Failed to load content");
    toast.error(result.message || "Failed to load content");
  }, [id]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="bg-card rounded-2xl p-6 shadow-soft text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={loadContent}>Retry</Button>
        </div>
      ) : item ? (
        <div className="bg-card rounded-2xl p-5 shadow-soft space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                <FileText className="h-3 w-3" />
                {typeLabel[item.type] || item.type}
              </span>
              <span className="text-xs text-muted-foreground">
                Read-only moderation view
              </span>
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {item.title}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                Uploaded by{" "}
                <strong className="text-foreground">
                  {item.owner?.name || "Unknown"}
                </strong>
              </span>
              {item.owner?.email ? <span>{item.owner.email}</span> : null}
              <span>{formatAdminUserDate(item.createdAt)}</span>
            </div>
            {item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : null}
          </div>

          <div className="border-t border-border/50 pt-5">
            {item.type === "note" ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                {item.content}
              </div>
            ) : null}

            {item.type === "link" ? (
              <a
                href={item.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline break-all"
              >
                {item.content}
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            ) : null}

            {item.type === "file" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {item.fileName || "Uploaded file"}
                </p>
                <AdminFilePreview item={item} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
