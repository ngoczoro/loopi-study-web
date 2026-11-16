import { Plus, Trash2 } from "lucide-react";
import { blankQuestion } from "@/lib/quizDraft";

const OPTION_LETTERS = ["A", "B", "C", "D"];

const fieldClass =
  "w-full rounded-xl bg-background px-3 py-2 text-sm text-foreground border border-border outline-none focus:border-primary disabled:opacity-50";

/** Editable list of quiz questions. Fully controlled by the parent. */
export default function QuizReviewEditor({ title, onTitleChange, questions, onChange, disabled }) {
  const updateQuestion = (index, patch) =>
    onChange(questions.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const updateOption = (index, optionIndex, value) =>
    updateQuestion(index, {
      options: questions[index].options.map((option, i) => (i === optionIndex ? value : option)),
    });

  const removeQuestion = (index) => onChange(questions.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Quiz title</label>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={200}
          disabled={disabled}
          className={`${fieldClass} h-10`}
        />
      </div>

      {questions.map((item, index) => (
        <div key={index} className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Question {index + 1}</span>
            <button
              type="button"
              onClick={() => removeQuestion(index)}
              disabled={disabled || questions.length <= 1}
              className="text-muted-foreground hover:text-destructive disabled:opacity-40"
              aria-label={`Delete question ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <textarea
            value={item.question}
            onChange={(e) => updateQuestion(index, { question: e.target.value })}
            rows={2}
            maxLength={1000}
            disabled={disabled}
            placeholder="Question"
            className={fieldClass}
          />

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Select the correct answer</p>
            {item.options.map((option, optionIndex) => (
              <label key={optionIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${index}`}
                  checked={item.correctIndex === optionIndex}
                  onChange={() => updateQuestion(index, { correctIndex: optionIndex })}
                  disabled={disabled}
                  className="accent-primary"
                />
                <span className="text-xs font-medium text-muted-foreground w-4">
                  {OPTION_LETTERS[optionIndex]}
                </span>
                <input
                  value={option}
                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                  maxLength={500}
                  disabled={disabled}
                  className={`${fieldClass} h-9`}
                />
              </label>
            ))}
          </div>

          <textarea
            value={item.explanation}
            onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
            rows={2}
            maxLength={1000}
            disabled={disabled}
            placeholder="Explanation (optional)"
            className={fieldClass}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...questions, blankQuestion()])}
        disabled={disabled || questions.length >= 50}
        className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add question
      </button>
    </div>
  );
}
