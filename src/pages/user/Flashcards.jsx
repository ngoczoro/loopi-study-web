import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layers, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useSubjects } from "@/hooks/useSubjects";
import { useFlashcards } from "@/hooks/useFlashcards";
import { isDue } from "@/lib/flashcards/schedule";
import DeckFormModal from "@/components/flashcards/DeckFormModal";

export default function Flashcards() {
  const navigate = useNavigate();
  const { subjects } = useSubjects();
  const { decks, cards, createDeck } = useFlashcards();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const subjectName = (subjectId) =>
    subjects.find((subject) => subject.id === subjectId)?.name ?? "No subject";

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return decks.filter((deck) => {
      if (subjectFilter && deck.subjectId !== subjectFilter) return false;
      if (!keyword) return true;
      return deck.title.toLowerCase().includes(keyword);
    });
  }, [decks, search, subjectFilter]);

  const countsFor = (deckId) => {
    const mine = cards.filter((card) => card.deckId === deckId);
    return { total: mine.length, due: mine.filter((card) => isDue(card)).length };
  };

  const handleCreate = ({ title, subjectId }) => {
    const deck = createDeck({ title, subjectId });
    toast.success(`Created "${deck.title}"`);
    setCreating(false);
    navigate(`/flashcards/${deck.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Flashcards</h1>
          <p className="text-sm text-muted-foreground">
            Review a few cards at a time and mark how well you remembered them
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New deck
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search decks"
            className="w-full h-10 rounded-xl bg-card pl-9 pr-4 text-sm text-foreground border border-border shadow-soft outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.target.value)}
          className="h-10 rounded-xl bg-card px-3 text-sm text-foreground border border-border shadow-soft outline-none focus:ring-2 focus:ring-primary/20 sm:min-w-[180px]"
        >
          <option value="">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-soft text-center space-y-3">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {decks.length === 0 ? "No decks yet" : "No decks match that search"}
            </p>
            <p className="text-xs text-muted-foreground">
              {decks.length === 0
                ? "Create a deck, add cards, then study the ones that are due."
                : "Try a different name or subject."}
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((deck) => {
            const counts = countsFor(deck.id);
            return (
              <li key={deck.id} className="bg-card rounded-2xl p-4 shadow-soft space-y-3">
                <div className="space-y-1">
                  <Link to={`/flashcards/${deck.id}`} className="block text-base font-semibold text-foreground hover:text-primary">
                    {deck.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{subjectName(deck.subjectId)}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {counts.total} card{counts.total === 1 ? "" : "s"}
                    {counts.due > 0 ? ` · ${counts.due} due` : counts.total > 0 ? " · caught up" : ""}
                  </p>
                  <Link
                    to={`/flashcards/${deck.id}/study`}
                    className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 inline-flex items-center"
                  >
                    Study
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating && (
        <DeckFormModal
          subjects={subjects}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
