import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Ticket as TicketIcon, CheckCircle, BarChart3 } from "lucide-react";
import { startOfDay } from "date-fns";

interface Ticket {
  id: string;
  category: string;
  status: string;
  created_at: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--success))",
];

interface AdminAnalyticsProps {
  tickets: Ticket[];
  loading: boolean;
}

const AdminAnalytics = ({ tickets, loading }: AdminAnalyticsProps) => {
  const openTickets = tickets.filter((t) => t.status !== "Resolved");
  const todayStart = startOfDay(new Date()).toISOString();
  const resolvedToday = tickets.filter(
    (t) => t.status === "Resolved" && t.created_at >= todayStart
  );

  const categoryBreakdown = openTickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  if (loading) {
    return (
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Open</CardTitle>
          <TicketIcon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">{openTickets.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Resolved Today</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">{resolvedToday.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Open by Category</CardTitle>
          <BarChart3 className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tickets</p>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
