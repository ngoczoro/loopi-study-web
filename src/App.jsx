import { useState } from "react";
import Progress from "./pages/user/Progress";
import Notes from "./pages/user/Notes";
import Quiz from "./pages/user/Quiz";
import Dashboard from "./pages/user/Dashboard";
import Subjects from "./pages/user/Subjects";
import { Routes, Route } from "react-router-dom";
import { AppSidebar } from "./components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "./components/sidebar";
import Planner from "./pages/user/Planner";
import "./App.css";

function App() {
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
              <Route path="/progress" element={<Progress />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/quiz" element={<Quiz />} />
              {/* route mac dinh */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
export default App;
