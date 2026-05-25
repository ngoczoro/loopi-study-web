/**
 * Returns ISO date string (YYYY-MM-DD) for the Monday of the week containing `date`.
 */
export const getWeekStartDate = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};
