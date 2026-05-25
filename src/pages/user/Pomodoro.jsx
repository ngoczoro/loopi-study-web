import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Timer, X } from "lucide-react";
import { useSubjects } from "@/hooks/useSubjects";
import { useFocusSession } from "@/contexts/FocusSessionContext";
import FocusTimer from "@/components/focus/FocusTimer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { FOCUS_MAX_WORK_MINUTES } from "@/lib/focusTimerUtils";
import { normalizeTaskSubjectId } from "@/lib/task-utils";
import { toast } from "sonner";
import { createFocusSessionAPI } from "@/services/focusSessionService";

const DEFAULT_WORK_MINUTES = 25;

export default function Pomodoro() {
  const [params] = useSearchParams();
  const { liveSession, activeLoading, bindLiveSession } = useFocusSession();
  const [showSetupModal, setShowSetupModal] = useState(false);

  const urlSubjectId = params.get("subjectId") || "";

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Timer className="h-6 w-6 text-primary" />
          Focus Sessions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your study timer stays active while you browse the app.
        </p>
      </div>

      {activeLoading && !liveSession ? (
        <div className="bg-card rounded-2xl p-8 shadow-soft text-center">
          <p className="text-sm text-muted-foreground">Loading session…</p>
        </div>
      ) : liveSession ? (
        <FocusTimer />
      ) : (
        <div className="bg-card rounded-2xl p-8 shadow-soft flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="w-full max-w-xs h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.01] transition-transform"
          >
            Start Study
          </button>
        </div>
      )}

      {showSetupModal && (
        <SetupModal
          initialSubjectId={urlSubjectId}
          onClose={() => setShowSetupModal(false)}
          onStarted={(session) => {
            setShowSetupModal(false);
            bindLiveSession(session);
          }}
        />
      )}
    </div>
  );
}

function SetupModal({ initialSubjectId, onClose, onStarted }) {
  const { subjects } = useSubjects();
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [subjectId, setSubjectId] = useState(initialSubjectId || "none");
  const [loading, setLoading] = useState(false);

  const handleStartSession = async () => {
    const plannedWorkMinutes = Math.min(
      Math.max(1, Number(workMinutes) || DEFAULT_WORK_MINUTES),
      FOCUS_MAX_WORK_MINUTES,
    );
    const breakValue = breakMinutes === "" ? null : Number(breakMinutes);
    const plannedBreakMinutes =
      breakValue == null || Number.isNaN(breakValue)
        ? null
        : Math.max(1, Math.min(60, breakValue));

    setLoading(true);
    const result = await createFocusSessionAPI({
      subjectId: normalizeTaskSubjectId(subjectId),
      plannedWorkMinutes,
      plannedBreakMinutes,
      notes: notes.trim() || null,
    });
    setLoading(false);

    if (result.success) {
      toast.success("Focus session started");
      onStarted({
        ...result.data,
        plannedWorkMinutes,
        plannedBreakMinutes: plannedBreakMinutes ?? result.data.plannedBreakMinutes,
      });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-card rounded-2xl p-6 shadow-soft w-full max-w-md space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-foreground">
            Session setup
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
            Focus duration (minutes) <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={FOCUS_MAX_WORK_MINUTES}
            value={workMinutes}
            onChange={(e) => setWorkMinutes(Number(e.target.value))}
            className="w-full mt-1 h-10 rounded-xl bg-background border border-border px-3 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Break duration (minutes, optional)
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
            placeholder="Optional"
            className="w-full mt-1 h-10 rounded-xl bg-background border border-border px-3 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Subject (optional)
          </label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="w-full mt-1 h-10 rounded-xl bg-background">
              <SelectValue placeholder="No subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No subject</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Notes / goals (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What do you want to accomplish?"
            className="w-full mt-1 rounded-xl bg-background border border-border px-3 py-2 text-sm resize-none"
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleStartSession}
          className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
        >
          {loading ? "Starting…" : "Start Session"}
        </button>
      </div>
    </div>
  );
}
