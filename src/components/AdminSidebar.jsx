import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import loopyHappy from "@/assets/loopy-happy.png";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/sidebar";

const adminNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Content Management", url: "/admin/content", icon: FileText },
  { title: "Violations", url: "/admin/warnings", icon: AlertTriangle },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    // Use window.location to force page reload and ensure clean state
    window.location.href = "/login";
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-soft">
      {/* HEADER */}
      <div className="p-4 flex items-center gap-3">
        <img src={loopyHappy} alt="Loopy" className="w-10 h-10 rounded-full" />
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              Admin
            </span>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      {/* MENU */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        h-11 rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-soft-md"
                            : "text-foreground hover:bg-secondary/60"
                        }
                      `}
                    >
                      <NavLink to={item.url}>
                        <item.icon
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.5}
                        />
                        {!collapsed && (
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 h-11 rounded-xl text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-sm"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          {!collapsed && <span className="font-medium">Log out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
