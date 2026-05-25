import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/chart";

export default function FocusTrendChart({ trends, loading }) {
  if (loading || !trends?.points?.length) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border h-64 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading trends…" : "No focus data yet"}
        </p>
      </div>
    );
  }

  const data = trends.points.slice(-14).map((p) => ({
    label: p.date.slice(5),
    minutes: p.focusMinutes,
  }));

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
      <h2 className="font-semibold text-foreground mb-4">Daily focus (last 2 weeks)</h2>
      <ChartContainer
        config={{ minutes: { label: "Focus min", color: "hsl(var(--primary))" } }}
        className="h-56 w-full"
      >
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
