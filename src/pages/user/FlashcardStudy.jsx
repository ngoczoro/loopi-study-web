import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlashcards } from "@/hooks/useFlashcards";
import { isDue, scheduleReview } from "@/lib/flashcards/schedule";

const RATINGS = [
  { id: "again", label: "Again", hint: "Forgot", className: "bg-destructive/10 text-destructive hover:bg-destructive/15" },
  { id: "hard", label: "Hard", hint: "Struggled", className: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25" },
  { id: "good", label: "Good", hint: "Remembered", className: "bg-primary/10 text-primary hover:bg-primary/15" },
  { id: "easy", label: "Easy", hint: "Instant", className: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" },
];

function dueQueue(cards, deckId) {
  return cards.filter((card) => card.deckId === deckId && isDue(card)).map((card) => card.id);
}

export default function FlashcardStudy() {
  const { deckId } = useParams();
  const { decks, cards, updateCard } = useFlashcards();
  const deck = decks.find((item) => item.id === deckId) ?? null;
  const deckCards = cards.filter((card) => card.deckId === deckId);

  const [remaining, setRemaining] = useState(() => dueQueue(cards, deckId));
  const [queueDeckId, setQueueDeckId] = useState(deckId);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [reviewed, setReviewed] = useState(0);

  if (queueDeckId !== deckId) {
    setQueueDeckId(deckId);
    setRemaining(dueQueue(cards, deckId));
    setFlipped(false);
    setCounts({ again: 0, hard: 0, good: 0, easy: 0 });
    setReviewed(0);
  }

  const current = deck ? deckCards.find((card) => card.id === remaining[0]) ?? null : null;
  const finished = remaining.length === 0;

  const rate = (rating) => {
    if (!current) return;
    updateCard(current.id, scheduleReview(current, rating));
    setCounts((previous) => ({ ...previous, [rating]: previous[rating] + 1 }));
    setReviewed((value) => value + 1);
    setFlipped(false);
    setRemaining((queue) => {
      const [head, ...rest] = queue;
      if (rating === "again") return [...rest, head];
      return rest;
    });
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.key === " " || event.key === "Enter") {
        if (target instanceof HTMLButtonElement) return;
        event.preventDefault();
        if (current) setFlipped((value) => !value);
        return;
      }
      const index = Number(event.key) - 1;
      if (flipped && RATINGS[index]) rate(RATINGS[index].id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

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

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/flashcards/${deck.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {deck.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {finished ? "Done" : `${remaining.length} left`}
        </p>
      </div>

      {deckCards.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-soft text-center space-y-2">
          <p className="text-sm font-medium text-foreground">This deck has no cards</p>
          <Link to={`/flashcards/${deck.id}`} className="text-sm font-medium text-primary hover:underline">
            Add a card first
          </Link>
        </div>
      ) : finished ? (
        <div className="bg-card rounded-2xl p-8 shadow-soft text-center space-y-4">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">
              {reviewed === 0 ? "You're caught up" : "Session complete"}
            </p>
            <p className="text-sm text-muted-foreground">
              {reviewed === 0
                ? "Nothing is due right now. You can still review every card."
                : `You rated ${reviewed} card${reviewed === 1 ? "" : "s"}.`}
            </p>
          </div>
          {reviewed > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map((rating) => (
                <div key={rating.id} className="rounded-xl bg-secondary/70 px-2 py-3">
                  <p className="text-lg font-semibold text-foreground">{counts[rating.id]}</p>
                  <p className="text-[11px] text-muted-foreground">{rating.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRemaining(deckCards.map((card) => card.id));
                setCounts({ again: 0, hard: 0, good: 0, easy: 0 });
                setReviewed(0);
                setFlipped(false);
              }}
              className="h-9 px-4 rounded-full bg-secondary text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              Review all
            </button>
            <Link
              to={`/flashcards/${deck.id}`}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center"
            >
              Back to deck
            </Link>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="block w-full text-left [perspective:1200px]"
            aria-label={flipped ? "Show the front of the card" : "Flip the card"}
          >
            <span
              className={cn(
                "relative grid h-72 transition-transform duration-500 [transform-style:preserve-3d]",
                flipped && "[transform:rotateY(180deg)]",
              )}
            >
              <span className="col-start-1 row-start-1 flex items-center justify-center rounded-3xl bg-card p-8 text-center shadow-soft [backface-visibility:hidden]">
                <span>
                  <span className="mb-3 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Front
                  </span>
                  <span className="block text-xl font-semibold text-foreground">{current.front}</span>
                </span>
              </span>
              <span className="col-start-1 row-start-1 flex items-center justify-center rounded-3xl bg-primary/10 p-8 text-center shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span>
                  <span className="mb-3 block text-[11px] font-medium uppercase tracking-wide text-primary">
                    Back
                  </span>
                  <span className="block text-lg text-foreground">{current.back}</span>
                </span>
              </span>
            </span>
          </button>
          <p className="text-center text-xs text-muted-foreground">
            {flipped ? "Press 1–4 to rate" : "Click the card or press space to flip"}
          </p>
          {flipped && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RATINGS.map((rating) => (
                <button
                  key={rating.id}
                  type="button"
                  onClick={() => rate(rating.id)}
                  className={cn("rounded-2xl px-3 py-3 text-sm font-semibold", rating.className)}
                >
                  {rating.label}
                  <span className="mt-0.5 block text-[11px] font-medium opacity-70">{rating.hint}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
