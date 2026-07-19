/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayOfWeek, Lesson, ConflictWarning } from '../types';

// Convert a "HH:MM" 24h time to total minutes from midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

// Convert minutes from midnight to "HH:MM" 24h string
export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Format "HH:MM" based on settings (12h or 24h)
export function formatTime(timeStr: string, format: '12h' | '24h'): string {
  if (!timeStr || !timeStr.includes(':')) return '';
  if (format === '24h') return timeStr;

  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// Calculate duration in minutes
export function getDurationMinutes(start: string, end: string): number {
  if (!start || !end) return 0;
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  if (endMins < startMins) {
    // Over midnight lesson (rare but possible)
    return (24 * 60 - startMins) + endMins;
  }
  return endMins - startMins;
}

// Format duration nicely (e.g. "2h 30m" or "1h" or "45m")
export function formatDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const totalMins = getDurationMinutes(start, end);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

// Sort a list of lessons chronologically by start time
export function sortLessonsChronologically(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => {
    const minA = timeToMinutes(a.startTime);
    const minB = timeToMinutes(b.startTime);
    return minA - minB;
  });
}

// Detect all conflicts within a set of lessons
export function detectConflicts(lessons: Lesson[]): ConflictWarning[] {
  const conflicts: ConflictWarning[] = [];
  
  // We check for conflicts day by day
  const days: DayOfWeek[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  days.forEach(day => {
    const dayLessons = lessons.filter(l => l.days.includes(day));
    
    for (let i = 0; i < dayLessons.length; i++) {
      for (let j = i + 1; j < dayLessons.length; j++) {
        const l1 = dayLessons[i];
        const l2 = dayLessons[j];
        
        const start1 = timeToMinutes(l1.startTime);
        const end1 = timeToMinutes(l1.endTime);
        const start2 = timeToMinutes(l2.startTime);
        const end2 = timeToMinutes(l2.endTime);
        
        // Check for overlap
        // (startA < endB) && (endA > startB)
        const isOverlap = (start1 < end2) && (end1 > start2);
        
        if (isOverlap) {
          conflicts.push({
            lessonId1: l1.id,
            lessonId2: l2.id,
            day,
            message: `"${l1.subject}" conflicts with "${l2.subject}" on ${day} (${formatTime(l1.startTime, '12h')}-${formatTime(l1.endTime, '12h')} vs ${formatTime(l2.startTime, '12h')}-${formatTime(l2.endTime, '12h')})`
          });
        }
      }
    }
  });
  
  return conflicts;
}

// Get day index from string (where Saturday is 0, Sunday is 1, ... Friday is 6)
export function getDayIndex(day: DayOfWeek): number {
  const indexMap: Record<DayOfWeek, number> = {
    'Saturday': 0,
    'Sunday': 1,
    'Monday': 2,
    'Tuesday': 3,
    'Wednesday': 4,
    'Thursday': 5,
    'Friday': 6
  };
  return indexMap[day];
}

// Get English DayName from a real JavaScript Date object
export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const jsDay = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
  return days[jsDay];
}

// Check if a specific lesson is currently active at this exact moment
export function isLessonActive(lesson: Lesson, targetDay: DayOfWeek, now: Date): boolean {
  if (!lesson.days.includes(targetDay)) return false;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(lesson.startTime);
  const end = timeToMinutes(lesson.endTime);
  
  if (end < start) {
    // Crosses midnight
    return currentMinutes >= start || currentMinutes < end;
  }
  return currentMinutes >= start && currentMinutes < end;
}

// Check if a specific lesson is already finished today
export function isLessonFinished(lesson: Lesson, targetDay: DayOfWeek, now: Date): boolean {
  if (!lesson.days.includes(targetDay)) return false;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const end = timeToMinutes(lesson.endTime);
  const start = timeToMinutes(lesson.startTime);
  
  if (end < start) {
    // Crosses midnight
    return currentMinutes >= end && currentMinutes < start;
  }
  return currentMinutes >= end;
}

// Determine status of today's lesson: 'finished' | 'active' | 'upcoming'
export function getLessonStatus(lesson: Lesson, targetDay: DayOfWeek, now: Date): 'finished' | 'active' | 'upcoming' {
  if (isLessonActive(lesson, targetDay, now)) return 'active';
  if (isLessonFinished(lesson, targetDay, now)) return 'finished';
  return 'upcoming';
}

// Calculate countdown timer in seconds until a lesson starts
export function getSecondsUntilLesson(lesson: Lesson, now: Date): number {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();
  const startMinutes = timeToMinutes(lesson.startTime);
  
  let diffMinutes = startMinutes - currentMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Next day
  }
  
  return diffMinutes * 60 - currentSeconds;
}

// Format countdown nicely (e.g. "in 45 mins" or "in 2h 15m")
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'starting now';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
