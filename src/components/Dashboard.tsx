/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Hourglass, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Play
} from 'lucide-react';
import { Lesson, ConflictWarning, DayOfWeek } from '../types';
import { 
  formatTime, 
  formatDuration, 
  getDayOfWeekFromDate, 
  getLessonStatus, 
  getSecondsUntilLesson, 
  formatCountdown,
  sortLessonsChronologically
} from '../utils/timeUtils';

import { translations } from '../utils/translations';

interface DashboardProps {
  lessons: Lesson[];
  conflicts: ConflictWarning[];
  currentTime: Date;
  timeFormat: '12h' | '24h';
  studentName: string;
  onNavigateToTab: (tab: 'dashboard' | 'timetable' | 'timeline' | 'calendar' | 'statistics' | 'settings') => void;
  language?: 'ar' | 'en';
}

export default function Dashboard({
  lessons,
  conflicts,
  currentTime,
  timeFormat,
  studentName,
  onNavigateToTab,
  language = 'ar'
}: DashboardProps) {
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

  // Total weekly hours calculation
  const totalMinutes = lessons.reduce((sum, lesson) => {
    if (!lesson.startTime || !lesson.endTime || !lesson.days || lesson.days.length === 0) return sum;
    const [startH, startM] = lesson.startTime.split(':').map(Number);
    const [endH, endM] = lesson.endTime.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; // Midnight rollover
    return sum + (diff * lesson.days.length);
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Filter lessons happening today
  const todayLessons = sortLessonsChronologically(
    lessons.filter((l) => l.days.includes(currentDay))
  );

  // Find the next lesson
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(-1);

  useEffect(() => {
    // Look for lessons scheduled today that haven't started yet, or next day if none
    const todayUpcoming = todayLessons.filter(l => {
      const status = getLessonStatus(l, currentDay, currentTime);
      return status === 'upcoming';
    });

    if (todayUpcoming.length > 0) {
      setNextLesson(todayUpcoming[0]);
      setSecondsLeft(getSecondsUntilLesson(todayUpcoming[0], currentTime));
    } else {
      // Find the absolute next lesson across the week
      let foundLesson: Lesson | null = null;
      let minDiffSeconds = Infinity;
      
      lessons.forEach(l => {
        l.days.forEach(day => {
          const startSecs = getSecondsUntilLesson(l, currentTime);
          if (startSecs > 0 && startSecs < minDiffSeconds) {
            minDiffSeconds = startSecs;
            foundLesson = l;
          }
        });
      });
      
      setNextLesson(foundLesson);
      setSecondsLeft(minDiffSeconds === Infinity ? -1 : minDiffSeconds);
    }
  }, [lessons, currentTime, currentDay, todayLessons]);

  // Format today's date
  const dateStr = currentTime.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden liquid-card-shine">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest font-sans">
              {language === 'ar' ? 'مرحباً بك مجدداً' : 'Welcome Back'}
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
              {language === 'ar' ? 'أهلاً بك، ' : 'Hello, '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">{studentName || 'Aesthetic Student'}</span>
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              {language === 'ar' ? (
                <>
                  إليك جدول أعمالك الدراسي ليوم <span className="font-semibold text-white">{getTranslatedDay(currentDay)}</span>. 
                  لديك اليوم <span className="font-bold text-cyan-400">{todayLessons.length} حصص</span> مجدولة.
                </>
              ) : (
                <>
                  Here is your study agenda for <span className="font-semibold text-white">{currentDay}</span>. 
                  You have <span className="font-bold text-cyan-400">{todayLessons.length} lessons</span> scheduled for today.
                </>
              )}
            </p>
          </div>
          
          <div className="flex flex-col items-end bg-white/5 rounded-2xl p-4 border border-white/5 font-sans text-right min-w-[200px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              {language === 'ar' ? 'ساعة المخطط الحية' : 'Live Scheduler Clock'}
            </span>
            <span className="text-3xl font-bold text-white mt-1 tracking-tighter">
              {currentTime.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: timeFormat === '12h' })}
            </span>
            <span className="text-xs text-cyan-300 mt-1">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Lessons Card */}
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 hover:translate-y-[-2px] transition-transform">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-sans">{t.totalLessons}</span>
            <p className="text-2xl font-bold text-white mt-1">{lessons.length}</p>
            <p className="text-[10px] text-slate-500 font-sans">
              {language === 'ar' ? 'مجدولة طوال الأسبوع' : 'scheduled across week'}
            </p>
          </div>
        </div>

        {/* Total Study Hours Card */}
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 hover:translate-y-[-2px] transition-transform">
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-sans">{t.weeklyWorkload}</span>
            <p className="text-2xl font-bold text-white mt-1">{totalHours} {language === 'ar' ? 'ساعة' : 'hrs'}</p>
            <p className="text-[10px] text-slate-500 font-sans">
              {language === 'ar' ? 'إجمالي وقت الحصص' : 'total lesson time'}
            </p>
          </div>
        </div>

        {/* Today's Classes */}
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 hover:translate-y-[-2px] transition-transform">
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Hourglass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-sans">
              {language === 'ar' ? 'حصص اليوم' : "Today's Load"}
            </span>
            <p className="text-2xl font-bold text-white mt-1">{todayLessons.length}</p>
            <p className="text-[10px] text-slate-500 font-sans">
              {language === 'ar' ? 'حصص مجدولة اليوم' : 'classes scheduled today'}
            </p>
          </div>
        </div>

        {/* Conflict Alert Status */}
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 hover:translate-y-[-2px] transition-transform">
          <div className={`p-3.5 rounded-xl border ${
            conflicts.length > 0 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-sans">
              {language === 'ar' ? 'محرك التعارضات' : 'Conflict Engine'}
            </span>
            <p className={`text-2xl font-bold mt-1 ${conflicts.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {conflicts.length > 0 
                ? `${conflicts.length} ${language === 'ar' ? 'تعارض' : 'Warning'}` 
                : (language === 'ar' ? 'كل شيء ممتاز' : 'All Clear')}
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              {language === 'ar' ? 'فاحص التداخل نشط' : 'overlap checker active'}
            </p>
          </div>
        </div>

      </div>

      {/* Main Panel split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next Lesson Countdown Card (Left/Main, 1 col) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex-1 flex flex-col justify-between min-h-[320px] border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest font-sans">
                  {language === 'ar' ? 'مؤقت الدرس التالي' : 'Next Lesson Timer'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[9px] text-cyan-400 font-sans">
                  {language === 'ar' ? 'الهدف النشط' : 'Active Target'}
                </span>
              </div>
              
              {nextLesson ? (
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">{nextLesson.subject}</h3>
                    <p className="text-slate-300 text-sm mt-1">
                      {language === 'ar' ? 'المعلم: ' : 'Teacher: '}<span className="font-semibold text-white">{nextLesson.teacher}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-white/3 rounded-xl p-3 border border-white/5 text-sm font-sans text-slate-300">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">{language === 'ar' ? 'الوقت' : 'Time'}</span>
                      <span className="font-bold text-white text-base">
                        {formatTime(nextLesson.startTime, timeFormat)}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">{language === 'ar' ? 'المدة' : 'Duration'}</span>
                      <span>{formatDuration(nextLesson.startTime, nextLesson.endTime)}</span>
                    </div>
                    {nextLesson.location && (
                      <>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">{language === 'ar' ? 'القاعة' : 'Room'}</span>
                          <span className="text-cyan-300">{nextLesson.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-8 text-center text-slate-500 py-6">
                  <p className="text-sm font-sans">{language === 'ar' ? 'لا توجد حصص قادمة' : 'No lessons scheduled next'}</p>
                  <p className="text-xs mt-1">{language === 'ar' ? 'استمتع بوقت فراغك!' : 'Enjoy your free time!'}</p>
                </div>
              )}
            </div>

            {nextLesson && secondsLeft > 0 && (
              <div className="mt-6 pt-4 border-t border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">{language === 'ar' ? 'تبدأ خلال' : 'Starting In'}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono tracking-tighter">
                    {formatCountdown(secondsLeft)}
                  </span>
                  <span className="text-xs text-slate-400 font-sans">{language === 'ar' ? 'تنازلي' : 'countdown'}</span>
                </div>
                
                {/* Visual glass loadbar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-3 border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(100, Math.max(5, (1 - secondsLeft / 7200) * 100))}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Conflict Warnings List (If any exist) */}
          {conflicts.length > 0 && (
            <div className="glass-panel border-red-500/20 bg-red-950/20 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-sans">{language === 'ar' ? 'تداخلات الجدول الدراسية' : 'Timetable Conflicts'}</h3>
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {conflicts.map((conf, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-red-200">
                    <p className="font-semibold text-red-400">{getTranslatedDay(conf.day)}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{conf.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Today's List & Calendar quick overview (Right, 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{language === 'ar' ? 'جدول حصص اليوم' : "Today's Class Schedule"}</h3>
                <p className="text-xs text-slate-400 font-sans">{language === 'ar' ? 'مرتبة زمنياً' : 'Sorted chronologically'}</p>
              </div>
              <button 
                onClick={() => onNavigateToTab('timeline')}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold font-sans"
              >
                {language === 'ar' ? 'فتح المخطط الزمني' : 'Launch Line View'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayLessons.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/2 rounded-2xl border border-white/5">
                <span className="p-4 rounded-full bg-cyan-400/5 text-cyan-400 border border-cyan-400/10 mb-4 animate-pulse">
                  <CheckCircle2 className="w-8 h-8" />
                </span>
                <p className="text-base font-semibold text-white">{language === 'ar' ? 'لا توجد دروس اليوم!' : 'No Lessons Today!'}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[250px]">
                  {language === 'ar' ? 'لقد انتهيت من كل شيء اليوم! استغل هذا الوقت للراحة ومراجعة المواد.' : 'All caught up! Use this time to rest, review notes, or schedule private lessons.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-2">
                {todayLessons.map((lesson) => {
                  const status = getLessonStatus(lesson, currentDay, currentTime);
                  
                  return (
                    <div 
                      key={lesson.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        status === 'active' 
                          ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse-glow' 
                          : status === 'finished'
                          ? 'bg-white/2 border-white/5 opacity-60'
                          : 'bg-white/4 border-white/10 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Status Light */}
                        <div className="relative">
                          <span className={`w-3 h-3 rounded-full block ${
                            status === 'active' 
                              ? 'bg-cyan-400' 
                              : status === 'finished' 
                              ? 'bg-slate-500' 
                              : 'bg-indigo-400'
                          }`} />
                          {status === 'active' && (
                            <span className="absolute -inset-1 rounded-full bg-cyan-400/40 animate-ping" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{lesson.subject}</h4>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {language === 'ar' ? 'بواسطة' : 'with'} {lesson.teacher}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-300 mt-1 font-sans flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>
                              {formatTime(lesson.startTime, timeFormat)} - {formatTime(lesson.endTime, timeFormat)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({formatDuration(lesson.startTime, lesson.endTime)})
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {lesson.location && (
                          <span className="px-2.5 py-1 text-[10px] font-sans text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 rounded-full">
                            {language === 'ar' ? `قاعة ${lesson.location}` : `Room ${lesson.location}`}
                          </span>
                        )}
                        <span className={`text-[10px] font-sans uppercase font-semibold ${
                          status === 'active' 
                            ? 'text-cyan-400' 
                            : status === 'finished' 
                            ? 'text-slate-500' 
                            : 'text-indigo-400'
                        }`}>
                          {status === 'active' 
                            ? (language === 'ar' ? 'نشط الآن' : 'active')
                            : status === 'finished'
                            ? (language === 'ar' ? 'منتهي' : 'finished')
                            : (language === 'ar' ? 'قادم' : 'upcoming')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
