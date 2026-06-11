import { toast } from "sonner";
import { Upload } from "lucide-react";
import {
  FILE_INPUT_ACCEPT,
  handleUploadFileSelection,
  validateUploadFile,
} from "@/lib/content-utils";

/**
 * @param {{
 *   fileDocuments: Array<{ id: string, title: string, fileName?: string|null, subjectId?: string|null }>,
 *   selectedDocumentId?: string|null,
 *   uploading?: boolean,
 *   onSelectDocument: (documentId: string) => void,
 *   onUploadFile: (file: File) => void,
 *   onContinue: () => void,
 *   onBack?: () => void,
 * }} props
 */
export default function DocumentUploadStep({
  fileDocuments,
  selectedDocumentId,
  uploading = false,
  onSelectDocument,
  onUploadFile,
  onContinue,
  onBack,
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-secondary/40 p-3 space-y-2 max-h-48 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
          Your uploaded files
        </p>
        {fileDocuments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No files uploaded yet.</p>
        ) : (
          fileDocuments.map((doc) => (
            <label
              key={doc.id}
              className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-secondary/60 cursor-pointer"
            >
              <input
                type="radio"
                name="document"
                checked={selectedDocumentId === doc.id}
                onChange={() => onSelectDocument(doc.id)}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {doc.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {doc.fileName || "Uploaded file"}
                </p>
              </div>
            </label>
          ))
        )}
      </div>

      <label className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload new file"}
        <input
          type="file"
          className="hidden"
          accept={FILE_INPUT_ACCEPT}
          disabled={uploading}
          onChange={(e) => {
            handleUploadFileSelection(e.target.files, {
              setSelectedFile: (file) => {
                const check = validateUploadFile(file);
                if (!check.ok) return;
                onUploadFile(file);
              },
              clearInput: () => {
                e.target.value = "";
              },
              toastError: (message) => toast.error(message),
            });
          }}
        />
      </label>

      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedDocumentId || uploading}
          className="ml-auto h-10 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          Analyze document
        </button>
      </div>
    </div>
  );
}
