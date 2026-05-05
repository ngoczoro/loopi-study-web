import { Flame, Trophy, Target, Star, Lock } from "lucide-react";
import { motion } from "framer-motion";
import loopyHappy from "@/assets/loopy-happy.png";

const goals = [
  { title: "Study 3 hours daily", progress: 2.5, target: 3, unit: "hrs" },
  { title: "Complete 5 tasks per day", progress: 3, target: 5, unit: "tasks" },
  { title: "Finish Math chapters", progress: 5, target: 8, unit: "chapters" },
  { title: "Practice French 30min", progress: 20, target: 30, unit: "min" },
];

const badges = [
  { name: "First Session", icon: Star, unlocked: true },
  { name: "3-Day Streak", icon: Flame, unlocked: true },
  { name: "7-Day Streak", icon: Flame, unlocked: true },
  { name: "10 Tasks Done", icon: Trophy, unlocked: true },
  { name: "30-Day Streak", icon: Flame, unlocked: false },
  { name: "Subject Master", icon: Target, unlocked: false },
];

export default function Goals() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Goals & Streak</h1>
          <p className="text-sm text-muted-foreground">Stay motivated and earn rewards</p>
        </div>
        <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft">
          <Flame className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <span className="text-lg font-bold text-foreground">7</span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
      </div>

      {/* Goals */}
      <div className="grid sm:grid-cols-2 gap-3">
        {goals.map((goal) => (
          <div key={goal.title} className="bg-card rounded-2xl p-4 shadow-soft">
            <p className="text-sm font-medium text-foreground mb-2">{goal.title}</p>
            <div className="h-2 rounded-full bg-secondary overflow-hidden mb-1.5">
              <div 
                className="h-full rounded-full bg-accent" 
                style={{ width: `${(goal.progress / goal.target) * 100}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {goal.progress} / {goal.target} {goal.unit}
            </p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Badges & Rewards</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl ${
                badge.unlocked ? "bg-primary/10" : "bg-secondary/50 opacity-50"
              }`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                badge.unlocked ? "bg-primary/20" : "bg-secondary"
              }`}>
                {badge.unlocked ? (
                  <badge.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>
              <span className="text-[10px] font-medium text-center text-foreground leading-tight">
                {badge.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-soft">
        <img src={loopyHappy} alt="Loopy" className="w-10 h-10" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Loopy says:</span> "You're doing great! Keep that streak going! 🔥"
        </p>
      </div>
    </div>
  );
}