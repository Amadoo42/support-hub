import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        toast.error("Failed to load tickets.");
      } else {
        const all = data as Ticket[];
        const open: Ticket[] = [];
        const resolved: Ticket[] = [];
        for (const t of all) {
          if (t.status === "Resolved") resolved.push(t);
          else open.push(t);
        }
        setTickets(sortTickets(open));
        setArchivedTickets(sortTickets(resolved));
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
            if (t.status === "Resolved") {
              setArchivedTickets((prev) => sortTickets([...prev, t]));
            } else {
              setTickets((prev) => sortTickets([...prev, t]));
            }
          } else if (payload.eventType === "UPDATE") {
            const t = payload.new as Ticket;
            if (t.status === "Resolved") {
              setTickets((prev) => prev.filter((x) => x.id !== t.id));
              setArchivedTickets((prev) => sortTickets([...prev.filter((x) => x.id !== t.id), t]));
            } else {
              setArchivedTickets((prev) => prev.filter((x) => x.id !== t.id));
              setTickets((prev) => sortTickets([...prev.filter((x) => x.id !== t.id), t]));
            }
            setSelectedTicket((prev) => (prev && prev.id === t.id ? { ...prev, ...t } : prev));
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as Ticket).id;
            setTickets((prev) => prev.filter((x) => x.id !== id));
            setArchivedTickets((prev) => prev.filter((x) => x.id !== id));
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
      if (newStatus === "Resolved") {
        setTickets((prev) => prev.filter((x) => x.id !== ticket.id));
        setArchivedTickets((prev) => sortTickets([...prev.filter((x) => x.id !== ticket.id), { ...ticket, status: newStatus }]));
      } else {
        setArchivedTickets((prev) => prev.filter((x) => x.id !== ticket.id));
        setTickets((prev) => sortTickets([...prev.filter((x) => x.id !== ticket.id), { ...ticket, status: newStatus }]));
      }
      setSelectedTicket((prev) =>
        prev && prev.id === ticket.id ? { ...prev, status: newStatus } : prev
      );
      toast.success("Ticket status updated.");
    }
  };

  const matchesSearch = (ticket: Ticket) =>
    !searchQuery.trim() ||
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredTickets = tickets.filter(matchesSearch);
  const filteredArchived = archivedTickets.filter(matchesSearch);

  const ticketTableRows = (list: Ticket[]) =>
    list.map((ticket) => (
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
    ));

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">Here's your support overview for today.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-10 bg-secondary border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
          ) : filteredTickets.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              {tickets.length === 0 ? "No open tickets found." : "No tickets match your search."}
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
                {ticketTableRows(filteredTickets)}
              </TableBody>
            </Table>
          )}
        </div>

        <h2 className="text-lg font-semibold text-foreground">Archived (Resolved)</h2>
        <div className="rounded-xl border border-border bg-card">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredArchived.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              {archivedTickets.length === 0 ? "No resolved tickets yet." : "No archived tickets match your search."}
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
                {ticketTableRows(filteredArchived)}
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
