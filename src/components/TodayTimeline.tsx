/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CheckCircle2, 
  Play, 
  Hourglass, 
  Clock, 
  MapPin, 
  CalendarDays,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Lesson, DayOfWeek } from '../types';
import { 
  formatTime, 
  formatDuration, 
  getDayOfWeekFromDate, 
  getLessonStatus, 
  getSecondsUntilLesson, 
  formatCountdown,
  sortLessonsChronologically
} from '../utils/timeUtils';

interface TodayTimelineProps {
  lessons: Lesson[];
  currentTime: Date;
  timeFormat: '12h' | '24h';
  language?: 'ar' | 'en';
}

export default function TodayTimeline({
  lessons,
  currentTime,
  timeFormat,
  language = 'ar'
}: TodayTimelineProps) {
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

  // Fetch today's lessons and sort them chronologically
  const todayLessons = sortLessonsChronologically(
    lessons.filter((l) => l.days.includes(currentDay))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header banner */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest font-sans">
              {language === 'ar' ? 'المتابعة اليومية' : 'Vertical Tracker'}
            </span>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              {language === 'ar' ? 'المخطط الزمني لحصص اليوم' : "Today's Class Timeline"}
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-1">
              {language === 'ar' ? `تتبع حي للحصص والتقدم • ${getTranslatedDay(currentDay)}` : `Live progress tracker • ${currentDay}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 font-sans">
            <CalendarDays className="w-4 h-4 text-cyan-400" />
            <span>
              {todayLessons.length} {language === 'ar' ? 'حصص مجدولة اليوم' : 'scheduled classes today'}
            </span>
          </div>
        </div>
      </div>

      {todayLessons.length === 0 ? (
        /* Empty State */
        <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="p-5 rounded-full bg-indigo-500/5 border border-indigo-500/10 mb-5 animate-bounce">
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {language === 'ar' ? 'جدولك الزمني فارغ اليوم' : 'Your Timeline is Empty Today'}
          </h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            {language === 'ar' 
              ? `لا توجد حصص خصوصية مسجلة ليوم ${getTranslatedDay(currentDay)}. استغل هذا الوقت للمذاكرة الفردية والراحة!` 
              : `There are no private lessons registered for ${currentDay}. Use this time for personal studies or load new schedules!`}
          </p>
        </div>
      ) : (
        /* Timeline Nodes list */
        <div className="glass-panel rounded-3xl p-6 md:p-8 relative">
          
          {/* Vertical axis line down the timeline */}
          <div className={`absolute ${language === 'ar' ? 'right-6 md:right-12' : 'left-6 md:left-12'} top-10 bottom-10 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-400 to-indigo-500`} />

          <div className="space-y-8">
            {todayLessons.map((lesson, idx) => {
              const status = getLessonStatus(lesson, currentDay, currentTime);
              
              // Node configuration based on status
              const getNodeConfig = () => {
                switch (status) {
                  case 'finished':
                    return {
                      icon: CheckCircle2,
                      iconColor: 'text-emerald-400',
                      bgColor: 'bg-emerald-950/20 border-emerald-500/25',
                      nodeDot: 'bg-emerald-500 border-emerald-900',
                      label: language === 'ar' ? 'درس منتهي' : 'Finished Lesson',
                      labelColor: 'text-emerald-400'
                    };
                  case 'active':
                    return {
                      icon: Play,
                      iconColor: 'text-cyan-400',
                      bgColor: 'bg-cyan-950/25 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse-glow',
                      nodeDot: 'bg-cyan-400 border-cyan-100',
                      label: language === 'ar' ? 'نشط الآن' : 'ACTIVE NOW',
                      labelColor: 'text-cyan-400 font-extrabold animate-pulse'
                    };
                  case 'upcoming':
                  default:
                    return {
                      icon: Hourglass,
                      iconColor: 'text-indigo-400',
                      bgColor: 'bg-white/4 border-white/5',
                      nodeDot: 'bg-indigo-400 border-indigo-900',
                      label: language === 'ar' ? 'حصة قادمة' : 'Upcoming Lesson',
                      labelColor: 'text-indigo-400'
                    };
                }
              };

              const config = getNodeConfig();
              const IconComponent = config.icon;
              const startInSecs = getSecondsUntilLesson(lesson, currentTime);

              return (
                <div key={lesson.id} className={`relative flex items-start gap-6 ${language === 'ar' ? 'pr-10 md:pr-20 pl-0' : 'pl-10 md:pl-20 pr-0'} transition-all`}>
                  
                  {/* Vertical Axis Node dot */}
                  <div className={`absolute ${language === 'ar' ? 'right-4 md:right-10' : 'left-4 md:left-10'} top-5 transform ${language === 'ar' ? 'translate-x-1/2' : '-translate-x-1/2'} flex items-center justify-center z-10`}>
                    <div className={`w-4 h-4 rounded-full border-2 ${config.nodeDot} shadow-md`} />
                    {status === 'active' && (
                      <span className="absolute w-6 h-6 rounded-full bg-cyan-400/30 animate-ping pointer-events-none" />
                    )}
                  </div>

                  {/* Main Node Card */}
                  <div 
                    className={`flex-1 rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden ${config.bgColor}`}
                    style={{
                      borderLeft: language === 'ar' ? undefined : `5px solid ${lesson.color || '#3b82f6'}`,
                      borderRight: language === 'ar' ? `5px solid ${lesson.color || '#3b82f6'}` : undefined
                    }}
                  >
                    {/* Gloss sheen overlay */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/2 to-transparent rounded-full pointer-events-none" />

                    {/* Lesson Core Information */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold font-sans tracking-wider uppercase bg-white/5 ${config.labelColor}`}>
                          {config.label}
                        </span>
                        
                        {/* Countdown if upcoming */}
                        {status === 'upcoming' && startInSecs > 0 && (
                          <span className="text-[10px] text-cyan-300 font-sans">
                            {language === 'ar' ? `(تبدأ خلال ${formatCountdown(startInSecs)})` : `(Starts ${formatCountdown(startInSecs)})`}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {lesson.subject}
                      </h3>

                      <p className="text-xs text-slate-300">
                        {language === 'ar' ? 'المعلم: ' : 'Instructor: '}<span className="font-semibold text-white">{lesson.teacher}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs font-sans text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {formatTime(lesson.startTime, timeFormat)} - {formatTime(lesson.endTime, timeFormat)}
                          </span>
                        </div>
                        
                        <div className="w-px h-3 bg-white/10 hidden sm:block" />
                        
                        <div>
                          <span>{language === 'ar' ? 'المدة: ' : 'Duration: '}</span>
                          <span className="text-white font-semibold">{formatDuration(lesson.startTime, lesson.endTime)}</span>
                        </div>

                        {lesson.location && (
                          <>
                            <div className="w-px h-3 bg-white/10 hidden sm:block" />
                            <div className="flex items-center gap-1 text-cyan-300">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? `قاعة ${lesson.location}` : `Room ${lesson.location}`}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side visual badge / stats */}
                    <div className="flex items-center gap-3 bg-white/3 p-3.5 rounded-xl border border-white/5 md:self-stretch justify-center md:min-w-[120px] font-sans text-center">
                      <div className="flex flex-col items-center">
                        <IconComponent className={`w-5 h-5 ${config.iconColor} mb-1`} />
                        <span className="text-[9px] uppercase text-slate-500">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                        <span className="text-xs text-white font-bold capitalize">
                          {status === 'active' 
                            ? (language === 'ar' ? 'نشط' : 'active')
                            : status === 'finished'
                            ? (language === 'ar' ? 'منتهي' : 'finished')
                            : (language === 'ar' ? 'قادم' : 'upcoming')}
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
