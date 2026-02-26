import { Shield, LogOut, BarChart3, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const customerNavItems = [
  { icon: BarChart3, label: "Dashboard", to: "/dashboard" },
];

const adminNavItems = [
  { icon: ShieldCheck, label: "Admin Panel", to: "/admin" },
];

const Sidebar = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  const navItems = role === "admin" ? adminNavItems : customerNavItems;

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-2 h-16 px-6 border-b border-sidebar-border">
        <Shield className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-bold text-sidebar-primary-foreground">FinDesk</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold text-sidebar-accent-foreground">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
