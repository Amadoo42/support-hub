import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { Ticket as TicketIcon, TrendingUp, Users, Timer } from "lucide-react";

const stats = [
  { label: "Open Tickets", value: "24", icon: TicketIcon, change: "+3 today", accent: "text-primary" },
  { label: "Avg. Resolution", value: "4.2h", icon: Timer, change: "-12% this week", accent: "text-accent" },
  { label: "SLA Compliance", value: "96.8%", icon: TrendingUp, change: "+2.1%", accent: "text-success" },
  { label: "Active Agents", value: "8", icon: Users, change: "2 available", accent: "text-muted-foreground" },
];

interface Ticket {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
}

const statusVariant: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Open: "bg-primary/10 text-primary",
  "In Progress": "bg-accent/10 text-accent",
  Resolved: "bg-success/10 text-success",
};

const STATUS_OPTIONS = ["Pending", "Open", "In Progress", "Resolved"];

const Admin = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Failed to load tickets.");
      } else {
        setTickets(data as Ticket[]);
      }
      setLoading(false);
    };
    fetchTickets();

    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTickets((prev) => [payload.new as Ticket, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTickets((prev) =>
              prev.map((t) => (t.id === (payload.new as Ticket).id ? (payload.new as Ticket) : t))
            );
          } else if (payload.eventType === "DELETE") {
            setTickets((prev) => prev.filter((t) => t.id !== (payload.old as Ticket).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (ticket: Ticket, newStatus: string) => {
    const { error } = await supabase
      .from("tickets")
      .update({ status: newStatus })
      .eq("id", ticket.id);

    if (error) {
      toast.error("Failed to update ticket status.");
    } else {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t))
      );
      toast.success("Ticket status updated.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
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

        <h2 className="text-lg font-semibold text-foreground">All Tickets</h2>
        <div className="rounded-xl border border-border bg-card">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No tickets found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{ticket.category}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[300px] truncate">
                      {ticket.description}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket, value)}
                      >
                        <SelectTrigger
                          className={`w-36 text-xs font-medium rounded-full px-2.5 py-1 border-0 ${statusVariant[ticket.status] || "bg-muted text-muted-foreground"}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      </main>
    </div>
  );
};

export default Admin;
