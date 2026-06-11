import { useState } from "react";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

/**
 * @param {{
 *   userDifficulty?: string|null,
 *   userHours?: number|null,
 *   aiDifficulty: string,
 *   aiHours: number,
 *   rationale?: string,
 *   onContinue: (choice: { source: "user"|"ai"|"custom", difficulty: string, hoursPerWeek: number, updateSubject: boolean }) => void,
 *   onBack?: () => void,
 * }} props
 */
export default function DifficultyChoiceForm({
  userDifficulty = "Medium",
  userHours = 4,
  aiDifficulty,
  aiHours,
  rationale,
  onContinue,
  onBack,
}) {
  const sameAsUser =
    userDifficulty === aiDifficulty &&
    Number(userHours) === Number(aiHours);

  const [choice, setChoice] = useState(
    sameAsUser ? "user" : "ai",
  );
  const [customDifficulty, setCustomDifficulty] = useState(aiDifficulty);
  const [customHours, setCustomHours] = useState(String(aiHours));
  const [updateSubject, setUpdateSubject] = useState(true);

  const resolved =
    choice === "user"
      ? { difficulty: userDifficulty || "Medium", hoursPerWeek: Number(userHours) || 4 }
      : choice === "ai"
        ? { difficulty: aiDifficulty, hoursPerWeek: aiHours }
        : {
            difficulty: customDifficulty,
            hoursPerWeek: parseFloat(customHours) || aiHours,
          };

  if (sameAsUser) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-secondary/40 p-4 text-sm text-muted-foreground">
          AI confirmed your current settings: {userDifficulty}, {userHours}h/week.
          {rationale ? ` ${rationale}` : ""}
        </div>
        <label className="flex items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={updateSubject}
            onChange={(e) => setUpdateSubject(e.target.checked)}
            className="rounded border-border"
          />
          Update subject with analyzed values
        </label>
        <div className="flex gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              onContinue({
                source: "user",
                difficulty: resolved.difficulty,
                hoursPerWeek: resolved.hoursPerWeek,
                updateSubject,
              })
            }
            className="ml-auto h-10 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-secondary/40 p-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
            Your settings
          </p>
          <p className="font-medium text-foreground">{userDifficulty || "Medium"}</p>
          <p className="text-muted-foreground">{userHours || 4}h/week</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
            AI suggestion
          </p>
          <p className="font-medium text-foreground">{aiDifficulty}</p>
          <p className="text-muted-foreground">{aiHours}h/week</p>
        </div>
      </div>

      {rationale && (
        <p className="text-xs text-muted-foreground leading-relaxed">{rationale}</p>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="difficulty-choice"
            checked={choice === "user"}
            onChange={() => setChoice("user")}
          />
          Keep my settings
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="difficulty-choice"
            checked={choice === "ai"}
            onChange={() => setChoice("ai")}
          />
          Use AI suggestion
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="difficulty-choice"
            checked={choice === "custom"}
            onChange={() => setChoice("custom")}
          />
          Choose manually
        </label>
      </div>

      {choice === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <select
            value={customDifficulty}
            onChange={(e) => setCustomDifficulty(e.target.value)}
            className="h-10 rounded-xl bg-secondary px-3 text-sm"
          >
            {DIFFICULTIES.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            max="40"
            step="0.5"
            value={customHours}
            onChange={(e) => setCustomHours(e.target.value)}
            className="h-10 rounded-xl bg-secondary px-3 text-sm"
            placeholder="Hours/week"
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={updateSubject}
          onChange={(e) => setUpdateSubject(e.target.checked)}
          className="rounded border-border"
        />
        Update subject with selected difficulty and hours
      </label>

      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            onContinue({
              source: choice,
              difficulty: resolved.difficulty,
              hoursPerWeek: resolved.hoursPerWeek,
              updateSubject,
            })
          }
          className="ml-auto h-10 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform"
        >
          Create schedule
        </button>
      </div>
    </div>
  );
}
