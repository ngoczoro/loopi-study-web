import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "@/components/groups/GroupModalShell";
import { useFlashcards } from "@/hooks/useFlashcards";
import { generateDocumentFlashcards } from "@/services/aiService";
import { useGenerationCounter } from "@/hooks/useGenerationCounter";

const CARD_COUNTS = [5, 10, 15, 20];

export default function AIFlashcardGenerator({
  open,
  note,
  onOpenChange,
  onCreated,
}) {
  const navigate = useNavigate();
  const { createDeck, createCards, deleteDeck } = useFlashcards();
  const [numberOfCards, setNumberOfCards] = useState(5);
  const [loading, setLoading] = useState(false);
  // Counts generated cards up while the server works ("Generating card 3/5"…).
  const counter = useGenerationCounter("cards");
  const [drafts, setDrafts] = useState(null);

  const close = () => {
    if (loading) return;
    setDrafts(null);
    setNumberOfCards(5);
    onOpenChange(false);
  };

  const generate = async () => {
    if (!note?.id || loading) return;
    setLoading(true);
    counter.start(numberOfCards);
    const result = await generateDocumentFlashcards(note.id, {
      numberOfCards,
      onProgress: counter.update,
    });

    const cards = Array.isArray(result.data?.cards) ? result.data.cards : [];
    if (!result.success || cards.length === 0) {
      counter.reset();
      setLoading(false);
      toast.error(
        (!result.success && result.message) ||
          "Could not create flashcards from this note. Please try again later.",
      );
      return;
    }
    // Let the count reach the number of cards before the drafts replace it.
    await counter.finish(cards.length);
    counter.reset();
    setLoading(false);

    setDrafts(
      cards.map((card, index) => ({
        key: `${note.id}-${index}`,
        front: card.front ?? "",
        back: card.back ?? "",
        included: true,
      })),
    );
  };

  const selectedCount =
    drafts?.filter((draft) => draft.included && draft.front.trim() && draft.back.trim())
      .length ?? 0;

  const save = () => {
    if (!note || !drafts || selectedCount === 0) return;
    const cards = drafts
      .filter((draft) => draft.included)
      .map(({ front, back }) => ({ front, back }));
    const deck = createDeck({
      title: note.title?.trim() || "Untitled deck",
      subjectId: note.subjectId ?? null,
      sourceContentId: note.id,
    });
    const created = createCards(deck.id, cards);
    if (created.length === 0) {
      deleteDeck(deck.id);
      toast.error("Add a front and a back before saving.");
      return;
    }
    toast.success(`Created "${deck.title}"`);
    setDrafts(null);
    setNumberOfCards(5);
    onOpenChange(false);
    onCreated?.(deck);
    navigate(`/flashcards/${deck.id}`);
  };

  if (!open || !note) return null;

  return (
    <GroupModalShell
      open
      busy={loading}
      title="Create flashcards"
      description={
        drafts
          ? "Review the cards, then save the ones you want."
          : "Drafts cards from this document. You can edit them before saving."
      }
      onClose={close}
    >
      <p className="mb-4 truncate text-xs text-muted-foreground">
        {note.title || "Untitled note"}
      </p>

      {drafts ? (
        <div className="space-y-4">
          {drafts.length < numberOfCards && (
            <p className="text-xs text-muted-foreground">
              This note produced {drafts.length} card{drafts.length === 1 ? "" : "s"}.
            </p>
          )}
          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {drafts.map((draft, index) => (
              <li key={draft.key} className="space-y-2 rounded-xl border border-border p-3">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draft.included}
                    onChange={(event) =>
                      setDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, included: event.target.checked }
                            : item,
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDrafts(null)}
              className={groupSecondaryButtonClassName}
            >
              Back
            </button>
            <button
              type="button"
              onClick={save}
              disabled={selectedCount === 0}
              className={groupPrimaryButtonClassName}
            >
              Save {selectedCount === 0 ? "cards" : `${selectedCount} card${selectedCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Number of cards</span>
            <select
              value={numberOfCards}
              onChange={(event) => setNumberOfCards(Number(event.target.value))}
              disabled={loading}
              className={`${groupInputClassName} h-10 w-full`}
            >
              {CARD_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count} cards
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={close} className={groupSecondaryButtonClassName}>
              Cancel
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className={groupPrimaryButtonClassName}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
              {loading
                ? counter.label || "Creating cards..."
                : "Create flashcards"}
            </button>
          </div>
        </div>
      )}
    </GroupModalShell>
  );
}
