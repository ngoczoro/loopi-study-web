import { useState, useRef, useEffect } from "react";
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
  Pencil,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import loopyThinking from "@/assets/loopy-thinking.png";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { generateMockStudyPlan } from "@/lib/ai-utils";

const hours = Array.from({ length: 12 }, (_, i) => i + 8);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper: Format time display
function formatTime(value) {
  const hour = Math.floor(value);
  const minute = value % 1 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
}

// Helper: Parse ICS file
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
        parseInt(dtstart.slice(6, 8))
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
  const {
    sessions,
    subjects,
    addSession,
    addSessions,
    updateSession,
    deleteSession,
  } = useAppStore();

  const navigate = useNavigate();
  const fileRef = useRef(null);

  // --- States ---
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", day: "0", start: "9", duration: "1" });

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editSessionId, setEditSessionId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", day: "0", start: "9", duration: "1" });

  const [showAiPlan, setShowAiPlan] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);

  // --- Handlers ---

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleOpenEdit = (session, e) => {
    e.stopPropagation(); 
    setEditSessionId(session.id);
    setEditForm({
      title: session.title,
      day: String(session.day),
      start: String(session.start),
      duration: String(session.duration),
    });
    setActiveMenuId(null);
    setShowEdit(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editSessionId) return;
    if (!editForm.title.trim()) {
      toast.error("Please enter a title!");
      return;
    }

    updateSession(editSessionId, {
      title: editForm.title.trim(),
      day: parseInt(editForm.day),
      start: parseFloat(editForm.start),
      duration: parseFloat(editForm.duration),
    });

    setShowEdit(false);
    setEditSessionId(null);
    toast.success("Plan updated successfully!");
  };

  const handleAddSession = () => {
    if (!addForm.title.trim()) {
      toast.error("Please enter a title!");
      return;
    }
    const randomColors = ["340 82% 59%", "210 80% 60%", "142 45% 55%", "35 90% 60%"];
    addSession({
      title: addForm.title,
      day: parseInt(addForm.day),
      start: parseFloat(addForm.start),
      duration: parseFloat(addForm.duration),
      color: randomColors[Math.floor(Math.random() * randomColors.length)],
    });
    setShowAdd(false);
    setAddForm({ title: "", day: "0", start: "9", duration: "1" });
    toast.success("New session added!");
  };

  const handleStartStudy = (session) => {
    const subject = subjects.find(s => 
      session.title.toLowerCase().includes(s.name.toLowerCase()) || s.color === session.color
    );
    if (!subject) {
      toast.error("Corresponding subject not found!");
      return;
    }
    navigate(`/pomodoro?subjectId=${subject.id}&studyPlanId=${session.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Planner</h1>
          <p className="text-sm text-muted-foreground">Organize your weekly schedule</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-full p-1 mr-2">
            <button className="p-1 hover:bg-background rounded-full transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 text-xs font-semibold">This Week</span>
            <button className="p-1 hover:bg-background rounded-full transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <button 
            onClick={() => fileRef.current?.click()} 
            className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-full bg-secondary text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Import .ICS
          </button>
          <input ref={fileRef} type="file" accept=".ics" className="hidden" onChange={(e) => {
             const file = e.target.files[0];
             if (file) {
               const reader = new FileReader();
               reader.onload = (ev) => {
                 const evs = parseICS(ev.target.result);
                 addSessions(evs.map(x => ({...x, color: "280 60% 65%"})));
                 toast.success("Schedule imported!");
               };
               reader.readAsText(file);
             }
          }} />

          <button onClick={() => setShowAiPlan(true)} className="flex items-center gap-2 h-9 px-4 rounded-full bg-secondary text-xs font-medium hover:bg-secondary/80 transition-colors">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Plan
          </button>

          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shadow-sm">
            <Plus className="h-4 w-4" /> Add Session
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/20">
          <div />
          {days.map((day) => (
            <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-l border-border/10">
              {day}
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative bg-grid-slate-100">
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="h-20 flex items-start justify-end pr-3 pt-2 text-[10px] font-bold text-muted-foreground/60">
                {hour}:00
              </div>
              {days.map((_, dayIdx) => (
                <div key={dayIdx} className="h-20 border-l border-b border-border/40 relative group/slot hover:bg-muted/5 transition-colors">
                  {sessions
                    .filter((s) => s.day === dayIdx && Math.floor(s.start) === hour)
                    .map((session) => (
                      <div
                        key={session.id}
                        className="absolute inset-x-1.5 rounded-xl p-2.5 text-[11px] font-semibold z-10 shadow-sm border-l-4 group/item cursor-default"
                        style={{
                          top: `${(session.start - hour) * 80}px`,
                          height: `${session.duration * 80 - 4}px`,
                          backgroundColor: `hsl(${session.color} / 0.15)`,
                          borderColor: `hsl(${session.color})`,
                          color: `hsl(${session.color} / 1)`,
                        }}
                      >
                        <div className="truncate leading-tight pr-4">{session.title}</div>
                        <div className="text-[9px] opacity-70 mt-0.5">{formatTime(session.start)} - {formatTime(session.start + session.duration)}</div>

                        {/* Dropdown Menu Toggle */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === session.id ? null : session.id); }}
                          className="absolute top-2 right-1.5 h-5 w-5 flex items-center justify-center rounded-md hover:bg-black/5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>

                        {/* Dropdown Content */}
                        {activeMenuId === session.id && (
                          <div className="absolute top-7 right-0 w-32 bg-card border border-border rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95 duration-100">
                            <button onClick={(e) => handleOpenEdit(session, e)} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-medium hover:bg-secondary rounded-lg transition-colors">
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button onClick={() => { deleteSession(session.id); toast.success("Deleted!"); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}

                        {/* Start Button */}
                        <button
                          onClick={() => handleStartStudy(session)}
                          className="absolute bottom-2 right-2 h-6 px-2 flex items-center gap-1 bg-primary text-primary-foreground rounded-full text-[9px] font-bold opacity-0 group-hover/item:opacity-100 transition-all hover:scale-105 active:scale-95"
                        >
                          <Play className="h-2 w-2 fill-current" /> Start
                        </button>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* --- Modals (Add / Edit) --- */}
      <AnimatePresence>
        {(showAdd || showEdit) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => { setShowAdd(false); setShowEdit(false); }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-card border border-border shadow-2xl rounded-3xl p-6 w-full max-w-sm overflow-hidden"
            >
              <h2 className="text-xl font-bold tracking-tight mb-5">{showEdit ? "Edit Session" : "Add New Session"}</h2>
              
              <form onSubmit={showEdit ? handleSaveEdit : (e) => { e.preventDefault(); handleAddSession(); }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Title</label>
                  <input
                    autoFocus
                    placeholder="Enter subject name..."
                    value={showEdit ? editForm.title : addForm.title}
                    onChange={(e) => showEdit ? setEditForm({...editForm, title: e.target.value}) : setAddForm({...addForm, title: e.target.value})}
                    className="w-full h-11 bg-secondary/50 border-none rounded-2xl px-4 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Day</label>
                    <select
                      value={showEdit ? editForm.day : addForm.day}
                      onChange={(e) => showEdit ? setEditForm({...editForm, day: e.target.value}) : setAddForm({...addForm, day: e.target.value})}
                      className="w-full h-11 bg-secondary/50 border-none rounded-2xl px-3 text-sm outline-none cursor-pointer"
                    >
                      {days.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Duration</label>
                    <select
                      value={showEdit ? editForm.duration : addForm.duration}
                      onChange={(e) => showEdit ? setEditForm({...editForm, duration: e.target.value}) : setAddForm({...addForm, duration: e.target.value})}
                      className="w-full h-11 bg-secondary/50 border-none rounded-2xl px-3 text-sm outline-none cursor-pointer"
                    >
                      {[0.5, 1, 1.5, 2, 3].map(d => <option key={d} value={d}>{d} hour(s)</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Start Time</label>
                  <select
                    value={showEdit ? editForm.start : addForm.start}
                    onChange={(e) => showEdit ? setEditForm({...editForm, start: e.target.value}) : setAddForm({...addForm, start: e.target.value})}
                    className="w-full h-11 bg-secondary/50 border-none rounded-2xl px-3 text-sm outline-none cursor-pointer"
                  >
                    {hours.flatMap(h => [
                      <option key={h} value={h}>{h}:00</option>,
                      <option key={h+.5} value={h+0.5}>{h}:30</option>
                    ])}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAdd(false); setShowEdit(false); }}
                    className="flex-1 h-11 rounded-2xl font-bold text-xs hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-primary text-primary-foreground rounded-2xl font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    {showEdit ? "Save Changes" : "Confirm Add"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tip Section */}
      <div className="flex items-center gap-4 p-5 bg-card border border-border rounded-3xl shadow-sm">
        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <img src={loopyThinking} alt="tip" className="w-8 h-8" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Quick Tip:</strong> You can use the <span className="text-primary font-bold">AI Plan</span> feature to automatically generate an optimized study schedule based on your existing subjects' difficulty!
        </p>
      </div>
    </div>
  );
}