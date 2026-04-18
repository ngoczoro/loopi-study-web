import { useState } from "react";
import WeeklyTimeline from "./components/WeeklyTimeline";
import {Button} from "./components/button";
import {Badge} from "./components/badge";
import {Calendar} from "./components/calendar";
import {Input} from "./components/input";
import "./App.css";

function App() {
  
  return (
    <>
      <Button>Hello</Button>
      <Input placeholder="Enter your name..." />
      <Badge variant="destructive">Destructive</Badge>
      <Calendar />
      </>
  );
}
export default App;