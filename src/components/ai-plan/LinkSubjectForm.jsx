import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/button";
import { Calendar as CalendarPicker } from "@/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createSubject } from "@/services/subjectService";

/**
 * @param {{
 *   subjects: Array<{ id: string, name: string, examDate?: string|null }>,
 *   suggestedName?: string,
 *   examDate?: Date,
 *   difficulty?: string,
 *   hoursPerWeek?: number,
 *   onLinked: (subjectId: string) => void,
 *   onBack?: () => void,
 *   onSubjectCreated?: () => void,
 * }} props
 */
export default function LinkSubjectForm({
  subjects,
  suggestedName = "",
  examDate,
  difficulty = "Medium",
  hoursPerWeek = 4,
  onLinked,
  onBack,
  onSubjectCreated,
}) {
  const [mode, setMode] = useState("existing");
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    subjects[0]?.id || "",
  );
  const [newName, setNewName] = useState(suggestedName);
  const [newExamDate, setNewExamDate] = useState(examDate);
  const [creating, setCreating] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const handleContinue = async () => {
    if (mode === "existing") {
      if (!selectedSubjectId) return;
      onLinked(selectedSubjectId);
      return;
    }

    if (!newName.trim() || !newExamDate) return;

    setCreating(true);
    const result = await createSubject({
      name: newName.trim(),
      examDate: format(newExamDate, "yyyy-MM-dd"),
      difficulty,
      requiredHoursPerWeek: hoursPerWeek,
      priority: "medium",
      credits: 3,
    });
    setCreating(false);

    if (!result.success || !result.data?.id) {
      toast.error(result.message || "Failed to create subject");
      return;
    }

    onSubjectCreated?.();
    onLinked(result.data.id);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Link this plan to a subject before generating the schedule.
      </p>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            checked={mode === "existing"}
            onChange={() => setMode("existing")}
          />
          Choose an existing subject
        </label>
        {mode === "existing" && (
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full h-10 rounded-xl bg-secondary px-3 text-sm"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        )}

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            checked={mode === "new"}
            onChange={() => setMode("new")}
          />
          Create a new subject
        </label>

        {mode === "new" && (
          <div className="space-y-3 rounded-xl bg-secondary/40 p-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Subject name"
              className="w-full h-10 rounded-xl bg-background px-3 text-sm"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-10 rounded-xl justify-start text-left font-normal",
                    !newExamDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newExamDate ? format(newExamDate, "PPP") : "Exam date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={newExamDate}
                  onSelect={setNewExamDate}
                  disabled={(date) => date < tomorrow}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={creating}
            className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={
            creating ||
            (mode === "existing" && !selectedSubjectId) ||
            (mode === "new" && (!newName.trim() || !newExamDate))
          }
          className="ml-auto h-10 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          {creating ? "Creating…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
