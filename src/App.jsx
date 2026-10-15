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
import Groups from "./pages/user/Groups";
import GroupDetail from "./pages/user/GroupDetail";
import Assistant from "./pages/user/Assistant";
import AdminLayout from "./components/AdminLayout";
import AdminContent from "./pages/admin/AdminContent";
import AdminContentPreview from "./pages/admin/AdminContentPreview";
import AdminWarnings from "./pages/admin/AdminWarnings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProfile from "./pages/admin/AdminProfile";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";
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
          <Route path="/admin/content/:id" element={<AdminContentPreview />} />
          <Route path="/admin/warnings" element={<AdminWarnings />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AdminLayout>
      </AppBootstrap>
    );
  }

  return (
    <AppBootstrap>
      <FocusSessionProvider>
        <Layout>
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
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
            <Route path="/assistant/:conversationId?" element={<Assistant />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </FocusSessionProvider>
    </AppBootstrap>
  );
}

export default App;
