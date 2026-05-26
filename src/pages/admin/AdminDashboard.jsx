"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, CalendarDays, Loader2, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/skeleton";
import { cn } from "@/lib/utils";
import { formatAdminUserDate } from "@/lib/adminUserUtils";
import {
  getDashboardStats,
  getRecentContent,
} from "@/services/adminDashboardService";

const chartConfig = {
  students: { label: "Students", color: "hsl(var(--primary))" },
  sessions: { label: "Sessions", color: "hsl(var(--accent))" },
};

const RECENT_CONTENT_LIMIT = 15;
const RECENT_CONTENT_SCROLL_THRESHOLD = 5;

const weeklyData = [
  { day: "Mon", sessions: 4, students: 3 },
  { day: "Tue", sessions: 6, students: 5 },
  { day: "Wed", sessions: 3, students: 2 },
  { day: "Thu", sessions: 7, students: 4 },
  { day: "Fri", sessions: 5, students: 6 },
  { day: "Sat", sessions: 2, students: 1 },
  { day: "Sun", sessions: 1, students: 1 },
];

const typeLabel = {
  note: "Note",
  file: "File",
  link: "Link",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [recentError, setRecentError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoadingStats(true);
    setLoadingRecent(true);
    setStatsError(null);
    setRecentError(null);

    const [statsResult, recentResult] = await Promise.all([
      getDashboardStats(),
      getRecentContent({ limit: RECENT_CONTENT_LIMIT }),
    ]);

    setLoadingStats(false);
    setLoadingRecent(false);

    if (statsResult.success) {
      setStats(statsResult.data);
    } else {
      setStatsError(statsResult.message || "Failed to load stats");
      toast.error(statsResult.message || "Failed to load dashboard stats");
    }

    if (recentResult.success) {
      setRecentContent(recentResult.data);
    } else {
      setRecentError(recentResult.message || "Failed to load recent content");
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalStudents = stats?.totalStudents ?? 0;
  const activeStudents = stats?.activeStudents ?? 0;
  const lockedStudents = stats?.lockedStudents ?? 0;
  const totalSubjects = stats?.totalSubjects ?? 0;

  const activeRate =
    totalStudents > 0
      ? `${Math.round((activeStudents / totalStudents) * 100)}%`
      : "0%";

  const statCards = [
    {
      label: "Total Students",
      value: loadingStats ? "—" : totalStudents,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Total Subjects",
      value: loadingStats ? "—" : totalSubjects,
      icon: BookOpen,
      color: "bg-accent/10 text-accent-foreground",
    },
    {
      label: "Study Sessions",
      value: weeklyData.reduce((sum, d) => sum + d.sessions, 0),
      icon: CalendarDays,
      color: "bg-secondary text-secondary-foreground",
    },
    {
      label: "Active Rate",
      value: loadingStats ? "—" : activeRate,
      icon: TrendingUp,
      color: "bg-accent/10 text-accent-foreground",
    },
  ];

  const pieData = useMemo(
    () => [
      {
        name: "Active",
        value: activeStudents,
        fill: "hsl(var(--accent))",
      },
      {
        name: "Locked",
        value: lockedStudents,
        fill: "hsl(var(--destructive))",
      },
    ],
    [activeStudents, lockedStudents],
  );

  const shouldScrollRecent =
    !loadingRecent &&
    !recentError &&
    recentContent.length > RECENT_CONTENT_SCROLL_THRESHOLD;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          System overview & statistics
        </p>
      </div>

      {statsError ? (
        <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{statsError}</span>
          <button
            type="button"
            onClick={loadDashboard}
            className="text-xs font-medium underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-5 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}
              >
                <s.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {loadingStats && s.label !== "Study Sessions" ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Weekly Activity
          </h2>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="sessions"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="students"
                fill="hsl(var(--accent))"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Student Status
          </h2>
          {loadingStats ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Recent Content
        </h2>

        {loadingRecent ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : recentError ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-destructive">{recentError}</p>
            <button
              type="button"
              onClick={loadDashboard}
              className="text-xs font-medium text-primary underline"
            >
              Retry
            </button>
          </div>
        ) : recentContent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No uploaded content yet.
          </p>
        ) : (
          <div
            className={cn(
              "space-y-2",
              shouldScrollRecent && "max-h-[400px] overflow-y-auto widget-scroll-area pr-1",
            )}
          >
            {recentContent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/admin/content/${item.id}`)}
                className="w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-xl border-b border-border/50 last:border-0 text-left hover:bg-secondary/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {typeLabel[item.type] || item.type} · {item.uploadedBy} ·{" "}
                    {formatAdminUserDate(item.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
