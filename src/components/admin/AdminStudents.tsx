import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Booking, Course } from '../../types';
import { Search, Users, Eye, Phone, Mail, BookOpen, Calendar, HelpCircle, Check, X, Download } from 'lucide-react';
import { showToast } from '../Toast';
import { exportToCSV, ExportColumn } from '../../lib/exportUtils';

export default function AdminStudents() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Right Side Panel Student
  const [selectedStudent, setSelectedStudent] = useState<Booking | null>(null);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [history, setHistory] = useState<Booking[]>([]);

  const fetchStudentsData = async () => {
    try {
      const [b, c] = await Promise.all([
        db.bookings.list(),
        db.courses.list()
      ]);
      setBookings(b);
      setCourses(c);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_bookings') {
        fetchStudentsData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Update details drawer on changes
  useEffect(() => {
    if (selectedStudent) {
      const found = bookings.find(b => b.id === selectedStudent.id);
      if (found) {
        setSelectedStudent(found);
        setNotes(found.admin_notes || '');
        
        // Find other registrations with same phone to compile student profile history
        const list = bookings.filter(b => b.phone === found.phone && b.id !== found.id);
        setHistory(list);
      }
    }
  }, [bookings, selectedStudent]);

  const handleSelectStudent = (student: Booking) => {
    setSelectedStudent(student);
    setNotes(student.admin_notes || '');
    const hist = bookings.filter(b => b.phone === student.phone && b.id !== student.id);
    setHistory(hist);
  };

  const handleSaveNotes = async () => {
    if (!selectedStudent) return;
    setNotesSaving(true);
    try {
      await db.bookings.updateNotes(selectedStudent.id, notes.trim());
      showToast('✓ تم تمسيد وحفظ الملاحظات الإدارية للطالب بنجاح!', 'success');
      fetchStudentsData();
    } catch {
      showToast('فشل حفظ التعديلات', 'error');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleQuickStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      await db.bookings.updateStatus(id, status);
      showToast(status === 'confirmed' ? '✓ تم قبول تسجيل الطالب بنجاح!' : '✓ تم رفض الحجز بالتأثير الفوري', 'success');
      fetchStudentsData();
    } catch (err: any) {
      showToast(err.message || 'فشل تعديل حالة الطالب', 'error');
    }
  };

  // Group unique students by phone or name to showcase unique trainees. Wait, the user requested a table of: الاسم / الهاتف / البريد / الدورة / تاريخ الحجز / الحالة. Clicking row opens details side panel. So we can show the bookings list which represent student registrations perfectly! That aligns strictly with student_name rows.
  const filteredStudents = bookings.filter(b => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = b.student_name.toLowerCase().includes(q);
      const matchPhone = b.phone.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    if (courseFilter !== 'all' && b.course_id !== courseFilter) return false;

    if (dateRange.start && new Date(b.created_at) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(b.created_at) > new Date(dateRange.end)) return false;

    return true;
  });

  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      showToast('لا توجد بيانات طلاب مطابقة للتصدير', 'warning');
      return;
    }

    const cols: ExportColumn<Booking>[] = [
      { header: 'الاسم الكامل', key: 'student_name' },
      { header: 'الهاتف', key: 'phone' },
      { header: 'البريد الإلكتروني', key: 'email', transform: (v) => v || 'غير متوفر' },
      { header: 'الدورة التعليمية', key: 'course_name' },
      { header: 'تاريخ التسجيل والحجز', key: 'created_at' },
      { header: 'الحالة', key: 'status', transform: (v) => v === 'confirmed' ? 'التحق' : v === 'rejected' ? 'ملغى' : 'معلق' },
      { header: 'الملاحظات الإدارية', key: 'admin_notes', transform: (v) => v || '' }
    ];

    exportToCSV(filteredStudents, cols, 'students');
    showToast('✓ تم تصدير بيانات الطلاب المصفاة بنجاح!', 'success');
  };

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start font-sans" style={{ direction: 'rtl' }}>
      
      {/* Table listing */}
      <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-navy font-sans">ملفات وسجلات الطلاب الملتحقين</h3>
            <p className="text-xs text-slate-400">كشوفات استقصائية عن تواصل وتأكيدات الطلاب لجميع الحزم والسنوات</p>
          </div>
          <button
            onClick={handleExportStudents}
            className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start"
          >
            <Download className="w-4 h-4" />
            <span>تصدير كشف الطلاب (Excel)</span>
          </button>
        </div>

        {/* Filters bar */}
        <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
          <div className="space-y-1">
            <span className="font-bold text-slate-500">بحث بالاسم أو الهاتف:</span>
            <input
              type="text"
              placeholder="ابحث هنا..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-500">شعبة الدورة التعليمية:</span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">كل الشعب المتوفرة</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-500">نطاق التسجيل:</span>
            <div className="grid grid-cols-2 gap-1 font-mono">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="p-1 border border-slate-300 rounded text-[10px]"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="p-1 border border-slate-300 rounded text-[10px]"
              />
            </div>
          </div>
        </div>

        {/* Student table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-right text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 text-slate-500 font-black">
              <tr>
                <th className="p-4">اسم المترشح(ة)</th>
                <th className="p-4">الهاتف للاتصال</th>
                <th className="p-4">شعبة الدورة</th>
                <th className="p-4 text-center">تاريخ الحجز</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">جاري مسح بيانات المسجلين...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">لا توجد بيانات طلاب مطابقة للتصفية.</td>
                </tr>
              ) : (
                filteredStudents.map(b => (
                  <tr 
                    key={b.id} 
                    onClick={() => handleSelectStudent(b)}
                    className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                      selectedStudent?.id === b.id ? 'bg-gold-light/20 font-bold' : ''
                    }`}
                  >
                    <td className="p-4 font-bold text-slate-800">{b.student_name}</td>
                    <td className="p-4 font-mono select-all text-slate-500 [direction:ltr] text-right">{b.phone}</td>
                    <td className="p-4 text-slate-600 font-medium">{b.course_name}</td>
                    <td className="p-4 text-center text-slate-400">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      {b.status === 'confirmed' && <span className="px-2 py-0.5 text-[9.5px] font-bold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">التحق</span>}
                      {b.status === 'pending' && <span className="px-2 py-0.5 text-[9.5px] font-bold bg-amber-50 text-amber-700 rounded-md border border-amber-200">معلق</span>}
                      {b.status === 'rejected' && <span className="px-2 py-0.5 text-[9.5px] font-bold bg-rose-50 text-rose-700 rounded-md border border-rose-200">ملغى</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Right side details drawer */}
      <div className="xl:col-span-1">
        {selectedStudent ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-slide-in-right">
            
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-navy flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gold shrink-0" />
                <span>ملف المترشح المقيد بالنظام</span>
              </h4>
              <button onClick={() => setSelectedStudent(null)} className="text-xs text-slate-400 hover:text-slate-600 block cursor-pointer">
                إغلاق
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">الاسم واللقب كاملين:</span>
                <span className="text-sm font-bold text-slate-800">{selectedStudent.student_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">رقم الهاتف للاتصال:</span>
                  <a href={`tel:${selectedStudent.phone}`} className="text-sm font-bold text-navy hover:underline [direction:ltr] block text-right">{selectedStudent.phone}</a>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">البريد الإلكتروني:</span>
                  <span className="text-xs font-semibold block text-slate-600 truncate">{selectedStudent.email || 'غير متوفر'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">الحزمة أو الدورة الحالية:</span>
                <span className="text-xs font-bold text-slate-800 bg-slate-100 p-2.5 rounded-lg block leading-relaxed">{selectedStudent.course_name}</span>
              </div>

              {/* Private admin notes field saves to Supabase as requested */}
              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">ملاحظات و تقارير الأستاذ والإدارة:</label>
                <textarea
                  placeholder="اكتب تفاصيل خاصة بالعملية التعليمية والحضور والتحصيل أو الأمور المالية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs leading-relaxed focus:border-navy"
                />
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="px-4 py-1.5 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg text-[9.5px] shadow-sm cursor-pointer"
                  >
                    {notesSaving ? 'جاري التحديث...' : 'حفظ الملاحظات'}
                  </button>
                </div>
              </div>

              {/* Quick action buttons acceptance and reject triggers */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-600 block">إجراء مقعد التسجيل السريع:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickStatus(selectedStudent.id, 'confirmed')}
                    disabled={selectedStudent.status === 'confirmed'}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-emerald-500 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>قبول والتحاق</span>
                  </button>
                  <button
                    onClick={() => handleQuickStatus(selectedStudent.id, 'rejected')}
                    disabled={selectedStudent.status === 'rejected'}
                    className="py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-rose-200 font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>رفض وإلغاء</span>
                  </button>
                </div>
              </div>

              {/* All historic registrations grouped by phone matching as requested */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">السجل التعليمي والتاريخي للطالب ({history.length + 1} تسجيلات):</span>
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  <div className="p-2.5 rounded-lg bg-gold-light/20 border border-gold/30 text-slate-800 text-[10px]">
                    <p className="font-bold flex items-center justify-between">
                      <span>{selectedStudent.course_name}</span>
                      {selectedStudent.status === 'confirmed' ? (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 rounded text-[8.5px] border border-emerald-200 font-bold">التسجيل الجاري</span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 px-1.5 rounded text-[8.5px] border border-amber-200 font-bold">معلق المعالجة</span>
                      )}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1">تاريخ الحجز: {new Date(selectedStudent.created_at).toLocaleDateString()}</p>
                  </div>

                  {history.map(item => (
                    <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] space-y-1">
                      <p className="font-bold flex items-center justify-between text-slate-700">
                        <span>{item.course_name}</span>
                        <span>
                          {item.status === 'confirmed' && <span className="bg-emerald-50 text-emerald-700 px-1.5 rounded text-[8px] border border-emerald-150 font-bold">مقبول</span>}
                          {item.status === 'rejected' && <span className="bg-rose-50 text-rose-700 px-1.5 rounded text-[8px] border border-rose-150 font-bold">مرفوض/ملغي</span>}
                        </span>
                      </p>
                      <p className="text-[9px] text-slate-400">تاريخ التسجيل: {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-350 p-12 text-center text-slate-400 text-xs font-sans flex flex-col items-center justify-center gap-3">
            <Eye className="w-8 h-8 text-slate-300" />
            <p className="font-extrabold text-navy">لوحة المسجلين التفصيلية</p>
            <p className="text-slate-400 leading-relaxed max-w-sm mx-auto">انقر فوق أي سطر في جدول المسجلين لعرض معلومات الاتصال الكاملة، أرشيف الطلاب التاريخي، وتحرير تقارير الأستاذ الخاصة بالأقسام.</p>
          </div>
        )}
      </div>

    </div>
  );
}
