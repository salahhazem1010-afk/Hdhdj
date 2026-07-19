/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Copy, 
  Clock, 
  MapPin, 
  X,
  FileDown,
  Info
} from 'lucide-react';
import { Lesson, DayOfWeek, DAYS_OF_WEEK } from '../types';
import { formatTime, formatDuration, getDayOfWeekFromDate, isLessonActive } from '../utils/timeUtils';

import { translations } from '../utils/translations';

interface WeeklyTimetableProps {
  lessons: Lesson[];
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onDuplicateLesson: (lesson: Lesson) => void;
  onRescheduleLesson: (lessonId: string, oldDay: DayOfWeek, newDay: DayOfWeek) => void;
  onOpenExport: () => void;
  currentTime: Date;
  timeFormat: '12h' | '24h';
  language?: 'ar' | 'en';
}

export default function WeeklyTimetable({
  lessons,
  onEditLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onRescheduleLesson,
  onOpenExport,
  currentTime,
  timeFormat,
  language = 'ar'
}: WeeklyTimetableProps) {
  const t = translations[language];
  const currentDay = getDayOfWeekFromDate(currentTime);

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

  // States for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Extract unique subjects and teachers for filtering dropdowns
  const uniqueSubjects = Array.from(new Set(lessons.map((l) => l.subject))).filter(Boolean);
  const uniqueTeachers = Array.from(new Set(lessons.map((l) => l.teacher))).filter(Boolean);

  // Drag and Drop State helpers
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [draggedSourceDay, setDraggedSourceDay] = useState<DayOfWeek | null>(null);

  // Filter lessons based on selection
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = 
      lesson.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.location && lesson.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = selectedSubject ? lesson.subject === selectedSubject : true;
    const matchesTeacher = selectedTeacher ? lesson.teacher === selectedTeacher : true;

    return matchesSearch && matchesSubject && matchesTeacher;
  });

  // Sort lessons within day columns chronologically by start time
  const getDayLessons = (day: DayOfWeek) => {
    return filteredLessons
      .filter((l) => l.days.includes(day))
      .sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
      });
  };

  // Drag handles
  const handleDragStart = (e: React.DragEvent, lessonId: string, day: DayOfWeek) => {
    setDraggedLessonId(lessonId);
    setDraggedSourceDay(day);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lessonId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: DayOfWeek) => {
    e.preventDefault();
    if (draggedLessonId && draggedSourceDay && draggedSourceDay !== targetDay) {
      onRescheduleLesson(draggedLessonId, draggedSourceDay, targetDay);
    }
    setDraggedLessonId(null);
    setDraggedSourceDay(null);
  };

  // Clear all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTeacher('');
    setSelectedSubject('');
  };

  const isFilterActive = searchQuery || selectedTeacher || selectedSubject;

  return (
    <div className="space-y-6">
      
      {/* Header and Filter Board */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{language === 'ar' ? 'جدول حصص الأسبوع' : 'Weekly Timetable'}</h2>
            <p className="text-xs text-slate-400 font-sans">
              {language === 'ar' ? 'تنظيم الحصص الأسبوعية المتكررة وأماكن المذاكرة والدروس' : 'Manage weekly recurring classes and locations'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenExport}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-1.5 transition-all shadow-md"
            >
              <FileDown className="w-4 h-4" />
              {language === 'ar' ? 'تصدير وطباعة الجدول' : 'Print & Export Timetable'}
            </button>
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center gap-1 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            )}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
          {/* Search bar */}
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'البحث بالدرس، المعلم، الموقع...' : 'Search subject, teacher...'}
              className={`w-full ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 text-xs rounded-xl glass-input`}
            />
          </div>

          {/* Subject selector */}
          <div className="relative">
            <Filter className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400`} />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={`w-full ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 text-xs rounded-xl glass-input appearance-none bg-slate-900/40`}
            >
              <option value="" className="bg-slate-900">{language === 'ar' ? 'جميع المواد' : 'All Subjects'}</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub} className="bg-slate-900">{sub}</option>
              ))}
            </select>
          </div>

          {/* Teacher selector */}
          <div className="relative">
            <Filter className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400`} />
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className={`w-full ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 text-xs rounded-xl glass-input appearance-none bg-slate-900/40`}
            >
              <option value="" className="bg-slate-900">{language === 'ar' ? 'جميع المعلمين' : 'All Teachers'}</option>
              {uniqueTeachers.map((teach) => (
                <option key={teach} value={teach} className="bg-slate-900">{teach}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Scroll Container */}
      <div className="overflow-x-auto pb-4">
        
        {/* Helper Note */}
        <div className={`flex items-center gap-2 mb-3 text-slate-500 text-[11px] font-sans ${language === 'ar' ? 'justify-start' : 'justify-end'} px-2`}>
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'ar' ? 'ملاحظة: يمكنك سحب وإفلات الحصص والدروس بين الأيام لإعادة جدولتها فورياً!' : 'Tip: Drag lessons between day columns to reschedule instantly!'}</span>
        </div>

        <div className={`flex gap-4 min-w-[1100px] select-none ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {DAYS_OF_WEEK.map((day) => {
            const dayLessons = getDayLessons(day);
            const isToday = day === currentDay;

            return (
              <div
                key={day}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
                className={`flex-1 min-h-[500px] rounded-3xl p-3 flex flex-col gap-3 transition-all ${
                  isToday 
                    ? 'bg-cyan-500/5 border-2 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]' 
                    : 'bg-white/3 border border-white/5 hover:bg-white/4'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <h3 className={`font-extrabold text-sm ${isToday ? 'text-cyan-400' : 'text-slate-200'}`}>
                    {getTranslatedDay(day)}
                  </h3>
                  {isToday && (
                    <span className="px-2 py-0.5 text-[8px] font-sans font-bold uppercase rounded-full bg-cyan-400/20 text-cyan-300">
                      {language === 'ar' ? 'اليوم' : 'Today'}
                    </span>
                  )}
                </div>

                {/* Day Content */}
                <div className="flex-1 flex flex-col gap-3">
                  {dayLessons.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-4">
                      <span className="text-[10px] text-slate-500 italic font-sans">{language === 'ar' ? 'يوم راحة' : 'Free Day'}</span>
                    </div>
                  ) : (
                    dayLessons.map((lesson) => {
                      const isActive = isLessonActive(lesson, day, currentTime);
                      
                      return (
                        <div
                          key={`${lesson.id}-${day}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lesson.id, day)}
                          className={`group rounded-2xl p-4 border relative overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing liquid-card-shine ${
                            isActive 
                              ? 'bg-cyan-950/20 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)] animate-pulse-glow' 
                              : 'bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10 hover:shadow-lg'
                          }`}
                          style={{
                            borderRightWidth: language === 'ar' ? '5px' : '0px',
                            borderRightColor: language === 'ar' ? (lesson.color || '#3b82f6') : undefined,
                            borderLeftWidth: language === 'ar' ? '0px' : '5px',
                            borderLeftColor: language === 'ar' ? undefined : (lesson.color || '#3b82f6')
                          }}
                        >
                          {/* Accent light shine overlay */}
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/2 to-transparent rounded-full pointer-events-none" />

                          {/* Subject Header */}
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-white text-xs truncate max-w-[120px]" title={lesson.subject}>
                              {lesson.subject}
                            </h4>
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: lesson.color }}
                            />
                          </div>

                          {/* Teacher Name */}
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            {language === 'ar' ? 'معلم:' : ''} {lesson.teacher}
                          </p>

                          {/* Times & Durations */}
                          <div className="space-y-1 mt-3">
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-300 font-sans">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>
                                {formatTime(lesson.startTime, timeFormat)} - {formatTime(lesson.endTime, timeFormat)}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-sans italic">
                              ({formatDuration(lesson.startTime, lesson.endTime)})
                            </p>
                          </div>

                          {/* Classroom Location */}
                          {lesson.location && (
                            <div className="flex items-center gap-1 text-[9px] text-cyan-300 mt-2 font-sans bg-cyan-950/40 py-0.5 px-2 rounded-full w-fit border border-cyan-500/10">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[90px]">{lesson.location}</span>
                            </div>
                          )}

                          {/* Notes (truncated) */}
                          {lesson.notes && (
                            <p className="text-[9px] text-slate-500 mt-2 italic line-clamp-1 border-t border-white/5 pt-1.5">
                              {lesson.notes}
                            </p>
                          )}

                          {/* Floating Actions on Hover */}
                          <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                            <button
                              onClick={() => onEditLesson(lesson)}
                              className="p-2 rounded-xl bg-white/10 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                              title={language === 'ar' ? 'تعديل' : 'Edit Lesson'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDuplicateLesson(lesson)}
                              className="p-2 rounded-xl bg-white/10 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 transition-colors"
                              title={language === 'ar' ? 'تكرار' : 'Duplicate'}
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteLesson(lesson.id)}
                              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled Lessons Panel */}
      {filteredLessons.filter(l => l.days.length === 0).length > 0 && (
        <div className="glass-panel rounded-3xl p-6 mt-6 border border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-200">
              {language === 'ar' ? 'مسودات وحصص غير مجدولة' : 'Drafts & Unscheduled Lessons'}
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 text-slate-400 rounded-full">
              {filteredLessons.filter(l => l.days.length === 0).length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredLessons.filter(l => l.days.length === 0).map((lesson) => (
              <div
                key={lesson.id}
                className="group rounded-2xl p-4 border relative overflow-hidden transition-all duration-300 bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10 hover:shadow-lg"
                style={{
                  borderRightWidth: language === 'ar' ? '5px' : '0px',
                  borderRightColor: language === 'ar' ? (lesson.color || '#3b82f6') : undefined,
                  borderLeftWidth: language === 'ar' ? '0px' : '5px',
                  borderLeftColor: language === 'ar' ? undefined : (lesson.color || '#3b82f6')
                }}
              >
                {/* Accent light shine overlay */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/2 to-transparent rounded-full pointer-events-none" />

                {/* Subject Header */}
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-white text-xs truncate max-w-[150px]" title={lesson.subject}>
                    {lesson.subject}
                  </h4>
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: lesson.color }}
                  />
                </div>

                {/* Teacher Name */}
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {language === 'ar' ? 'المعلم:' : 'Teacher:'} {lesson.teacher}
                </p>

                {/* Unscheduled Status */}
                <p className="text-[10px] font-sans font-semibold text-amber-400 mt-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {language === 'ar' ? 'لم يتم تحديد الموعد بعد' : 'Schedule Not Set Yet'}
                  </span>
                </p>

                {/* Notes (truncated) */}
                {lesson.notes && (
                  <p className="text-[9px] text-slate-500 mt-2 italic line-clamp-1 border-t border-white/5 pt-1.5">
                    {lesson.notes}
                  </p>
                )}

                {/* Floating Actions on Hover */}
                <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                  <button
                    onClick={() => onEditLesson(lesson)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                    title={language === 'ar' ? 'تعديل وتحديد موعد' : 'Edit & Schedule'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteLesson(lesson.id)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                    title={language === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
