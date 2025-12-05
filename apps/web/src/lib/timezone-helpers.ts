/**
 * Timezone Helper Utilities
 *
 * CRITICAL: All date/time operations should use these helpers to respect
 * the company's configured timezone.
 *
 * Use Cases:
 * - Daily AI limit resets (midnight company time)
 * - Weekly task resets (Monday 00:00 company time)
 * - Scheduled job notifications
 * - Report date ranges
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import {
  startOfDay,
  startOfWeek,
  endOfDay,
  endOfWeek,
  addDays,
  format as formatDate,
} from 'date-fns'

/**
 * Get current date/time in company's timezone
 */
export function getNowInCompanyTimezone(timezone: string): Date {
  return toZonedTime(new Date(), timezone)
}

/**
 * Get start of day in company's timezone
 * Used for: Daily resets, date range queries
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone)
  return startOfDay(zonedDate)
}

/**
 * Get end of day in company's timezone
 */
export function getEndOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone)
  return endOfDay(zonedDate)
}

/**
 * Get start of week (Monday) in company's timezone
 * Used for: Weekly task reset logic
 */
export function getStartOfWeekInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone)
  return startOfWeek(zonedDate, { weekStartsOn: 1 }) // Monday = 1
}

/**
 * Get end of week (Sunday) in company's timezone
 */
export function getEndOfWeekInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone)
  return endOfWeek(zonedDate, { weekStartsOn: 1 })
}

/**
 * Get midnight tonight in company's timezone (for reset countdown)
 * Used for: "Resets in X hours" displays
 */
export function getMidnightTonightInTimezone(timezone: string): Date {
  const now = getNowInCompanyTimezone(timezone)
  const tomorrow = addDays(now, 1)
  return getStartOfDayInTimezone(tomorrow, timezone)
}

/**
 * Format date/time in company's timezone
 */
export function formatInCompanyTimezone(
  date: Date,
  timezone: string,
  formatString: string
): string {
  return formatInTimeZone(date, timezone, formatString)
}

/**
 * Check if current time is past midnight in company's timezone
 * Used by: AI reset cron job
 */
export function isPastMidnightInTimezone(timezone: string): boolean {
  const now = new Date()
  const companyNow = toZonedTime(now, timezone)
  const companyHour = companyNow.getHours()

  // Consider "past midnight" as 00:00-01:00
  return companyHour === 0
}

/**
 * Get ISO week number for company timezone
 * Used for: Task usage counter week tracking
 */
export function getISOWeekInTimezone(
  date: Date,
  timezone: string
): {
  year: number
  week: number
  weekStart: Date
} {
  const zonedDate = toZonedTime(date, timezone)
  const weekStart = startOfWeek(zonedDate, { weekStartsOn: 1 })

  // ISO week calculation
  const year = weekStart.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const daysSinceStart = Math.floor(
    (weekStart.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  )
  const week = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7)

  return {
    year,
    week,
    weekStart,
  }
}

/**
 * Convert user input date (local browser time) to company timezone
 * Used when: User schedules a job
 */
export function convertToCompanyTimezone(
  localDate: Date,
  companyTimezone: string
): Date {
  return fromZonedTime(localDate, companyTimezone)
}

/**
 * Get time until next reset in company timezone
 * Returns hours and minutes until midnight
 */
export function getTimeUntilReset(timezone: string): {
  hours: number
  minutes: number
  resetAt: Date
} {
  const now = new Date()
  const midnight = getMidnightTonightInTimezone(timezone)

  const diffMs = midnight.getTime() - now.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return {
    hours,
    minutes,
    resetAt: midnight,
  }
}

/**
 * Format time until reset for display
 * Example: "Resets in 5 hours, 23 minutes"
 */
export function formatTimeUntilReset(timezone: string): string {
  const { hours, minutes } = getTimeUntilReset(timezone)

  if (hours === 0) {
    return `Resets in ${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  return `Resets in ${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`
}

/**
 * Common US timezones for settings dropdown
 */
export const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
] as const

/**
 * All IANA timezones (for advanced settings)
 */
export function getAllTimezones(): string[] {
  return Intl.supportedValuesOf('timeZone')
}

/**
 * Detect user's browser timezone
 */
export function detectBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
