import { useState } from "react";
import Progress from "./pages/user/Progress";
import Notes from "./pages/user/Notes";
import Dashboard from "./pages/user/Dashboard";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Dashboard />
      {/* <Progress /> */}
      {/* <Notes /> */}
    </div>
  );
}
export default App;
