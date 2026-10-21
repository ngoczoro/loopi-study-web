import { useState } from "react";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "@/components/groups/GroupModalShell";

const fieldClassName = `${groupInputClassName} w-full`;

export default function CardFormModal({ card, onClose, onSubmit }) {
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!front.trim() || !back.trim()) return;
    onSubmit({ front: front.trim(), back: back.trim() });
  };

  return (
    <GroupModalShell
      open
      title={card ? "Edit card" : "New card"}
      description="The front is the prompt. The back is what you want to recall."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Front</span>
          <textarea
            value={front}
            onChange={(event) => setFront(event.target.value)}
            required
            rows={3}
            maxLength={500}
            placeholder="What is a foreign key?"
            className={`${fieldClassName} resize-none py-2`}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Back</span>
          <textarea
            value={back}
            onChange={(event) => setBack(event.target.value)}
            required
            rows={4}
            maxLength={2000}
            placeholder="A key that points at a row in another table."
            className={`${fieldClassName} resize-none py-2`}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={groupSecondaryButtonClassName}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!front.trim() || !back.trim()}
            className={groupPrimaryButtonClassName}
          >
            {card ? "Save" : "Add card"}
          </button>
        </div>
      </form>
    </GroupModalShell>
  );
}
