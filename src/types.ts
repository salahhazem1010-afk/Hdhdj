/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DayOfWeek = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday'
];

export interface Lesson {
  id: string;
  subject: string;
  teacher: string;
  days: DayOfWeek[];
  startTime: string; // "HH:MM" (24-hour format)
  endTime: string;   // "HH:MM" (24-hour format)
  location?: string;
  color: string;     // Hex color code or Tailwind color class key
  notes?: string;
  subjectAr?: string;
  subjectEn?: string;
  teacherAr?: string;
  teacherEn?: string;
  notesAr?: string;
  notesEn?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  accentColor: string; // e.g., 'cyan', 'purple', 'blue', 'emerald'
  timeFormat: '12h' | '24h';
  animationSpeed: 'slow' | 'normal' | 'fast';
  studentName: string;
  currentWeek: string;
  language: 'ar' | 'en';
}

export interface ConflictWarning {
  lessonId1: string;
  lessonId2: string;
  day: DayOfWeek;
  message: string;
}

export interface ActiveNotification {
  id: string;
  lessonId: string;
  title: string;
  message: string;
  time: Date;
  type: 'reminder' | 'conflict' | 'info';
  read: boolean;
}

export type ExportTheme = 'liquid-glass' | 'minimal-white' | 'dark-premium' | 'blue-professional' | 'black-gold';
