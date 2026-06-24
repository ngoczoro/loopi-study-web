import { useMemo, useState } from "react";
import {
  Flame,
  Target,
  Star,
  Lock,
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Pause,
  Play,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import loopyHappy from "@/assets/loopy-happy.png";
import { useProgressStreaks } from "@/hooks/queries/progress";
import { useAchievementBadges } from "@/hooks/queries/achievements";
import {
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
} from "@/hooks/queries/goals";
import { GOALS_BADGE_GRID, mergeGoalsBadgeGrid } from "@/lib/badgeDisplay";

const BADGE_ICONS = {
  first_focus_session: Star,
  "3_day_streak": Flame,
  seven_day_streak: Flame,
  ten_tasks_completed: Trophy,
  thirty_day_streak: Flame,
  five_subjects: Target,
};

const UNIT_OPTIONS = [
  { value: "hrs", label: "Hours studied" },
  { value: "min", label: "Minutes studied" },
  { value: "tasks", label: "Tasks completed" },
  { value: "chapters", label: "Chapters (manual)" },
];

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const EMPTY_FORM = {
  title: "",
  targetValue: 1,
  unit: "hrs",
  period: "weekly",
};

function formatGoalUnit(unit) {
  if (unit === "hrs") return "hrs";
  if (unit === "min") return "min";
  if (unit === "tasks") return "tasks";
  if (unit === "chapters") return "chapters";
  return unit ?? "";
}

/** API returns focus progress/target in seconds for hrs/min goals. */
function formatGoalAmount(value, unit) {
  const amount = Number(value ?? 0);
  if (unit === "hrs") return Number((amount / 3600).toFixed(1));
  if (unit === "min") return Math.round(amount / 60);
  return amount;
}

function formatGoalProgressLine(goal) {
  const unit = goal.unit;
  const targetDisplay =
    unit === "hrs" || unit === "min"
      ? (goal.targetValue ?? formatGoalAmount(goal.target, unit))
      : (goal.targetValue ?? goal.target ?? 0);

  return `${formatGoalAmount(goal.progress, unit)} / ${targetDisplay} ${formatGoalUnit(unit)}`;
}

export default function Goals() {
  const { goals, isLoading: goalsLoading } = useGoals();
  const { data: streak, isLoading: streakLoading } = useProgressStreaks();
  const { badges: apiBadges, isLoading: badgesLoading } = useAchievementBadges();
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loading = goalsLoading || streakLoading;

  const sortedGoals = useMemo(
    () =>
      [...goals].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return (b.percentComplete ?? 0) - (a.percentComplete ?? 0);
      }),
    [goals],
  );

  const gridBadges = useMemo(
    () => mergeGoalsBadgeGrid(GOALS_BADGE_GRID, apiBadges),
    [apiBadges],
  );

  const openCreateForm = () => {
    setEditingGoal(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title ?? "",
      targetValue: goal.targetValue ?? 1,
      unit: goal.unit ?? "hrs",
      period: goal.period ?? "weekly",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmitGoal = async () => {
    if (!form.title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    const targetValue = Number(form.targetValue);
    if (!targetValue || targetValue <= 0) {
      toast.error("Target must be greater than 0");
      return;
    }

    const payload = {
      title: form.title.trim(),
      targetValue,
      unit: form.unit,
      period: form.period,
    };

    try {
      if (editingGoal) {
        await updateMutation.mutateAsync({
          id: editingGoal.id,
          payload,
        });
        toast.success("Goal updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Goal created");
      }
      closeForm();
    } catch (error) {
      toast.error(error.message || "Failed to save goal");
    }
  };

  const handleToggleActive = async (goal) => {
    try {
      await updateMutation.mutateAsync({
        id: goal.id,
        payload: { active: !goal.active },
      });
      toast.success(goal.active ? "Goal paused" : "Goal resumed");
    } catch (error) {
      toast.error(error.message || "Failed to update goal");
    }
  };

  const handleDeleteGoal = async (goal) => {
    try {
      await deleteMutation.mutateAsync(goal.id);
      toast.success("Goal deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete goal");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Goals & Streak
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay motivated and earn rewards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateForm}
            className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:scale-[1.01] transition-transform"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </button>
          <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft">
            <Flame className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <span className="text-lg font-bold text-foreground">
              {loading ? "…" : streak?.currentStreak ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {goalsLoading ? (
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <p className="text-sm text-muted-foreground">Loading goals…</p>
          </div>
        ) : sortedGoals.length === 0 ? (
          <div className="bg-card rounded-2xl p-4 shadow-soft sm:col-span-2">
            <p className="text-sm text-muted-foreground">
              No goals yet. Create one to track your progress.
            </p>
          </div>
        ) : (
          sortedGoals.map((goal) => (
            <div
              key={goal.id}
              className={`bg-card rounded-2xl p-4 shadow-soft ${
                !goal.active ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {goal.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {goal.period} · {formatGoalUnit(goal.unit)}
                    {!goal.active ? " · paused" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditForm(goal)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary"
                    title="Edit goal"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(goal)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary"
                    title={goal.active ? "Pause goal" : "Resume goal"}
                  >
                    {goal.active ? (
                      <Pause className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10"
                    title="Delete goal"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{
                    width: `${Math.min(100, goal.percentComplete ?? 0)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatGoalProgressLine(goal)} · {goal.percentComplete}% · {goal.status}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          Badges & Rewards
        </h2>

        {badgesLoading ? (
          <p className="text-sm text-muted-foreground mb-4">Loading badges…</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {gridBadges.map((badge, i) => {
              const Icon = BADGE_ICONS[badge.code] ?? Star;
              return (
                <motion.div
                  key={badge.code}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                    badge.unlocked
                      ? "bg-primary/10"
                      : "bg-secondary/50 opacity-50"
                  }`}
                  title={
                    badge.unlocked
                      ? `Unlocked${badge.earnedAt ? ` · ${new Date(badge.earnedAt).toLocaleDateString()}` : ""}`
                      : "Locked — keep going!"
                  }
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      badge.unlocked ? "bg-primary/20" : "bg-secondary"
                    }`}
                  >
                    {badge.unlocked ? (
                      <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    ) : (
                      <Lock
                        className="h-4 w-4 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-center text-foreground leading-tight">
                    {badge.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-soft">
        <img src={loopyHappy} alt="Loopy" className="w-10 h-10" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Loopy says:</span> "
          {loading
            ? "Keep going — your progress is loading!"
            : streak?.todayQualifies
              ? "Amazing! You’ve already qualified for today’s streak. 🔥"
              : "You're doing great! Keep that streak going! 🔥"}
          "
        </p>
      </div>

      {showForm ? (
        <GoalFormModal
          form={form}
          setForm={setForm}
          editing={Boolean(editingGoal)}
          saving={createMutation.isPending || updateMutation.isPending}
          onClose={closeForm}
          onSubmit={handleSubmitGoal}
        />
      ) : null}
    </div>
  );
}

function GoalFormModal({ form, setForm, editing, saving, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-card rounded-2xl p-6 shadow-soft w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-foreground">
            {editing ? "Edit Goal" : "New Goal"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Title
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full mt-1 h-10 rounded-xl bg-background border border-border px-3 text-sm"
            placeholder="e.g. Study 10 hours this week"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Target
          </label>
          <input
            type="number"
            min={1}
            step={0.5}
            value={form.targetValue}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, targetValue: e.target.value }))
            }
            className="w-full mt-1 h-10 rounded-xl bg-background border border-border px-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Unit
            </label>
            <select
              value={form.unit}
              onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
              className="w-full mt-1 h-10 rounded-xl bg-background border border-border px-3 text-sm"
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Period
            </label>
            <select
              value={form.period}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, period: e.target.value }))
              }
              className="w-full mt-1 h-10 rounded-xl bg-background border border-border px-3 text-sm"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={onSubmit}
          className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : editing ? "Save Changes" : "Create Goal"}
        </button>
      </div>
    </div>
  );
}
