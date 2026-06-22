import { BookOpen } from "lucide-react";

export default function QuizWeakTopicsCard({ weakTopics = [] }) {
  const topics = Array.isArray(weakTopics) ? weakTopics.filter(Boolean) : [];

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Topics to review
        </h2>
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Great job! No weak topics stand out.
        </p>
      ) : (
        <ul className="space-y-2">
          {topics.map((topic) => (
            <li
              key={topic}
              className="text-sm text-foreground flex items-start gap-2"
            >
              <span className="text-primary mt-0.5">•</span>
              <span>{topic}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
