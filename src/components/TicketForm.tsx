import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const categories = ["Account Issue", "Payment", "KYC / Compliance", "Technical", "General Inquiry"];

interface TicketFormProps {
  onTicketCreated: () => void;
}

const TicketForm = ({ onTicketCreated }: TicketFormProps) => {
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from("tickets").insert({
      user_id: user.id,
      category,
      description: description.trim(),
    });
    setLoading(false);

    if (error) {
      toast.error("Failed to create ticket.");
      console.error(error);
    } else {
      toast.success("Ticket created successfully.");
      setCategory("");
      setDescription("");
      onTicketCreated();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Submit a Ticket</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            className="min-h-[80px]"
          />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="gap-2">
        <Plus className="h-4 w-4" />
        {loading ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  );
};

export default TicketForm;
