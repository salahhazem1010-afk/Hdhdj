/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Palette, 
  Clock, 
  User, 
  Database, 
  Download, 
  Upload, 
  Trash2,
  Check,
  Zap
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onExportBackup: () => void;
  onImportBackup: (importedLessons: any) => void;
  onClearAllData: () => void;
  language?: 'ar' | 'en';
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onClearAllData,
  language = 'ar'
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Accent color preset circles
  const accents = [
    { id: 'blue', label: language === 'ar' ? 'الأزرق الكلاسيكي' : 'Classic Blue', bg: 'bg-blue-500' },
    { id: 'cyan', label: language === 'ar' ? 'السيان السائل' : 'Liquid Cyan', bg: 'bg-cyan-400' },
    { id: 'purple', label: language === 'ar' ? 'الأرجواني الملكي' : 'Royal Purple', bg: 'bg-purple-500' },
    { id: 'emerald', label: language === 'ar' ? 'الأخضر البيئي' : 'Eco Emerald', bg: 'bg-emerald-500' },
    { id: 'rose', label: language === 'ar' ? 'وردي الغروب' : 'Sunset Rose', bg: 'bg-rose-500' }
  ] as const;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed)) {
          onImportBackup(parsed);
          setSuccessMsg(language === 'ar' ? 'تم تحميل النسخة الاحتياطية للدروس بنجاح!' : 'Lessons backup loaded successfully!');
          setTimeout(() => setSuccessMsg(''), 4000);
        } else {
          alert(language === 'ar' ? 'ملف غير صالح. يجب أن يحتوي على قائمة حصص.' : 'Invalid backup file. Must be a list of lessons.');
        }
      } catch (err) {
        alert(language === 'ar' ? 'فشل تحليل الملف. تأكد من جودة ملف الـ JSON.' : 'Failed to parse the file. Verify that it is valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const confirmClearAll = () => {
    const confirmationText = language === 'ar'
      ? 'تحذير هام: هل أنت متأكد تماماً من رغبتك في حذف جميع الدروس والإعدادات والجدول؟ لا يمكن التراجع عن هذا الإجراء.'
      : 'WARNING: Are you absolutely sure you want to clear ALL lessons and preferences? This action cannot be undone.';
    
    if (window.confirm(confirmationText)) {
      onClearAllData();
      setSuccessMsg(language === 'ar' ? 'تم مسح جميع البيانات والدروس بنجاح.' : 'All data cleared successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${language === 'ar' ? 'dir-rtl' : ''}`}>
      
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400/10 to-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
          <div>
            <h2 className="text-xl font-bold text-white">
              {language === 'ar' ? 'إعدادات النظام والتخصيص' : 'System Settings & Customization'}
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              {language === 'ar' ? 'تخصيص محرك Apple Liquid Glass للجدول الدراسي والخطوط العربية' : 'Tailor the Apple Liquid Glass visual engine'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Visual Customizations */}
        <div className="glass-panel rounded-3xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-sans border-b border-white/5 pb-2">
            {language === 'ar' ? 'التفضيلات واللغة والمظهر' : 'Preferences & Theme'}
          </h3>

          {/* Student Profile */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              {language === 'ar' ? 'اسم الطالب' : 'Student Name'}
            </label>
            <input
              type="text"
              value={settings.studentName}
              onChange={(e) => onUpdateSettings({ studentName: e.target.value })}
              className="w-full px-4 py-2 text-sm rounded-xl glass-input font-medium"
              placeholder={language === 'ar' ? 'اكتب اسمك هنا (مثال: صلاح عاصم)' : 'Your Name (e.g. Alex Mercer)'}
            />
          </div>

          {/* Current Week indicator */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              {language === 'ar' ? 'الأسبوع الدراسي الحالي' : 'Active Week Range'}
            </label>
            <input
              type="text"
              value={settings.currentWeek}
              onChange={(e) => onUpdateSettings({ currentWeek: e.target.value })}
              className="w-full px-4 py-2 text-sm rounded-xl glass-input font-medium"
              placeholder={language === 'ar' ? 'مثال: الأسبوع الثاني (يوليو)' : 'e.g. Week 2 (July)'}
            />
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <span className="text-cyan-400 font-bold">🌐</span>
              {language === 'ar' ? 'لغة واجهة التطبيق' : 'Application Language'}
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => onUpdateSettings({ language: 'ar' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  settings.language === 'ar'
                    ? 'bg-white text-slate-900 shadow-md scale-102 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  settings.language === 'en'
                    ? 'bg-slate-800 text-white shadow-md scale-102 border border-white/5 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Light/Dark Mode Switcher */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-yellow-400" />}
              {language === 'ar' ? 'وضع مظهر التطبيق البصري' : 'Aesthetic Theme Mode'}
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-white text-slate-900 shadow-md scale-102 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                {language === 'ar' ? 'مظهر مضيء زجاجي' : 'Liquid Light'}
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'bg-slate-800 text-white shadow-md scale-102 border border-white/5 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                {language === 'ar' ? 'مظهر داكن فضائي' : 'Cosmic Dark'}
              </button>
            </div>
          </div>

          {/* Time System */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              {language === 'ar' ? 'نظام وتنسيق الوقت' : 'Time System Format'}
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => onUpdateSettings({ timeFormat: '12h' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  settings.timeFormat === '12h'
                    ? 'bg-white/10 text-white border border-white/10 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ar' ? '12 ساعة (ص/م)' : '12-Hour (AM/PM)'}
              </button>
              <button
                onClick={() => onUpdateSettings({ timeFormat: '24h' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  settings.timeFormat === '24h'
                    ? 'bg-white/10 text-white border border-white/10 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ar' ? '24 ساعة' : '24-Hour military'}
              </button>
            </div>
          </div>

          {/* Accent Color selection */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              {language === 'ar' ? 'لون التزيين الزجاجي' : 'Accent Styling Color'}
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {accents.map((acc) => {
                const isSelected = settings.accentColor === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => onUpdateSettings({ accentColor: acc.id })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-cyan-400 bg-cyan-400/10 text-white font-bold' 
                        : 'border-white/5 bg-white/3 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${acc.bg}`} />
                    <span>{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Engine, Performance and Backups */}
        <div className="glass-panel rounded-3xl p-6 space-y-6">
          
          {/* Performance section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-sans border-b border-white/5 pb-2">
              {language === 'ar' ? 'محرك حركات الواجهة' : 'Performance Engine'}
            </h3>
            
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                {language === 'ar' ? 'سرعة التأثيرات الحركية' : 'Applet Animation Speed'}
              </span>
              <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-1 rounded-2xl border border-white/5">
                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => onUpdateSettings({ animationSpeed: speed })}
                    className={`py-1.5 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${
                      settings.animationSpeed === speed
                        ? 'bg-white/10 text-white border border-white/10 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed === 'slow' && (language === 'ar' ? 'بطيء' : 'slow')}
                    {speed === 'normal' && (language === 'ar' ? 'طبيعي' : 'normal')}
                    {speed === 'fast' && (language === 'ar' ? 'سريع' : 'fast')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Database & Storage operations */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-sans flex items-center gap-2">
              <Database className="w-4 h-4" />
              {language === 'ar' ? 'النسخ الاحتياطي وقاعدة البيانات' : 'Backup & local storage database'}
            </h3>

            <div className="space-y-3">
              <button
                onClick={onExportBackup}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="font-bold">{language === 'ar' ? 'تصدير نسخة احتياطية (JSON)' : 'Export JSON Backup'}</p>
                    <p className="text-[10px] text-slate-500 font-sans">{language === 'ar' ? 'تحميل جدولك لحفظه خارجياً كملف' : 'Download lesson file to local disc'}</p>
                  </div>
                </div>
                <Check className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100" />
              </button>

              <button
                onClick={handleImportClick}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="font-bold">{language === 'ar' ? 'استيراد نسخة احتياطية (JSON)' : 'Import JSON Backup'}</p>
                    <p className="text-[10px] text-slate-500 font-sans">{language === 'ar' ? 'تحميل جدول دروس خارجي مخزن مسبقاً' : 'Load external timetable backup'}</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden" 
                />
              </button>

              <button
                onClick={confirmClearAll}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 text-red-400 transition-all text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="font-bold text-red-400">{language === 'ar' ? 'مسح قاعدة البيانات كاملة' : 'Clear All Storage'}</p>
                    <p className="text-[10px] text-red-500/60 font-sans">{language === 'ar' ? 'حذف غير قابل للاسترداد لجميع الدروس والجدول' : 'Irreversible database wipe'}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-500/20 text-cyan-300 text-center text-xs animate-bounce font-medium font-sans">
              {successMsg}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
