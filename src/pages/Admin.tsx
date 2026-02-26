import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Admin — All Tickets</h1>
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
    </div>
  );
};

export default Admin;
