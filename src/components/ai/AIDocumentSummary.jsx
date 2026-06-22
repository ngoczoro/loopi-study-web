"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";
import {
  generateDocumentSummary,
  getDocumentSummary,
  isAiSummarySupported,
} from "@/services/aiService";

const formatGeneratedAt = (value) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
};

export default function AIDocumentSummary({ documentId, documentTitle, document }) {
  const supported = isAiSummarySupported(document ?? { id: documentId });
  const [summary, setSummary] = useState(null);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  const loadCachedSummary = useCallback(async () => {
    if (!documentId || !supported) {
      setSummary(null);
      return;
    }

    setLoadingFetch(true);
    const result = await getDocumentSummary(documentId);
    setLoadingFetch(false);

    if (result.success) {
      setSummary(result.data);
      return;
    }

    if (result.notFound) {
      setSummary(null);
      return;
    }

    toast.error(result.message || "Could not load AI summary");
  }, [documentId, supported]);

  useEffect(() => {
    loadCachedSummary();
  }, [loadCachedSummary]);

  const handleGenerate = async (forceRegenerate = false) => {
    if (!documentId || loadingGenerate) return;

    setLoadingGenerate(true);
    const result = await generateDocumentSummary(documentId, forceRegenerate);
    setLoadingGenerate(false);
    setRegenerateOpen(false);

    if (result.success) {
      setSummary(result.data);
      toast.success(
        forceRegenerate ? "AI summary regenerated" : "AI summary is ready",
      );
      return;
    }

    toast.error(result.message || "Could not generate AI summary");
  };

  if (!documentId) return null;

  if (!supported) {
    return (
      <div className="mt-4 rounded-2xl border border-border/50 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-foreground">AI Summary</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This document type does not support AI summary yet.
        </p>
      </div>
    );
  }

  const isBusy = loadingFetch || loadingGenerate;

  return (
    <div className="mt-4 rounded-2xl border border-border/50 bg-secondary/20 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
          AI Summary
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Summarize this document into key points and study notes
          {documentTitle ? `: ${documentTitle}` : ""}.
        </p>
      </div>

      {loadingFetch ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : summary ? (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
              Summary
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {summary.summary}
            </p>
          </div>

          {summary.keyPoints?.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                Key points
              </p>
              <ul className="space-y-1.5 text-sm text-foreground list-disc pl-5">
                {summary.keyPoints.map((point, index) => (
                  <li key={`${point}-${index}`}>{point}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.learningNotes?.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                Study notes
              </p>
              <ul className="space-y-1.5 text-sm text-foreground list-disc pl-5">
                {summary.learningNotes.map((note, index) => (
                  <li key={`${note}-${index}`}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.keywords?.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                Keywords
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.keywords.map((keyword, index) => (
                  <span
                    key={`${keyword}-${index}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/40">
            <p>Generated: {formatGeneratedAt(summary.generatedAt)}</p>
            {summary.model ? <p>Model: {summary.model}</p> : null}
          </div>

          <button
            type="button"
            onClick={() => setRegenerateOpen(true)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {loadingGenerate ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating summary...
              </>
            ) : (
              "Regenerate summary"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No summary generated yet.</p>
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loadingGenerate ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating summary...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate AI Summary
              </>
            )}
          </button>
        </div>
      )}

      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate AI summary?</AlertDialogTitle>
            <AlertDialogDescription>
              This will call AI again and may use additional credits. Do you want
              to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={loadingGenerate}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleGenerate(true)}
              disabled={loadingGenerate}
              className="rounded-full"
            >
              {loadingGenerate ? "Generating..." : "Regenerate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
