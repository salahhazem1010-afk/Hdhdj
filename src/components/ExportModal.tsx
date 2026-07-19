/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, Download, Printer, Share2, FileText, Image, Check, Sparkles, User, Calendar, Clock } from 'lucide-react';
import { Lesson, ExportTheme, DayOfWeek, DAYS_OF_WEEK } from '../types';
import { formatTime, formatDuration } from '../utils/timeUtils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function oklchToRgb(oklchStr: string): string {
  const match = oklchStr.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.deg]+)(?:\s*[\/\s]\s*([\d.]+%?))?\s*\)/i);
  if (!match) return 'rgb(0,0,0)'; // fallback

  const lVal = match[1];
  const cVal = match[2];
  const hVal = match[3];
  const aVal = match[4];

  const L = lVal.endsWith('%') ? parseFloat(lVal) / 100 : parseFloat(lVal);
  const C = parseFloat(cVal);
  const H = parseFloat(hVal);
  const alpha = aVal ? (aVal.endsWith('%') ? parseFloat(aVal) / 100 : parseFloat(aVal)) : 1;

  // Convert OKLCH to OKLAB
  const H_rad = (H * Math.PI) / 180;
  const a = C * Math.cos(H_rad);
  const b = C * Math.sin(H_rad);

  // Convert OKLAB to LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855414 * b;

  // LMS cube
  const l = Math.pow(Math.max(0, l_), 3);
  const m = Math.pow(Math.max(0, m_), 3);
  const s = Math.pow(Math.max(0, s_), 3);

  // LMS to linear RGB
  const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  // Helper for sRGB gamma correction
  const toSRGB = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    const val = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(val * 255);
  };

  const r = toSRGB(r_lin);
  const g = toSRGB(g_lin);
  const rgb_b = toSRGB(b_lin);

  return alpha === 1 ? `rgb(${r}, ${g}, ${rgb_b})` : `rgba(${r}, ${g}, ${rgb_b}, ${alpha})`;
}

async function replaceOklchInStylesheets(): Promise<() => void> {
  const originalStyles: { el: Element; originalVal: string | boolean }[] = [];
  const newStyleElements: HTMLStyleElement[] = [];

  // Find all <style> and <link rel="stylesheet"> elements
  const elements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));

  for (const el of elements) {
    let cssText = '';
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'style') {
      cssText = el.textContent || '';
    } else if (tagName === 'link') {
      const href = (el as HTMLLinkElement).href;
      if (!href) continue;
      try {
        const response = await fetch(href);
        cssText = await response.text();
      } catch (e) {
        console.error('Failed to fetch stylesheet for oklch replacement:', href, e);
        continue;
      }
    }

    if (cssText.includes('oklch')) {
      // Convert all oklch to rgb
      const convertedText = cssText.replace(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.deg]+)(?:\s*[\/\s]\s*([\d.]+%?))?\s*\)/gi, (match) => {
        try {
          return oklchToRgb(match);
        } catch (e) {
          return 'rgba(0,0,0,0)';
        }
      });

      // Create a new style element with converted CSS
      const newStyle = document.createElement('style');
      newStyle.textContent = convertedText;
      document.head.appendChild(newStyle);
      newStyleElements.push(newStyle);

      // Temporarily disable or hide the original element
      if (tagName === 'style') {
        originalStyles.push({ el, originalVal: el.textContent || '' });
        el.textContent = ''; // empty it temporarily
      } else {
        originalStyles.push({ el, originalVal: (el as HTMLLinkElement).disabled });
        (el as HTMLLinkElement).disabled = true; // disable link temporarily
      }
    }
  }

  // Also convert inline styles on the body and elements of the document
  const originalInlineStyles: { el: HTMLElement; style: string }[] = [];
  const allElements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
  for (const el of allElements) {
    const styleAttr = el.getAttribute('style');
    if (styleAttr && styleAttr.includes('oklch')) {
      originalInlineStyles.push({ el, style: styleAttr });
      const fixedStyle = styleAttr.replace(/oklch\([^)]+\)/g, (match) => {
        try {
          return oklchToRgb(match);
        } catch (e) {
          return 'rgba(0,0,0,0)';
        }
      });
      el.setAttribute('style', fixedStyle);
    }
  }

  // Return cleanup function to restore everything back to original state
  return () => {
    // Remove new style elements
    for (const style of newStyleElements) {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }
    // Restore original styles
    for (const item of originalStyles) {
      if (item.el.tagName.toLowerCase() === 'style') {
        item.el.textContent = item.originalVal as string;
      } else {
        (item.el as HTMLLinkElement).disabled = item.originalVal as boolean;
      }
    }
    // Restore original inline styles
    for (const item of originalInlineStyles) {
      item.el.setAttribute('style', item.style);
    }
  };
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  studentName: string;
  currentWeek: string;
  timeFormat: '12h' | '24h';
  language?: 'ar' | 'en';
}

export default function ExportModal({
  isOpen,
  onClose,
  lessons,
  studentName: initialStudentName,
  currentWeek: initialCurrentWeek,
  timeFormat,
  language = 'ar'
}: ExportModalProps) {
  const [theme, setTheme] = useState<ExportTheme>('liquid-glass');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [studentName, setStudentName] = useState(initialStudentName || (language === 'ar' ? 'صلاح عاصم' : 'Active Student'));
  const [weekRange, setWeekRange] = useState(initialCurrentWeek || (language === 'ar' ? 'هذا الأسبوع' : 'This Week'));
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const exportAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Translate days short form
  const getShortTranslatedDay = (day: string) => {
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

  // Calculate total study hours for the timetable
  const totalMinutes = lessons.reduce((sum, lesson) => {
    if (!lesson.startTime || !lesson.endTime || !lesson.days || lesson.days.length === 0) return sum;
    // Calculate total minutes per day, multiplied by number of days it repeats
    const [startH, startM] = lesson.startTime.split(':').map(Number);
    const [endH, endM] = lesson.endTime.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; // over midnight
    return sum + (diff * lesson.days.length);
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Group lessons by day of week
  const getLessonsForDay = (day: DayOfWeek) => {
    return lessons
      .filter((l) => l.days.includes(day))
      .sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
      });
  };

  // Setup theme-specific styling classes
  const getThemeStyles = (t: ExportTheme) => {
    switch (t) {
      case 'minimal-white':
        return {
          wrapper: 'bg-slate-50 text-slate-900 font-sans p-8 border-2 border-slate-200 relative rounded-3xl shadow-xl',
          header: 'border-b pb-6 mb-6 border-slate-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4',
          title: 'text-3xl font-extrabold text-slate-900 tracking-tight',
          metaCard: 'bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-sm shadow-sm font-medium',
          dayHeader: 'bg-slate-200 text-slate-800 font-extrabold border border-slate-300/80 py-2.5 px-2 text-center text-xs uppercase rounded-xl shadow-sm',
          lessonCard: 'bg-white border border-slate-150 p-3.5 rounded-2xl mb-2.5 shadow-sm hover:shadow-md transition-all',
          lessonText: 'text-slate-900 font-bold text-sm',
          subText: 'text-slate-500 text-xs font-medium',
          gridCell: 'border border-slate-200 p-2 min-h-[380px] bg-slate-100/50 rounded-2xl'
        };
      case 'dark-premium':
        return {
          wrapper: 'bg-slate-950 text-slate-100 font-sans p-8 border border-slate-800 relative rounded-3xl shadow-2xl',
          header: 'border-b pb-6 mb-6 border-slate-800',
          title: 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 uppercase tracking-wider',
          metaCard: 'bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-sm text-slate-300 shadow-lg',
          dayHeader: 'bg-slate-900 text-amber-400 font-extrabold border border-slate-800 py-2.5 px-2 text-center text-xs uppercase rounded-xl shadow-md',
          lessonCard: 'bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl mb-2.5 shadow-inner',
          lessonText: 'text-slate-100 font-bold text-sm',
          subText: 'text-slate-400 text-xs font-medium',
          gridCell: 'border border-slate-800/80 p-2 min-h-[380px] bg-slate-950/60 rounded-2xl'
        };
      case 'blue-professional':
        return {
          wrapper: 'bg-sky-50 text-slate-950 font-sans p-8 border border-sky-100 relative rounded-3xl shadow-2xl',
          header: 'border-b pb-6 mb-6 border-sky-200/50 bg-gradient-to-r from-sky-900 to-blue-800 text-white p-6 rounded-2xl shadow-lg',
          title: 'text-3xl font-black text-white tracking-tight',
          metaCard: 'bg-white/10 border border-white/10 p-3 rounded-xl text-sm text-white backdrop-blur-sm',
          dayHeader: 'bg-gradient-to-r from-sky-800 to-blue-700 text-white font-extrabold border border-blue-900/20 py-2.5 px-2 text-center text-xs uppercase rounded-xl shadow-md',
          lessonCard: 'bg-white border border-sky-100 p-3.5 rounded-2xl mb-2.5 shadow-sm',
          lessonText: 'text-slate-900 font-bold text-sm',
          subText: 'text-slate-600 text-xs font-medium',
          gridCell: 'border border-sky-100 p-2 min-h-[380px] bg-sky-100/40 rounded-2xl'
        };
      case 'black-gold':
        return {
          wrapper: 'bg-zinc-950 text-amber-100 font-sans p-8 border-2 border-amber-500/30 relative rounded-3xl shadow-2xl',
          header: 'border-b pb-6 mb-6 border-amber-500/20 text-center',
          title: 'text-4xl font-serif text-amber-400 tracking-widest uppercase font-light',
          metaCard: 'bg-zinc-900 border border-amber-500/20 p-3 rounded-xl text-sm text-amber-200/80 shadow-md',
          dayHeader: 'bg-zinc-900 text-amber-400 font-bold border border-amber-500/20 py-2.5 px-2 text-center text-xs uppercase rounded-xl shadow-md',
          lessonCard: 'bg-zinc-900 border border-amber-500/10 p-3.5 rounded-2xl mb-2.5 shadow-md',
          lessonText: 'text-amber-100 font-extrabold text-sm',
          subText: 'text-amber-300/60 text-xs font-medium',
          gridCell: 'border border-amber-500/10 p-2 min-h-[380px] bg-zinc-900/50 rounded-2xl'
        };
      case 'liquid-glass':
      default:
        return {
          wrapper: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 text-white font-sans p-8 border border-white/10 relative overflow-hidden rounded-3xl shadow-2xl',
          header: 'border-b pb-6 mb-6 border-white/10',
          title: 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 tracking-tight',
          metaCard: 'bg-white/5 border border-white/10 p-3 rounded-2xl text-sm backdrop-blur-md shadow-md',
          dayHeader: 'bg-white/10 text-cyan-200 font-bold border border-white/10 py-2.5 px-2 text-center text-xs uppercase rounded-xl backdrop-blur-md shadow-md',
          lessonCard: 'bg-white/5 border border-white/10 p-3.5 rounded-2xl mb-2.5 backdrop-blur-md shadow-md relative overflow-hidden',
          lessonText: 'text-white font-bold text-sm',
          subText: 'text-slate-300 text-xs font-medium',
          gridCell: 'border border-white/5 p-2 min-h-[380px] bg-white/2 rounded-2xl'
        };
    }
  };

  const selectedThemeStyles = getThemeStyles(theme);

  // Export functions
  const handleExportImage = async (format: 'png' | 'jpg') => {
    if (!exportAreaRef.current) return;
    setExporting(true);
    setSuccessMsg(language === 'ar' ? 'جاري تصوير وتوليد الرندر بالدقة المطلوبة...' : 'Preparing high-resolution render...');

    // Replace oklch with rgb in all style definitions temporarily
    const restoreStyles = await replaceOklchInStylesheets();

    try {
      // Create high resolution canvas
      const canvas = await html2canvas(exportAreaRef.current, {
        scale: 3, // 3x scale for 300 DPI high-res printing output
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === 'minimal-white' ? '#ffffff' : theme === 'dark-premium' ? '#020617' : theme === 'black-gold' ? '#000000' : theme === 'blue-professional' ? '#f8fafc' : '#0c0f1d'
      });

      const dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      
      const link = document.createElement('a');
      link.download = `weekly_timetable_${theme}_${orientation}.${format}`;
      link.href = dataUrl;
      link.click();
      
      setSuccessMsg(language === 'ar' ? `تم تصدير ملف ${format.toUpperCase()} عالي الدقة بنجاح!` : `Successfully exported high-res ${format.toUpperCase()}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setSuccessMsg(language === 'ar' ? 'فشل التصدير. يرجى المحاولة مرة أخرى.' : 'Export failed. Please try again.');
    } finally {
      restoreStyles();
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!exportAreaRef.current) return;
    setExporting(true);
    setSuccessMsg(language === 'ar' ? 'جاري تجميع مستند الـ PDF عالي الجودة...' : 'Compiling PDF structure...');

    // Replace oklch with rgb in all style definitions temporarily
    const restoreStyles = await replaceOklchInStylesheets();

    try {
      const canvas = await html2canvas(exportAreaRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === 'minimal-white' ? '#ffffff' : theme === 'dark-premium' ? '#020617' : theme === 'black-gold' ? '#000000' : theme === 'blue-professional' ? '#f8fafc' : '#0c0f1d'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Determine orientation and page dimensions in mm
      const isLandscape = orientation === 'landscape';
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = isLandscape ? 297 : 210;
      const pdfHeight = isLandscape ? 210 : 297;

      // Calculate ratios to fit perfectly onto A4 page
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / (imgWidth / 10), pdfHeight / (imgHeight / 10));
      
      const printW = (imgWidth / 10) * ratio;
      const printH = (imgHeight / 10) * ratio;
      
      // Center the image
      const posX = (pdfWidth - printW) / 2;
      const posY = (pdfHeight - printH) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, printW, printH);
      pdf.save(`weekly_study_schedule_${theme}.pdf`);

      setSuccessMsg(language === 'ar' ? 'تم تنزيل مستند الـ PDF الفاخر بنجاح!' : 'Successfully downloaded crisp PDF!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setSuccessMsg(language === 'ar' ? 'فشل إنشاء مستند الـ PDF.' : 'PDF generation failed.');
    } finally {
      restoreStyles();
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-6xl glass-panel-heavy rounded-3xl overflow-hidden flex flex-col max-h-[90vh] ${language === 'ar' ? 'dir-rtl' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white">
              {language === 'ar' ? 'استوديو التصدير والطباعة الاحترافي' : 'Professional Print & Export Studio'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Studio Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar controls (1 Column) */}
          <div className={`space-y-6 lg:pb-0 pb-6 ${language === 'ar' ? 'lg:border-l lg:pl-6 lg:border-white/10' : 'lg:border-r lg:pr-6 lg:border-white/10'}`}>
            
            {/* Student Info Inputs */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                {language === 'ar' ? 'بيانات رأس الجدول' : 'Planner Header'}
              </h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{language === 'ar' ? 'اسم الطالب' : 'Student Name'}</label>
                <div className="relative">
                  <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-500`} />
                  <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className={`w-full py-2 text-sm rounded-xl glass-input ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                    placeholder={language === 'ar' ? 'أدخل اسم الطالب' : 'Enter student name'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{language === 'ar' ? 'الأسبوع / نطاق التاريخ' : 'Week/Date Range'}</label>
                <div className="relative">
                  <Calendar className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-500`} />
                  <input 
                    type="text" 
                    value={weekRange}
                    onChange={(e) => setWeekRange(e.target.value)}
                    className={`w-full py-2 text-sm rounded-xl glass-input ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                    placeholder={language === 'ar' ? 'مثال: الأسبوع الثاني (يوليو)' : 'e.g. Week 28 (July)'}
                  />
                </div>
              </div>
            </div>

            {/* Timetable Preset Theme */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest font-sans">
                {language === 'ar' ? 'اختر مظهر التصدير' : 'Select Export Theme'}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'liquid-glass', name: language === 'ar' ? 'آبل الزجاجي السائل' : 'Apple Liquid Glass', bg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600' },
                  { id: 'minimal-white', name: language === 'ar' ? 'أبيض مبسط مطبوع' : 'Minimalist White', bg: 'bg-white border border-slate-300 text-slate-800' },
                  { id: 'dark-premium', name: language === 'ar' ? 'الداكن الذهبي المميز' : 'Dark Premium', bg: 'bg-slate-900 border border-amber-500/20' },
                  { id: 'blue-professional', name: language === 'ar' ? 'أزرق احترافي مدرسي' : 'Blue Professional', bg: 'bg-blue-800' },
                  { id: 'black-gold', name: language === 'ar' ? 'الأسود والذهبي الفاخر' : 'Black & Gold', bg: 'bg-black border border-amber-500' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as ExportTheme)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                      theme === t.id 
                        ? 'ring-2 ring-cyan-400 bg-white/10 font-bold' 
                        : 'bg-slate-800/40 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full ${t.bg}`}></span>
                      <span className="text-xs text-white">{t.name}</span>
                    </div>
                    {theme === t.id && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Options */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest font-sans">
                {language === 'ar' ? 'تخطيط الصفحة A4' : 'A4 Orientation'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer ${
                    orientation === 'portrait'
                      ? 'border-cyan-400 bg-cyan-400/10 text-white font-bold'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {language === 'ar' ? 'طولي (Vertical)' : 'Portrait (Vertical)'}
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer ${
                    orientation === 'landscape'
                      ? 'border-cyan-400 bg-cyan-400/10 text-white font-bold'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {language === 'ar' ? 'عرضي (Horizontal)' : 'Landscape (Horizontal)'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-sans">
                {language === 'ar' ? 'صيغ التصدير والطباعة' : 'Export Formats'}
              </h3>
              
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold text-sm shadow-lg shadow-rose-950/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                {language === 'ar' ? 'تصدير كملف PDF عالي الدقة' : 'Export High-Res PDF'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExportImage('png')}
                  disabled={exporting}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-white/10 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5 text-cyan-400" />
                  {language === 'ar' ? 'صورة PNG' : 'PNG Image'}
                </button>
                <button
                  onClick={() => handleExportImage('jpg')}
                  disabled={exporting}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-white/10 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5 text-indigo-400" />
                  {language === 'ar' ? 'صورة JPG' : 'JPG Image'}
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                {language === 'ar' ? 'طباعة عبر المتصفح مباشر' : 'Print via Browser'}
              </button>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-center text-xs animate-bounce font-medium font-sans">
                {successMsg}
              </div>
            )}

          </div>

          {/* Render Area (3 Columns) */}
          <div className="lg:col-span-3 flex flex-col justify-start items-center p-4 bg-slate-950/40 rounded-2xl border border-white/5 overflow-x-auto min-h-[450px]">
            
            <p className="text-xs text-slate-500 mb-2 font-sans">
              {language === 'ar' ? 'المعاينة الحية لملف التصدير' : 'Live Export Preview'} ({orientation.toUpperCase()})
            </p>
            
            {/* The Actual Timetable container that gets rendered for export */}
            <div 
              id="printable-timetable-root"
              ref={exportAreaRef}
              className={`rounded-2xl shadow-2xl transition-all duration-300 ${selectedThemeStyles.wrapper} ${language === 'ar' ? 'dir-rtl text-right' : 'text-left'}`}
              style={{
                width: orientation === 'landscape' ? '1000px' : '750px',
                minHeight: '600px',
                transform: 'scale(1)',
                transformOrigin: 'top center'
              }}
            >
              {/* Theme Decorative blobs (only if Liquid theme selected) */}
              {theme === 'liquid-glass' && (
                <>
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
                </>
              )}

              {/* Timetable Header */}
              <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${selectedThemeStyles.header}`}>
                <div>
                  <h1 className={`${selectedThemeStyles.title} font-bold`}>
                    {language === 'ar' ? 'الجدول الدراسي الأسبوعي לחصصي الخصوصية' : 'Weekly Study Schedule'}
                  </h1>
                  <p className={`text-sm mt-1 font-sans ${theme === 'minimal-white' ? 'text-gray-500' : 'text-slate-400'}`}>
                    {language === 'ar' ? 'مخطط ومتابع ميزانية الدروس لطلاب الثانوية' : 'High School Private Lessons Planner'}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:flex gap-3">
                  <div className={selectedThemeStyles.metaCard}>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-sans">
                      {language === 'ar' ? 'اسم الطالب' : 'Student Name'}
                    </p>
                    <p className="font-bold">{studentName}</p>
                  </div>
                  <div className={selectedThemeStyles.metaCard}>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-sans">
                      {language === 'ar' ? 'أسبوع الجدول' : 'Schedule Week'}
                    </p>
                    <p className="font-bold">{weekRange}</p>
                  </div>
                  <div className={selectedThemeStyles.metaCard}>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-sans">
                      {language === 'ar' ? 'الجهد الأسبوعي' : 'Weekly Load'}
                    </p>
                    <p className="font-bold text-cyan-400">{totalHours} {language === 'ar' ? 'ساعة' : 'Hours'}</p>
                  </div>
                </div>
              </div>

              {/* Timetable Grid */}
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const dayLessons = getLessonsForDay(day);

                  return (
                    <div key={day} className="flex flex-col gap-2">
                      {/* Day Header */}
                      <div className={selectedThemeStyles.dayHeader}>
                        {getShortTranslatedDay(day)}
                      </div>

                      {/* Day Grid Cell containing Lessons */}
                      <div className={`flex-1 flex flex-col gap-2 rounded-xl ${selectedThemeStyles.gridCell}`}>
                        {dayLessons.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-[10px] text-slate-500/60 font-sans italic">
                              {language === 'ar' ? 'يوم حر' : 'Free Day'}
                            </span>
                          </div>
                        ) : (
                          dayLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={selectedThemeStyles.lessonCard}
                              style={{
                                borderLeft: language === 'ar' ? undefined : `4px solid ${lesson.color || '#3b82f6'}`,
                                borderRight: language === 'ar' ? `4px solid ${lesson.color || '#3b82f6'}` : undefined,
                                backgroundColor: theme === 'liquid-glass' 
                                  ? `${lesson.color}15` 
                                  : theme === 'minimal-white'
                                    ? `${lesson.color}12`
                                    : theme === 'dark-premium'
                                      ? `${lesson.color}20`
                                      : theme === 'black-gold'
                                        ? `${lesson.color}18`
                                        : `${lesson.color}15`
                              }}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-xs ${selectedThemeStyles.lessonText} block truncate w-full font-bold`}>
                                  {lesson.subject}
                                </span>
                                <span 
                                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: lesson.color }}
                                />
                              </div>
                              <p className={`text-[10px] ${selectedThemeStyles.subText} mt-0.5 truncate`}>
                                {lesson.teacher}
                              </p>
                              
                              <div className="flex items-center gap-1 mt-2 text-[9px] text-slate-400/80 font-sans">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{formatTime(lesson.startTime, timeFormat)}</span>
                              </div>
                              <p className={`text-[8px] text-slate-500 mt-1 font-sans italic ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                                ({formatDuration(lesson.startTime, lesson.endTime)})
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timetable Footer */}
              <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500/80 font-sans">
                <span>{language === 'ar' ? `تم الإنشاء في ${new Date().toLocaleDateString('ar-EG')}` : `Generated on ${new Date().toLocaleDateString()}`}</span>
                <span>{language === 'ar' ? 'مخطط الحصص الأسبوعي الخصوصي • واجهات آبل الزجاجية السائلة' : 'Weekly Study Planner • Apple Liquid Glass Suite'}</span>
                <span>{language === 'ar' ? 'صفحة ١ من ١' : 'Page 1 of 1'}</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
