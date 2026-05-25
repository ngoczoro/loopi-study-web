import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  X,
  Sparkles,
  Loader2,
  Check,
  Play,
  Trash2,
  MoreVertical,
  Edit2,
  Save,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import loopyThinking from "@/assets/loopy-thinking.png";
import { useAppStore } from "@/lib/store";
import { getWeekStartDate } from "@/lib/plannerWeek";
import { generateMockStudyPlan } from "@/lib/ai-utils";
import {
  createPlannerSession,
  deletePlannerSession,
  getPlannerSessions,
  updatePlannerSession,
} from "@/services/plannerService";
import { getBlockedSlots } from "@/services/userService";
import { toast } from "sonner";

const hours = Array.from({ length: 12 }, (_, i) => i + 8);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseICS(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT");
  for (const block of blocks.slice(1)) {
    const summary = block.match(/SUMMARY:(.*)/)?.[1]?.trim() || "Imported Event";
    const dtstart = block.match(/DTSTART[^:]*:(\d{8}T\d{6})/)?.[1];
    const dtend = block.match(/DTEND[^:]*:(\d{8}T\d{6})/)?.[1];
    if (dtstart) {
      const startHour = parseInt(dtstart.slice(9, 11));
      const startMin = parseInt(dtstart.slice(11, 13));
      const date = new Date(
        parseInt(dtstart.slice(0, 4)),
        parseInt(dtstart.slice(4, 6)) - 1,
        parseInt(dtstart.slice(6, 8)),
      );
      const dayOfWeek = (date.getDay() + 6) % 7;
      let duration = 1;
      if (dtend) {
        const endHour = parseInt(dtend.slice(9, 11));
        const endMin = parseInt(dtend.slice(11, 13));
        duration = endHour + endMin / 60 - (startHour + startMin / 60);
      }
      events.push({
        title: summary,
        day: dayOfWeek,
        start: startHour + startMin / 60,
        duration: Math.max(0.5, duration),
      });
    }
  }
  return events;
}

export default function Planner() {
  const { subjects, fetchSubjects, replaceSessions } = useAppStore();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loadWeek = useCallback(async () => {
    setLoading(true);
    const week = getWeekStartDate(currentDate);

    const [sessionsRes, blockedRes] = await Promise.all([
      getPlannerSessions(week),
      getBlockedSlots(),
    ]);

    if (sessionsRes.success) {
      setSessions(sessionsRes.data);
      replaceSessions(sessionsRes.data);
    } else {
      toast.error(sessionsRes.message);
    }

    if (blockedRes.success) {
      setBlockedSlots(blockedRes.data || []);
    }

    setLoading(false);
  }, [currentDate, replaceSessions]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);

  const [addForm, setAddForm] = useState({
    title: "",
    subjectId: "",
    day: "0",
    start: "9",
    duration: "1",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    subjectId: "",
    day: "0",
    start: "9",
    duration: "1",
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

    if (sessionOverlapsBlocked(dayIndex, newStart, session.duration)) {
      toast.error("This time overlaps a blocked slot in your availability settings");
      dragIdRef.current = null;
      return;
    }

    const result = await updatePlannerSession(
      id,
      { day: dayIndex, start: newStart },
      weekStartDate,
    );

    if (result.success) {
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === id ? result.data : s));
        replaceSessions(next);
        return next;
      });
    } else {
      toast.error(result.message);
      loadWeek();
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
          s.id === sessionId ? { ...s, duration: latestDuration } : s,
        ),
      );
    };

    const onUp = async () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setResizingId(null);

      const result = await updatePlannerSession(
        sessionId,
        { duration: latestDuration },
        weekStartDate,
      );

      if (result.success) {
        setSessions((prev) => {
          const next = prev.map((s) =>
            s.id === sessionId ? result.data : s,
          );
          replaceSessions(next);
          return next;
        });
      } else {
        toast.error(result.message);
        loadWeek();
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
    if (!addForm.title.trim()) return;

    const subject =
      subjects.find((s) => s.id === addForm.subjectId) ||
      findSubjectByTitle(addForm.title);

    if (
      sessionOverlapsBlocked(
        parseInt(addForm.day, 10),
        parseFloat(addForm.start),
        parseFloat(addForm.duration),
      )
    ) {
      toast.error("This time is blocked in your availability settings");
      return;
    }

    const result = await createPlannerSession(
      {
        title: addForm.title.trim(),
        subjectId: subject?.id ?? null,
        day: parseInt(addForm.day, 10),
        start: parseFloat(addForm.start),
        duration: parseFloat(addForm.duration),
        color:
          subject?.color ||
          ["340 82% 59%", "210 80% 60%", "142 45% 55%", "35 90% 60%"][
            Math.floor(Math.random() * 4)
          ],
      },
      weekStartDate,
    );

    if (result.success) {
      const next = [...sessions, result.data];
      setSessions(next);
      replaceSessions(next);
      setShowAdd(false);
      setAddForm({ title: "", subjectId: "", day: "0", start: "9", duration: "1" });
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
      day: session.day.toString(),
      start: session.start.toString(),
      duration: session.duration.toString(),
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
        day: parseInt(editForm.day, 10),
        start: parseFloat(editForm.start),
        duration: parseFloat(editForm.duration),
        color: subject?.color ?? editingSession.color,
      },
      weekStartDate,
    );

    if (result.success) {
      const next = sessions.map((s) =>
        s.id === editingSession.id ? result.data : s,
      );
      setSessions(next);
      replaceSessions(next);
      setEditingSession(null);
      toast.success("Session updated!");
    } else {
      toast.error(result.message);
    }
  };

  const handleDeleteSession = async (id) => {
    const result = await deletePlannerSession(id);
    if (result.success) {
      const next = sessions.filter((s) => s.id !== id);
      setSessions(next);
      replaceSessions(next);
      toast.success("Session removed");
    } else {
      toast.error(result.message);
    }
  };

  const handleICSImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result;
      const events = parseICS(text);
      if (events.length === 0) {
        toast.error("No events found in file");
        return;
      }

      let created = 0;
      for (const evn of events) {
        const result = await createPlannerSession(
          {
            ...evn,
            color: "280 60% 65%",
            source: "ics_import",
          },
          weekStartDate,
        );
        if (result.success) {
          created += 1;
        }
      }

      if (created > 0) {
        toast.success(`Schedule imported! ${created} event(s) added 🎉`);
        loadWeek();
      } else {
        toast.error("Could not import events");
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGenerateAiPlan = () => {
    if (subjects.length === 0) {
      toast.error("Add subjects first to generate a plan");
      return;
    }
    setAiLoading(true);
    setTimeout(() => {
      const plan = generateMockStudyPlan(subjects);
      setAiPlan(plan);
      setAiLoading(false);
    }, 1200);
  };

  const handleAcceptPlan = async () => {
    if (!aiPlan) return;

    let created = 0;
    for (const item of aiPlan) {
      const subject = subjects.find((s) => item.title.startsWith(s.name));
      const result = await createPlannerSession(
        {
          title: item.title,
          subjectId: subject?.id ?? null,
          day: item.day,
          start: item.start,
          duration: item.duration,
          color: item.color,
          source: "ai_plan",
        },
        weekStartDate,
      );
      if (result.success) created += 1;
    }

    if (created > 0) {
      toast.success(`Study plan saved! ${created} sessions added 📅`);
      setAiPlan(null);
      setShowAiPlan(false);
      loadWeek();
    } else {
      toast.error("Could not save AI plan sessions");
    }
  };

  if (loading) {
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
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.02] transition-transform"
          >
            <Plus className="h-4 w-4" /> Add Session
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden">
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
                      .filter(
                        (s) => s.day === di && Math.floor(s.start) === hour,
                      )
                      .map((s) => (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={(e) => handleSessionDragStart(e, s.id)}
                          className={`absolute inset-x-1 rounded-lg p-2 text-[11px] font-medium z-10 group/sess overflow-visible cursor-move ${resizingId === s.id ? "ring-2 ring-primary/40" : ""}`}
                          style={{
                            top: `${(s.start - hour) * 64}px`,
                            height: `${s.duration * 64}px`,
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
                                  <motion.div
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
                                  </motion.div>
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
                              handleResizeStart(e, s.id, s.duration)
                            }
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-end justify-center opacity-0 group-hover/sess:opacity-100 transition-opacity"
                            title="Drag to resize"
                          >
                            <div className="h-1 w-8 rounded-full bg-current opacity-60" />
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          ))}
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
            <motion.div
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
                        setEditForm({
                          ...editForm,
                          subjectId: e.target.value,
                          title: sub?.name || "",
                        });
                      } else {
                        setAddForm({
                          ...addForm,
                          subjectId: e.target.value,
                          title: sub?.name || "",
                        });
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
                        ? setEditForm({ ...editForm, title: e.target.value })
                        : setAddForm({ ...addForm, title: e.target.value })
                    }
                    className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                )}

                <select
                  value={editingSession ? editForm.day : addForm.day}
                  onChange={(e) =>
                    editingSession
                      ? setEditForm({ ...editForm, day: e.target.value })
                      : setAddForm({ ...addForm, day: e.target.value })
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
                    value={editingSession ? editForm.start : addForm.start}
                    onChange={(e) =>
                      editingSession
                        ? setEditForm({ ...editForm, start: e.target.value })
                        : setAddForm({ ...addForm, start: e.target.value })
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
                      editingSession ? editForm.duration : addForm.duration
                    }
                    onChange={(e) =>
                      editingSession
                        ? setEditForm({
                            ...editForm,
                            duration: e.target.value,
                          })
                        : setAddForm({ ...addForm, duration: e.target.value })
                    }
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                  >
                    {[0.5, 1, 1.5, 2, 2.5, 3].map((d) => (
                      <option key={d} value={d}>
                        {d}h
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={
                    editingSession ? handleSaveEdit : handleAddSession
                  }
                  className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
                >
                  {editingSession ? (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
                  ) : (
                    "Add Session"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAiPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => {
                setShowAiPlan(false);
                setAiPlan(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-lg z-10 max-h-[85vh] overflow-auto border border-border"
            >
              <button
                onClick={() => {
                  setShowAiPlan(false);
                  setAiPlan(null);
                }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Generate AI Study Plan
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Based on your subjects, hours, and priorities
                  </p>
                </div>
              </div>
              {!aiPlan ? (
                <div className="space-y-3">
                  <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Your Subjects
                    </p>
                    {subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No subjects added yet
                      </p>
                    ) : (
                      subjects.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-foreground font-medium">
                            {s.name}
                          </span>
                          <span className="text-muted-foreground">
                            {s.requiredHoursPerWeek || s.credits}h/week ·{" "}
                            {s.priority || "medium"} priority
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={handleGenerateAiPlan}
                    disabled={aiLoading || subjects.length === 0}
                    className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating
                        Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Generate Plan
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    {aiPlan.length} sessions generated
                  </p>
                  <div className="space-y-1.5 max-h-60 overflow-auto">
                    {aiPlan.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-secondary/40 rounded-xl p-3"
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: `hsl(${s.color})` }}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">
                            {s.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {days[s.day]} · {Math.floor(s.start)}:
                            {(s.start % 1) * 60 === 0 ? "00" : "30"} ·{" "}
                            {s.duration}h
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAiPlan(null);
                        handleGenerateAiPlan();
                      }}
                      className="flex-1 h-10 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={handleAcceptPlan}
                      className="flex-1 h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" /> Accept Plan
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
