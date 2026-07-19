/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { Lesson, DayOfWeek, DAYS_OF_WEEK } from '../types';
import { 
  formatTime, 
  formatDuration, 
  getDayOfWeekFromDate, 
  sortLessonsChronologically 
} from '../utils/timeUtils';

import { translations } from '../utils/translations';

interface MonthlyCalendarProps {
  lessons: Lesson[];
  currentTime: Date;
  timeFormat: '12h' | '24h';
  language?: 'ar' | 'en';
}

export default function MonthlyCalendar({
  lessons,
  currentTime,
  timeFormat,
  language = 'ar'
}: MonthlyCalendarProps) {
  const realToday = new Date();
  const [currentYear, setCurrentYear] = useState(realToday.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(realToday.getMonth()); // 0-indexed
  
  // Day selection state - default to realToday
  const [selectedDate, setSelectedDate] = useState<Date>(realToday);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const weekdayHeadersEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayHeadersAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const weekdayHeaders = language === 'ar' ? weekdayHeadersAr : weekdayHeadersEn;

  const getTranslatedDay = (day: string) => {
    switch (day) {
      case 'Saturday': return language === 'ar' ? 'السبت' : 'Saturday';
      case 'Sunday': return language === 'ar' ? 'الأحد' : 'Sunday';
      case 'Monday': return language === 'ar' ? 'الإثنين' : 'Monday';
      case 'Tuesday': return language === 'ar' ? 'الثلاثاء' : 'Tuesday';
      case 'Wednesday': return language === 'ar' ? 'الأربعاء' : 'Wednesday';
      case 'Thursday': return language === 'ar' ? 'الخميس' : 'Thursday';
      case 'Friday': return language === 'ar' ? 'الجمعة' : 'Friday';
      default: return day;
    }
  };

  // Navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get days in the month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the first day of the month as weekday index (0 for Sunday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate calendar cells (pad preceding and trailing days)
  const calendarCells: (Date | null)[] = [];
  
  // Pad preceding month days
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    calendarCells.push(new Date(currentYear, currentMonth, day));
  }

  // Get lessons for a specific Date based on its day of week
  const getLessonsForDate = (date: Date): Lesson[] => {
    const dayName = getDayOfWeekFromDate(date);
    return sortLessonsChronologically(
      lessons.filter((l) => l.days.includes(dayName))
    );
  };

  const selectedDayName = getDayOfWeekFromDate(selectedDate);
  const selectedDayLessons = getLessonsForDate(selectedDate);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${language === 'ar' ? 'dir-rtl' : ''}`}>
      
      {/* Calendar Grid Section (2 Cols) */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        <div className="glass-panel rounded-3xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white font-sans">
                {language === 'ar' ? `${arabicMonths[currentMonth]} ${currentYear}` : `${months[currentMonth]} ${currentYear}`}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              >
                {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(realToday.getMonth());
                  setCurrentYear(realToday.getFullYear());
                  setSelectedDate(realToday);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/25 transition-all cursor-pointer"
              >
                {language === 'ar' ? 'اليوم' : 'Today'}
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              >
                {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-500 font-sans">
            {weekdayHeaders.map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((date, idx) => {
              if (date === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-transparent" />;
              }

              const dayLessons = getLessonsForDate(date);
              
              const isSelected = 
                selectedDate.getDate() === date.getDate() &&
                selectedDate.getMonth() === date.getMonth() &&
                selectedDate.getFullYear() === date.getFullYear();

              const isRealToday = 
                realToday.getDate() === date.getDate() &&
                realToday.getMonth() === date.getMonth() &&
                realToday.getFullYear() === date.getFullYear();

              return (
                <button
                  key={`day-${date.getDate()}`}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square rounded-2xl p-2 flex flex-col justify-between items-center transition-all relative overflow-hidden cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 text-white shadow-lg scale-105 font-bold' 
                      : isRealToday
                      ? 'bg-cyan-500/10 border-2 border-cyan-400 text-white font-extrabold'
                      : 'bg-white/3 border border-white/5 hover:bg-white/8 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold leading-none">{date.getDate()}</span>
                  
                  {/* Lesson indicators on dates */}
                  {dayLessons.length > 0 && (
                    <div className="flex gap-1 justify-center mt-1 w-full max-w-full overflow-hidden">
                      {dayLessons.slice(0, 3).map((l, i) => (
                        <span 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full block ${isSelected ? 'bg-white' : ''}`}
                          style={{ backgroundColor: isSelected ? undefined : l.color }}
                        />
                      ))}
                      {dayLessons.length > 3 && (
                        <span className={`text-[7px] font-sans leading-none ${isSelected ? 'text-white' : 'text-slate-500'}`}>+</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* Selected Day Agenda Side panel (1 Col) */}
      <div className="lg:col-span-1 flex flex-col">
        <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">{language === 'ar' ? 'أجندة اليوم' : "Day's Agenda"}</h3>
                <p className="text-xs text-slate-400 font-sans">
                  {selectedDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {selectedDayLessons.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white/2 rounded-2xl border border-white/5 mt-4">
                <span className="text-4xl">🎉</span>
                <h4 className="font-bold text-white text-sm mt-3">{language === 'ar' ? 'يوم دراسة فردي حر' : 'Free Studying Day'}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar' 
                    ? `لا توجد حصص خصوصية مجدولة ليوم ${getTranslatedDay(selectedDayName)}. استغل وقتك في المراجعة الذاتية!` 
                    : `No private lessons scheduled on ${selectedDayName}s. Perfect for self-revision!`}
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-4 overflow-y-auto max-h-[320px] pr-1">
                {selectedDayLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-3.5 rounded-2xl bg-white/3 hover:bg-white/5 border border-white/5 relative overflow-hidden flex flex-col gap-2 transition-all"
                    style={{
                      borderLeft: language === 'ar' ? undefined : `4px solid ${lesson.color || '#3b82f6'}`,
                      borderRight: language === 'ar' ? `4px solid ${lesson.color || '#3b82f6'}` : undefined
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white truncate max-w-[120px]">{lesson.subject}</span>
                      <span className="text-[10px] text-slate-400 font-sans">
                        {language === 'ar' ? 'بواسطة' : 'with'} {lesson.teacher}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans mt-1 border-t border-white/5 pt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{formatTime(lesson.startTime, timeFormat)}</span>
                      </div>
                      <span>({formatDuration(lesson.startTime, lesson.endTime)})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>{language === 'ar' ? `اليوم: ${getTranslatedDay(selectedDayName)}` : `Selected Day: ${selectedDayName}`}</span>
            <span>{selectedDayLessons.length} {language === 'ar' ? 'حصص' : 'Classes'}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
