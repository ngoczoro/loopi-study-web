"use client"

import { useAdminDemoStore } from "@/lib/adminDemoStore";
import { useSubjects } from "@/hooks/useSubjects";
import { motion } from "framer-motion";
import { Users, BookOpen, CalendarDays, TrendingUp } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

const chartConfig = {
  students: { label: "Students", color: "hsl(var(--primary))" },
  sessions: { label: "Sessions", color: "hsl(var(--accent))" },
};

export default function AdminDashboard() {
  const { users, documents } = useAdminDemoStore();
  const { subjects } = useSubjects();
  const students = users.filter((u) => u.role === "student");
  const activeStudents = students.filter((u) => !u.locked);

  const weeklyData = [
    { day: "Mon", sessions: 4, students: 3 },
    { day: "Tue", sessions: 6, students: 5 },
    { day: "Wed", sessions: 3, students: 2 },
    { day: "Thu", sessions: 7, students: 4 },
    { day: "Fri", sessions: 5, students: 6 },
    { day: "Sat", sessions: 2, students: 1 },
    { day: "Sun", sessions: 1, students: 1 },
  ];

  const stats = [
    { label: "Total Students", value: students.length, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Total Subjects", value: subjects.length, icon: BookOpen, color: "bg-accent/10 text-accent-foreground" },
    {
      label: "Study Sessions",
      value: weeklyData.reduce((sum, d) => sum + d.sessions, 0),
      icon: CalendarDays,
      color: "bg-secondary text-secondary-foreground",
    },
    {
      label: "Active Rate",
      value: students.length > 0 ? `${Math.round((activeStudents.length / students.length) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "bg-accent/10 text-accent-foreground",
    },
  ];

  const pieData = [
    { name: "Active", value: activeStudents.length, fill: "hsl(var(--accent))" },
    { name: "Locked", value: students.length - activeStudents.length, fill: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System overview & statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-5 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground mb-4">Weekly Activity</h2>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="students" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground mb-4">Student Status</h2>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent Content</h2>
        <div className="space-y-2">
          {documents.slice(0, 5).map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.type} · {d.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}