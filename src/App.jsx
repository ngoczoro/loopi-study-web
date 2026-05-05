import { useState } from "react";
import Progress from "./pages/user/Progress";
import Notes from "./pages/user/Notes";
import Quiz from "./pages/user/Quiz";
import Pomodoro from "./pages/user/Pomodoro";
import Dashboard from "./pages/user/Dashboard";
import Subjects from "./pages/user/Subjects";
import { Routes, Route } from "react-router-dom";
import { AppSidebar } from "./components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "./components/sidebar";
import { AdminLayout } from "./components/AdminLayout";
import Planner from "./pages/user/Planner";
import Settings from "./pages/user/Settings";
import Login from "./pages/auth/Login";
import { useAppStore } from "./lib/store";
import NotFound from "./pages/NotFound";
import AdminContent from "./pages/admin/AdminContent";
import "./App.css";

function App() {
  // Check nếu user đã login
  const currentUser = useAppStore((s) => s.currentUser);

  // Nếu chưa login, chỉ hiển thị login page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    );
  }

  // Nếu là admin, hiển thị admin layout
  if (currentUser.role === "admin") {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AdminLayout>
    );
  }

  // Nếu là user, hiển thị user layout
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 flex items-center border-b md:hidden">
            <SidebarTrigger />
            <span className="ml-4 font-bold text-sm">StudyBeaver</span>
          </div>

          <div className="p-4 md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/settings" element={<Settings />} />
              {/* route mac dinh */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
export default App;
