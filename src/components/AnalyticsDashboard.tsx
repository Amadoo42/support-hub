import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryBreakdown {
  name: string;
  value: number;
}

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const AnalyticsDashboard = () => {
  const [totalOpen, setTotalOpen] = useState<number | null>(null);
  const [resolvedToday, setResolvedToday] = useState<number | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const [openResult, resolvedResult, catResult] = await Promise.all([
        supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .neq("status", "Resolved"),
        supabase
          .from("audit_logs")
          .select("*", { count: "exact", head: true })
          .eq("new_status", "Resolved")
          .gte("created_at", todayStart.toISOString()),
        supabase
          .from("tickets")
          .select("category")
          .neq("status", "Resolved"),
      ]);

      const counts: Record<string, number> = {};
      (catResult.data ?? []).forEach((t) => {
        counts[t.category] = (counts[t.category] ?? 0) + 1;
      });

      setTotalOpen(openResult.count ?? 0);
      setResolvedToday(resolvedResult.count ?? 0);
      setCategoryData(Object.entries(counts).map(([name, value]) => ({ name, value })));
      setLoading(false);
    };

    void fetchStats();

    const channel = supabase
      .channel("analytics-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        void fetchStats();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => {
        void fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Total Open Tickets</p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{totalOpen}</p>
          )}
        </div>
        <div className="rounded-lg border border-border p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Resolved Today</p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{resolvedToday}</p>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground mb-3">Open Tickets by Category</p>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : categoryData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No open tickets.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200} aria-label="Open tickets by category">
            <PieChart>
              <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
