import { useSyncExternalStore } from "react";
import {
  createCard,
  createCards,
  createDeck,
  deleteCard,
  deleteDeck,
  getFlashcardsServerSnapshot,
  getFlashcardsSnapshot,
  subscribeFlashcards,
  updateCard,
  updateDeck,
} from "@/lib/flashcards/storage";

export function useFlashcards() {
  const data = useSyncExternalStore(
    subscribeFlashcards,
    getFlashcardsSnapshot,
    getFlashcardsServerSnapshot,
  );

  return {
    decks: data.decks,
    cards: data.cards,
    createDeck,
    updateDeck,
    deleteDeck,
    createCard,
    createCards,
    updateCard,
    deleteCard,
  };
}
