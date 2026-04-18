import { useState } from "react";
import WeeklyTimeline from "./components/WeeklyTimeline";
import QuizResultSummary from "./components/QuizResultSummary";
import QuizQuestionCard from "./components/QuizQuestionCard";
import "./App.css";

function App() {
  return (
    <>
      {/* <QuizResultSummary correctCount={5} totalCount={10} />
      <WeeklyTimeline />
      <QuizQuestionCard
        question={{
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correctIndex: 2,
        }}
        index={0}
        selectedAnswer={undefined}
        showResults={false}
        onAnswer={() => {}}
      /> */}
    </>
  );
}

export default App;
