/**
 * @param {string} weekStartDate YYYY-MM-DD (Monday)
 * @param {number} dayOfWeek 0=Mon … 6=Sun
 * @param {number} startHour decimal hour
 */
const sessionToDate = (weekStartDate, dayOfWeek, startHour) => {
  const date = new Date(`${weekStartDate}T12:00:00`);
  date.setDate(date.getDate() + dayOfWeek);
  const hours = Math.floor(startHour);
  const minutes = Math.round((startHour % 1) * 60);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const pad = (value) => String(value).padStart(2, "0");

const formatICSDateTime = (date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;

const escapeICS = (text) =>
  String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

/**
 * @param {import("@/lib/study-plan/types").PlanSessionPreview[]} sessions
 * @param {{ calendarName?: string, filename?: string }} [options]
 */
export function exportPlanToICS(sessions, options = {}) {
  const calendarName = options.calendarName ?? "Loopi AI Study Plan";
  const filename = options.filename ?? "loopi-ai-study-plan.ics";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Loopi Study//AI Plan//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
  ];

  const timestamp = Date.now(); 

  sessions.forEach((session, index) => {
    const start = sessionToDate(
      session.weekStartDate,
      session.dayOfWeek,
      session.startHour,
    );
    const end = new Date(start.getTime() + session.durationHours * 60 * 60 * 1000);

    // Tạo chuỗi ngẫu nhiên ngắn để đảm bảo UID hoàn toàn duy nhất cho từng buổi học của mỗi tuần
    const uniqueSalt = Math.random().toString(36).substring(2, 7);

    lines.push("BEGIN:VEVENT");
    lines.push(
      `UID:ai-plan-${session.weekStartDate}-${session.dayOfWeek}-${index}-${timestamp}-${uniqueSalt}@loopi.study`,
    );
    lines.push(`DTSTART:${formatICSDateTime(start)}`);
    lines.push(`DTEND:${formatICSDateTime(end)}`);
    lines.push(`SUMMARY:${escapeICS(session.title)}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  const blob = new Blob([`${lines.join("\r\n")}\r\n`], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * @param {import("@/lib/study-plan/types").ReplacePreviewItem[]} replacePreview
 * @param {number} newSessionCount
 */
export function buildApplyConfirmMessage(replacePreview, newSessionCount) {
  const toReplace = replacePreview.filter((item) => item.countToReplace > 0);

  if (toReplace.length === 0) {
    return {
      title: "Apply study plan?",
      description: `This will add ${newSessionCount} AI Plan session(s) to your planner. Manual sessions and imported events won't change.`,
    };
  }

  if (toReplace.length === 1) {
    const item = toReplace[0];
    return {
      title: "Replace AI Plan sessions?",
      description: `This will replace ${item.countToReplace} AI Plan session(s) for ${item.subjectName}. Other subjects, manual sessions, and imported events won't change. ${newSessionCount} new session(s) will be added.`,
    };
  }

  const breakdown = toReplace
    .map((item) => `${item.subjectName}: ${item.countToReplace}`)
    .join(", ");
  const totalReplace = toReplace.reduce(
    (sum, item) => sum + item.countToReplace,
    0,
  );

  return {
    title: "Replace AI Plan sessions?",
    description: `This will replace ${totalReplace} AI Plan session(s) (${breakdown}). Manual sessions and imported events won't change. ${newSessionCount} new session(s) will be added.`,
  };
}

/**
 * @param {import("@/lib/study-plan/types").WeekPlan[]} weeks
 */
export function flattenPlanSessions(weeks) {
  return weeks.flatMap((week) => week.sessions);
}

/**
 * Strip preview-only fields before POST /apply.
 * @param {import("@/lib/study-plan/types").PlanSessionPreview[]} sessions
 */
export function toApplyPlanSessions(sessions) {
  return sessions.map((session) => ({
    subjectId: session.subjectId,
    title: session.title,
    dayOfWeek: session.dayOfWeek,
    startHour: session.startHour,
    durationHours: session.durationHours,
    weekStartDate: session.weekStartDate,
    ...(session.color != null && session.color !== ""
      ? { color: session.color }
      : {}),
  }));
}