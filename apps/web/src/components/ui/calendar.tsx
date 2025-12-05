'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 inline-flex items-center justify-center rounded-md border border-white/10 hover:bg-white/10'
        ),
        button_next: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 inline-flex items-center justify-center rounded-md border border-white/10 hover:bg-white/10'
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button: cn(
          'h-9 w-9 p-0 font-normal rounded-md hover:bg-white/10 inline-flex items-center justify-center'
        ),
        selected:
          'bg-[#d4a574] text-black hover:bg-[#c49464] hover:text-black focus:bg-[#d4a574] focus:text-black rounded-md',
        today: 'bg-white/10 text-white rounded-md',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50 cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
