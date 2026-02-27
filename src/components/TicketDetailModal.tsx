import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface Ticket {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  body: string;
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

const TicketDetailModal = ({ ticket, open, onClose }: TicketDetailModalProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !ticket) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setMessages((data as TicketMessage[]) ?? []);
      }
      setLoadingMessages(false);
    };

    fetchMessages();

    const fetchAuditLogs = async () => {
      setLoadingAudit(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (!error) setAuditLogs((data as AuditLog[]) ?? []);
      setLoadingAudit(false);
    };

    fetchAuditLogs();

    const channel = supabase
      .channel(`ticket-messages-${ticket.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticket.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TicketMessage]);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs", filter: `ticket_id=eq.${ticket.id}` },
        (payload) => {
          const newLog = payload.new as AuditLog;
          setAuditLogs((prev) => {
            if (prev.some((log) => log.id === newLog.id)) return prev;
            return [...prev, newLog];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, ticket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket || !user) return;

    setSending(true);
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      body: newMessage.trim(),
    });
    setSending(false);

    if (error) {
      toast.error("Failed to send message.");
      console.error(error);
    } else {
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!newMessage.trim() || !ticket || !user || sending) return;
      setSending(true);
      supabase
        .from("ticket_messages")
        .insert({ ticket_id: ticket.id, sender_id: user.id, body: newMessage.trim() })
        .then(({ error }) => {
          setSending(false);
          if (error) {
            toast.error("Failed to send message.");
            console.error(error);
          } else {
            setNewMessage("");
          }
        });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl w-full flex flex-col max-h-[85vh]">
        {ticket && (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-base font-semibold">{ticket.category}</DialogTitle>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusVariant[ticket.status] || "bg-muted text-muted-foreground"}`}>
                  {ticket.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{ticket.description}</p>
            </DialogHeader>

            <div className="border-t border-border" />

            <Tabs defaultValue="conversation" className="flex-1 flex flex-col min-h-0">
              <TabsList className="shrink-0 w-fit">
                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="conversation" className="flex-1 flex flex-col min-h-0 mt-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
                  {loadingMessages ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-3/4" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No messages yet. Start the conversation below.
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-secondary text-secondary-foreground rounded-bl-sm"
                            }`}
                          >
                            <p>{msg.body}</p>
                            <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-border" />

                {/* Message form */}
                <form onSubmit={handleSend} className="flex items-end gap-2 shrink-0 pt-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    rows={2}
                    className="flex-1 resize-none"
                    onKeyDown={handleKeyDown}
                  />
                  <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="history" className="flex-1 overflow-y-auto min-h-0 mt-0">
                {loadingAudit ? (
                  <div className="space-y-3 py-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No status changes recorded yet.
                  </p>
                ) : (
                  <ol className="relative border-l border-border ml-3 py-4 space-y-6">
                    {auditLogs.map((log) => (
                      <li key={log.id} className="ml-4">
                        <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-primary" />
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <p className="text-sm text-foreground mt-0.5">
                          Status changed from{" "}
                          <span className="font-medium">{log.old_status ?? "—"}</span> to{" "}
                          <span className="font-medium">{log.new_status ?? "—"}</span>
                        </p>
                      </li>
                    ))}
                  </ol>
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
