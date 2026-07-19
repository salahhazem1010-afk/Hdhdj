/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Clock, 
  BookOpen, 
  CalendarDays,
  Award
} from 'lucide-react';
import { Lesson, DayOfWeek, DAYS_OF_WEEK } from '../types';

interface StatisticsProps {
  lessons: Lesson[];
  language?: 'ar' | 'en';
}

export default function Statistics({ lessons, language = 'ar' }: StatisticsProps) {
  
  // Day translations
  const getShortDayText = (day: string) => {
    switch (day) {
      case 'Saturday': return language === 'ar' ? 'سبت' : 'Sat';
      case 'Sunday': return language === 'ar' ? 'أحد' : 'Sun';
      case 'Monday': return language === 'ar' ? 'إثنين' : 'Mon';
      case 'Tuesday': return language === 'ar' ? 'ثلاثاء' : 'Tue';
      case 'Wednesday': return language === 'ar' ? 'أربعاء' : 'Wed';
      case 'Thursday': return language === 'ar' ? 'خميس' : 'Thu';
      case 'Friday': return language === 'ar' ? 'جمعة' : 'Fri';
      default: return day.substring(0, 3);
    }
  };

  const getFullDayText = (day: string) => {
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

  // 1. Calculate study hours per day
  const dailyHoursMap: Record<DayOfWeek, number> = {
    'Saturday': 0,
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0
  };

  // 2. Calculate study hours per subject
  const subjectHoursMap: Record<string, { hours: number; color: string }> = {};

  lessons.forEach((lesson) => {
    if (!lesson.startTime || !lesson.endTime || !lesson.days || lesson.days.length === 0) return;
    // Calculate single occurrence duration in hours
    const [startH, startM] = lesson.startTime.split(':').map(Number);
    const [endH, endM] = lesson.endTime.split(':').map(Number);
    let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMins < 0) diffMins += 24 * 60; // Midnight rollover
    const diffHours = diffMins / 60;

    // Add to daily workload
    lesson.days.forEach((day) => {
      dailyHoursMap[day] += diffHours;
    });

    // Add to subject workload
    const key = lesson.subject || 'Unknown';
    if (!subjectHoursMap[key]) {
      subjectHoursMap[key] = { hours: 0, color: lesson.color || '#3b82f6' };
    }
    subjectHoursMap[key].hours += (diffHours * lesson.days.length);
  });

  // Convert daily maps to arrays
  const dailyWorkloadData = DAYS_OF_WEEK.map((day) => ({
    label: day,
    hours: dailyHoursMap[day]
  }));

  const subjectWorkloadData = Object.entries(subjectHoursMap).map(([subject, info]) => ({
    subject,
    hours: info.hours,
    color: info.color
  })).sort((a, b) => b.hours - a.hours);

  // Derive stats
  const totalWeeklyHours = dailyWorkloadData.reduce((sum, d) => sum + d.hours, 0);
  
  // Find busiest day
  let busiestDay: DayOfWeek = 'Saturday';
  let maxDayHours = 0;
  dailyWorkloadData.forEach((d) => {
    if (d.hours > maxDayHours) {
      maxDayHours = d.hours;
      busiestDay = d.label;
    }
  });

  // Find top subject
  const topSubject = subjectWorkloadData.length > 0 ? subjectWorkloadData[0] : null;

  // Render SVG charts
  const renderDailyWorkloadChart = () => {
    const chartHeight = 160;
    const chartWidth = 500;
    const maxVal = Math.max(...dailyWorkloadData.map(d => d.hours), 2);
    const padding = 30;
    
    // Draw coordinates
    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full text-slate-400">
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Helper grid lines */}
        <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Draw Workload Bars (Glass look with soft glowing colors) */}
        {dailyWorkloadData.map((d, i) => {
          const colWidth = (chartWidth - padding * 2) / 7;
          const barWidth = Math.min(22, colWidth - 10);
          const x = padding + i * colWidth + (colWidth - barWidth) / 2;
          const barHeight = (d.hours / maxVal) * (chartHeight - padding * 2);
          const y = chartHeight - padding - barHeight;

          return (
            <g key={d.label} className="group cursor-pointer">
              {/* Invisible trigger block */}
              <rect x={x - 10} y={padding} width={barWidth + 20} height={chartHeight - padding * 2} fill="transparent" />
              
              {/* Glowing active background */}
              {d.hours > 0 && (
                <rect 
                  x={x} 
                  y={y} 
                  width={barWidth} 
                  height={barHeight} 
                  rx="6" 
                  fill="url(#chartGlow)" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity" 
                />
              )}

              {/* Foreground Glass Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 3)}
                rx="6"
                fill={d.hours > 0 ? "rgba(6, 182, 212, 0.7)" : "rgba(255,255,255,0.05)"}
                stroke={d.hours > 0 ? "rgba(168, 85, 247, 0.4)" : "transparent"}
                strokeWidth="1.5"
                className="group-hover:fill-cyan-400 group-hover:stroke-cyan-300 transition-all duration-300"
              />

              {/* Data label */}
              {d.hours > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                  className="font-sans opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {d.hours.toFixed(1)}{language === 'ar' ? 'س' : 'h'}
                </text>
              )}

              {/* Day Name Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight - 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                fontWeight="medium"
                className="font-sans group-hover:fill-white transition-colors"
              >
                {getShortDayText(d.label)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderSubjectWorkloadChart = () => {
    if (subjectWorkloadData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[180px] text-slate-500 font-sans text-xs">
          {language === 'ar' ? 'لا توجد دروس مسجلة حالياً لعرضها.' : 'No lessons registered.'}
        </div>
      );
    }

    return (
      <div className="space-y-3 pt-2">
        {subjectWorkloadData.map((data) => {
          const maxHours = Math.max(...subjectWorkloadData.map((s) => s.hours), 1);
          const pct = (data.hours / maxHours) * 100;

          return (
            <div key={data.subject} className="group space-y-1">
              <div className={`flex items-center justify-between text-xs ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                  <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{data.subject}</span>
                </div>
                <span className="font-sans text-slate-300 font-semibold">
                  {data.hours.toFixed(1)} {language === 'ar' ? 'ساعة أسبوعياً' : 'hrs'}
                </span>
              </div>
              
              {/* Glass bar */}
              <div className="w-full bg-white/5 h-3.5 rounded-full border border-white/5 overflow-hidden flex relative">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 relative ${language === 'ar' ? 'right-0 absolute' : ''}`}
                  style={{ 
                    width: `${pct}%`,
                    backgroundColor: data.color,
                    boxShadow: `0 0 10px ${data.color}40`
                  }}
                >
                  {/* Sheen effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : ''}`}>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total hours */}
        <div className={`glass-panel rounded-2xl p-5 flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans">
              {language === 'ar' ? 'ساعات الحصص الأسبوعية' : 'Weekly Class Hours'}
            </span>
            <p className="text-xl font-bold text-white mt-0.5">
              {totalWeeklyHours.toFixed(1)} {language === 'ar' ? 'ساعة' : 'hrs'}
            </p>
            <p className="text-[9px] text-slate-500 font-sans">
              {language === 'ar' ? 'إجمالي الحمل الدراسي الملتزم به' : 'committed study load'}
            </p>
          </div>
        </div>

        {/* Top Subject */}
        <div className={`glass-panel rounded-2xl p-5 flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans">
              {language === 'ar' ? 'المادة الأكثر حملاً دراسياً' : 'Busiest Subject'}
            </span>
            <p className="text-xl font-bold text-white mt-0.5 truncate max-w-[150px]">
              {topSubject ? topSubject.subject : (language === 'ar' ? 'لا توجد' : 'N/A')}
            </p>
            <p className="text-[9px] text-slate-500 font-sans">
              {topSubject 
                ? `${topSubject.hours.toFixed(1)} ${language === 'ar' ? 'ساعة/أسبوع' : 'hours/week'}` 
                : (language === 'ar' ? 'لم تضف دروساً بعد' : 'no lessons added')}
            </p>
          </div>
        </div>

        {/* Busiest day */}
        <div className={`glass-panel rounded-2xl p-5 flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans">
              {language === 'ar' ? 'يوم الذروة الأسبوعي' : 'Peak Lesson Day'}
            </span>
            <p className="text-xl font-bold text-white mt-0.5">
              {maxDayHours > 0 ? getFullDayText(busiestDay) : (language === 'ar' ? 'لا يوجد' : 'N/A')}
            </p>
            <p className="text-[9px] text-slate-500 font-sans">
              {maxDayHours > 0 
                ? `${maxDayHours.toFixed(1)} ${language === 'ar' ? 'ساعات دراسية' : 'lesson hours'}` 
                : (language === 'ar' ? 'أسبوع دراسي فارغ' : 'fully free week')}
            </p>
          </div>
        </div>

      </div>

      {/* Main Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Workload Daily wave */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className={`flex items-center gap-2 mb-4 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  {language === 'ar' ? 'توزيع الحمل والجهد الدراسي اليومي' : 'Daily Workload Distribution'}
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  {language === 'ar' ? 'مخطط بياني يمثل الساعات الدراسية الملتزم بها لكل يوم' : 'Study hours mapped Sunday through Friday'}
                </p>
              </div>
            </div>

            <div className="h-[220px] flex items-center justify-center p-2 bg-white/1 rounded-2xl border border-white/5 mt-4">
              {renderDailyWorkloadChart()}
            </div>
          </div>
          
          <div className={`mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-sans ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span>
              {language === 'ar' ? 'الرسم تفاعلي • مرر الفأرة لمشاهدة التفاصيل' : 'Graph is interactive • hover items'}
            </span>
            <span>
              {language === 'ar' ? 'حدود المقياس: ٠ إلى ' : 'Scale bounds: 0 - '}
              {Math.max(...dailyWorkloadData.map(d => d.hours), 4).toFixed(0)}
              {language === 'ar' ? ' ساعة' : 'h'}
            </span>
          </div>
        </div>

        {/* Subject Bar breakout */}
        <div className="glass-panel rounded-3xl p-6">
          <div className={`flex items-center gap-2 mb-4 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <PieChart className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                {language === 'ar' ? 'نسبة الاستهلاك الزمني لكل مقرر' : 'Study Share by Subject'}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                {language === 'ar' ? 'مجموع الساعات الدراسية التراكمية لكل مادة أسبوعياً' : 'Total study hours breakouts per course'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/1 rounded-2xl border border-white/5 max-h-[220px] overflow-y-auto">
            {renderSubjectWorkloadChart()}
          </div>

          <div className={`mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-sans flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span>
              {language === 'ar' ? 'يتم احتساب تكرار الحصص طوال الأسبوع' : 'Subject volumes account for repeat days'}
            </span>
            <span>
              {subjectWorkloadData.length} {language === 'ar' ? 'مواد مسجلة' : 'Subjects monitored'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
