import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Course } from '../../types';
import { Plus, Copy, Edit, Trash2, BookOpen, Clock, Calendar, CheckSquare, Sparkles, HelpCircle, X, Download } from 'lucide-react';
import { showToast } from '../Toast';
import { exportToCSV, ExportColumn } from '../../lib/exportUtils';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modals states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('French');
  const [level, setLevel] = useState('beginner');
  const [duration, setDuration] = useState('');
  const [schedule, setSchedule] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maxSeats, setMaxSeats] = useState(25);
  const [price, setPrice] = useState(4500);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  // Custom languages from site settings
  const [customLanguages, setCustomLanguages] = useState<{ id: string; name: string }[]>([]);

  const fetchCourses = async () => {
    try {
      const res = await db.courses.list();
      setCourses(res);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const data = await db.settings.get();
      const langsStr = data?.custom_languages || JSON.stringify([
        { id: 'French', name: 'الفرنسية' },
        { id: 'English', name: 'الإنجليزية' },
        { id: 'Spanish', name: 'الإسبانية' },
        { id: 'Skills', name: 'مهارات مهنية' }
      ]);
      setCustomLanguages(JSON.parse(langsStr));
    } catch {}
  };

  const handleExportCourses = () => {
    if (courses.length === 0) {
      showToast('لا توجد دورات تدريبية للتصدير', 'warning');
      return;
    }

    const cols: ExportColumn<Course>[] = [
      { header: 'اسم الدورة', key: 'name' },
      { header: 'القسم / اللغة', key: 'language', transform: (v) => customLanguages.find(l => l.id === v || l.name === v)?.name || v },
      { header: 'المستوى المطلق', key: 'level', transform: (v) => v === 'beginner' ? 'مبتدئ' : v === 'intermediate' ? 'متوسط' : 'متقدم' },
      { header: 'المدة الزمنية', key: 'duration' },
      { header: 'أيام وتوقيت الحصص', key: 'schedule' },
      { header: 'تاريخ انطلاق الفوج', key: 'start_date' },
      { header: 'الحد الأقصى للمقاعد', key: 'max_seats', transform: (v) => `${v} مقعد` },
      { header: 'عدد المسجلين حالياً', key: 'enrolled_count', transform: (v) => `${v || 0} طالب` },
      { header: 'سعر الاشتراك (DZD)', key: 'price', transform: (v) => `${v} دج` },
      { header: 'الحالة الإدارية', key: 'status', transform: (v) => v === 'active' ? 'نشط ومتاح' : 'موقف مؤقتاً' }
    ];

    exportToCSV(courses, cols, 'courses');
    showToast('✓ تم تصدير قائمة الأقسام والدورات بنجاح!', 'success');
  };

  useEffect(() => {
    fetchCourses();
    fetchLanguages();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_courses') {
        fetchCourses();
      }
      if (key === 'naji_site_settings') {
        fetchLanguages();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setName('');
    const defaultLang = customLanguages.length > 0 ? customLanguages[0].id : 'French';
    setLanguage(defaultLang);
    setLevel('beginner');
    setDuration('2 أشهر');
    setSchedule('الإثنين والأربعاء 17:00');
    setStartDate(new Date().toISOString().split('T')[0]);
    setMaxSeats(25);
    setPrice(4500);
    setDescription('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setName(c.name);
    setLanguage(c.language);
    setLevel(c.level);
    setDuration(c.duration);
    setSchedule(c.schedule);
    setStartDate(c.start_date);
    setMaxSeats(c.max_seats);
    setPrice(c.price);
    setDescription(c.description);
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !duration.trim() || !schedule.trim() || !startDate) {
      showToast('الرجاء تعبئة الحقول الأساسية للدورة التدريبية', 'warning');
      return;
    }

    const payload = {
      name: name.trim(),
      language,
      level,
      duration: duration.trim(),
      schedule: schedule.trim(),
      start_date: startDate,
      max_seats: Number(maxSeats) || 25,
      price: Number(price) || 0,
      description: description.trim(),
      status
    };

    try {
      if (editingCourse) {
        await db.courses.update(editingCourse.id, payload);
        showToast('✓ تم تعديل بيانات وتفاصيل الدورة التدريبية بنجاح!', 'success');
      } else {
        await db.courses.create(payload);
        showToast('✓ تم إضافة وإطلاق الدورة التدريبية الجديدة بنجاح!', 'success');
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ الدورة', 'error');
    }
  };

  // Duplications with new start date details as requested!
  const handleDuplicateCourse = async (c: Course) => {
    if (!window.confirm(`هل تريد نسخ مكرر من دورة "${c.name}"؟ سيتم جدولة النسخة الجديدة لشهر قادم.`)) return;
    
    // Auto shift date of copy to 30 days later
    const d = new Date(c.start_date);
    d.setDate(d.getDate() + 30);
    const newStartDate = d.toISOString().split('T')[0];

    try {
      await db.courses.create({
        name: `${c.name} - دفعة جديدة`,
        language: c.language,
        level: c.level,
        duration: c.duration,
        schedule: c.schedule,
        start_date: newStartDate,
        max_seats: c.max_seats,
        price: c.price,
        description: c.description,
        status: 'active'
      });
      showToast('✓ تم تكرار ونسخ الدورة بنجاح مع جدولة تشغيل النسخة الجديدة!', 'success');
      fetchCourses();
    } catch {
      showToast('تعذر مضاعفة الدورة', 'error');
    }
  };

  // Status updates in database immediately on switch as requested
  const handleToggleStatus = async (c: Course) => {
    const targetStatus = c.status === 'active' ? 'paused' : 'active';
    try {
      await db.courses.update(c.id, { status: targetStatus });
      showToast(`✓ تم ${targetStatus === 'active' ? 'تفعيل وتنشيط' : 'توقيف وإخفاء'} الدورة التدريبية بنجاح!`, 'success');
      fetchCourses();
    } catch {
      showToast('تعذر تبديل الحالة', 'error');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('مهم جداً: حذف هذه الدورة سيؤدي آلياً إلى إلغاء ورفض كل الحجوزات المعلقة التابعة لها! هل تود الاستمرار؟')) return;
    try {
      await db.courses.delete(id);
      showToast('✓ تم تدمير الدورة، وتم تطبيق إلغاء متتالي للحجوزات التابعة بنجاح!', 'success');
      fetchCourses();
    } catch {
      showToast('تعذر حذف الدورة المعنية', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans text-right" style={{ direction: 'rtl' }}>
      
      {/* Tab actions bar header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-navy font-sans">إعداد وإدارة الدورات الدراسية</h3>
          <p className="text-xs text-slate-400">إطلاق دورات، مراجعة وتكرار الدفعات التدريبية المعتمدة</p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <button
            onClick={handleExportCourses}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            title="تصدير قائمة الدورات"
          >
            <Download className="w-4 h-4" />
            <span>تصدير الدورات (Excel)</span>
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-gold text-slate-950 font-bold hover:bg-gold-dark rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>إضافة دورة تدريبية جديدة</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">جاري مراجعة كراسات البرامج...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map(course => {
            const seatsRemaining = course.max_seats - course.enrolled_count;
            const ratio = Math.min(100, Math.round((course.enrolled_count / course.max_seats) * 100));

            return (
              <div 
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between shadow-sm"
              >
                
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-navy-light text-navy rounded-md">
                      {customLanguages.find(l => l.id === course.language || l.name === course.language)?.name || course.language}
                    </span>
                    
                    {/* Status switch toggle instantly */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">حالة الظهور:</span>
                      <button
                        onClick={() => handleToggleStatus(course)}
                        className={`w-10 h-5.5 rounded-full p-1 transition-all ${
                          course.status === 'active' ? 'bg-emerald-500 text-left' : 'bg-slate-300 text-right'
                        } flex items-center cursor-pointer`}
                      >
                        <span 
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm block ${
                            course.status === 'active' ? 'mr-auto' : 'ml-auto'
                          }`} 
                        />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-navy">{course.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{course.description || 'لم يتم صياغة وصف ترويجي للدورة بعد.'}</p>
                </div>

                {/* Duration & Scheduling info */}
                <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-100 text-xs text-slate-600 font-sans">
                  <p><b>المدة:</b> {course.duration}</p>
                  <p><b>التوقيت المتفق:</b> {course.schedule}</p>
                </div>

                {/* Progress bar and statistics ratio */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-sans font-bold">
                    <span>امتلاء المقاعد: {course.enrolled_count} / {course.max_seats}</span>
                    {seatsRemaining > 5 ? (
                      <span className="text-emerald-600 font-bold">({seatsRemaining} مقاعد شاغرة)</span>
                    ) : seatsRemaining > 0 ? (
                      <span className="text-amber-500 font-bold animate-pulse">شبه ممتلئ ({seatsRemaining})</span>
                    ) : (
                      <span className="text-rose-500 font-bold">ممتلئ تماماً</span>
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

                {/* Actions bottom operations */}
                <div className="pt-4 border-t border-slate-150 flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="text-[10px] text-slate-300 block font-bold">الرسم الاستثماري:</span>
                    <span className="font-extrabold text-navy text-sm font-mono">{course.price.toLocaleString('ar-DZ')} دج</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="p-2 hover:bg-slate-100 text-slate-650 hover:text-navy rounded-lg cursor-pointer border border-slate-150 flex items-center gap-1 font-bold"
                      title="تعديل التفاصيل"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDuplicateCourse(course)}
                      className="p-2 hover:bg-slate-100 text-slate-650 hover:text-gold-dark rounded-lg cursor-pointer border border-slate-150 flex items-center gap-1 font-bold"
                      title="نسخ مكرر لدفعة جديدة"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>تكرار</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer border border-rose-100"
                      title="حذف نهائي"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}


      {/* ══ ADD / EDIT MODAL DIALOG ══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-navy p-4 text-white flex items-center justify-between border-b border-navy-dark">
              <h4 className="font-bold text-sm">{editingCourse ? 'تعديل بيانات الدورة التدريبية' : 'إطلاق دورة تدريبية جديدة'}</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gold cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-right">
              
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">اسم البرنامج أو الدورة بالكامل <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اللغة الإسبانية المستوى المتوسط"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">التصنيف اللغوي</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  >
                    {customLanguages.map(lang => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">مستوى الدورة التدريسية</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  >
                    <option value="beginner">مبتدئ (Beginner)</option>
                    <option value="intermediate font-sans">متوسط (Intermediate)</option>
                    <option value="advanced">متقدم (Advanced)</option>
                    <option value="all">كل المستويات (All Levels)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">المدة الإجمالية <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شهرين، 3 أشهر"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-navy"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الجدول الزمني والتحصيص <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الإثنين والأربعاء 17:00"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">تاريخ البداية <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">أقصى كراسي <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">تكلفة الدورة (دج) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الوصف التعريفي الترويجي للدورة</label>
                <textarea
                  placeholder="الوصف التعريفي والمهارات التي سيتحصل عليها الطالب عند إتمام البرنامج تفصيلياً..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  إلغاء النافذة
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg cursor-pointer shadow"
                >
                  حفظ الدورة وتحديث الأرشيف
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
