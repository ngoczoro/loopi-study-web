import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/auth/Login";
import Progress from "./pages/user/Progress";
import Notes from "./pages/user/Notes";
import Quiz from "./pages/user/Quiz";
import Pomodoro from "./pages/user/Pomodoro";
import Dashboard from "./pages/user/Dashboard";
import Subjects from "./pages/user/Subjects";
import Planner from "./pages/user/Planner";
import Settings from "./pages/user/Settings";
import Notifications from "./pages/user/Notifications";
import Goals from "./pages/user/Goals";
import AdminLayout from "./components/AdminLayout";
import AdminContent from "./pages/admin/AdminContent";
import AdminWarnings from "./pages/admin/AdminWarnings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import NotFound from "./pages/NotFound";
import { AppSidebar } from "./components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "./components/sidebar";
import { FilePreviewModal } from "./components/FilePreviewModal";
import AuthLoadingScreen from "./components/AuthLoadingScreen";
import AppBootstrap from "./components/AppBootstrap";
import { FocusSessionProvider } from "./contexts/FocusSessionContext";

import "./App.css";

function App() {
  const { authReady, isAuthenticated, user } = useAuth();

  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/register" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <AppBootstrap>
      <AdminLayout>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/warnings" element={<AdminWarnings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AdminLayout>
      </AppBootstrap>
    );
  }

  return (
    <AppBootstrap>
    <FocusSessionProvider>
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 flex items-center border-b md:hidden">
            <SidebarTrigger />
            <span className="ml-4 font-bold text-sm">Loopi Study</span>
          </div>

          <div className="p-4 md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
      <FilePreviewModal />
    </SidebarProvider>
    </FocusSessionProvider>
    </AppBootstrap>
  );
}

export default App;
