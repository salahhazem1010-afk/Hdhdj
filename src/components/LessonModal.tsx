/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Clock, MapPin, User, FileText, Check } from 'lucide-react';
import { Lesson, DayOfWeek, DAYS_OF_WEEK } from '../types';
import { timeToMinutes } from '../utils/timeUtils';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
  editingLesson: Lesson | null;
  lessons: Lesson[];
  language?: 'ar' | 'en';
}

const COLOR_PRESETS = [
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#eab308', // Yellow
  '#f97316'  // Orange
];

// Helper to hash string to a color preset
function generateColorFromSubject(subject: string): string {
  if (!subject) return COLOR_PRESETS[0];
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % COLOR_PRESETS.length;
  return COLOR_PRESETS[idx];
}

export default function LessonModal({
  isOpen,
  onClose,
  onSave,
  editingLesson,
  lessons,
  language = 'ar'
}: LessonModalProps) {
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:30');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [notes, setNotes] = useState('');

  // Conflict warning feedback state
  const [conflictMsg, setConflictMsg] = useState('');

  const getTranslatedDayName = (d: string) => {
    switch (d) {
      case 'Saturday': return language === 'ar' ? 'السبت' : 'Saturday';
      case 'Sunday': return language === 'ar' ? 'الأحد' : 'Sunday';
      case 'Monday': return language === 'ar' ? 'الإثنين' : 'Monday';
      case 'Tuesday': return language === 'ar' ? 'الثلاثاء' : 'Tuesday';
      case 'Wednesday': return language === 'ar' ? 'الأربعاء' : 'Wednesday';
      case 'Thursday': return language === 'ar' ? 'الخميس' : 'Thursday';
      case 'Friday': return language === 'ar' ? 'الجمعة' : 'Friday';
      default: return d;
    }
  };

  // Load editing lesson details if provided
  useEffect(() => {
    if (editingLesson) {
      setSubject(editingLesson.subject);
      setTeacher(editingLesson.teacher);
      setSelectedDays(editingLesson.days || []);
      setStartTime(editingLesson.startTime || '16:00');
      setEndTime(editingLesson.endTime || '17:30');
      setLocation(editingLesson.location || '');
      setColor(editingLesson.color || COLOR_PRESETS[0]);
      setNotes(editingLesson.notes || '');
    } else {
      // Clear forms for new lesson
      setSubject('');
      setTeacher('');
      setSelectedDays([]);
      setStartTime('16:00');
      setEndTime('17:30');
      setLocation('');
      setColor(COLOR_PRESETS[0]);
      setNotes('');
    }
  }, [editingLesson, isOpen]);

  // Automatic color generator on subject change
  const handleSubjectChange = (val: string) => {
    setSubject(val);
    if (!editingLesson) {
      setColor(generateColorFromSubject(val));
    }
  };

  // Perform live conflict checks on days and hours changes
  useEffect(() => {
    if (selectedDays.length === 0 || !startTime || !endTime) {
      setConflictMsg('');
      return;
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (endMins <= startMins) {
      setConflictMsg(
        language === 'ar' 
          ? 'يجب أن يكون وقت البدء قبل وقت الانتهاء.' 
          : 'Start time must be strictly before end time.'
      );
      return;
    }

    let foundConflict = '';

    for (const day of selectedDays) {
      // Check other lessons scheduled on this day
      const dayLessons = lessons.filter(
        (l) => l.days.includes(day) && l.id !== (editingLesson?.id || '')
      );

      for (const other of dayLessons) {
        if (!other.startTime || !other.endTime) continue; // Skip unscheduled
        const otherStart = timeToMinutes(other.startTime);
        const otherEnd = timeToMinutes(other.endTime);

        // Overlap: (startA < endB) && (endA > startB)
        const isOverlap = (startMins < otherEnd) && (endMins > otherStart);

        if (isOverlap) {
          foundConflict = language === 'ar'
            ? `تنبيه: تعارض في المواعيد يوم ${getTranslatedDayName(day)} مع درس "${other.subject}" (${other.startTime} - ${other.endTime})`
            : `Time conflict detected on ${day} with "${other.subject}" (${other.startTime} - ${other.endTime})`;
          break;
        }
      }
      if (foundConflict) break;
    }

    setConflictMsg(foundConflict);

  }, [selectedDays, startTime, endTime, lessons, editingLesson, subject, language]);

  if (!isOpen) return null;

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert(language === 'ar' ? 'اسم المادة مطلوب.' : 'Subject name is required.');
      return;
    }
    
    const hasDays = selectedDays.length > 0;
    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (hasDays) {
      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);
      if (endMins <= startMins) {
        alert(language === 'ar' ? 'يجب أن يكون وقت الانتهاء بعد وقت البدء.' : 'End time must exceed start time.');
        return;
      }
    } else {
      finalStartTime = '';
      finalEndTime = '';
    }

    onSave({
      id: editingLesson?.id || Math.random().toString(36).substring(2, 9),
      subject: subject.trim(),
      teacher: teacher.trim() || (language === 'ar' ? 'أستاذ غير معروف' : 'Unknown Teacher'),
      days: selectedDays,
      startTime: finalStartTime,
      endTime: finalEndTime,
      location: location.trim() || undefined,
      color,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-xl glass-panel-heavy rounded-3xl overflow-hidden shadow-2xl animate-fade-in my-8 ${language === 'ar' ? 'dir-rtl' : ''}`}>
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white">
              {editingLesson 
                ? (language === 'ar' ? 'تعديل تفاصيل الدرس الدراسي' : 'Edit Lesson Parameters') 
                : (language === 'ar' ? 'إضافة درس خصوصي جديد' : 'Add New Study Lesson')}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSaveClick} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Conflict Alert Bar */}
          {conflictMsg && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              conflictMsg.includes('conflict') || conflictMsg.includes('تعارض')
                ? 'bg-red-500/10 border-red-500/25 text-red-200' 
                : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-200'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans">{conflictMsg}</p>
            </div>
          )}

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {language === 'ar' ? 'اسم المقرر / المادة الدراسية *' : 'Subject / Course Name *'}
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-white"
              placeholder={language === 'ar' ? 'مثال: رياضيات، فقه، فست، أحياء، كيمياء...' : 'e.g. Advanced Math, AP Physics, Literature'}
            />
          </div>

          {/* Teacher Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              {language === 'ar' ? 'اسم المعلم / الأستاذ' : 'Teacher Name'}
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white"
              placeholder={language === 'ar' ? 'مثال: أ. مجدي شعبان' : 'e.g. Dr. Arthur Pendelton'}
            />
          </div>

          {/* Repeat Days Checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {language === 'ar' ? 'أيام التكرار أسبوعياً (يمكنك تحديد عدة أيام)' : 'Days of Week (Multiple Selectable)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300 font-bold'
                        : 'border-white/5 bg-white/3 text-slate-400 hover:text-white'
                    }`}
                  >
                    {getTranslatedDayName(day)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Times fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {language === 'ar' ? 'وقت البدء' : 'Start Time'}
              </label>
              <input
                type="time"
                required={selectedDays.length > 0}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-4 py-2 text-sm rounded-xl glass-input font-sans text-white ${selectedDays.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={selectedDays.length === 0}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {language === 'ar' ? 'وقت الانتهاء' : 'End Time'}
              </label>
              <input
                type="time"
                required={selectedDays.length > 0}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-4 py-2 text-sm rounded-xl glass-input font-sans text-white ${selectedDays.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={selectedDays.length === 0}
              />
            </div>
          </div>

          {/* Unscheduled Info Notice */}
          {selectedDays.length === 0 && (
            <div className="p-3.5 rounded-2xl border border-dashed border-amber-500/25 bg-amber-500/5 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <p className="leading-relaxed font-medium">
                {language === 'ar' 
                  ? 'بما أنك لم تختر أي أيام للتكرار أسبوعياً، فسيتم حفظ هذه المادة كـ "مسودة مادة غير مجدولة" (لم يتم تحديد الموعد بعد).'
                  : "Since you haven't selected any repeating days, this course will be saved as an \"Unscheduled Draft Lesson\" (Schedule Not Set Yet)."}
              </p>
            </div>
          )}

          {/* Location details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {language === 'ar' ? 'مكان الحصة / قاعة التدريس (اختياري)' : 'Classroom / Location (Optional)'}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white"
              placeholder={language === 'ar' ? 'مثال: سنتر الأوائل، قاعة ب' : 'e.g. Room 402B, Secondary Hall'}
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {language === 'ar' ? 'اللون المميز للمادة (مقترح تلقائياً)' : 'Color Accent (Auto-suggested)'}
            </label>
            <div className="flex gap-2 flex-wrap pt-0.5">
              {COLOR_PRESETS.map((col) => {
                const isSelected = color === col;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: col }}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {language === 'ar' ? 'ملاحظات خاصة (اختياري)' : 'Private Notes (Optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-xl glass-input text-sm text-white"
              placeholder={language === 'ar' ? 'أضف موضوعات التحضير، تواريخ الامتحانات أو أي معلومات أخرى...' : 'Add study remarks, exam dates or preparation topics...'}
            />
          </div>

          {/* Save trigger buttons */}
          <div className={`flex justify-end gap-3 pt-4 border-t border-white/5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white/5 text-slate-300 hover:text-white transition-colors border border-white/5 cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:opacity-95 transition-all shadow-lg active:scale-98 cursor-pointer"
            >
              {language === 'ar' ? 'حفظ الدرس الخصوصي' : 'Save Lesson'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
