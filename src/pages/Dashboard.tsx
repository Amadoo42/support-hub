import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import TicketForm from "@/components/TicketForm";
import TicketList from "@/components/TicketList";
import Sidebar from "@/components/Sidebar";

const Dashboard = () => {
  const { role } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

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
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Submit a ticket and we'll get back to you shortly.</p>
          </div>

          {/* Submit Ticket */}
          <TicketForm onTicketCreated={() => setRefreshKey((k) => k + 1)} />

          {/* My Tickets */}
          <TicketList refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
