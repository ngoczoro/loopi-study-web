import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { useSubjects } from "@/hooks/useSubjects";
import { useFlashcards } from "@/hooks/useFlashcards";
import { dueLabel, isDue } from "@/lib/flashcards/schedule";
import CardFormModal from "@/components/flashcards/CardFormModal";
import DeckFormModal from "@/components/flashcards/DeckFormModal";
import ImportNoteModal from "@/components/flashcards/ImportNoteModal";
import ConfirmActionDialog from "@/components/groups/ConfirmActionDialog";

export default function FlashcardDeck() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { subjects } = useSubjects();
  const { decks, cards, updateDeck, deleteDeck, createCard, createCards, updateCard, deleteCard } =
    useFlashcards();
  const content = useAppStore((state) => state.content);
  const fetchContent = useAppStore((state) => state.fetchContent);
  const deck = decks.find((item) => item.id === deckId) ?? null;
  const deckCards = cards.filter((card) => card.deckId === deckId);
  const dueCount = deckCards.filter((card) => isDue(card)).length;
  const notes = content.filter((item) => item.type === "note" && item.content);
  const source = content.find((item) => item.id === deck?.sourceContentId) ?? null;

  const [editingDeck, setEditingDeck] = useState(false);
  const [cardModal, setCardModal] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (content.length === 0) fetchContent();
  }, [content.length, fetchContent]);

  if (!deck) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-2">
        <p className="text-sm text-destructive">Deck not found</p>
        <Link to="/flashcards" className="text-sm font-medium text-primary hover:underline">
          Back to flashcards
        </Link>
      </div>
    );
  }

  const subjectName = subjects.find((subject) => subject.id === deck.subjectId)?.name;

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "deck") {
      deleteDeck(deck.id);
      toast.success("Deck deleted");
      navigate("/flashcards");
      return;
    }
    deleteCard(pendingDelete.card.id);
    toast.success("Card deleted");
    setPendingDelete(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            to="/flashcards"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Flashcards
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground truncate">{deck.title}</h1>
          <p className="text-xs text-muted-foreground">
            {subjectName || "No subject"}
            {" · "}
            {deckCards.length} card{deckCards.length === 1 ? "" : "s"}
            {dueCount > 0 ? ` · ${dueCount} due` : deckCards.length > 0 ? " · caught up" : ""}
          </p>
          {source && (
            <Link
              to="/notes"
              state={{ contentId: source.id }}
              className="inline-block text-xs font-medium text-primary hover:underline"
            >
              From note: {source.title || "Untitled note"}
            </Link>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditingDeck(true)}
            className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground inline-flex items-center justify-center hover:bg-secondary/80"
            aria-label="Edit deck"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPendingDelete({ kind: "deck" })}
            className="h-9 w-9 rounded-full bg-destructive/10 text-destructive inline-flex items-center justify-center hover:bg-destructive/15"
            aria-label="Delete deck"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/flashcards/${deck.id}/study`}
          className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center"
        >
          Study{dueCount > 0 ? ` ${dueCount} due` : ""}
        </Link>
        <button
          type="button"
          onClick={() => setCardModal({ card: null })}
          className="h-9 px-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New card
        </button>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="h-9 px-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80"
        >
          Add from note
        </button>
      </div>

      {deckCards.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-soft text-center text-sm text-muted-foreground">
          This deck is empty. Add a card or pull some from a note.
        </div>
      ) : (
        <ul className="space-y-2">
          {deckCards.map((card) => (
            <li key={card.id} className="bg-card rounded-2xl px-4 py-3 shadow-soft flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{card.front}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{card.back}</p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
                {dueLabel(card)}
              </span>
              <button
                type="button"
                onClick={() => setCardModal({ card })}
                aria-label="Edit card"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete({ kind: "card", card })}
                aria-label="Delete card"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editingDeck && (
        <DeckFormModal
          deck={deck}
          subjects={subjects}
          onClose={() => setEditingDeck(false)}
          onSubmit={(patch) => {
            updateDeck(deck.id, patch);
            toast.success("Deck updated");
            setEditingDeck(false);
          }}
        />
      )}
      {cardModal && (
        <CardFormModal
          key={cardModal.card?.id ?? "new"}
          card={cardModal.card}
          onClose={() => setCardModal(null)}
          onSubmit={(values) => {
            if (cardModal.card) {
              updateCard(cardModal.card.id, { ...values, updatedAt: new Date().toISOString() });
              toast.success("Card updated");
            } else {
              createCard(deck.id, values);
              toast.success("Card added");
            }
            setCardModal(null);
          }}
        />
      )}
      {importOpen && (
        <ImportNoteModal
          notes={notes}
          onClose={() => setImportOpen(false)}
          onImport={(drafts, sourceContentId) => {
            const created = createCards(deck.id, drafts);
            if (!deck.sourceContentId && sourceContentId) {
              updateDeck(deck.id, { sourceContentId });
            }
            toast.success(`Added ${created.length} card${created.length === 1 ? "" : "s"}`);
          }}
        />
      )}
      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title={pendingDelete?.kind === "deck" ? "Delete this deck?" : "Delete this card?"}
        description={
          pendingDelete?.kind === "deck"
            ? "The deck and every card in it will be removed from this device."
            : "This card will be removed from the deck."
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
