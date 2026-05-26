import { useMemo } from "react";
import { Flame, Target, Star, Lock, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import loopyHappy from "@/assets/loopy-happy.png";
import { useProgressSummary, useProgressStreaks } from "@/hooks/queries/progress";
import { useAchievementBadges } from "@/hooks/queries/achievements";
import { GOALS_BADGE_GRID, mergeGoalsBadgeGrid } from "@/lib/badgeDisplay";

const BADGE_ICONS = {
  first_focus_session: Star,
  "3_day_streak": Flame,
  seven_day_streak: Flame,
  ten_tasks_completed: Trophy,
  thirty_day_streak: Flame,
  five_subjects: Target,
};

export default function Goals() {
  const { data: progress, isLoading } = useProgressSummary();
  const { data: streak, isLoading: streakLoading } = useProgressStreaks();
  const { badges: apiBadges, isLoading: badgesLoading } = useAchievementBadges();

  const loading = isLoading || streakLoading;
  const goals = progress?.goals?.active ?? [];

  const gridBadges = useMemo(
    () => mergeGoalsBadgeGrid(GOALS_BADGE_GRID, apiBadges),
    [apiBadges],
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Goals & Streak
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay motivated and earn rewards
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft">
          <Flame className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <span className="text-lg font-bold text-foreground">
            {loading ? "…" : streak?.currentStreak ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {loading ? (
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <p className="text-sm text-muted-foreground">Loading goals…</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <p className="text-sm text-muted-foreground">No active goals yet.</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="bg-card rounded-2xl p-4 shadow-soft">
              <p className="text-sm font-medium text-foreground mb-2">
                {goal.title}
              </p>
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{
                    width: `${Math.min(100, goal.percentComplete ?? 0)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {goal.progress} / {goal.target} · {goal.percentComplete}% ·{" "}
                {goal.status}
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
    </div>
  );
}
