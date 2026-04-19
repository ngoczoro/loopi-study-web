import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Timer,
  BarChart3,
  FileText,
  Target,
  Bell,
  Settings,
  LogOut,
  Brain,
} from "lucide-react";
import { NavLink } from "./NavLink";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../lib/store";
import loopyHappy from "../assets/loopy-happy.png";
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
} from "./sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Subjects", url: "/subjects", icon: BookOpen },
  { title: "Study Planner", url: "/planner", icon: CalendarDays },
  { title: "Pomodoro Timer", url: "/pomodoro", icon: Timer },
  { title: "Progress", url: "/progress", icon: BarChart3 },
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Quizzes", url: "/quiz", icon: Brain },
  { title: "Goals & Streak", url: "/goals", icon: Target },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  // Lấy hàm logout từ store
  const logout = useAppStore((state) => state.logout);

  const handleLogout = () => {
    if (logout) {
      logout();
      toast.success("Logged out successfully 👋");
      navigate("/login");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-soft">
      <div className="p-4 flex items-center gap-3">
        <img src={loopyHappy} alt="Loopy" className="w-10 h-10 rounded-full" />
        {!collapsed && (
          <span className="font-display font-bold text-lg text-foreground tracking-tight">
            StudyBeaver
          </span>
        )}
      </div>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11 rounded-xl transition-all duration-200">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 text-muted-foreground hover:bg-secondary/60"
                      activeClassName="bg-primary text-primary-foreground shadow-soft-md hover:bg-primary"
                    >
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 h-11 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-sm"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          {!collapsed && <span className="font-medium">Log out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}