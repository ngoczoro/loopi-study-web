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

export function createDeck({ title, subjectId = null, sourceContentId = null }) {
  const now = new Date().toISOString();
  const deck = {
    id: nextId(),
    title: title.trim(),
    subjectId: subjectId || null,
    sourceContentId: sourceContentId || null,
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

export function createCard(deckId, { front, back }) {
  const now = new Date().toISOString();
  const card = {
    id: nextId(),
    deckId,
    front: front.trim(),
    back: back.trim(),
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
