import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Upload, X, Sparkles, Loader2, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import loopyThinking from "../../assets/loopy-thinking.png"; 
import { useAppStore } from "../../lib/store"; 
import { toast } from "sonner";
import { generateMockStudyPlan } from "../../lib/ai-utils"; 

const hours = Array.from({ length: 12 }, (_, i) => i + 8);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

//parse file lich .ics thanh mang object
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
      const date = new Date(parseInt(dtstart.slice(0, 4)), parseInt(dtstart.slice(4, 6)) - 1, parseInt(dtstart.slice(6, 8)));
      const dayOfWeek = (date.getDay() + 6) % 7;
      let duration = 1;
      if (dtend) {
        const endHour = parseInt(dtend.slice(9, 11));
        const endMin = parseInt(dtend.slice(11, 13));
        duration = (endHour + endMin / 60) - (startHour + startMin / 60);
      }
      events.push({ title: summary, day: dayOfWeek, start: startHour + startMin / 60, duration: Math.max(0.5, duration) });
    }
  }
  return events;
}

export default function Planner() {
  const { sessions, subjects, addSession, addSessions } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const fileRef = useRef(null);
  const [addForm, setAddForm] = useState({ title: "", day: "0", start: "9", duration: "1" });

  // AI Plan state
  const [showAiPlan, setShowAiPlan] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);

  const handleAddSession = () => {
    if (!addForm.title.trim()) return;
    addSession({ 
        title: addForm.title, 
        day: parseInt(addForm.day), 
        start: parseInt(addForm.start), 
        duration: parseFloat(addForm.duration), 
        color: ["340 82% 59%", "210 80% 60%", "142 45% 55%", "35 90% 60%"][Math.floor(Math.random() * 4)] 
    });
    setShowAdd(false); 
    setAddForm({ title: "", day: "0", start: "9", duration: "1" }); 
    toast.success("Study session added! 📅");
  };

  const handleICSImport = (e) => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result; 
      const events = parseICS(text);
      if (events.length === 0) { 
          toast.error("No events found in file"); 
          return; 
      }
      addSessions(events.map((ev) => ({ 
          title: ev.title, 
          day: ev.day, 
          start: ev.start, 
          duration: ev.duration, 
          color: "280 60% 65%" 
      })));
      toast.success(`Schedule imported! ${events.length} event(s) added 🎉`);
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

  const handleAcceptPlan = () => {
    if (!aiPlan) return;
    addSessions(aiPlan);
    toast.success(`Study plan saved! ${aiPlan.length} sessions added 📅`);
    setAiPlan(null);
    setShowAiPlan(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Study Planner</h1>
          <p className="text-sm text-muted-foreground">Organize your week with time blocks</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <ChevronLeft className="h-4 w-4 text-foreground" strokeWidth={1.5} />
          </button>
          <span className="text-sm font-medium text-foreground px-3">This Week</span>
          <button className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <ChevronRight className="h-4 w-4 text-foreground" strokeWidth={1.5} />
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="ml-2 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors">
            <Upload className="h-4 w-4" strokeWidth={1.5} /> Import .ICS
          </button>
          <input ref={fileRef} type="file" accept=".ics" className="hidden" onChange={handleICSImport} />
          <button onClick={() => setShowAiPlan(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} /> AI Plan
          </button>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.02] transition-transform">
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Add Session
          </button>
        </div>
      </div>

      {/* Bảng thời khóa biểu */}
      <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50">
          <div />
          {days.map((day) => (
            <div key={day} className="text-center py-3 text-xs uppercase tracking-widest font-bold text-muted-foreground">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="h-16 flex items-start justify-end pr-2 pt-1 text-[10px] text-muted-foreground font-medium">{hour}:00</div>
              {days.map((day, di) => (
                <div key={`${hour}-${day}`} className="h-16 border-l border-b border-border/30 relative">
                  {sessions.filter((s) => s.day === di && Math.floor(s.start) === hour).map((s) => (
                    <div key={s.id} className="absolute inset-x-1 rounded-lg p-2 text-[11px] font-medium z-10 cursor-pointer hover:scale-[1.02] transition-transform"
                      style={{ top: `${((s.start - hour) * 64)}px`, height: `${s.duration * 64}px`, backgroundColor: `hsl(${s.color} / 0.15)`, color: `hsl(${s.color})`, borderLeft: `3px solid hsl(${s.color})` }}>
                      {s.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-soft">
        <img src={loopyThinking} alt="Loopy thinking" className="w-10 h-10" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> Try "AI Plan" to auto-generate a schedule based on your subjects!
        </p>
      </div>

      {/* Add Session Dialog */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md z-10">
              <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">Add Study Session</h2>
              <div className="space-y-3">
                <input placeholder="Session title" value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
                <select value={addForm.day} onChange={(e) => setAddForm({ ...addForm, day: e.target.value })}
                  className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none">
                  {days.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select value={addForm.start} onChange={(e) => setAddForm({ ...addForm, start: e.target.value })}
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none">
                    {hours.map((h) => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                  <select value={addForm.duration} onChange={(e) => setAddForm({ ...addForm, duration: e.target.value })}
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none">
                    {[0.5, 1, 1.5, 2, 2.5, 3].map((d) => <option key={d} value={d}>{d}h</option>)}
                  </select>
                </div>
                <button onClick={handleAddSession}
                  className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform">
                  Add Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Study Plan Modal */}
      <AnimatePresence>
        {showAiPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => { setShowAiPlan(false); setAiPlan(null); }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-lg z-10 max-h-[85vh] overflow-auto">
              <button onClick={() => { setShowAiPlan(false); setAiPlan(null); }} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary" /></div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground">Generate AI Study Plan</h2>
                  <p className="text-xs text-muted-foreground">Based on your subjects, hours, and priorities</p>
                </div>
              </div>

              {!aiPlan ? (
                <div className="space-y-3">
                  <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Your Subjects</p>
                    {subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No subjects added yet</p>
                    ) : (
                      subjects.map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span className="text-foreground font-medium">{s.name}</span>
                          <span className="text-muted-foreground">{s.requiredHoursPerWeek || s.credits}h/week · {s.priority || "medium"} priority</span>
                        </div>
                      ))
                    )}
                  </div>
                  <button onClick={handleGenerateAiPlan} disabled={aiLoading || subjects.length === 0}
                    className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                    {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Plan...</> : <><Sparkles className="h-4 w-4" /> Generate Plan</>}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">{aiPlan.length} sessions generated</p>
                  <div className="space-y-1.5 max-h-60 overflow-auto">
                    {aiPlan.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 bg-secondary/40 rounded-xl p-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: `hsl(${s.color})` }} />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">{s.title}</p>
                          <p className="text-[11px] text-muted-foreground">{days[s.day]} · {Math.floor(s.start)}:{(s.start % 1) * 60 === 0 ? "00" : "30"} · {s.duration}h</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setAiPlan(null); handleGenerateAiPlan(); }} className="flex-1 h-10 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80">
                      Regenerate
                    </button>
                    <button onClick={handleAcceptPlan} className="flex-1 h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform flex items-center justify-center gap-2">
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