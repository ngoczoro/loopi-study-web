import { useState, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  X,
  Sparkles,
  Play,
  Trash2,
  MoreVertical,
  Edit2,
} from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import loopyThinking from "@/assets/loopy-thinking.png";
import { useSubjects } from "@/hooks/useSubjects";
import { usePlannerWeek, usePlannerWeekCache } from "@/hooks/usePlannerWeek";
import {
  useBlockedSlotsQuery,
  useUserPreferencesQuery,
} from "@/hooks/queries/user";
import { getWeekStartDate } from "@/lib/plannerWeek";
import AiPlanWizard from "@/components/ai-plan/AiPlanWizard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";
import {
  clearAllPlannerSessions,
  createPlannerSession,
  deletePlannerSession,
  getPlannerSessions,
  updatePlannerSession,
} from "@/services/plannerService";
import { toast } from "sonner";

const hours = Array.from({ length: 24 }, (_, i) => i);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_MAX_STUDY_HOURS_PER_DAY = 4;
const SUGGEST_START_HOUR = 8;
const SUGGEST_END_HOUR = 20;

function getYYYYMMDDMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseICS(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT");
  
  for (const block of blocks.slice(1)) {
    const summary = block.match(/SUMMARY:(.*)/)?.[1]?.trim() || "Imported Event";
    const dtstartLine = block.match(/DTSTART.*:(.*)/)?.[1]?.trim();
    const dtendLine = block.match(/DTEND.*:(.*)/)?.[1]?.trim();

    console.log("=== DEBUG EVENT KHỐI ICS ===");
    console.log("summary:", summary);
    console.log("dtstartLine:", dtstartLine);
    console.log("dtendLine:", dtendLine);

    if (dtstartLine) {
      const cleanStart = dtstartLine.replace(/[^0-9T]/g, "");
      console.log("cleanStart:", cleanStart, "length:", cleanStart.length);

      if (cleanStart.length >= 15) {
        const year = parseInt(cleanStart.slice(0, 4), 10);
        const month = parseInt(cleanStart.slice(4, 6), 10) - 1;
        const day = parseInt(cleanStart.slice(6, 8), 10);
        const startHourValue = parseInt(cleanStart.slice(9, 11), 10);
        const startMin = parseInt(cleanStart.slice(11, 13), 10);
        
        const date = new Date(year, month, day, startHourValue, startMin);
        
        if (isNaN(date.getTime())) {
          console.error("❌ LỖI: Date không hợp lệ!");
          continue; 
        }

        const dayOfWeek = (date.getDay() + 6) % 7;
        const eventWeekStart = getYYYYMMDDMonday(date);

        console.log("👉 Kết quả tính toán -> dayOfWeek:", dayOfWeek, "weekStartDate:", eventWeekStart);

        let duration = 1;
        if (dtendLine) {
          const cleanEnd = dtendLine.replace(/[^0-9T]/g, "");
          if (cleanEnd.length >= 15) {
            const endHour = parseInt(cleanEnd.slice(9, 11), 10);
            const endMin = parseInt(cleanEnd.slice(11, 13), 10);
            duration = (endHour + endMin / 60) - (startHourValue + startMin / 60);
          }
        }

        events.push({
          title: String(summary),
          day: Math.floor(Number(dayOfWeek)),  
          start: Number(startHourValue + startMin / 60), 
          duration: Number(Math.max(0.5, duration)), 
          color: "280 60% 65%", 
          weekStartDate: String(eventWeekStart),
          source: "ics_import",
        });
      }
    }
  }
  return events;
}

const getSessionDay = (session) => Number(session.dayOfWeek ?? session.day);
const getSessionStart = (session) => Number(session.startHour ?? session.start);
const getSessionDuration = (session) =>
  Number(session.durationHours ?? session.duration);

const intervalsOverlap = (startA, durationA, startB, durationB) =>
  startA < startB + durationB && startA + durationA > startB;

const formatHour = (value) => {
  const hour = Math.floor(Number(value));
  const minutes = Math.round((Number(value) - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatImportedEventTime = (event) =>
  `${event.weekStartDate} · ${days[event.day]} · ${formatHour(event.start)}-${formatHour(
    event.start + event.duration,
  )}`;

const sessionOverlapsEvent = (event, session) =>
  event.weekStartDate === session.weekStartDate &&
  getSessionDay(session) === Number(event.day) &&
  intervalsOverlap(
    Number(event.start),
    Number(event.duration),
    getSessionStart(session),
    getSessionDuration(session),
  );

const importedEventOverlapsBlockedSlot = (event, blockedSlots = []) =>
  blockedSlots.some((slot) => {
    if (slot.day !== days[event.day]) return false;
    return intervalsOverlap(Number(event.start), Number(event.duration), Number(slot.hour), 1);
  });

const findImportedEventConflict = ({
  event,
  sessionsByWeek,
  blockedSlots,
  plannedEvents = [],
}) => {
  if (event.start + event.duration > 24) {
    return { message: "Event ends after the end of the day" };
  }

  if (importedEventOverlapsBlockedSlot(event, blockedSlots)) {
    return {
      message: "Overlaps a blocked time from availability settings",
    };
  }

  const existingSessions = sessionsByWeek[event.weekStartDate] ?? [];
  const overlappingSession = existingSessions.find((session) =>
    sessionOverlapsEvent(event, session),
  );

  if (overlappingSession) {
    return {
      message: `Overlaps existing session: ${overlappingSession.title}`,
    };
  }

  const overlappingImport = plannedEvents.find((planned) =>
    sessionOverlapsEvent(event, planned),
  );

  if (overlappingImport) {
    return {
      message: `Overlaps another imported event: ${overlappingImport.title}`,
    };
  }

  return null;
};

const appendImportedEventsToWeekMap = (sessionsByWeek, events) => {
  const next = { ...sessionsByWeek };
  for (const event of events) {
    next[event.weekStartDate] = [...(next[event.weekStartDate] ?? []), event];
  }
  return next;
};

const circularDayDistance = (dayA, dayB) => {
  const diff = Math.abs(Number(dayA) - Number(dayB));
  return Math.min(diff, 7 - diff);
};

const getDaySessions = ({ weekStartDate, day, sessionsByWeek, plannedEvents }) => [
  ...(sessionsByWeek[weekStartDate] ?? []),
  ...plannedEvents,
].filter(
  (session) =>
    session.weekStartDate === weekStartDate && getSessionDay(session) === Number(day),
);

const getDayLoadHours = (args) =>
  getDaySessions(args).reduce(
    (sum, session) => sum + getSessionDuration(session),
    0,
  );

const scoreSuggestedSlot = ({
  candidate,
  original,
  daySessions,
  maxStudyHoursPerDay,
}) => {
  const dayDistance = circularDayDistance(candidate.day, original.day);
  const timeDistance = Math.abs(Number(candidate.start) - Number(original.start));
  const totalHoursAfterAdd =
    daySessions.reduce((sum, session) => sum + getSessionDuration(session), 0) +
    Number(candidate.duration);
  const loadRatio = totalHoursAfterAdd / maxStudyHoursPerDay;

  let score = 100;
  if (Number(candidate.day) === Number(original.day)) score += 25;
  score -= dayDistance * 20;
  score -= timeDistance * 8;
  score -= daySessions.length * 5;
  score -= Math.pow(loadRatio, 2) * 15;
  if (candidate.start >= 18) score -= 10;
  return score;
};

const suggestImportedEventSlot = ({
  event,
  sessionsByWeek,
  blockedSlots,
  plannedEvents = [],
  maxStudyHoursPerDay,
}) => {
  const candidates = [];
  const otherPlannedEvents = plannedEvents.filter(
    (planned) => planned.importId !== event.importId,
  );

  for (let day = 0; day < 7; day += 1) {
    for (let start = SUGGEST_START_HOUR; start < SUGGEST_END_HOUR; start += 0.5) {
      const candidate = { ...event, day, start };
      if (candidate.start + candidate.duration > SUGGEST_END_HOUR) continue;

      const conflict = findImportedEventConflict({
        event: candidate,
        sessionsByWeek,
        blockedSlots,
        plannedEvents: otherPlannedEvents,
      });
      if (conflict) continue;

      const daySessions = getDaySessions({
        weekStartDate: candidate.weekStartDate,
        day: candidate.day,
        sessionsByWeek,
        plannedEvents: otherPlannedEvents,
      });
      const totalHoursAfterAdd =
        getDayLoadHours({
          weekStartDate: candidate.weekStartDate,
          day: candidate.day,
          sessionsByWeek,
          plannedEvents: otherPlannedEvents,
        }) + Number(candidate.duration);

      if (totalHoursAfterAdd > maxStudyHoursPerDay) continue;

      candidates.push({
        event: candidate,
        score: scoreSuggestedSlot({
          candidate,
          original: event,
          daySessions,
          maxStudyHoursPerDay,
        }),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.event ?? null;
};

export default function Planner() {
  const { subjects, refetch: refetchSubjects } = useSubjects();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStartDate = useMemo(
    () => getWeekStartDate(currentDate),
    [currentDate],
  );

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return { name: days[i], date: d.getDate(), fullDate: d };
    });
  }, [currentDate]);

  const {
    sessions,
    loading: sessionsLoading,
    isFetching: sessionsFetching,
    refetch: refetchSessions,
  } = usePlannerWeek(weekStartDate);
  const {
    blockedSlots,
    isLoading: blockedLoading,
    error: blockedError,
  } = useBlockedSlotsQuery();
  const { data: preferences, isLoading: preferencesLoading } =
    useUserPreferencesQuery();
  const { setSessions } = usePlannerWeekCache(weekStartDate);

  const showInitialLoader = sessionsLoading || blockedLoading;
  const rawMaxStudyHoursPerDay = Number(
    preferences?.maxStudyHoursPerDay ?? DEFAULT_MAX_STUDY_HOURS_PER_DAY,
  );
  const maxStudyHoursPerDay =
    Number.isFinite(rawMaxStudyHoursPerDay) && rawMaxStudyHoursPerDay > 0
      ? rawMaxStudyHoursPerDay
      : DEFAULT_MAX_STUDY_HOURS_PER_DAY;

  const reloadWeek = () => {
    refetchSessions();
    if (blockedError) {
      queryClient.invalidateQueries({ queryKey: ["user", "blocked-slots"] });
    }
  };

  const weekLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const isSlotBlocked = (dayLabel, hour) =>
    blockedSlots.some((s) => s.day === dayLabel && s.hour === hour);

  const sessionOverlapsBlocked = (dayIndex, start, duration) =>
    blockedSlots.some((slot) => {
      if (slot.day !== days[dayIndex]) return false;
      return start < slot.hour + 1 && start + duration > slot.hour;
    });

  const dragIdRef = useRef(null);
  const fileRef = useRef(null);
  const [resizingId, setResizingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [showAiPlan, setShowAiPlan] = useState(false);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [icsPreview, setIcsPreview] = useState(null);
  const [icsResolveMode, setIcsResolveMode] = useState(false);
  const [icsResolvedEvents, setIcsResolvedEvents] = useState([]);
  const [icsImporting, setIcsImporting] = useState(false);

  const [addForm, setAddForm] = useState({
    title: "",
    subjectId: "",
    dayOfWeek: "0",
    startHour: "9",
    durationHours: "1",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    subjectId: "",
    dayOfWeek: "0",
    startHour: "9",
    durationHours: "1",
  });

  const findSubjectByTitle = (title) =>
    subjects.find((sub) => sub.name === title);

  const handleSessionDragStart = (e, id) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleCellDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCellDrop = async (e, dayIndex, hour) => {
    e.preventDefault();
    const id = dragIdRef.current || e.dataTransfer.getData("text/plain");
    if (!id) return;

    const session = sessions.find((s) => s.id === id);
    if (!session) {
      dragIdRef.current = null;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const fractional = Math.max(0, Math.min(1, offsetY / 64));
    const snapped = Math.round(fractional * 2) / 2;
    let newStart = hour + snapped;
    if (newStart > 19.5) newStart = 19.5;

    if (sessionOverlapsBlocked(dayIndex, newStart, session.durationHours || session.duration)) {
      toast.error("This time overlaps a blocked slot in your availability settings");
      dragIdRef.current = null;
      return;
    }

    const result = await updatePlannerSession(
      id,
      { dayOfWeek: Number(dayIndex), startHour: Number(newStart) },
      weekStartDate,
    );

    if (result.success) {
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === id ? result.data : s));
        return next;
      });
    } else {
      toast.error(result.message);
      reloadWeek();
    }

    dragIdRef.current = null;
  };

  const handleResizeStart = (e, sessionId, currentDuration) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingId(sessionId);
    const startY = e.clientY;
    let latestDuration = currentDuration;

    const onMove = (ev) => {
      const delta = ev.clientY - startY;
      latestDuration = Math.max(
        0.5,
        Math.round((currentDuration + delta / 64) * 2) / 2,
      );
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, durationHours: latestDuration, duration: latestDuration } : s,
        ),
      );
    };

    const onUp = async () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setResizingId(null);

      const result = await updatePlannerSession(
        sessionId,
        { durationHours: Number(latestDuration) },
        weekStartDate,
      );

      if (result.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? result.data : s)),
        );
      } else {
        toast.error(result.message);
        reloadWeek();
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const findSubjectIdForSession = (s) => {
    if (s.subjectId) return s.subjectId;
    const byTitle = subjects.find((sub) =>
      s.title.toLowerCase().includes(sub.name.toLowerCase()),
    );
    if (byTitle) return byTitle.id;
    const byColor = subjects.find((sub) => sub.color === s.color);
    return byColor?.id || null;
  };

  const handleStartStudy = (session) => {
    const subjectId = findSubjectIdForSession(session);
    if (!subjectId) {
      toast.error("This session has no linked subject. Add a matching subject first.");
      return;
    }
    navigate(`/pomodoro?subjectId=${subjectId}&studyPlanId=${session.id}`);
  };

  const handleAddSession = async () => {
    if (!addForm.title.trim()) {
      toast.error("Please select a subject or enter a session title");
      return;
    }

    const subject =
      subjects.find((s) => s.id === addForm.subjectId) ||
      findSubjectByTitle(addForm.title);

    if (
      sessionOverlapsBlocked(
        parseInt(addForm.dayOfWeek, 10),
        parseFloat(addForm.startHour),
        parseFloat(addForm.durationHours),
      )
    ) {
      toast.error("This time is blocked in your availability settings");
      return;
    }

    const result = await createPlannerSession(
      {
        title: addForm.title.trim(),
        subjectId: subject?.id ?? null,
        dayOfWeek: Number(addForm.dayOfWeek),
        startHour: Number(addForm.startHour),
        durationHours: Number(addForm.durationHours),
        weekStartDate: weekStartDate,
        color:
          subject?.color ||
          ["340 82% 59%", "210 80% 60%", "142 45% 55%", "35 90% 60%"][
            Math.floor(Math.random() * 4)
          ],
      },
      weekStartDate,
    );

    if (result.success) {
      setSessions((prev) => [...prev, result.data]);
      setShowAdd(false);
      setAddForm({ title: "", subjectId: "", dayOfWeek: "0", startHour: "9", durationHours: "1" });
      toast.success("Study session added!");
    } else {
      toast.error(result.message);
    }
  };

  const handleOpenEdit = (session) => {
    setEditingSession(session);
    setEditForm({
      title: session.title,
      subjectId: session.subjectId || "",
      dayOfWeek: (session.dayOfWeek !== undefined ? session.dayOfWeek : session.day).toString(),
      startHour: (session.startHour !== undefined ? session.startHour : session.start).toString(),
      durationHours: (session.durationHours !== undefined ? session.durationHours : session.duration).toString(),
    });
    setActiveMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editingSession) return;

    const subject =
      subjects.find((s) => s.id === editForm.subjectId) ||
      findSubjectByTitle(editForm.title);

    const result = await updatePlannerSession(
      editingSession.id,
      {
        title: editForm.title.trim(),
        subjectId: subject?.id ?? null,
        dayOfWeek: Number(editForm.dayOfWeek),
        startHour: Number(editForm.startHour),
        durationHours: Number(editForm.durationHours),
        weekStartDate: editingSession.weekStartDate || weekStartDate,
        color: subject?.color ?? editingSession.color,
      },
      weekStartDate,
    );

    if (result.success) {
      setSessions((prev) =>
        prev.map((s) => (s.id === editingSession.id ? result.data : s)),
      );
      setEditingSession(null);
      toast.success("Session updated!");
    } else {
      toast.error(result.message);
    }
  };

  const handleDeleteSession = async (id) => {
    const result = await deletePlannerSession(id);
    if (result.success) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session removed");
    } else {
      toast.error(result.message);
    }
  };

  const handleClearAllSessions = async () => {
    setClearingAll(true);
    const result = await clearAllPlannerSessions();
    setClearingAll(false);

    if (!result.success) {
      toast.error(result.message || "Failed to clear planner sessions");
      return;
    }

    const deleted = result.data?.deleted ?? 0;
    setSessions([]);
    queryClient.invalidateQueries({ queryKey: ["planner"] });
    setClearAllOpen(false);
    toast.success(
      deleted > 0
        ? `Removed ${deleted} session${deleted === 1 ? "" : "s"} from your planner`
        : "Your planner is already empty",
    );
  };

  const buildICSPreview = async (events) => {
    const weekStartDates = [...new Set(events.map((event) => event.weekStartDate))];
    const weekResults = await Promise.all(
      weekStartDates.map(async (date) => [date, await getPlannerSessions(date)]),
    );

    const sessionsByWeek = {};
    for (const [date, result] of weekResults) {
      if (!result.success) {
        throw new Error(result.message || "Could not check existing planner sessions");
      }
      sessionsByWeek[date] = result.data ?? [];
    }

    const importedEvents = events.map((event, index) => ({
      ...event,
      importId: `${event.weekStartDate}-${event.day}-${event.start}-${index}`,
    }));
    const available = [];
    const conflicts = [];

    for (const event of importedEvents) {
      const conflict = findImportedEventConflict({
        event,
        sessionsByWeek,
        blockedSlots,
        plannedEvents: available,
      });

      if (conflict) {
        conflicts.push({ ...event, conflict });
      } else {
        available.push(event);
      }
    }

    setIcsPreview({
      total: importedEvents.length,
      available,
      conflicts,
      sessionsByWeek,
      importedCount: 0,
    });
    setIcsResolvedEvents(
      conflicts.map((event) => ({
        title: event.title,
        day: event.day,
        start: event.start,
        duration: event.duration,
        color: event.color,
        weekStartDate: event.weekStartDate,
        source: event.source,
        importId: event.importId,
      })),
    );
    setIcsResolveMode(false);
  };

  const closeICSPreview = (force = false) => {
    if (icsImporting && !force) return;
    setIcsPreview(null);
    setIcsResolveMode(false);
    setIcsResolvedEvents([]);
  };

  const resolveConflictIssue = (event, index) => {
    if (!icsPreview) return null;

    const plannedEvents = [
      ...icsPreview.available,
      ...icsResolvedEvents.filter((_, i) => i !== index),
    ];

    return findImportedEventConflict({
      event,
      sessionsByWeek: icsPreview.sessionsByWeek,
      blockedSlots,
      plannedEvents,
    });
  };

  const resolvedConflictIssues = icsResolveMode
    ? icsResolvedEvents.map((event, index) => resolveConflictIssue(event, index))
    : [];
  const hasUnresolvedConflicts = resolvedConflictIssues.some(Boolean);

  const importICSEvents = async (eventsToImport) => {
    if (eventsToImport.length === 0) {
      toast.error("No sessions available to import");
      return { created: 0, succeeded: [], failures: [] };
    }

    setIcsImporting(true);
    let created = 0;
    const succeeded = [];
    const failures = [];

    for (const event of eventsToImport) {
      const result = await createPlannerSession(event, event.weekStartDate);

      if (result.success) {
        created += 1;
        succeeded.push(event);
      } else {
        failures.push({
          title: event.title,
          message: result.message || "Failed to create planner session",
        });
      }
    }

    setIcsImporting(false);

    if (created > 0) {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
      reloadWeek();
      toast.success(
        failures.length > 0
          ? `Imported ${created} of ${eventsToImport.length} session(s)`
          : `Imported ${created} session(s) from ICS`,
      );
    }

    if (failures.length > 0) {
      toast.error(`${failures.length} session(s) could not be imported`, {
        description: failures
          .slice(0, 5)
          .map((failure) => `${failure.title}: ${failure.message}`)
          .join("\n"),
        duration: 8000,
      });
    }

    return { created, succeeded, failures };
  };

  const handleImportAvailableICS = async () => {
    if (!icsPreview) return;
    const { created, succeeded } = await importICSEvents(icsPreview.available);
    if (created === 0) return;

    const succeededIds = new Set(succeeded.map((event) => event.importId));
    const nextAvailable = icsPreview.available.filter(
      (event) => !succeededIds.has(event.importId),
    );
    const nextConflicts = icsPreview.conflicts;
    const nextPreview = {
      ...icsPreview,
      available: nextAvailable,
      sessionsByWeek: appendImportedEventsToWeekMap(
        icsPreview.sessionsByWeek,
        succeeded,
      ),
      importedCount: (icsPreview.importedCount ?? 0) + created,
    };

    setIcsPreview(nextPreview);

    if (nextAvailable.length === 0 && nextConflicts.length === 0) {
      closeICSPreview(true);
    }
  };

  const handleImportResolvedICS = async () => {
    if (!icsPreview || hasUnresolvedConflicts) return;
    const { created, succeeded } = await importICSEvents(icsResolvedEvents);
    if (created === 0) return;

    const succeededIds = new Set(succeeded.map((event) => event.importId));
    const nextResolvedEvents = icsResolvedEvents.filter(
      (event) => !succeededIds.has(event.importId),
    );
    const nextConflicts = icsPreview.conflicts.filter(
      (event) => !succeededIds.has(event.importId),
    );
    const nextPreview = {
      ...icsPreview,
      conflicts: nextConflicts,
      sessionsByWeek: appendImportedEventsToWeekMap(
        icsPreview.sessionsByWeek,
        succeeded,
      ),
      importedCount: (icsPreview.importedCount ?? 0) + created,
    };

    setIcsPreview(nextPreview);
    setIcsResolvedEvents(nextResolvedEvents);

    if (nextPreview.available.length === 0 && nextConflicts.length === 0) {
      closeICSPreview(true);
    } else {
      setIcsResolveMode(false);
    }
  };

  const getSuggestedICSConflict = (event, resolvedEvents = icsResolvedEvents) => {
    if (!icsPreview) return null;

    return suggestImportedEventSlot({
      event,
      sessionsByWeek: icsPreview.sessionsByWeek,
      blockedSlots,
      plannedEvents: [...icsPreview.available, ...resolvedEvents],
      maxStudyHoursPerDay,
    });
  };

  const handleSuggestICSConflict = (index) => {
    const event = icsResolvedEvents[index];
    if (!event) return;

    const suggested = getSuggestedICSConflict(event);
    if (!suggested) {
      toast.error(
        `No suggested slot found within your ${maxStudyHoursPerDay}h daily limit`,
      );
      return;
    }

    setIcsResolvedEvents((prev) =>
      prev.map((item, i) => (i === index ? suggested : item)),
    );
    toast.success(`Suggested ${formatImportedEventTime(suggested)}`);
  };

  const handleSuggestAllICSConflicts = () => {
    if (!icsPreview || icsResolvedEvents.length === 0) return;

    let suggestedCount = 0;
    const nextResolvedEvents = [...icsResolvedEvents];

    for (let index = 0; index < nextResolvedEvents.length; index += 1) {
      const suggested = getSuggestedICSConflict(
        nextResolvedEvents[index],
        nextResolvedEvents,
      );

      if (!suggested) continue;
      nextResolvedEvents[index] = suggested;
      suggestedCount += 1;
    }

    setIcsResolvedEvents(nextResolvedEvents);

    if (suggestedCount > 0) {
      toast.success(`Suggested new times for ${suggestedCount} conflict(s)`);
    } else {
      toast.error(
        `No suggested slots found within your ${maxStudyHoursPerDay}h daily limit`,
      );
    }
  };

  const handleICSImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Could not read the .ics file");
    };
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result;
        if (typeof text !== "string") {
          toast.error("Could not read the .ics file");
          return;
        }

        const events = parseICS(text);
        if (events.length === 0) {
          toast.error("No valid events found in file. Check your file format.");
          return;
        }

        await buildICSPreview(events);
      } catch (error) {
        toast.error(error.message || "Could not parse the .ics file");
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (showInitialLoader) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        Loading planner…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Study Planner
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize your week with time blocks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground px-3 min-w-[120px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={handleNextWeek}
            className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="ml-2 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
          >
            <Upload className="h-4 w-4" /> Import .ICS
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".ics"
            className="hidden"
            onChange={handleICSImport}
          />
          <button
            onClick={() => setShowAiPlan(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
          >
            <Sparkles className="h-4 w-4" /> AI Plan
          </button>
          <button
            onClick={() => setClearAllOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-destructive/30 text-destructive font-medium text-sm hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Clear All
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.02] transition-transform"
          >
            <Plus className="h-4 w-4" /> Add Session
          </button>
        </div>
      </div>

      <div
        className={`bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden transition-opacity duration-150 ${
          sessionsFetching && !sessionsLoading ? "opacity-60" : ""
        }`}
      >
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 bg-muted/30">
          <div />
          {weekDays.map((day) => (
            <div
              key={day.name}
              className="text-center py-3 flex flex-col items-center"
            >
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {day.name}
              </span>
              <span
                className={`text-sm font-bold mt-1 ${day.fullDate.toDateString() === new Date().toDateString() ? "text-primary bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center" : "text-foreground"}`}
              >
                {day.date}
              </span>
            </div>
          ))}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="h-16 flex items-start justify-end pr-2 pt-1 text-[10px] text-muted-foreground font-medium border-b border-border/10">
                  {hour}:00
                </div>
                {days.map((dayLabel, di) => {
                  const blocked = isSlotBlocked(dayLabel, hour);
                  return (
                    <div
                      key={`${hour}-${di}`}
                      className={`h-16 border-l border-b border-border/30 relative ${blocked ? "bg-rose-950/10 rounded-md" : ""}`}
                      onDragOver={handleCellDragOver}
                      onDrop={(e) => handleCellDrop(e, di, hour)}
                    >
                      {sessions
                        .filter((s) => {
                          const currentDay = s.dayOfWeek !== undefined ? s.dayOfWeek : s.day;
                          const currentStart = s.startHour !== undefined ? s.startHour : s.start;
                          return Number(currentDay) === di && Math.floor(Number(currentStart)) === hour;
                        })
                        .map((s) => {
                          const currentStart = s.startHour !== undefined ? s.startHour : s.start;
                          const currentDuration = s.durationHours !== undefined ? s.durationHours : s.duration;
                          return (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={(e) => handleSessionDragStart(e, s.id)}
                              className={`absolute inset-x-1 rounded-lg p-2 text-[11px] font-medium z-10 group/sess overflow-visible cursor-move ${resizingId === s.id ? "ring-2 ring-primary/40" : ""}`}
                              style={{
                                top: `${(Number(currentStart) - hour) * 64}px`,
                                height: `${Number(currentDuration) * 64}px`,
                                backgroundColor: `hsl(${s.color} / 0.15)`,
                                color: `hsl(${s.color})`,
                                borderLeft: `3px solid hsl(${s.color})`,
                              }}
                            >
                              <div className="truncate pr-5">{s.title}</div>

                              <div className="absolute top-1 right-1 opacity-0 group-hover/sess:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(
                                      activeMenuId === s.id ? null : s.id,
                                    );
                                  }}
                                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-foreground/10"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                                <AnimatePresence>
                                  {activeMenuId === s.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setActiveMenuId(null)}
                                      />
                                      <Motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute right-0 top-6 w-28 bg-card border border-border shadow-xl rounded-xl z-30 py-1 overflow-hidden"
                                      >
                                        <button
                                          onClick={() => handleOpenEdit(s)}
                                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-muted text-foreground transition-colors"
                                        >
                                          <Edit2 className="h-3 w-3" /> Edit
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleDeleteSession(s.id);
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-destructive/10 text-destructive transition-colors"
                                        >
                                          <Trash2 className="h-3 w-3" /> Delete
                                        </button>
                                      </Motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartStudy(s);
                                }}
                                className="absolute bottom-1 right-1 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-primary text-primary-foreground text-[10px] font-medium opacity-0 group-hover/sess:opacity-100 transition-opacity hover:scale-[1.05]"
                                title="Start Study"
                              >
                                <Play className="h-2.5 w-2.5" /> Start
                              </button>
                              <div
                                onPointerDown={(e) =>
                                  handleResizeStart(e, s.id, Number(currentDuration))
                                }
                                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-end justify-center opacity-0 group-hover/sess:opacity-100 transition-opacity"
                                title="Drag to resize"
                              >
                                <div className="h-1 w-8 rounded-full bg-current opacity-60" />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-soft border border-border/50">
        <img src={loopyThinking} alt="Loopy thinking" className="w-10 h-10" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> Blocked
          times from Settings appear grayed out. Sessions cannot overlap those
          slots.
        </p>
      </div>

      <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all planner sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete every session on your planner —
              including manual sessions, applied AI plans, and imported events
              across all weeks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={clearingAll}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={clearingAll}
              onClick={(e) => {
                e.preventDefault();
                handleClearAllSessions();
              }}
            >
              {clearingAll ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {icsPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={closeICSPreview}
              aria-hidden
            />
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-2xl z-10 border border-border max-h-[85vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={closeICSPreview}
                disabled={icsImporting}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>

              {!icsResolveMode ? (
                <>
                  <h2 className="text-lg font-display font-semibold text-foreground mb-2">
                    Import ICS schedule?
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Review what can be imported before adding sessions to your planner.
                  </p>
                  {icsPreview.importedCount > 0 ? (
                    <div className="rounded-xl bg-primary/10 text-primary text-sm p-3 mb-4">
                      {icsPreview.importedCount} session
                      {icsPreview.importedCount === 1 ? "" : "s"} imported so far.
                      You can continue resolving or importing the remaining sessions.
                    </div>
                  ) : null}

                  <div className="grid sm:grid-cols-3 gap-3 mb-5">
                    <div className="rounded-xl bg-secondary/50 p-3">
                      <p className="text-2xl font-bold text-foreground">
                        {icsPreview.total}
                      </p>
                      <p className="text-xs text-muted-foreground">sessions found</p>
                    </div>
                    <div className="rounded-xl bg-accent/10 p-3">
                      <p className="text-2xl font-bold text-accent">
                        {icsPreview.available.length}
                      </p>
                      <p className="text-xs text-muted-foreground">can be imported</p>
                    </div>
                    <div className="rounded-xl bg-destructive/10 p-3">
                      <p className="text-2xl font-bold text-destructive">
                        {icsPreview.conflicts.length}
                      </p>
                      <p className="text-xs text-muted-foreground">conflict</p>
                    </div>
                  </div>

                  {icsPreview.conflicts.length > 0 ? (
                    <div className="space-y-2 mb-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Conflicting sessions
                      </p>
                      {icsPreview.conflicts.slice(0, 5).map((event, index) => (
                        <div
                          key={`${event.title}-${event.weekStartDate}-${event.day}-${event.start}-${index}`}
                          className="rounded-xl border border-destructive/20 bg-destructive/5 p-3"
                        >
                          <p className="text-sm font-medium text-foreground">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatImportedEventTime(event)}
                          </p>
                          <p className="text-xs text-destructive mt-1">
                            {event.conflict.message}
                          </p>
                        </div>
                      ))}
                      {icsPreview.conflicts.length > 5 ? (
                        <p className="text-xs text-muted-foreground">
                          +{icsPreview.conflicts.length - 5} more conflict(s)
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-accent/10 text-accent text-sm p-3 mb-5">
                      No conflicts detected. All sessions are ready to import.
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeICSPreview}
                      disabled={icsImporting}
                      className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setIcsResolveMode(true)}
                      disabled={icsImporting || icsPreview.conflicts.length === 0}
                      className="h-10 px-4 rounded-full border border-border text-sm font-medium hover:bg-secondary disabled:opacity-50"
                    >
                      Resolve conflicts
                    </button>
                    <button
                      type="button"
                      onClick={handleImportAvailableICS}
                      disabled={icsImporting || icsPreview.available.length === 0}
                      className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      {icsImporting
                        ? "Importing..."
                        : `Import ${icsPreview.available.length} available session${
                            icsPreview.available.length === 1 ? "" : "s"
                          }`}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-display font-semibold text-foreground mb-2">
                    Resolve ICS conflicts
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pick a new day and start time for each conflicting session. Duration stays the same.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-secondary/50 p-3 mb-4">
                    <p className="text-xs text-muted-foreground">
                      Auto suggestions only use slots that respect your{" "}
                      {maxStudyHoursPerDay}h/day study limit.
                    </p>
                    <button
                      type="button"
                      onClick={handleSuggestAllICSConflicts}
                      disabled={icsImporting || preferencesLoading}
                      className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto suggest all
                    </button>
                  </div>
                  {icsPreview.available.length > 0 ? (
                    <div className="rounded-xl bg-accent/10 text-accent text-sm p-3 mb-4">
                      {icsPreview.available.length} non-conflicting session
                      {icsPreview.available.length === 1 ? "" : "s"} are still pending.
                      Go back after resolving conflicts to import them too.
                    </div>
                  ) : null}

                  <div className="space-y-3 mb-5">
                    {icsResolvedEvents.map((event, index) => {
                      const issue = resolvedConflictIssues[index];
                      const original = icsPreview.conflicts[index];

                      return (
                        <div
                          key={`${event.title}-${event.weekStartDate}-${index}`}
                          className="rounded-xl border border-border bg-background/60 p-3 space-y-3"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {event.title}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleSuggestICSConflict(index)}
                                disabled={icsImporting || preferencesLoading}
                                className="h-7 px-2 rounded-full bg-secondary text-secondary-foreground text-[11px] font-medium disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
                              >
                                <Sparkles className="h-3 w-3" />
                                Suggest
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Original: {formatImportedEventTime(original)}
                            </p>
                            <p className="text-xs text-destructive mt-1">
                              {original.conflict.message}
                            </p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-2">
                            <select
                              value={event.day}
                              onChange={(e) =>
                                setIcsResolvedEvents((prev) =>
                                  prev.map((item, i) =>
                                    i === index
                                      ? { ...item, day: Number(e.target.value) }
                                      : item,
                                  ),
                                )
                              }
                              className="h-10 rounded-xl bg-card px-3 text-sm text-foreground border border-border outline-none"
                            >
                              {days.map((day, dayIndex) => (
                                <option key={day} value={dayIndex}>
                                  {day}
                                </option>
                              ))}
                            </select>
                            <select
                              value={event.start}
                              onChange={(e) =>
                                setIcsResolvedEvents((prev) =>
                                  prev.map((item, i) =>
                                    i === index
                                      ? { ...item, start: Number(e.target.value) }
                                      : item,
                                  ),
                                )
                              }
                              className="h-10 rounded-xl bg-card px-3 text-sm text-foreground border border-border outline-none"
                            >
                              {hours.flatMap((hour) => [
                                <option key={hour} value={hour}>
                                  {hour}:00
                                </option>,
                                <option key={`${hour}-30`} value={hour + 0.5}>
                                  {hour}:30
                                </option>,
                              ])}
                            </select>
                          </div>

                          <p
                            className={`text-xs ${
                              issue ? "text-destructive" : "text-accent"
                            }`}
                          >
                            {issue
                              ? issue.message
                              : `Ready: ${formatImportedEventTime(event)}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIcsResolveMode(false)}
                      disabled={icsImporting}
                      className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={closeICSPreview}
                      disabled={icsImporting}
                      className="h-10 px-4 rounded-full border border-border text-sm font-medium hover:bg-secondary disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleImportResolvedICS}
                      disabled={icsImporting || hasUnresolvedConflicts}
                      className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      {icsImporting
                        ? "Importing..."
                        : `Import ${icsResolvedEvents.length} resolved conflict${
                            icsResolvedEvents.length === 1 ? "" : "s"
                          }`}
                    </button>
                  </div>
                </>
              )}
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showAdd || editingSession) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => {
                setShowAdd(false);
                setEditingSession(null);
              }}
            />
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md z-10 border border-border"
            >
              <button
                onClick={() => {
                  setShowAdd(false);
                  setEditingSession(null);
                }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                {editingSession ? "Edit Session" : "Add Study Session"}
              </h2>
              <div className="space-y-3">
                {subjects.length > 0 ? (
                  <select
                    value={
                      editingSession ? editForm.subjectId : addForm.subjectId
                    }
                    onChange={(e) => {
                      const sub = subjects.find((s) => s.id === e.target.value);
                      if (editingSession) {
                        setEditForm((prev) => ({
                          ...prev,
                          subjectId: e.target.value,
                          title: sub?.name || "",
                        }));
                      } else {
                        setAddForm((prev) => ({
                          ...prev,
                          subjectId: e.target.value,
                          title: sub?.name || "",
                        }));
                      }
                    }}
                    className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="" disabled>
                      Select subject
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    placeholder="Session title"
                    value={editingSession ? editForm.title : addForm.title}
                    onChange={(e) =>
                      editingSession
                        ? setEditForm((prev) => ({ ...prev, title: e.target.value }))
                        : setAddForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                )}

                <select
                  value={editingSession ? editForm.dayOfWeek : addForm.dayOfWeek}
                  onChange={(e) =>
                    editingSession
                      ? setEditForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))
                      : setAddForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))
                  }
                  className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                >
                  {days.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editingSession ? editForm.startHour : addForm.startHour}
                    onChange={(e) =>
                      editingSession
                        ? setEditForm((prev) => ({ ...prev, startHour: e.target.value }))
                        : setAddForm((prev) => ({ ...prev, startHour: e.target.value }))
                    }
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                  >
                    {hours.flatMap((h) => [
                      <option key={h} value={h}>
                        {h}:00
                      </option>,
                      <option key={`${h}-30`} value={h + 0.5}>
                        {h}:30
                      </option>,
                    ])}
                  </select>
                  <select
                    value={
                      editingSession ? editForm.durationHours : addForm.durationHours
                    }
                    onChange={(e) =>
                      editingSession
                        ? setEditForm((prev) => ({
                            ...prev,
                            durationHours: e.target.value,
                          }))
                        : setAddForm((prev) => ({
                            ...prev,
                            durationHours: e.target.value,
                          }))
                    }
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                  >
                    {Array.from({ length: 8 }, (_, i) => (i + 1) * 0.5).map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? "hour" : "hours"}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={editingSession ? handleSaveEdit : handleAddSession}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium mt-2 hover:scale-[1.01] transition-transform"
                >
                  {editingSession ? "Save Changes" : "Create Session"}
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAiPlan && (
          <AiPlanWizard
            open={showAiPlan}
            onClose={() => setShowAiPlan(false)}
            subjects={subjects}
            onSubjectsChange={refetchSubjects}
            onApplied={() => {
              setShowAiPlan(false);
              reloadWeek();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
