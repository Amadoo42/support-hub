import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Clock, ArrowRight } from "lucide-react";

interface Ticket {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  ticket_id: string;
  old_status: string | null;
  new_status: string | null;
  changed_by: string;
  created_at: string;
}

interface TicketDetailModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

const statusVariant: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Open: "bg-primary/10 text-primary",
  "In Progress": "bg-accent/10 text-accent",
  Resolved: "bg-success/10 text-success",
};

const priorityVariant: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-primary/10 text-primary",
  High: "bg-warning/10 text-warning",
  Critical: "bg-destructive/10 text-destructive",
};

const TicketDetailModal = ({ ticket, open, onClose }: TicketDetailModalProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (!open || !ticket) return;

    const fetchLogs = async () => {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setAuditLogs((data as AuditLog[]) ?? []);
      }
      setLoadingLogs(false);
    };

    fetchLogs();
  }, [open, ticket]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl w-full flex flex-col max-h-[85vh]">
        {ticket && (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-base font-semibold">{ticket.category}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusVariant[ticket.status] || "bg-muted text-muted-foreground"}`}>
                  {ticket.status}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityVariant[ticket.priority] || "bg-muted text-muted-foreground"}`}>
                  {ticket.priority}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{ticket.description}</p>
            </DialogHeader>

            <Tabs defaultValue="history" className="flex-1 min-h-0 flex flex-col">
              <TabsList className="shrink-0">
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="flex-1 overflow-y-auto">
                {loadingLogs ? (
                  <div className="space-y-3 p-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No status changes recorded yet.
                  </p>
                ) : (
                  <div className="relative pl-6 py-2 space-y-0">
                    {/* Vertical line */}
                    <div className="absolute left-[11px] top-4 bottom-4 w-px bg-border" />
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative flex items-start gap-3 pb-6 last:pb-0">
                        <div className="absolute left-[-13px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] ${statusVariant[log.old_status || ""] || ""}`}>
                              {log.old_status || "—"}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className={`text-[10px] ${statusVariant[log.new_status || ""] || ""}`}>
                              {log.new_status || "—"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailModal;
