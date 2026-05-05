import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "../lib/utils";
import { buttonVariants } from "./button";
import "react-day-picker/dist/style.css";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      styles={{
        month_grid: {
          borderSpacing: "6px",
          borderCollapse: "separate",
        },
        weekdays: {
          gap: "6px",
        },
        week: {
          gap: "6px",
        },
        day: {
          width: "36px",
          height: "36px",
        },
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",

        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",

        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),

        month_grid: "w-full border-separate border-spacing-1",
        weekdays: "flex gap-1",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",

        week: "flex w-full gap-1 mt-2",

        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-sm aria-selected:opacity-100"
        ),

        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",

        today: "bg-accent text-accent-foreground",

        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",

        disabled: "text-muted-foreground opacity-50",

        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",

        hidden: "invisible",

        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }

          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };