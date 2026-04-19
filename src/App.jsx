import { useState } from "react";
import WeeklyTimeline from "./components/WeeklyTimeline";
import {Button} from "./components/button";
import {Badge} from "./components/badge";
import {Calendar} from "./components/calendar";
import {Input} from "./components/input";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, SelectLabel} from "./components/select";
import {Popover, PopoverTrigger, PopoverContent} from "./components/popover";
import {Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription} from "./components/sheet";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from "./components/AlertDialog";
import TodayTasks from "./components/TodayTasks";
import {Toaster} from "sonner";
import "./App.css";

function App() {
  const [value, setValue] = useState("");

  return (
  <div className="min-h-screen bg-background p-4 md:p-8">
      <main className="max-w-2xl mx-auto space-y-6">
        {/* Tiêu đề ứng dụng hoặc Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Study Planner</h1>
          <p className="text-muted-foreground">Manage your daily learning flow.</p>
        </header>

        {/* Chèn component TodayTasks vào đây */}
        <TodayTasks />

        {/* Các component khác như Calendar, SubjectList... */}
      </main>

      {/* Component này quản lý việc hiển thị thông báo (toast) */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
export default App;