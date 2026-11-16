import { getAuthUser } from "@/lib/authSession";

const PREFIX = "loopi_flashcards:";
const EMPTY = { decks: [], cards: [] };

let cache = { key: "", data: EMPTY };
const listeners = new Set();

function storageKey() {
  const user = getAuthUser();
  return `${PREFIX}${user?.id ?? user?.userId ?? "guest"}`;
}

function nextId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalize(raw) {
  return {
    decks: Array.isArray(raw?.decks) ? raw.decks : [],
    cards: Array.isArray(raw?.cards) ? raw.cards : [],
  };
}

function load() {
  const key = storageKey();
  if (cache.key === key) return cache.data;
  let data = EMPTY;
  try {
    const raw = localStorage.getItem(key);
    if (raw) data = normalize(JSON.parse(raw));
  } catch {
    data = EMPTY;
  }
  cache = { key, data };
  return data;
}

function commit(next) {
  const key = storageKey();
  cache = { key, data: next };
  localStorage.setItem(key, JSON.stringify(next));
  listeners.forEach((listener) => listener());
  return next;
}

export function subscribeFlashcards(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === storageKey()) {
      cache = { key: "", data: EMPTY };
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getFlashcardsSnapshot() {
  return load();
}

export function getFlashcardsServerSnapshot() {
  return EMPTY;
}

export function isVocabularyDeck(deck) {
  return deck?.kind === "vocabulary";
}

export function createDeck({ title, subjectId = null, sourceContentId = null, kind = "general" }) {
  const now = new Date().toISOString();
  const deck = {
    id: nextId(),
    title: title.trim(),
    subjectId: subjectId || null,
    sourceContentId: sourceContentId || null,
    kind: kind === "vocabulary" ? "vocabulary" : "general",
    createdAt: now,
    updatedAt: now,
  };
  const current = load();
  commit({ ...current, decks: [deck, ...current.decks] });
  return deck;
}

export function updateDeck(deckId, patch) {
  const current = load();
  const decks = current.decks.map((deck) =>
    deck.id === deckId
      ? {
          ...deck,
          ...patch,
          title: patch.title !== undefined ? patch.title.trim() : deck.title,
          subjectId: patch.subjectId !== undefined ? patch.subjectId || null : deck.subjectId,
          kind:
            patch.kind === "vocabulary" || patch.kind === "general"
              ? patch.kind
              : deck.kind === "vocabulary"
                ? "vocabulary"
                : "general",
          updatedAt: new Date().toISOString(),
        }
      : deck,
  );
  commit({ ...current, decks });
}

export function deleteDeck(deckId) {
  const current = load();
  commit({
    decks: current.decks.filter((deck) => deck.id !== deckId),
    cards: current.cards.filter((card) => card.deckId !== deckId),
  });
}

function cardMedia(input) {
  const phonetic = input.phonetic?.trim() || null;
  const audioUrl = phonetic ? input.audioUrl || null : null;
  return {
    imageUrl: input.imageUrl || null,
    phonetic,
    phoneticLang: phonetic ? input.phoneticLang || "en" : null,
    audioUrl,
    audioLang: audioUrl ? input.audioLang || "en" : null,
  };
}

export function createCard(deckId, input) {
  const now = new Date().toISOString();
  const card = {
    id: nextId(),
    deckId,
    front: input.front.trim(),
    back: input.back.trim(),
    ...cardMedia(input),
    dueAt: null,
    intervalDays: 0,
    ease: 2.5,
    repetitions: 0,
    lastRating: null,
    createdAt: now,
    updatedAt: now,
  };
  const current = load();
  commit({ ...current, cards: [card, ...current.cards] });
  return card;
}

export function createCards(deckId, drafts) {
  const now = new Date().toISOString();
  const cards = drafts
    .map((draft) => ({
      id: nextId(),
      deckId,
      front: draft.front.trim(),
      back: draft.back.trim(),
      ...cardMedia(draft),
      dueAt: null,
      intervalDays: 0,
      ease: 2.5,
      repetitions: 0,
      lastRating: null,
      createdAt: now,
      updatedAt: now,
    }))
    .filter((card) => card.front && card.back);
  if (cards.length === 0) return [];
  const current = load();
  commit({ ...current, cards: [...cards, ...current.cards] });
  return cards;
}

export function updateCard(cardId, patch) {
  const current = load();
  const cards = current.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card));
  commit({ ...current, cards });
}

export function deleteCard(cardId) {
  const current = load();
  commit({ ...current, cards: current.cards.filter((card) => card.id !== cardId) });
}
