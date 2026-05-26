/**
 * Goals page badge grid — display names must match mockup;
 * `code` must match `learning_app.badges.code` / user_badges unlock rows.
 */
export const GOALS_BADGE_GRID = [
  { name: "First Session", code: "first_focus_session" },
  { name: "3-Day Streak", code: "3_day_streak" },
  { name: "7-Day Streak", code: "seven_day_streak" },
  { name: "10 Tasks Done", code: "ten_tasks_completed" },
  { name: "30-Day Streak", code: "thirty_day_streak" },
  { name: "Subject Master", code: "five_subjects" },
];

/** Locked-by-default codes for milestone demo (seeder leaves these out of user_badges). */
export const DEMO_LOCKED_BADGE_CODES = new Set([
  "thirty_day_streak",
  "five_subjects",
]);

/**
 * @param {typeof GOALS_BADGE_GRID} catalog
 * @param {Array<{ code: string, unlocked?: boolean, earnedAt?: string | null, name?: string }>} apiBadges
 */
export function mergeGoalsBadgeGrid(catalog, apiBadges = []) {
  const byCode = new Map(apiBadges.map((b) => [b.code, b]));

  return catalog.map((def) => {
    const fromApi = byCode.get(def.code);
    return {
      ...def,
      name: fromApi?.name ?? def.name,
      unlocked: fromApi?.unlocked === true,
      earnedAt: fromApi?.earnedAt ?? null,
    };
  });
}
