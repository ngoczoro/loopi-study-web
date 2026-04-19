import { motion } from "framer-motion";
import { Flame, Clock, CheckCircle2, BookOpen, Timer, ArrowRight } from "lucide-react";
import WeeklyTimeline from "../../components/WeeklyTimeline";
import TodayTasks from "../../components/TodayTasks";
import loopyHappy from "../../assets/loopy-happy.png";
import { Link } from "react-router-dom";
import { useAppStore } from "../../lib/store";

const deadlines = [
  { subject: "Mathematics", task: "Problem Set #7", dueIn: "2 days" },
  { subject: "Computer Science", task: "Final Project", dueIn: "5 days" },
  { subject: "Biology", task: "Lab Report", dueIn: "1 week" },
];

export default function Dashboard() {
  const { tasks, sessions } = useAppStore();
  
  // Tính toán dữ liệu
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks?.filter((t) => t.taskDate === today) || [];
  const completed = todayTasks.filter((t) => t.completed).length;
  const totalHours = sessions?.reduce((sum, s) => sum + s.duration, 0) || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-4">
      {/* Hero Section */}
      <div className="relative bg-card rounded-2xl p-6 md:p-8 shadow-soft overflow-hidden border border-border">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
              Ready for a cozy study session? 📚
            </h1>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              Loopy is cheering for you! You have <span className="font-semibold text-foreground">{todayTasks.length - completed} tasks</span> to tackle today.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <Link 
                to="/pomodoro" 
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md hover:scale-[1.02] transition-transform"
              >
                <Timer className="h-4 w-4" strokeWidth={1.5} /> Start Studying
              </Link>
              <Link 
                to="/planner" 
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
              >
                View Planner <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
          <motion.img 
            src={loopyHappy} 
            alt="Loopy mascot" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain"
            animate={{ y: [0, -8, 0] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} 
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: "Streak", value: "7 days", color: "text-orange-500" },
          { icon: Clock, label: "Today", value: `${totalHours.toFixed(1)} hrs`, color: "text-blue-500" },
          { icon: CheckCircle2, label: "Completed", value: `${completed} / ${todayTasks.length}`, color: "text-green-500" },
          { icon: BookOpen, label: "Subjects", value: "5 active", color: "text-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2} />
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <TodayTasks />
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {deadlines.map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="h-2 w-2 rounded-full bg-red-400 mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{d.task}</p>
                  <p className="text-xs text-muted-foreground">{d.subject} · {d.dueIn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Study Timeline */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
         <WeeklyTimeline />
      </div>
    </div>
  );
}