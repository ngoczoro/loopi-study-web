import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/sidebar";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { AdminNotificationDropdown } from "@/components/AdminNotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useAppStore } from "@/lib/store";
import loopyHappy from "@/assets/loopy-happy.png";

export function TopBar() {
  const currentUser = useAppStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === "admin";
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    navigate(isAdmin ? "/admin/profile" : "/settings");
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border/50">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-3">
        {isAdmin ? <AdminNotificationDropdown /> : <NotificationDropdown />}
        <button
          onClick={handleAvatarClick}
          className="rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
        >
          <img
            src={loopyHappy}
            alt="User"
            className="h-8 w-8 rounded-full ring-2 ring-secondary"
          />
        </button>
      </div>
    </header>
  );
}
