import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "@/components/groups/GroupModalShell";
import { draftCardsFromNote } from "@/lib/flashcards/draftFromNote";

function buildDrafts(note) {
  if (!note?.id) return [];
  return draftCardsFromNote(note.content ?? "").map((draft, index) => ({
    ...draft,
    key: `${note.id}-${index}`,
    included: true,
  }));
}

export default function ImportNoteModal({ notes, presetNote = null, onClose, onImport }) {
  const [noteId, setNoteId] = useState(presetNote?.id ?? "");
  const [drafts, setDrafts] = useState(() => buildDrafts(presetNote));

  const selected = notes.find((note) => note.id === noteId) ?? null;

  const loadDrafts = (nextId) => {
    setNoteId(nextId);
    const note = notes.find((item) => item.id === nextId);
    const next = draftCardsFromNote(note?.content ?? "").map((draft, index) => ({
      ...draft,
      key: `${nextId}-${index}`,
      included: true,
    }));
    setDrafts(next);
    if (nextId && next.length === 0) {
      toast.error("This note doesn't have pairs or paragraphs that can become cards.");
    }
  };

  const close = () => {
    setNoteId("");
    setDrafts([]);
    onClose();
  };

  const selectedCount = drafts.filter((draft) => draft.included && draft.front.trim() && draft.back.trim()).length;

  const preview = useMemo(() => drafts, [drafts]);

  const save = () => {
    const cards = preview
      .filter((draft) => draft.included)
      .map(({ front, back }) => ({ front, back }));
    if (cards.length === 0) return;
    onImport(cards, selected?.id ?? null);
    close();
  };

  return (
    <GroupModalShell
      open
      title={presetNote ? "Create flashcards" : "Add cards from a note"}
      description="Lines shaped like “Term: definition” become cards. Review them before saving."
      onClose={close}
    >
      <div className="space-y-4">
        {presetNote ? (
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">From </span>
            {presetNote.title || "Untitled note"}
          </p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don't have any notes yet.{" "}
            <Link to="/notes" className="font-medium text-primary hover:underline" onClick={close}>
              Create one
            </Link>
          </p>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Note</span>
            <select
              value={noteId}
              onChange={(event) => loadDrafts(event.target.value)}
              className={`${groupInputClassName} h-10 w-full`}
            >
              <option value="">Choose a note</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title || "Untitled note"}
                </option>
              ))}
            </select>
          </label>
        )}

        {preview.length > 0 && (
          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {preview.map((draft, index) => (
              <li key={draft.key} className="rounded-xl border border-border p-3 space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draft.included}
                    onChange={(event) =>
                      setDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, included: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  Include
                </label>
                <input
                  value={draft.front}
                  onChange={(event) =>
                    setDrafts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, front: event.target.value } : item,
                      ),
                    )
                  }
                  className={`${groupInputClassName} h-10 w-full`}
                />
                <textarea
                  value={draft.back}
                  rows={2}
                  onChange={(event) =>
                    setDrafts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, back: event.target.value } : item,
                      ),
                    )
                  }
                  className={`${groupInputClassName} w-full resize-none py-2`}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={close} className={groupSecondaryButtonClassName}>
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={selectedCount === 0}
            className={groupPrimaryButtonClassName}
          >
            Add {selectedCount === 0 ? "cards" : `${selectedCount} card${selectedCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </GroupModalShell>
  );
}
