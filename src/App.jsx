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
import "./App.css";

function App() {
  const [value, setValue] = useState("");

  return (
  <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Xóa dữ liệu</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi máy chủ.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={() => console.log("Đã xóa!")}>
            Tiếp tục
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export default App;