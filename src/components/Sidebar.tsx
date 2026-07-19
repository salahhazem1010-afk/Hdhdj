/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  CalendarRange, 
  BarChart3, 
  Settings as SettingsIcon,
  Plus,
  Sparkles
} from 'lucide-react';
import { DayOfWeek } from '../types';

import { translations } from '../utils/translations';

export type AppTab = 'dashboard' | 'timetable' | 'timeline' | 'calendar' | 'statistics' | 'settings';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenQuickAdd: () => void;
  currentTime: Date;
  accentColor: string;
  language?: 'ar' | 'en';
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  currentTime,
  accentColor,
  language = 'ar'
}: SidebarProps) {
  
  const t = translations[language];

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'timetable', label: t.timetable, icon: CalendarDays },
    { id: 'timeline', label: t.timeline, icon: Clock },
    { id: 'calendar', label: t.calendar, icon: CalendarRange },
    { id: 'statistics', label: t.statistics, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: SettingsIcon },
  ] as const;

  // Convert accentColor string into Tailwind border/text color modifiers
  const getAccentColorClass = () => {
    switch (accentColor) {
      case 'cyan': return 'text-cyan-400 bg-cyan-400/15 border-cyan-400';
      case 'purple': return 'text-purple-400 bg-purple-400/15 border-purple-400';
      case 'emerald': return 'text-emerald-400 bg-emerald-400/15 border-emerald-400';
      case 'rose': return 'text-rose-400 bg-rose-400/15 border-rose-400';
      case 'blue':
      default: return 'text-blue-400 bg-blue-400/15 border-blue-400';
    }
  };

  const activeAccent = getAccentColorClass();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] sticky top-4 glass-panel rounded-3xl p-6 justify-between select-none">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-md">
              <Sparkles className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">{t.appName}</h1>
              <span className="text-[10px] text-slate-400 font-sans">Liquid Glass v2</span>
            </div>
          </div>

          {/* Quick Add FAB equivalent inside Sidebar */}
          <button
            onClick={onOpenQuickAdd}
            className="w-full mb-6 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-90 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            {t.addLesson}
          </button>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 relative group overflow-hidden ${
                    isActive 
                      ? `${activeAccent} border-l-4 shadow-md` 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? '' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                  <span>{item.label}</span>
                  
                  {/* Sliding highlight bar inside menu */}
                  {!isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Clock / Status */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex flex-col px-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-sans">{language === 'ar' ? 'حالة النظام' : 'Current Status'}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-slate-300 font-medium">
                {language === 'ar' ? 'متصل بالخادم المحلي' : 'Local Server Live'}
              </span>
            </div>
            
            <div className="mt-3 bg-white/3 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 font-sans leading-tight">
                {currentTime.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-lg font-bold text-white font-mono mt-1 tracking-tight">
                {currentTime.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Glass Floating Nav Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 glass-panel-heavy rounded-2xl py-3 px-2 flex justify-around items-center border border-white/10 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-cyan-400 scale-105' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-sans leading-none">{item.label.split(' ')[0]}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-1 bg-cyan-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={onOpenQuickAdd}
        className="md:hidden fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
