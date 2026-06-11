import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/button";
import { Calendar as CalendarPicker } from "@/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   value?: Date,
 *   onChange: (date: Date) => void,
 *   onContinue: () => void,
 *   onBack?: () => void,
 * }} props
 */
export default function ExamDateForm({ value, onChange, onContinue, onBack }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-secondary/40 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">
          No exam date found in the document
        </p>
        <p className="text-xs text-muted-foreground">
          Enter the expected exam date so we can plan until one week before it.
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-10 rounded-xl justify-start text-left font-normal",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "PPP") : "Select exam date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarPicker
              mode="single"
              selected={value}
              onSelect={(date) => date && onChange(date)}
              disabled={(date) => date < tomorrow}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={!value}
          className="ml-auto h-10 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
