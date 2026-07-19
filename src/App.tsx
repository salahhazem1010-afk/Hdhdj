/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Keyboard,
  Info
} from 'lucide-react';

// Import Types
import { 
  Lesson, 
  AppSettings, 
  DayOfWeek, 
  ConflictWarning, 
  ActiveNotification 
} from './types';

// Import Utilities
import { 
  detectConflicts, 
  getDayOfWeekFromDate, 
  formatTime,
  timeToMinutes
} from './utils/timeUtils';

// Import Sub-components
import Sidebar, { AppTab } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WeeklyTimetable from './components/WeeklyTimetable';
import TodayTimeline from './components/TodayTimeline';
import MonthlyCalendar from './components/MonthlyCalendar';
import Statistics from './components/Statistics';
import SettingsPanel from './components/SettingsPanel';
import LessonModal from './components/LessonModal';
import ExportModal from './components/ExportModal';

import { translations } from './utils/translations';

// High School default lessons for first-time premium load
const DEFAULT_LESSONS: Lesson[] = [
  {
    id: 'l-sharia-1',
    subject: 'التوحيد والحديث',
    subjectAr: 'التوحيد والحديث',
    subjectEn: 'Tawheed & Hadith',
    teacher: 'أ. مجدي شعبان',
    teacherAr: 'أ. مجدي شعبان',
    teacherEn: 'Magdy Shaaban',
    days: ['Sunday'],
    startTime: '08:00',
    endTime: '09:00',
    color: '#06b6d4', // Cyan
    notes: 'العلوم الشرعية',
    notesAr: 'العلوم الشرعية',
    notesEn: 'Islamic Studies'
  },
  {
    id: 'l-sharia-2',
    subject: 'التفسير',
    subjectAr: 'التفسير',
    subjectEn: 'Tafsir',
    teacher: 'أ. مجدي شعبان',
    teacherAr: 'أ. مجدي شعبان',
    teacherEn: 'Magdy Shaaban',
    days: ['Tuesday'],
    startTime: '08:00',
    endTime: '09:00',
    color: '#3b82f6', // Blue
    notes: 'العلوم الشرعية',
    notesAr: 'العلوم الشرعية',
    notesEn: 'Islamic Studies'
  },
  {
    id: 'l-sharia-3',
    subject: 'الفقه',
    subjectAr: 'الفقه',
    subjectEn: 'Fiqh',
    teacher: 'أ. مجدي شعبان',
    teacherAr: 'أ. مجدي شعبان',
    teacherEn: 'Magdy Shaaban',
    days: ['Thursday'],
    startTime: '08:00',
    endTime: '09:00',
    color: '#6366f1', // Indigo
    notes: 'العلوم الشرعية',
    notesAr: 'العلوم الشرعية',
    notesEn: 'Islamic Studies'
  },
  {
    id: 'l-bio',
    subject: 'الأحياء',
    subjectAr: 'الأحياء',
    subjectEn: 'Biology',
    teacher: 'أ. محمد إبراهيم',
    teacherAr: 'أ. محمد إبراهيم',
    teacherEn: 'Mohamed Ibrahim',
    days: ['Saturday', 'Monday', 'Wednesday'],
    startTime: '08:30',
    endTime: '10:00',
    color: '#10b981', // Emerald
  },
  {
    id: 'l-math',
    subject: 'الرياضيات',
    subjectAr: 'الرياضيات',
    subjectEn: 'Mathematics',
    teacher: 'أ. إسماعيل البنا',
    teacherAr: 'أ. إسماعيل البنا',
    teacherEn: 'Ismail El Banna',
    days: ['Saturday', 'Monday', 'Wednesday'],
    startTime: '15:30',
    endTime: '17:00',
    color: '#a855f7', // Purple
  },
  {
    id: 'l-chem',
    subject: 'الكيمياء',
    subjectAr: 'الكيمياء',
    subjectEn: 'Chemistry',
    teacher: 'أ. محمد هلال',
    teacherAr: 'أ. محمد هلال',
    teacherEn: 'Mohamed Helal',
    days: ['Sunday', 'Tuesday', 'Thursday'],
    startTime: '16:00',
    endTime: '17:30',
    color: '#f97316', // Orange
  },
  {
    id: 'l-eng',
    subject: 'اللغة الإنجليزية',
    subjectAr: 'اللغة الإنجليزية',
    subjectEn: 'English',
    teacher: 'مستر هشام صلاح',
    teacherAr: 'مستر هشام صلاح',
    teacherEn: 'Hesham Salah',
    days: ['Saturday', 'Monday', 'Wednesday'],
    startTime: '12:00',
    endTime: '13:00',
    color: '#f43f5e', // Rose
  },
  {
    id: 'l-arabic',
    subject: 'اللغة العربية',
    subjectAr: 'اللغة العربية',
    subjectEn: 'Arabic Language',
    teacher: 'أ. عبد الله عمر',
    teacherAr: 'أ. عبد الله عمر',
    teacherEn: 'Abdullah Omar',
    days: [],
    startTime: '',
    endTime: '',
    color: '#ec4899', // Pink
  },
  {
    id: 'l-phys',
    subject: 'الفيزياء',
    subjectAr: 'الفيزياء',
    subjectEn: 'Physics',
    teacher: 'أ. أحمد هشام',
    teacherAr: 'أ. أحمد هشام',
    teacherEn: 'Ahmed Hesham',
    days: [],
    startTime: '',
    endTime: '',
    color: '#eab308', // Yellow
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'cyan',
  timeFormat: '12h',
  animationSpeed: 'normal',
  studentName: 'صلاح حازم',
  currentWeek: 'الأسبوع الأول',
  language: 'ar'
};

export default function App() {
  // 1. Core States
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Modals & Panels toggle
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Custom Notifications lists
  const [notifications, setNotifications] = useState<ActiveNotification[]>([]);
  const [isNotifTrayOpen, setIsNotifTrayOpen] = useState(false);
  
  // Warnings cache
  const [conflicts, setConflicts] = useState<ConflictWarning[]>([]);

  // Keyboard shortcut instructions display state
  const [showShortcutsTip, setShowShortcutsTip] = useState(false);

  // Helper track triggered notifications today
  const [triggeredNotifsCache, setTriggeredNotifsCache] = useState<Record<string, boolean>>({});

  // 2. Load LocalStorage on Startup
  useEffect(() => {
    // Lessons
    const savedLessons = localStorage.getItem('weekly_lessons_v2');
    if (savedLessons) {
      try {
        setLessons(JSON.parse(savedLessons));
      } catch (e) {
        setLessons(DEFAULT_LESSONS);
      }
    } else {
      setLessons(DEFAULT_LESSONS);
      localStorage.setItem('weekly_lessons_v2', JSON.stringify(DEFAULT_LESSONS));
    }

    // Settings
    const savedSettings = localStorage.getItem('weekly_lessons_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 3. Keep body class, lang, and dir sync with settings
  useEffect(() => {
    if (settings.theme === 'light') {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
  }, [settings.theme]);

  useEffect(() => {
    const isRtl = (settings.language || 'ar') === 'ar';
    document.body.dir = isRtl ? 'rtl' : 'ltr';
    document.body.lang = settings.language || 'ar';
  }, [settings.language]);

  // 4. Live Clock Interval & Notifications Checker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Perform automated reminder scans every 10 seconds
      checkUpcomingLessonsReminders(now);
    }, 1000);

    return () => clearInterval(timer);
  }, [lessons, triggeredNotifsCache]);

  // 5. Check conflicts whenever lessons array updates
  useEffect(() => {
    const detected = detectConflicts(lessons);
    setConflicts(detected);
  }, [lessons]);

  // Check and fire reminders 30m, 15m, 5m before lesson start
  const checkUpcomingLessonsReminders = (now: Date) => {
    const todayDay = getDayOfWeekFromDate(now);
    const todayLessons = lessons.filter(l => l.days.includes(todayDay));
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const dateKey = now.toDateString(); // To unique trigger per day

    todayLessons.forEach(lesson => {
      const startMins = timeToMinutes(lesson.startTime);
      const diffMins = startMins - currentMins;

      // Only care about upcoming lessons within 30 mins
      if (diffMins === 30 || diffMins === 15 || diffMins === 5) {
        const cacheKey = `${dateKey}-${lesson.id}-${diffMins}`;
        
        // Prevent double triggers
        if (!triggeredNotifsCache[cacheKey]) {
          triggerReminder(lesson, diffMins);
          setTriggeredNotifsCache(prev => ({ ...prev, [cacheKey]: true }));
        }
      }
    });
  };

  const triggerReminder = (lesson: Lesson, minutesLeft: number) => {
    const title = `${lesson.subject} starts in ${minutesLeft} minutes!`;
    const msg = `Your lesson with ${lesson.teacher} starts at ${formatTime(lesson.startTime, settings.timeFormat)} in ${lesson.location || 'your chosen classroom'}.`;

    // 1. In-App Tray Notification
    const newNotif: ActiveNotification = {
      id: Math.random().toString(36).substring(2, 9),
      lessonId: lesson.id,
      title,
      message: msg,
      time: new Date(),
      type: 'reminder',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // 2. Real Browser Notification (if permitted)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: msg,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.error('Failed to trigger browser notification:', err);
      }
    }
  };

  // 6. Global Actions
  const handleSaveLesson = (savedLesson: Lesson) => {
    let updatedLessons = [];
    const exists = lessons.some(l => l.id === savedLesson.id);

    if (exists) {
      const original = lessons.find(l => l.id === savedLesson.id);
      const mergedLesson = {
        ...original,
        ...savedLesson,
        ...(settings.language === 'ar'
          ? { subjectAr: savedLesson.subject, teacherAr: savedLesson.teacher, notesAr: savedLesson.notes }
          : { subjectEn: savedLesson.subject, teacherEn: savedLesson.teacher, notesEn: savedLesson.notes })
      };
      updatedLessons = lessons.map(l => l.id === savedLesson.id ? mergedLesson : l);
    } else {
      updatedLessons = [
        ...lessons,
        {
          ...savedLesson,
          subjectAr: settings.language === 'ar' ? savedLesson.subject : undefined,
          subjectEn: settings.language === 'en' ? savedLesson.subject : undefined,
          teacherAr: settings.language === 'ar' ? savedLesson.teacher : undefined,
          teacherEn: settings.language === 'en' ? savedLesson.teacher : undefined,
          notesAr: settings.language === 'ar' ? savedLesson.notes : undefined,
          notesEn: settings.language === 'en' ? savedLesson.notes : undefined,
        }
      ];
    }

    setLessons(updatedLessons);
    localStorage.setItem('weekly_lessons_v2', JSON.stringify(updatedLessons));
    setIsLessonModalOpen(false);
    setEditingLesson(null);
  };

  const handleDeleteLesson = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      const updated = lessons.filter(l => l.id !== id);
      setLessons(updated);
      localStorage.setItem('weekly_lessons_v2', JSON.stringify(updated));
    }
  };

  const handleDuplicateLesson = (lesson: Lesson) => {
    const rawLesson = lessons.find(l => l.id === lesson.id) || lesson;
    const duplicated: Lesson = {
      ...rawLesson,
      id: Math.random().toString(36).substring(2, 9),
      subject: `${rawLesson.subject} (Copy)`,
      subjectAr: rawLesson.subjectAr ? `${rawLesson.subjectAr} (نسخة)` : undefined,
      subjectEn: rawLesson.subjectEn ? `${rawLesson.subjectEn} (Copy)` : undefined
    };
    setEditingLesson(duplicated);
    setIsLessonModalOpen(true);
  };

  const handleEditClick = (lesson: Lesson) => {
    const rawLesson = lessons.find(l => l.id === lesson.id) || lesson;
    setEditingLesson(rawLesson);
    setIsLessonModalOpen(true);
  };

  // Reschedule via Drag & Drop dropping cell action
  const handleRescheduleLesson = (lessonId: string, oldDay: DayOfWeek, newDay: DayOfWeek) => {
    const updated = lessons.map(lesson => {
      if (lesson.id === lessonId) {
        // Replace oldDay with newDay inside days array
        const filteredDays = lesson.days.filter(d => d !== oldDay);
        const updatedDays = [...filteredDays, newDay];
        return {
          ...lesson,
          days: updatedDays as DayOfWeek[]
        };
      }
      return lesson;
    });

    setLessons(updated);
    localStorage.setItem('weekly_lessons_v2', JSON.stringify(updated));
  };

  // Settings Actions
  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem('weekly_lessons_settings', JSON.stringify(updated));
  };

  // Backup Operations
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(lessons, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataUri);
    downloadAnchor.setAttribute('download', 'weekly_study_schedule_backup.json');
    downloadAnchor.click();
  };

  const handleImportBackup = (importedLessons: any) => {
    setLessons(importedLessons);
    localStorage.setItem('weekly_lessons_v2', JSON.stringify(importedLessons));
  };

  const handleClearAllData = () => {
    setLessons([]);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('weekly_lessons_v2');
    localStorage.removeItem('weekly_lessons_settings');
  };

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if writing in fields
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') {
        return;
      }

      switch (e.code) {
        case 'KeyN':
          e.preventDefault();
          setEditingLesson(null);
          setIsLessonModalOpen(true);
          break;
        case 'KeyD':
          e.preventDefault();
          setActiveTab('dashboard');
          break;
        case 'KeyT':
          e.preventDefault();
          setActiveTab('timetable');
          break;
        case 'KeyL':
          e.preventDefault();
          setActiveTab('timeline');
          break;
        case 'KeyC':
          e.preventDefault();
          setActiveTab('calendar');
          break;
        case 'KeyS':
          e.preventDefault();
          setActiveTab('settings');
          break;
        case 'Escape':
          setIsLessonModalOpen(false);
          setIsExportModalOpen(false);
          setIsNotifTrayOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Notification clear triggers
  const clearNotifications = () => {
    setNotifications([]);
  };

  const t = translations[settings.language || 'ar'];

  // Dynamically translate lessons for display components based on active language
  const localizedLessons = lessons.map(lesson => ({
    ...lesson,
    subject: settings.language === 'ar' ? (lesson.subjectAr || lesson.subject) : (lesson.subjectEn || lesson.subject),
    teacher: settings.language === 'ar' ? (lesson.teacherAr || lesson.teacher) : (lesson.teacherEn || lesson.teacher),
    notes: lesson.notes ? (settings.language === 'ar' ? (lesson.notesAr || lesson.notes) : (lesson.notesEn || lesson.notes)) : undefined,
  }));

  return (
    <div className="min-h-screen relative font-sans text-slate-800 dark:text-slate-100 flex flex-col md:flex-row p-4 md:p-6 gap-6 selection:bg-cyan-500/30 selection:text-white">
      
      {/* 1. Ambient Animated Background (Apple iOS Fluid Glass look) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        {/* Blob 1: Cyan Cyan */}
        <div className="absolute top-1/4 left-1/4 w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-gradient-to-tr from-cyan-400/20 to-teal-400/5 blur-[100px] md:blur-[140px] animate-liquid-blob-1" />
        {/* Blob 2: Dark Purple Indigo */}
        <div className="absolute top-1/2 right-1/4 w-[300px] md:w-[550px] h-[300px] md:h-[550px] rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent blur-[120px] md:blur-[160px] animate-liquid-blob-2" />
        {/* Blob 3: Rose Cyan glow */}
        <div className="absolute bottom-1/4 left-1/3 w-[250px] md:w-[450px] h-[250px] md:h-[450px] rounded-full bg-gradient-to-tr from-pink-500/10 to-cyan-500/10 blur-[90px] md:blur-[130px] animate-liquid-blob-3" />
      </div>

      {/* 2. Glass Floating Sidebar / Nav Rail */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => { setEditingLesson(null); setIsLessonModalOpen(true); }}
        currentTime={currentTime}
        accentColor={settings.accentColor}
        language={settings.language}
      />

      {/* 3. Main Workspace Area */}
      <main className="flex-1 flex flex-col gap-6 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto pb-24 md:pb-0">
        
        {/* Workspace Top Toolbar */}
        <header className="flex items-center justify-between px-4 py-3 glass-panel rounded-2xl border border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="text-cyan-400 w-4 h-4" />
            <h2 className="text-sm font-bold text-white font-sans uppercase tracking-widest">
              {activeTab === 'dashboard' ? t.overviewHub : (t[activeTab] || activeTab)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard Shortcuts Helper Button */}
            <button
              onClick={() => setShowShortcutsTip(!showShortcutsTip)}
              className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              title={t.keyboardShortcuts}
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Notification alert Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifTrayOpen(!isNotifTrayOpen)}
                className={`p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all relative ${
                  notifications.length > 0 ? 'text-cyan-400 animate-bounce' : ''
                }`}
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </button>

              {/* Slide-out notification panel tray */}
              {isNotifTrayOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel-heavy p-4 border border-white/10 shadow-2xl z-50 text-xs text-slate-300 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-bold text-white flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-cyan-400" />
                      {t.upcomingLesson} ({notifications.length})
                    </span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold"
                      >
                        {settings.language === 'ar' ? 'مسح الكل' : 'Clear All'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 italic">
                        {settings.language === 'ar' ? 'لا توجد إشعارات نشطة حالياً.' : 'No active lesson notifications.'}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-2.5 rounded-xl bg-white/3 border border-white/5 text-[11px] leading-relaxed">
                          <p className="font-bold text-white">{notif.title}</p>
                          <p className="text-slate-400 mt-1">{notif.message}</p>
                          <span className="text-[9px] text-slate-500 font-mono block mt-1.5">
                            {notif.time.toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-white/10" />

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white hover:opacity-95 shadow-md active:scale-98 transition-all font-sans"
            >
              {t.export}
            </button>
          </div>
        </header>

        {/* Keyboard shortcut popdown card */}
        {showShortcutsTip && (
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs leading-relaxed text-cyan-300 relative animate-fade-in">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-cyan-400" />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div><span className="font-bold font-mono bg-white/5 px-1.5 py-0.5 rounded border border-cyan-500/30">N</span> {t.shortcutsN}</div>
              <div><span className="font-bold font-mono bg-white/5 px-1.5 py-0.5 rounded border border-cyan-500/30">D</span> {t.shortcutsD}</div>
              <div><span className="font-bold font-mono bg-white/5 px-1.5 py-0.5 rounded border border-cyan-500/30">T</span> {t.shortcutsT}</div>
              <div><span className="font-bold font-mono bg-white/5 px-1.5 py-0.5 rounded border border-cyan-500/30">L</span> {t.shortcutsL}</div>
              <div><span className="font-bold font-mono bg-white/5 px-1.5 py-0.5 rounded border border-cyan-500/30">C</span> {t.shortcutsC}</div>
              <div><span className="font-bold font-mono bg-white/5 px-1.5 py-0.5 rounded border border-cyan-500/30">ESC</span> {settings.language === 'ar' ? 'إغلاق' : 'Close'}</div>
            </div>
            <button 
              onClick={() => setShowShortcutsTip(false)}
              className="p-1 rounded-md hover:bg-white/5 text-cyan-400 hover:text-cyan-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4. Tab Views Router */}
        {lessons.length === 0 && activeTab === 'dashboard' ? (
          /* Empty state illustration if no lessons exist */
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
            <div className="w-20 h-20 rounded-full bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center mb-6 animate-bounce">
              <Sparkles className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{t.noLessons}</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              {t.noLessonsDesc}
            </p>
            <button
              onClick={() => { setEditingLesson(null); setIsLessonModalOpen(true); }}
              className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 text-white font-bold text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.addLesson}
            </button>
          </div>
        ) : (
          /* Render Active View Tab */
          <div className="animate-fade-in duration-300">
            {activeTab === 'dashboard' && (
              <Dashboard 
                lessons={localizedLessons} 
                conflicts={conflicts}
                currentTime={currentTime}
                timeFormat={settings.timeFormat}
                studentName={settings.studentName}
                onNavigateToTab={setActiveTab}
                language={settings.language}
              />
            )}
            
            {activeTab === 'timetable' && (
              <WeeklyTimetable 
                lessons={localizedLessons}
                onEditLesson={handleEditClick}
                onDeleteLesson={handleDeleteLesson}
                onDuplicateLesson={handleDuplicateLesson}
                onRescheduleLesson={handleRescheduleLesson}
                onOpenExport={() => setIsExportModalOpen(true)}
                currentTime={currentTime}
                timeFormat={settings.timeFormat}
                language={settings.language}
              />
            )}

            {activeTab === 'timeline' && (
              <TodayTimeline 
                lessons={localizedLessons}
                currentTime={currentTime}
                timeFormat={settings.timeFormat}
                language={settings.language}
              />
            )}

            {activeTab === 'calendar' && (
              <MonthlyCalendar 
                lessons={localizedLessons}
                currentTime={currentTime}
                timeFormat={settings.timeFormat}
                language={settings.language}
              />
            )}

            {activeTab === 'statistics' && (
              <Statistics 
                lessons={localizedLessons}
                language={settings.language}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel 
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onClearAllData={handleClearAllData}
                language={settings.language}
              />
            )}
          </div>
        )}

      </main>

      {/* 5. Dialogs & Modals */}
      <LessonModal 
        isOpen={isLessonModalOpen}
        onClose={() => { setIsLessonModalOpen(false); setEditingLesson(null); }}
        onSave={handleSaveLesson}
        editingLesson={editingLesson}
        lessons={lessons}
        language={settings.language}
      />

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        lessons={localizedLessons}
        studentName={settings.studentName}
        currentWeek={settings.currentWeek}
        timeFormat={settings.timeFormat}
        language={settings.language}
      />

    </div>
  );
}
