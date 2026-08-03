import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Booking, Course } from '../../types';
import { Search, SlidersHorizontal, ArrowDownWideNarrow, Trash2, Eye, Mail, Phone, Calendar, Download, ChevronRight, ChevronLeft, Check, X, ShieldAlert } from 'lucide-react';
import { showToast } from '../Toast';
import { exportToCSV, ExportColumn } from '../../lib/exportUtils';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20; // 20 rows/page as requested

  // Row selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Side Drawer Detail panel state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // Match other histories for current phone number
  const [phoneHistory, setPhoneHistory] = useState<Booking[]>([]);

  const fetchData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        db.bookings.list(),
        db.courses.list()
      ]);
      setBookings(bRes);
      setCourses(cRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_bookings' || key === 'naji_courses') {
        fetchData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync details side drawer when bookings list updates
  useEffect(() => {
    if (selectedBooking) {
      const updated = bookings.find(b => b.id === selectedBooking.id);
      if (updated) {
        setSelectedBooking(updated);
        setTempNotes(updated.admin_notes || '');
        
        // Find other books with same phone
        const others = bookings.filter(b => b.phone === updated.phone && b.id !== updated.id);
        setPhoneHistory(others);
      }
    }
  }, [bookings, selectedBooking]);

  const handleSelectBookingRow = (b: Booking) => {
    setSelectedBooking(b);
    setTempNotes(b.admin_notes || '');
    
    // Find histories matching phone number
    const history = bookings.filter(item => item.phone === b.phone && item.id !== b.id);
    setPhoneHistory(history);
  };

  // Status updaters
  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      await db.bookings.updateStatus(id, status);
      showToast(
        status === 'confirmed' 
          ? '✓ تم قبول تسجيل حجز الطالب والمزامنة الحية تمت!' 
          : '✓ تم رفض الحجز وتحديث الدفاتر التدريبية', 
        status === 'confirmed' ? 'success' : 'warning'
      );
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'فشل تعديل حالة الطلب', 'error');
    }
  };

  // Notes update saver
  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    setNotesSaving(true);
    try {
      await db.bookings.updateNotes(selectedBooking.id, tempNotes.trim());
      showToast('✓ تم حفظ وتحديث الملاحظات الإدارية للطالب بنجاح!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ الملاحظات', 'error');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل التدريبي نهائياً؟ لا يمكن استرجاعه.')) return;
    try {
      await db.bookings.delete(id);
      showToast('✓ تم حذف الحجز والتحكم بالملفات المدرسية تمت!', 'success');
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(null);
      }
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'فشل الحذف', 'error');
    }
  };

  // Bulk actions handlers as requested
  const handleBulkStatusUpdate = async (status: 'confirmed' | 'rejected') => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`هل أنت متأكد من تعديل حالة ${selectedIds.length} حجوزات دفعة واحدة؟`)) return;

    try {
      for (const id of selectedIds) {
        await db.bookings.updateStatus(id, status);
      }
      showToast(`✓ تم تحديث حالة ${selectedIds.length} حجز دفعة واحدة!`, 'success');
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء التحديث الجماعي', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`تحذير خطير: هل أنت متأكد تماماً من حذف ${selectedIds.length} حجوزات بشكل جماعي ونهائي؟`)) return;

    try {
      for (const id of selectedIds) {
        await db.bookings.delete(id);
      }
      showToast(`✓ تم حذف ${selectedIds.length} حجز بنجاح!`, 'success');
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'تعذر إتمام الحذف الجماعي', 'error');
    }
  };

  // Export CSV of filtered bookings as requested
  const handleExportCSV = (allFiltered: Booking[]) => {
    if (allFiltered.length === 0) {
      showToast('لا توجد بيانات مطابقة لتصديرها بكشوفات اكسل CSV', 'warning');
      return;
    }

    const cols: ExportColumn<Booking>[] = [
      { header: 'الاسم', key: 'student_name' },
      { header: 'الهاتف', key: 'phone' },
      { header: 'البريد الإلكتروني', key: 'email', transform: (v) => v || 'غير متوفر' },
      { header: 'الدورة المحددة', key: 'course_name', transform: (v) => v || 'غير محددة' },
      { header: 'تاريخ الطلب', key: 'created_at' },
      { header: 'الحالة', key: 'status', transform: (v) => v === 'confirmed' ? 'مقبول' : v === 'rejected' ? 'مرفوض' : 'معلق' },
      { header: 'ملاحظات الإدارة', key: 'admin_notes', transform: (v) => v || '' }
    ];

    exportToCSV(allFiltered, cols, 'bookings');
    showToast('✓ تم توليد وتنزيل ملف التقرير Excel-CSV بنجاح!', 'success');
  };

  // Compute Filter logic
  const filteredBookings = bookings.filter(b => {
    // Search filter: matching student_name or phone
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = b.student_name.toLowerCase().includes(q);
      const matchPhone = b.phone.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    // Course dropdown filter
    if (courseFilter !== 'all' && b.course_id !== courseFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;

    // Date range filter
    if (dateRange.start && new Date(b.created_at) < new Date(dateRange.start)) return false;
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // include entire end day
      if (new Date(b.created_at) > endDate) return false;
    }

    return true;
  });

  // Pagination calculation
  const totalRows = filteredBookings.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedBookings.map(b => b.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start font-sans" style={{ direction: 'rtl' }}>
      
      {/* Table & filters box */}
      <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-navy font-sans">جدول طلبات الحجوزات التدريبية</h3>
            <p className="text-xs text-slate-400">إدارة قوائم المقاعد لجميع الفروع والدورات الجارية</p>
          </div>

          <button
            onClick={() => handleExportCSV(filteredBookings)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير النتائج المصفاة (Excel)</span>
          </button>
        </div>

        {/* Filters Panel with precise inputs */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
          
          <div className="space-y-1">
            <span className="font-bold text-slate-500">بحث بالاسم أو الهاتف:</span>
            <input
              type="text"
              placeholder="مثال: يونس بومدين..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page to 1
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white text-[11px] focus:outline-none focus:border-navy"
            />
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-500">فلترة بالدورة:</span>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">كل البرامج التعليمية</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-500">الحالة العامة:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white text-sans"
            >
              <option value="all">الكل (معلق / مقبول / مرفوض)</option>
              <option value="pending">المعلقة فقط (Pending)</option>
              <option value="confirmed">المقبولة فقط (Confirmed)</option>
              <option value="rejected">المرفوضة فقط (Rejected)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-500">نطاق البداية والنهاية:</span>
            <div className="grid grid-cols-2 gap-1 font-mono">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, start: e.target.value }));
                  setCurrentPage(1);
                }}
                className="p-1 border border-slate-300 rounded text-[10px]"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, end: e.target.value }));
                  setCurrentPage(1);
                }}
                className="p-1 border border-slate-300 rounded text-[10px]"
              />
            </div>
          </div>

        </div>

        {/* Bulk Action indicators bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-navy-light text-navy rounded-xl border border-navy/10 flex items-center justify-between text-xs animate-slide-in-right">
            <span className="font-bold">قم بتطبيق إجراء جماعي على ({selectedIds.length}) طلبات محددة:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('confirmed')}
                className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg cursor-pointer transition-all"
              >
                قبول وتأكيد جماعي
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('rejected')}
                className="px-2.5 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold rounded-lg cursor-pointer transition-all"
              >
                رفض تحديدات الطلاب
              </button>
              <button
                onClick={handleBulkDelete}
                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer border border-rose-200"
                title="حذف جماعي نهائي"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Data list Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-right text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 text-slate-500 font-black">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedBookings.length > 0 && selectedIds.length === paginatedBookings.length}
                    onChange={toggleSelectAll}
                    className="rounded text-navy focus:ring-navy cursor-pointer"
                  />
                </th>
                <th className="p-4">اسم الطالب</th>
                <th className="p-4 text-center">الهاتف والوصول</th>
                <th className="p-4">الدورة التدريبية</th>
                <th className="p-4">الوضع</th>
                <th className="p-3 text-center">الإجراءات والخيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">تحميل وتجميع سجلات التسجيل...</td>
                </tr>
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">لا توجد أي حجوزات تطابق مواصفات الفلاتر المسجلة حالياً.</td>
                </tr>
              ) : (
                paginatedBookings.map((b, index) => {
                  const isChecked = selectedIds.includes(b.id);
                  const isSelected = selectedBooking?.id === b.id;

                  return (
                    <tr 
                      key={b.id} 
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-gold-light/20 font-bold' : ''
                      }`}
                      onClick={() => handleSelectBookingRow(b)}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(b.id)}
                          className="rounded text-navy focus:ring-navy cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{b.student_name}</span>
                          {b.admin_notes && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="يوجد ملاحظات إدارية" />}
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono select-all text-slate-500 [direction:ltr]">{b.phone}</td>
                      <td className="p-4 text-slate-600 font-medium line-clamp-1 max-w-[150px]" title={b.course_name}>{b.course_name}</td>
                      <td className="p-4">
                        {b.status === 'pending' && <span className="px-2 py-0.5 text-[9.5px] font-bold bg-amber-50 text-amber-700 rounded border border-amber-200">معلّق</span>}
                        {b.status === 'confirmed' && <span className="px-2 py-0.5 text-[9.5px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">مقبول</span>}
                        {b.status === 'rejected' && <span className="px-2 py-0.5 text-[9.5px] font-bold bg-rose-50 text-rose-700 rounded border border-rose-200">مرفوض</span>}
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {b.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded cursor-pointer"
                              title="قبول وتحديث المقاعد"
                            >
                              قبول
                            </button>
                          )}
                          {b.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'rejected')}
                              className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold rounded cursor-pointer"
                              title="رفض"
                            >
                              رفض
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                            title="حذف نهائي"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar standard */}
        <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 font-sans">
          <span className="text-slate-500">عرض النتائج المطابقة: <b>{totalRows}</b> سجل تدريبي</span>
          
          <div className="flex items-center gap-1.5 font-mono">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2.5 font-sans font-bold">صفحة {currentPage} من {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Right Column: Detailed info side drawer as requested */}
      <div className="xl:col-span-1">
        {selectedBooking ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6 animate-slide-in-right">
            
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-navy flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-gold shrink-0" />
                <span>تفاصيل وملاحظات حجز المترشح</span>
              </h4>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                إغلاق الجانب
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">الاسم واللقب:</span>
                <span className="text-sm font-bold text-slate-800">{selectedBooking.student_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">رقم الهاتف للاتصال:</span>
                  <a href={`tel:${selectedBooking.phone}`} className="text-sm font-bold text-navy hover:underline [direction:ltr] block text-right">{selectedBooking.phone}</a>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">البريد الإلكتروني:</span>
                  <span className="text-xs font-medium text-slate-700 block truncate">{selectedBooking.email || 'غير متوفر'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">الدورة التدريبية المختارة:</span>
                <span className="text-xs font-bold text-slate-800 bg-slate-100 p-2 rounded-lg block leading-snug">{selectedBooking.course_name}</span>
              </div>

              {selectedBooking.message && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">رسالة الطالب أو التوجيهات المسجلة:</span>
                  <p className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 leading-relaxed font-sans select-all">
                    "{selectedBooking.message}"
                  </p>
                </div>
              )}

              {/* Private admin notes field block as requested */}
              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">ملاحظات الإدارة والمسير (خاص بالأكاديمية):</label>
                <textarea
                  placeholder="سجل هنا الملاحظات (مثال: تم الاتصال بالطالب، تم دفع الشطر الأول، بحاجة لجدول مسائي)..."
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy leading-relaxed"
                />
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="px-4 py-2 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {notesSaving ? 'جاري الحفظ...' : 'حفظ الملاحظات الإدارية'}
                  </button>
                </div>
              </div>

              {/* Same phone booking history as requested! */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">تاريخ حجز الطالب بنفس الهاتف ({phoneHistory.length + 1} طلبات):</span>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg border border-gold-dark bg-gold-light/10 text-slate-800">
                    <p className="font-bold flex items-center justify-between text-[10.5px]">
                      <span>{selectedBooking.course_name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] border border-amber-200">الطلب الحالي</span>
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1">{new Date(selectedBooking.created_at).toLocaleDateString()}</p>
                  </div>

                  {phoneHistory.map(hist => (
                    <div key={hist.id} className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1">
                      <p className="font-bold flex items-center justify-between text-[10px]">
                        <span>{hist.course_name}</span>
                        <span>
                          {hist.status === 'confirmed' && <span className="bg-emerald-50 text-emerald-700 px-1 rounded text-[8px] border border-emerald-100">مقبول</span>}
                          {hist.status === 'rejected' && <span className="bg-rose-50 text-rose-700 px-1 rounded text-[8px] border border-rose-100">مرفوض</span>}
                        </span>
                      </p>
                      <p className="text-[9px] text-slate-400">{new Date(hist.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-350 p-12 text-center text-slate-400 text-xs font-sans flex flex-col items-center justify-center gap-3">
            <Eye className="w-8 h-8 text-slate-300" />
            <p className="font-extrabold text-navy">لوحة المراجعة والتفاصيل الجانبية</p>
            <p className="text-slate-400 leading-relaxed max-w-xs mx-auto">انقر فوق أي صف من صفوف الجدول لعرض تفاصيل حجز الطالب، وكتابة ملاحظات إدارية خاصة، ومطالعة أرشيفه التدريبي.</p>
          </div>
        )}
      </div>

    </div>
  );
}
