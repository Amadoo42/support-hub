import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Ticket, BarChart3,
  Plus, Search, Bell,
  TrendingUp,
  Users, Timer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import TicketForm from "@/components/TicketForm";
import TicketList from "@/components/TicketList";
import Sidebar from "@/components/Sidebar";

const stats = [
  { label: "Open Tickets", value: "24", icon: Ticket, change: "+3 today", accent: "text-primary" },
  { label: "Avg. Resolution", value: "4.2h", icon: Timer, change: "-12% this week", accent: "text-accent" },
  { label: "SLA Compliance", value: "96.8%", icon: TrendingUp, change: "+2.1%", accent: "text-success" },
  { label: "Active Agents", value: "8", icon: Users, change: "2 available", accent: "text-muted-foreground" },
];

const recentTickets = [
  { id: "FD-1042", subject: "Wire transfer failed — timeout error", priority: "High", status: "Open", time: "12 min ago" },
  { id: "FD-1041", subject: "KYC document upload not working", priority: "Medium", status: "In Progress", time: "34 min ago" },
  { id: "FD-1040", subject: "Account statement discrepancy", priority: "Low", status: "Open", time: "1h ago" },
  { id: "FD-1039", subject: "Two-factor auth reset request", priority: "High", status: "Pending", time: "2h ago" },
  { id: "FD-1038", subject: "API rate limit exceeded for partner", priority: "Medium", status: "Resolved", time: "3h ago" },
];

const priorityColor: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/10 text-warning",
  Low: "bg-muted text-muted-foreground",
};

const statusColor: Record<string, string> = {
  Open: "bg-primary/10 text-primary",
  "In Progress": "bg-accent/10 text-accent",
  Pending: "bg-warning/10 text-warning",
  Resolved: "bg-success/10 text-success",
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets..." className="pl-10 bg-secondary border-0" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> New Ticket
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Here's your support overview for today.</p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`h-4 w-4 ${stat.accent}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Create Ticket */}
          <TicketForm onTicketCreated={() => setRefreshKey((k) => k + 1)} />

          {/* My Tickets */}
          <TicketList refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
