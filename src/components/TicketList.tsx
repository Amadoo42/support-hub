import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import TicketDetailModal from "@/components/TicketDetailModal";

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

interface TicketListProps {
  refreshKey: number;
}

const TicketList = ({ refreshKey }: TicketListProps) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setTickets(data as Ticket[]);
      }
      setLoading(false);
    };
    fetchTickets();
  }, [user, refreshKey]);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">My Tickets</h2>
      </div>
      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-sm">
          No tickets yet. Submit one above to get started.
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
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTicket(ticket)}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(ticket.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium text-sm">{ticket.category}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[300px] truncate">
                  {ticket.description}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusVariant[ticket.status] || "bg-muted text-muted-foreground"}`}>
                    {ticket.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <TicketDetailModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
};

export default TicketList;
