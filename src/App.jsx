import { useState } from "react";
import WeeklyTimeline from "./components/WeeklyTimeline";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./components/alert-dialog";
import QuizQuestionCard from "./components/QuizQuestionCard";
import QuizResultSummary from "./components/QuizResultSummary";
import QuizList from "./components/QuizList";
import { Button } from "./components/button";
import { Badge } from "./components/badge";
import { Calendar } from "./components/calendar";
import { Input } from "./components/input";
import "./App.css";

function App() {
  // return (
  //   <AlertDialog>
  //     <AlertDialogTrigger asChild>
  //       <button>Open Dialog</button>
  //     </AlertDialogTrigger>
  //     <AlertDialogContent>
  //       <AlertDialogHeader>
  //         <AlertDialogTitle>Xác nhận</AlertDialogTitle>
  //         <AlertDialogDescription>
  //           Bạn có chắc muốn xoá không?
  //         </AlertDialogDescription>
  //       </AlertDialogHeader>
  //       <AlertDialogFooter>
  //         <AlertDialogCancel>Huỷ</AlertDialogCancel>
  //         <AlertDialogAction>Xoá</AlertDialogAction>
  //       </AlertDialogFooter>
  //     </AlertDialogContent>
  //   </AlertDialog>
  // );
  // const quizzes = [
  //   {
  //     id: "1",
  //     title: "React Basics",
  //     createdAt: new Date(),
  //     questions: [{}, {}, {}],
  //   },
  //   {
  //     id: "2",
  //     title: "JavaScript",
  //     createdAt: new Date(),
  //     questions: [{}, {}],
  //   },
  // ];
  // const lastAttempts = {
  //   1: { score: 2, total: 3 },
  //   2: { score: 1, total: 2 },
  // };
  // return (
  //   <QuizList
  //     quizzes={quizzes}
  //     lastAttempts={lastAttempts}
  //     onSelectQuiz={(id) => console.log("Select", id)}
  //     onReviewQuiz={(id) => console.log("Review", id)}
  //     onDeleteQuiz={(id) => console.log("Delete", id)}
  //     onGenerateWithAi={() => console.log("Generate AI")}
  //   />
  // );
}
export default App;
