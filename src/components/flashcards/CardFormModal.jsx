import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "@/components/groups/GroupModalShell";
import { playAudio, stopAudio } from "@/lib/flashcards/playAudio";
import { suggestPronunciations, uploadFlashcardImage } from "@/services/flashcardMedia";

const fieldClassName = `${groupInputClassName} w-full`;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export default function CardFormModal({ card, vocabulary = false, onClose, onSubmit }) {
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [phonetic, setPhonetic] = useState(card?.phonetic ?? "");
  const [audioUrl, setAudioUrl] = useState(card?.audioUrl ?? null);
  const [attachedFront, setAttachedFront] = useState(card?.front ?? "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(card?.imageUrl ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => stopAudio(), []);

  useEffect(() => {
    if (!vocabulary) return undefined;
    const text = front.trim();
    if (!/[a-z]/i.test(text)) {
      setSuggestions([]);
      setLookupError("");
      setLookingUp(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLookingUp(true);
      const result = await suggestPronunciations(text, { signal: controller.signal });
      if (controller.signal.aborted || result.canceled) return;
      setLookingUp(false);
      if (!result.success) {
        setSuggestions([]);
        setLookupError(result.message);
        return;
      }
      setLookupError("");
      setSuggestions(result.data?.suggestions ?? []);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [front, vocabulary]);

  const handleFront = (value) => {
    setFront(value);
    if (value.trim().toLowerCase() !== attachedFront.trim().toLowerCase()) {
      setPhonetic("");
      setAudioUrl(null);
    }
  };

  const useSuggestion = (suggestion) => {
    setPhonetic(suggestion.phonetic);
    setAudioUrl(suggestion.audioUrl);
    setAttachedFront(front);
  };

  const handleImage = (event) => {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      toast.error("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (next.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }
    setFile(next);
    setRemoveImage(false);
    setPreview(URL.createObjectURL(next));
  };

  const clearImage = () => {
    setFile(null);
    setPreview(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!front.trim() || !back.trim() || busy) return;
    setBusy(true);
    try {
      let imageUrl = removeImage ? null : card?.imageUrl ?? null;
      if (file) {
        const uploaded = await uploadFlashcardImage(file);
        if (!uploaded.success) {
          toast.error(uploaded.message);
          return;
        }
        imageUrl = uploaded.data.url;
      }

      const payload = { front: front.trim(), back: back.trim(), imageUrl };
      if (vocabulary) {
        const spoken = phonetic.trim();
        payload.phonetic = spoken || null;
        payload.phoneticLang = spoken ? "en" : null;
        payload.audioUrl = spoken ? audioUrl : null;
        payload.audioLang = spoken && audioUrl ? "en" : null;
      }
      onSubmit(payload);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GroupModalShell
      open
      title={card ? "Edit card" : "New card"}
      description={
        vocabulary
          ? "The front is the word. Add a picture, pronunciation, and the meaning on the back."
          : "The front is the prompt. The back is what you want to recall."
      }
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Picture <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          {preview ? (
            <div className="flex items-center gap-3">
              <img src={preview} alt="" className="h-16 w-16 rounded-xl object-cover bg-secondary" />
              <button
                type="button"
                onClick={clearImage}
                className="h-8 px-3 rounded-full bg-secondary text-xs font-medium text-secondary-foreground inline-flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          ) : (
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
              <ImagePlus className="h-4 w-4" />
              Add image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleImage}
              />
            </label>
          )}
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Front</span>
          <textarea
            value={front}
            onChange={(event) => handleFront(event.target.value)}
            required
            rows={3}
            maxLength={500}
            placeholder={vocabulary ? "apple" : "What is a foreign key?"}
            className={`${fieldClassName} resize-none py-2`}
          />
        </label>
        {vocabulary && (
          <div className="space-y-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Pronunciation <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input
                value={phonetic}
                onChange={(event) => setPhonetic(event.target.value)}
                maxLength={80}
                placeholder="/ˈæ.pəl/"
                className={`${fieldClassName} h-10 font-mono`}
              />
            </label>
            {lookingUp && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Looking up pronunciation…
              </p>
            )}
            {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
            {suggestions.length > 0 && (
              <ul className="space-y-1.5">
                {suggestions.map((suggestion) => {
                  const selected = suggestion.phonetic === phonetic && suggestion.audioUrl === audioUrl;
                  return (
                    <li
                      key={suggestion.phonetic}
                      className="flex items-center gap-2 rounded-xl bg-secondary/70 px-2 py-1.5"
                    >
                      <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
                        {suggestion.phonetic}
                      </span>
                      <button
                        type="button"
                        onClick={() => playAudio(suggestion.audioUrl)}
                        className="h-7 px-2 rounded-full text-xs font-medium text-foreground hover:bg-background inline-flex items-center gap-1"
                        aria-label={`Play ${suggestion.phonetic}`}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Play
                      </button>
                      <button
                        type="button"
                        onClick={() => useSuggestion(suggestion)}
                        className="h-7 px-2 rounded-full bg-background text-xs font-medium text-foreground hover:bg-background/80"
                      >
                        {selected ? "Using" : "Use"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {(phonetic || audioUrl) && (
              <button
                type="button"
                onClick={() => {
                  setPhonetic("");
                  setAudioUrl(null);
                  setAttachedFront("");
                }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Clear pronunciation
              </button>
            )}
          </div>
        )}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Back</span>
          <textarea
            value={back}
            onChange={(event) => setBack(event.target.value)}
            required
            rows={4}
            maxLength={2000}
            placeholder={vocabulary ? "a round fruit" : "A key that points at a row in another table."}
            className={`${fieldClassName} resize-none py-2`}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={groupSecondaryButtonClassName}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!front.trim() || !back.trim() || busy}
            className={groupPrimaryButtonClassName}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {card ? "Save" : "Add card"}
          </button>
        </div>
      </form>
    </GroupModalShell>
  );
}
