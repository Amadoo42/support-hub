import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import TicketDetailModal from "@/components/TicketDetailModal";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

interface Ticket {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

const statusVariant: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Open: "bg-primary/10 text-primary",
  "In Progress": "bg-accent/10 text-accent",
  Resolved: "bg-success/10 text-success",
};

const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const priorityVariant: Record<string, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
  High: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-success/10 text-success border-success/20",
};

const STATUS_OPTIONS = ["Pending", "Open", "In Progress", "Resolved"];

const sortTickets = (list: Ticket[]) =>
  [...list].sort((a, b) => {
    const aPri = PRIORITY_ORDER[a.priority] ?? 99;
    const bPri = PRIORITY_ORDER[b.priority] ?? 99;
    if (aPri !== bPri) return aPri - bPri;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

const Admin = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .neq("status", "Resolved")
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        toast.error("Failed to load tickets.");
      } else {
        setTickets(sortTickets(data as Ticket[]));
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
            const t = payload.new as Ticket;
            if (t.status !== "Resolved") {
              setTickets((prev) => sortTickets([...prev, t]));
            }
          } else if (payload.eventType === "UPDATE") {
            const t = payload.new as Ticket;
            setTickets((prev) => {
              const filtered = prev.filter((x) => x.id !== t.id);
              if (t.status === "Resolved") return sortTickets(filtered);
              return sortTickets([...filtered, t]);
            });
            setSelectedTicket((prev) => (prev && prev.id === t.id ? { ...prev, ...t } : prev));
          } else if (payload.eventType === "DELETE") {
            setTickets((prev) => prev.filter((x) => x.id !== (payload.old as Ticket).id));
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
      setTickets((prev) => {
        const filtered = prev.filter((x) => x.id !== ticket.id);
        if (newStatus === "Resolved") return sortTickets(filtered);
        return sortTickets([...filtered, { ...ticket, status: newStatus }]);
      });
      setSelectedTicket((prev) =>
        prev && prev.id === ticket.id ? { ...prev, status: newStatus } : prev
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

        <AnalyticsDashboard />

        <h2 className="text-lg font-semibold text-foreground">Open Tickets</h2>
        <div className="rounded-xl border border-border bg-card">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No open tickets found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{ticket.category}</TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs font-medium ${priorityVariant[ticket.priority] ?? "bg-muted text-muted-foreground"}`}
                        variant="outline"
                      >
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[300px] truncate">
                      {ticket.description}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
      <TicketDetailModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
};

export default Admin;
