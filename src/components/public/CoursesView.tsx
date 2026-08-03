import React, { useState, useEffect, useTransition } from 'react';
import { Search, SlidersHorizontal, BookOpen, Clock, Users, ArrowLeft, RefreshCw, XCircle, Calendar, MapPin, Home } from 'lucide-react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Course, Room, CourseSchedule } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';

interface CoursesViewProps {
  onOpenBooking: (courseId?: string) => void;
}

export default function CoursesView({ onOpenBooking }: CoursesViewProps) {
  const { isRTL, language, t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);


  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);

  // New subtabs: 'catalog' (كشف الدورات) or 'schedule' (الجدول الأسبوعي)
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'schedule'>('catalog');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');

  // Tanstack React 18+ Transition control
  const [isPending, startTransition] = useTransition();

  const [customLanguages, setCustomLanguages] = useState<{ id: string; name: string }[]>([]);

  const fetchCoursesAndLanguages = async () => {
    try {
      const [cRes, sRes, rRes, schedRes] = await Promise.all([
        db.courses.list(),
        db.settings.get(),
        db.rooms.list().catch(() => []),
        db.schedules.list().catch(() => [])
      ]);
      setCourses(cRes);
      setRooms(rRes);
      setSchedules(schedRes);

      const langsStr = sRes?.custom_languages || JSON.stringify([
        { id: 'French', name: 'الفرنسية' },
        { id: 'English', name: 'الإنجليزية' },
        { id: 'Spanish', name: 'الإسبانية' },
        { id: 'Skills', name: 'مهارات مهنية' }
      ]);
      try {
        setCustomLanguages(JSON.parse(langsStr));
      } catch {}
    } catch (err) {
      console.error('Error fetching courses list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndLanguages();

    // Realtime subscription for instant seat values, courses, schedules, and rooms updates
    const unsubscribe = subscribeToRealtime((key) => {
      if (
        key === 'naji_courses' || 
        key === 'naji_site_settings' || 
        key === 'naji_schedules' || 
        key === 'naji_rooms'
      ) {
        fetchCoursesAndLanguages();
      }
    });

    return () => unsubscribe();
  }, []);

  // Debounce search text input with 300ms as requested
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Compute filtered list
  const filteredCourses = courses.filter(course => {
    // Only display active courses on the public website
    if (course.status !== 'active') return false;

    // Search query match
    if (debouncedSearch) {
      const val = debouncedSearch.toLowerCase().trim();
      const matchName = course.name.toLowerCase().includes(val);
      const matchDesc = course.description.toLowerCase().includes(val);
      if (!matchName && !matchDesc) return false;
    }

    // Language filter Match
    if (languageFilter !== 'all' && course.language !== languageFilter) {
      return false;
    }

    // Level filter Match
    if (levelFilter !== 'all' && course.level !== levelFilter) {
      return false;
    }

    // Available only Match
    if (availableOnly && course.enrolled_count >= course.max_seats) {
      return false;
    }

    return true;
  });

  // Schedule Days definition (Saturday - Thursday)
  const DAYS_OF_WEEK = [
    { key: 'Saturday', label: 'السبت' },
    { key: 'Sunday', label: 'الأحد' },
    { key: 'Monday', label: 'الإثنين' },
    { key: 'Tuesday', label: 'الثلاثاء' },
    { key: 'Wednesday', label: 'الأربعاء' },
    { key: 'Thursday', label: 'الخميس' },
  ] as const;

  // Enrich schedules with course info
  const calendarItems = schedules.map(s => {
    const courseObj = courses.find(c => c.id === s.course_id);
    return {
      ...s,
      courseObj
    };
  });

  const filteredCalendarItems = calendarItems.filter(item => {
    // Only show active courses on public view
    if (item.courseObj && item.courseObj.status !== 'active') return false;

    // Filter by room name
    if (selectedRoomFilter !== 'all' && item.room_name !== selectedRoomFilter) {
      return false;
    }
    return true;
  });

  // Sort calendar items by start_time ascending
  filteredCalendarItems.sort((a, b) => {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  return (
    <div className="font-sans text-slate-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      
      {/* Tiny Navy hero header with decorative elements */}
      <section className="bg-navy py-12 text-white border-b border-gold/20 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-bold font-sans">
            {isRTL ? 'كل دورات الأكاديمية' : (language === 'fr' ? 'Tous les Cours de l\'Académie' : 'All Academy Courses')}
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {isRTL 
              ? 'استعرض التخصصات اللغوية والبرامج المحترفة للرجال والنساء في سيدي بلعباس.' 
              : (language === 'fr'
                ? 'Découvrez nos spécialités linguistiques et programmes professionnels pour hommes et femmes à Sidi Bel Abbès.'
                : 'Browse our language specialities and professional training programs for men and women in Sidi Bel Abbes.')}
          </p>
        </div>
      </section>

      {/* Subtab navigation bar */}
      <div className="bg-slate-50 border-b border-slate-200/60 py-3 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 تصفح الدورات التدريبية</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'schedule'
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4 text-gold" />
            <span>📅 جدول الحصص الأسبوعي</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CATALOG OF COURSES */}
      {activeSubTab === 'catalog' && (
        <>
          {/* Filter and query options control (Sticky under navigation) */}
          <section className="bg-white border-b border-[#12386a]/10 py-4 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              
              {/* Search box input debounced styled rounded-[10px] */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن دورة (فرنسية، محادثة، مهارات)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-[10px] border border-[#12386a]/20 text-xs bg-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 block"
                  >
                    مسح
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                
                {/* Language filter dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold font-sans">اللغة:</span>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="p-2.5 border border-[#12386a]/20 rounded-[10px] bg-white text-slate-700 focus:outline-none font-bold"
                  >
                    <option value="all">كل اللغات والدورات</option>
                    {customLanguages.map(lang => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* Level filter dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold font-sans">المستوى:</span>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="p-2.5 border border-[#12386a]/20 rounded-[10px] bg-white text-slate-700 focus:outline-none font-bold"
                  >
                    <option value="all">كل المستويات التدريسية</option>
                    <option value="beginner">مبتدئ (Beginner)</option>
                    <option value="intermediate">متوسط (Intermediate)</option>
                    <option value="advanced">متقدم (Advanced)</option>
                  </select>
                </div>

                {/* Availability Toggle */}
                <label className="inline-flex items-center gap-2 cursor-pointer py-2 px-3.5 rounded-[10px] border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="rounded border-[#12386a]/20 text-gold focus:ring-gold"
                  />
                  <span className="font-bold text-slate-600">المقاعد المتاحة فقط</span>
                </label>

              </div>

            </div>
          </section>

          {/* Main Catalog View content */}
          <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-sans">
                <RefreshCw className="w-8 h-8 animate-spin text-gold" />
                <p className="text-sm">جاري تحديث كشوفات الدورات والمقاعد...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              /* Empty state message and styling requested */
              <div className="text-center py-20 max-w-md mx-auto space-y-4">
                <XCircle className="w-16 h-16 text-slate-300 mx-auto" />
                <h4 className="text-lg font-bold text-navy font-sans">لا توجد نتائج مطابقة لبحثك</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  لم نعثر على أي دورة تدريبية تناسب تصفيتك الحالية. جرب تغيير فلاتر اللغات أو تغيير عبارة البحث المدخلة مجدداً.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLanguageFilter('all');
                    setLevelFilter('all');
                    setAvailableOnly(false);
                  }}
                  className="px-4 py-2 text-xs bg-navy text-white hover:bg-gold hover:text-slate-950 font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  إعادة تهيئة كل الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map(course => {
                  const seatsRemaining = course.max_seats - course.enrolled_count;
                  const ratio = Math.min(100, Math.round((course.enrolled_count / course.max_seats) * 100));

                  return (
                    <div 
                      key={course.id}
                      className="bg-white rounded-[16px] border border-[#12386a]/10 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]"
                      style={{ borderRightWidth: '4px', borderRightColor: 'hsl(47, 72%, 49%)' }}
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-navy-light text-navy rounded-[6px] border border-navy/10">
                            {customLanguages.find(l => l.id === course.language || l.name === course.language)?.name || course.language}
                          </span>
                          <span className="text-xs font-bold text-gold-dark bg-[#dcb41e]/10 px-2.5 py-1 rounded-[6px] border border-[#dcb41e]/10 shrink-0">
                            {course.duration}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-navy leading-snug">{course.name}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-sans">{course.description}</p>

                        <div className="grid grid-cols-1 gap-2 pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-sans">
                          <p><span className="font-bold text-slate-400">الجدول الحركي:</span> {course.schedule}</p>
                          <p><span className="font-bold text-slate-400">تاريخ الانطلاق:</span> {new Date(course.start_date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <p><span className="font-bold text-slate-400">مستوى الدورة:</span> {course.level === 'beginner' ? 'مبتدئ' : course.level === 'intermediate' ? 'متوسط (Intermediate)' : course.level === 'advanced' ? 'متقدم (Advanced)' : 'كل المستويات'}</p>
                        </div>

                        {/* Live weekly schedules list */}
                        {(() => {
                          const courseSchedules = schedules.filter(s => s.course_id === course.id);
                          return (
                            <div className="pt-2.5 border-t border-slate-100/70 space-y-1">
                              <span className="text-[10px] font-extrabold text-navy flex items-center gap-1 font-sans">
                                <Clock className="w-3 h-3 text-gold shrink-0" />
                                <span>الجدول الزمني للحصص:</span>
                              </span>
                              {courseSchedules.length === 0 ? (
                                <span className="text-[10px] text-slate-400 block italic font-sans">لم يتم ضبط الحصص في القاعات الأسبوعية بعد.</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {courseSchedules.map((slot, sIdx) => {
                                    const dayLabel = DAYS_OF_WEEK.find(d => d.key === slot.day)?.label || slot.day;
                                    return (
                                      <span 
                                        key={sIdx} 
                                        className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-50 border border-slate-200/60 text-slate-600 text-[9px] rounded font-medium font-sans"
                                      >
                                        <strong>{dayLabel}</strong>: {slot.start_time} - {slot.end_time} ({slot.room_name})
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Progressive Seat meters */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-500">حجز المقاعد: {course.enrolled_count} / {course.max_seats}</span>
                            {seatsRemaining > 5 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-emerald-100">{seatsRemaining} مقعد متاح</span>
                            ) : seatsRemaining > 0 ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-amber-100 animate-pulse">شبه ممتلئ ({seatsRemaining})</span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-rose-100">مكتمل المقاعد</span>
                            )}
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                seatsRemaining === 0 ? 'bg-rose-500' :
                                seatsRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">التكلفة الإجمالية:</span>
                          <span className="text-sm font-extrabold text-navy font-sans">{course.price} دج</span>
                        </div>

                        <button
                          onClick={() => onOpenBooking(course.id)}
                          className={`px-4 py-2 rounded-[10px] font-bold text-[11px] transition-all shadow-sm cursor-pointer ${
                            seatsRemaining === 0 
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                              : 'bg-gold hover:bg-[#b49218] text-[#12386a]'
                          }`}
                        >
                          {seatsRemaining === 0 ? 'انضم للإحتياط' : 'احجز مقعد الآن'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* VIEW 2: VISUAL WEEKLY TIMETABLE / SCHEDULE */}
      {activeSubTab === 'schedule' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
          
          {/* Schedule Controls & Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-right w-full sm:w-auto">
              <h4 className="text-sm font-black text-navy flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                <span>جدول توزيع الحصص الأسبوعي المباشر لقاعات الأكاديمية</span>
              </h4>
              <p className="text-[11px] text-slate-400">تابع جدولة الحصص الدراسية للأفواج والأقسام ووزّع حضورك بذكاء في سيدي بلعباس.</p>
            </div>

            {/* Filter and settings */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {rooms.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 font-sans">اختر القاعة:</span>
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-navy focus:outline-none cursor-pointer text-right min-w-[130px]"
                  >
                    <option value="all">كافة القاعات الدراسية</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Weekly calendar Visual Grid Layout */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-sans">
              <RefreshCw className="w-8 h-8 animate-spin text-gold" />
              <p className="text-sm">جاري تحميل مخطط الحصص الأسبوعي...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60 shadow-sm max-w-md mx-auto space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
              <h5 className="font-bold text-navy text-sm font-sans">مخطط الحصص قيد التحديث</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                لم يقم الطاقم الإداري بجدولة الحصص الأسبوعية المباشرة في النظام بعد. يرجى تصفح دوراتنا مباشرة للتسجيل.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = filteredCalendarItems.filter(item => item.day === day.key);
                return (
                  <div key={day.key} className="bg-white rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-h-[300px]">
                    {/* Day Header */}
                    <div className="p-3.5 bg-slate-50/75 border-b border-slate-100 text-center rounded-t-2xl">
                      <span className="text-xs font-extrabold text-navy font-sans">{day.label}</span>
                      <span className="block text-[9px] text-slate-400 font-bold mt-0.5">حصص اليوم ({daySlots.length})</span>
                    </div>

                    {/* Day slots list */}
                    <div className="p-3 flex-1 flex flex-col gap-3.5 bg-slate-50/15 overflow-y-auto">
                      {daySlots.length === 0 ? (
                        <div className="my-auto text-center p-4 text-[10px] text-slate-350 italic">
                          لا توجد حصص مجدولة
                        </div>
                      ) : (
                        daySlots.map((slot, sIdx) => {
                          const isEnglish = slot.courseObj?.language === 'English';
                          const isFrench = slot.courseObj?.language === 'French';
                          const isSpanish = slot.courseObj?.language === 'Spanish';
                          
                          let langColor = 'bg-indigo-50 border-indigo-100 text-indigo-700';
                          if (isEnglish) langColor = 'bg-amber-50 border-amber-200 text-amber-800';
                          if (isFrench) langColor = 'bg-navy/5 border-navy/10 text-navy';
                          if (isSpanish) langColor = 'bg-rose-50 border-rose-100 text-rose-700';

                          const isFull = slot.courseObj ? (slot.courseObj.enrolled_count >= slot.courseObj.max_seats) : false;

                          return (
                            <div 
                              key={sIdx} 
                              className="p-3 rounded-xl border border-slate-100 text-right space-y-2.5 transition-all shadow-3xs hover:shadow-2xs hover:border-gold/30 bg-white"
                            >
                              {/* Time badge */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-50 text-slate-500 rounded border border-slate-150 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>{slot.start_time} - {slot.end_time}</span>
                                </span>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${langColor}`}>
                                  {slot.courseObj?.language === 'English' ? 'ENG' : slot.courseObj?.language === 'French' ? 'FR' : slot.courseObj?.language === 'Spanish' ? 'ESP' : 'SKILL'}
                                </span>
                              </div>

                              {/* Course Title */}
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-black text-navy block leading-tight">{slot.course_name}</span>
                                <span className="text-[9px] text-slate-400 font-bold block">
                                  {slot.courseObj?.level === 'all' ? 'جميع المستويات' : slot.courseObj?.level === 'beginner' ? 'مبتدئ' : slot.courseObj?.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                                </span>
                              </div>

                              {/* Room display & registration button */}
                              <div className="pt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between gap-2 text-[9px] text-slate-400 font-bold">
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <MapPin className="w-3 h-3 text-gold shrink-0" />
                                    <span>القاعة:</span>
                                  </span>
                                  <span className="text-[10px] font-extrabold text-navy truncate max-w-[85px]" title={slot.room_name}>
                                    {slot.room_name}
                                  </span>
                                </div>

                                {slot.course_id && (
                                  <button
                                    onClick={() => onOpenBooking(slot.course_id)}
                                    className={`w-full py-1.5 rounded-md text-[9px] font-extrabold transition-all cursor-pointer text-center block ${
                                      isFull
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                                        : 'bg-gold hover:bg-gold-dark text-navy hover:scale-[1.02]'
                                    }`}
                                  >
                                    {isFull ? 'انضم لقائمة الانتظار' : 'احجز مقعدك الآن'}
                                  </button>
                                )}
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
          )}

          {/* Informative footer */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
            <span className="text-[10px] font-bold text-slate-400 font-sans">المواعيد معلنة بالتوقيت المحلي لولاية سيدي بلعباس. يرجى التنسيق المسبق قبل الحضور لتأكيد التسجيل النهائي.</span>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-navy/50 inline-block"></span><span>الفرنسية</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span><span>الإنجليزية</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span><span>الإسبانية</span></div>
            </div>
          </div>

        </section>
      )}

    </div>
  );
}
