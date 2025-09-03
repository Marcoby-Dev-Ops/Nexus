'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabledDates?: (date: Date) => boolean;
  className?: string;
}

function isSameDay(a?: Date, b?: Date) {
  return (
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect, disabledDates, className }) => {
  const today = getToday();
  const [view, setView] = useState(() => {
    const base = selected || today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const daysInMonth = getDaysInMonth(view.year, view.month);
  const firstDay = getFirstDayOfWeek(view.year, view.month);

  // Build calendar grid
  const days: (Date | null)[] = [];
  // Leading blanks
  for (let i = 0; i < firstDay; i++) days.push(null);
  // Month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(view.year, view.month, d));
  }
  // Trailing blanks
  while (days.length % 7 !== 0) days.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    setView((v) => {
      const m = v.month - 1;
      if (m < 0) return { year: v.year - 1, month: 11 };
      return { year: v.year, month: m };
    });
  };
  const handleNextMonth = () => {
    setView((v) => {
      const m = v.month + 1;
      if (m > 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: m };
    });
  };

  return (
    <div className={cn('p-4 rounded-md border bg-card min-w-[24rem] w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrevMonth} className="p-1 rounded hover: bg-accent" aria-label="Previous Month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-medium text-sm">
          {new Date(view.year, view.month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={handleNextMonth} className="p-1 rounded hover: bg-accent" aria-label="Next Month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <table className="w-full border-collapse min-w-[22rem] select-none">
        <thead>
          <tr>
            {WEEKDAYS.map((wd) => (
              <th key={wd} className="text-muted-foreground font-normal text-[0.8rem] py-1">
                {wd}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((date, j) => {
                const isDisabled = !date || (disabledDates && date && disabledDates(date));
                const isSelected = date && selected && isSameDay(date, selected);
                const isToday = date && isSameDay(date, today);
                return (
                  <td key={j} className="h-9 w-9 text-center p-0">
                    {date ? (
                      <button
                        type="button"
                        className={cn(
                          'h-9 w-9 rounded-md text-sm transition-colors',
                          isSelected && 'bg-primary text-primary-foreground',
                          isToday && !isSelected && 'bg-accent text-accent-foreground',
                          isDisabled && 'opacity-50 pointer-events-none',
                          !isSelected && !isToday && !isDisabled && 'hover: bg-accent hover:text-accent-foreground'
                        )}
                        onClick={() => !isDisabled && onSelect?.(date)}
                        disabled={isDisabled}
                        aria-label={date.toDateString()}
                        aria-current={isToday ? 'date' : undefined}
                        aria-selected={isSelected || undefined}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <span className="inline-block h-9 w-9" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

Calendar.displayName = 'Calendar'; 
