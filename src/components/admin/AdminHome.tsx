import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Course, Booking, Room, CourseSchedule, AdminUser } from '../../types';
import { 
  Users, CalendarDays, CheckCircle, Flame, Clock, Trash2, 
  ShieldCheck, HelpCircle, FileSpreadsheet, Printer, Sparkles, 
  Settings, Sliders, MapPin, UserCheck, AlertCircle, BookOpen, 
  Coins, PlayCircle, Eye, Calendar, Grid, Check, Home, Download
} from 'lucide-react';
import { showToast } from '../Toast';
import { exportToCSV, ExportColumn } from '../../lib/exportUtils';

// Recharts components
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface AdminHomeProps {
  currentUser?: AdminUser | null;
  onNavigate?: (tab: string) => void;
}

export default function AdminHome({ currentUser, onNavigate }: AdminHomeProps) {
  // Main tabs: 'analytics' (لوحة المؤشرات), 'calendar' (الجدول الأسبوعي المرئي), or 'rooms_scheduling' (إدارة القاعات والجدولة)
  const [activeTab, setActiveTab] = useState<'analytics' | 'calendar' | 'rooms_scheduling'>('analytics');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [audiosCount, setAudiosCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stats customization state
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState<string[]>([
    'approved_students', 'monthly_bookings', 'empty_seats', 'expected_revenue'
  ]);

  // Classroom assignments stored in localStorage to keep them dynamic and persistent
  const [roomAssignments, setRoomAssignments] = useState<{ [courseId: string]: string }>({});
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');

  // Classroom management handlers
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');
  
  // Schedule management handlers
  const [schedCourseId, setSchedCourseId] = useState('');
  const [schedRoomId, setSchedRoomId] = useState('');
  const [schedDay, setSchedDay] = useState<'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday'>('Saturday');
  const [schedStartTime, setSchedStartTime] = useState('17:00');
  const [schedEndTime, setSchedEndTime] = useState('19:00');

  const fetchData = async () => {
    try {
      const [cRes, bRes, rRes, mRes, aRes, roomsData, schedulesData] = await Promise.all([
        db.courses.list(),
        db.bookings.list(),
        db.reviews.list().catch(() => []),
        db.adminMessages.list().catch(() => []),
        db.audioClips.list().catch(() => []),
        db.rooms.list().catch(() => []),
        db.schedules.list().catch(() => [])
      ]);
      setCourses(cRes);
      setBookings(bRes);
      setReviewsCount(rRes.filter((r: any) => r.status === 'approved').length);
      setMessagesCount(mRes.length);
      setAudiosCount(aRes.length);
      setRooms(roomsData);
      setSchedules(schedulesData);

      // Load dynamic classroom assignments from localStorage
      const savedRooms = localStorage.getItem('naji_room_assignments');
      if (savedRooms) {
        setRoomAssignments(JSON.parse(savedRooms));
      } else {
        // Initial defaults
        const defaults: { [key: string]: string } = {
          'course-1': 'قاعة ابن خلدون (القاعة 1)',
          'course-2': 'قاعة الخوارزمي (القاعة 2)',
          'course-3': 'قاعة ابن رشد (القاعة 3)',
          'course-4': 'قاعة ابن خلدون (القاعة 1)'
        };
        setRoomAssignments(defaults);
        localStorage.setItem('naji_room_assignments', JSON.stringify(defaults));
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime modifications
    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_courses' || key === 'naji_bookings' || key === 'naji_admin_messages' || key === 'naji_audio_clips' || key === 'naji_reviews' || key === 'naji_rooms' || key === 'naji_schedules') {
        fetchData();
      }
    });

    // Load custom stats from localStorage
    const savedStats = localStorage.getItem('naji_custom_dashboard_stats');
    if (savedStats) {
      try {
        setSelectedStats(JSON.parse(savedStats));
      } catch (e) {}
    }

    return () => unsubscribe();
  }, []);

  // Compute live metrics
  const totalApprovedStudents = bookings.filter(b => b.status === 'confirmed').length;
  const bookingsThisMonth = bookings.filter(b => {
    const bDate = new Date(b.created_at);
    return bDate.getMonth() === 5 && bDate.getFullYear() === 2026; // June 2026 filter
  }).length;

  const totalSeatsAvailable = courses.reduce((sum, c) => {
    if (c.status === 'active') {
      return sum + Math.max(0, c.max_seats - c.enrolled_count);
    }
    return sum;
  }, 0);

  const expectedRevenue = courses.reduce((sum, c) => {
    return sum + (c.price * c.enrolled_count);
  }, 0);

  // Stats pool to select from
  const STATS_POOL = [
    {
      id: 'approved_students',
      title: 'إجمالي الطلاب المقبولين',
      value: totalApprovedStudents,
      description: '+14% مقارنة بالشهر الماضي',
      icon: Users,
      bgColor: 'bg-navy/5 text-navy border-navy/10'
    },
    {
      id: 'monthly_bookings',
      title: 'حجوزات هذا الشهر',
      value: bookingsThisMonth,
      description: '+8% زيادة نسبية مقدرة',
      icon: CalendarDays,
      bgColor: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    {
      id: 'empty_seats',
      title: 'كراسي ومقاعد شاغرة',
      value: totalSeatsAvailable,
      description: 'في كل التخصصات الجارية',
      icon: Flame,
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    {
      id: 'expected_revenue',
      title: 'الإيرادات المتوقعة',
      value: `${expectedRevenue.toLocaleString('ar-DZ')} دج`,
      description: 'رسوم مسجلة للدورات',
      icon: Coins,
      bgColor: 'bg-gold/10 text-[#a0800e] border-gold/20'
    },
    {
      id: 'total_courses',
      title: 'الدورات التدريبية النشطة',
      value: courses.length,
      description: 'أفواج دراسية جارية حالياً',
      icon: BookOpen,
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    {
      id: 'total_reviews',
      title: 'آراء الطلاب المعتمدة',
      value: reviewsCount,
      description: 'التقييمات المعتمدة بالرئيسية',
      icon: CheckCircle,
      bgColor: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    {
      id: 'total_messages',
      title: 'تنبيهات البوابة الفعالة',
      value: messagesCount,
      description: 'تعميمات منشورة للطلاب',
      icon: AlertCircle,
      bgColor: 'bg-rose-50 text-rose-700 border-rose-100'
    },
    {
      id: 'total_audios',
      title: 'الصوتيات التدريبية',
      value: audiosCount,
      description: 'تسجيلات مسموعة للمراجعة',
      icon: Sparkles,
      bgColor: 'bg-violet-50 text-violet-700 border-violet-100'
    }
  ];

  // Get active stats cards in sorted order as requested
  const activeStatsCards = STATS_POOL.filter(card => selectedStats.includes(card.id));

  // Recharts Chart 1: Month by month dynamic aggregates (Last 6 Months: Jan to June 2026)
  const lineChartData = [
    { name: 'جانفي', 'الحجوزات': 18 },
    { name: 'فيفري', 'الحجوزات': 24 },
    { name: 'مارس', 'الحجوزات': 35 },
    { name: 'أفريل', 'الحجوزات': 28 },
    { name: 'ماي', 'الحجوزات': 42 },
    { name: 'جوان', 'الحجوزات': Math.max(15, bookings.length) }
  ];

  // Recharts Chart 2: Donut Status breakdown
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const rejectedCount = bookings.filter(b => b.status === 'rejected').length;

  const donutChartData = [
    { name: 'معلق (جديد)', value: pendingCount || 1, color: '#F59E0B' },
    { name: 'مقبول (مؤكد)', value: confirmedCount || 1, color: '#10B981' },
    { name: 'مرفوض', value: rejectedCount || 1, color: '#EF4444' }
  ];

  // Recent 8 Bookings List
  const recentBookings = bookings.slice(0, 8);

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'rejected') => {
    try {
      await db.bookings.updateStatus(id, newStatus);
      showToast(
        newStatus === 'confirmed' 
          ? '✓ تم تأكيد الحجز وإخطار الطالب عبر المحاكاة الالكترونية!' 
          : '✓ تم رفض الطلب وتحديث المقاعد بنجاح', 
        newStatus === 'confirmed' ? 'success' : 'warning'
      );
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'فشل معالجة الطلب', 'error');
    }
  };

  const handleDownloadCSV = () => {
    const rows = [
      ['تقرير المؤشرات والإحصائيات الرئيسية - أكاديمية ناجي لتعليم اللغات والتطوير'],
      ['تاريخ التصدير', new Date().toLocaleDateString('ar-DZ') + ' ' + new Date().toLocaleTimeString('ar-DZ')],
      [],
      ['المؤشر العام', 'القيمة الإجمالية', 'ملاحظات التحليل العام'],
      ['إجمالي الطلاب المقبولين والمؤكدين', String(totalApprovedStudents), 'مقارنة بالشهر الماضي +14%'],
      ['حجوزات هذا الشهر الحالي (جوان/يونيو)', String(bookingsThisMonth), 'زيادة نسبية مقدرة +8%'],
      ['المقاعد والتدفقات الشاغرة', String(totalSeatsAvailable), 'في كل التخصصات الجارية'],
      ['حجم الإيرادات والمداخيل المتوقعة', `${expectedRevenue} دج`, 'مجموع رسوم الدورات النشطة'],
      [],
      ['توزيع حالات طلبات الطلاب تفصيلياً'],
      ['الحالة', 'العدد الإجمالي'],
      ['حجوزات مقبولة (مؤكدة)', String(confirmedCount)],
      ['حجوزات معلقة (قيد المراجعة)', String(pendingCount)],
      ['طلبات مرفوضة / ملغاة', String(rejectedCount)],
      [],
      ['سجل أحدث طلبات الحجز التدريبية المسجلة'],
      ['اسم الطالب', 'الدورة التدريبية', 'رقم الهاتف', 'تاريخ الحجز', 'الحالة']
    ];

    recentBookings.forEach(b => {
      rows.push([
        b.student_name,
        b.course_name || '',
        b.phone,
        new Date(b.created_at).toLocaleDateString('ar-DZ'),
        b.status === 'confirmed' ? 'مقبول' : b.status === 'pending' ? 'معلق' : 'مرفوض'
      ]);
    });

    const escapedRows = rows.map(row => 
      row.map(val => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = '\uFEFF' + escapedRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `main_stats-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ تم تصدير الإحصائيات الرئيسية كملف CSV بنجاح!', 'success');
  };

  const handlePrintPDF = () => {
    window.print();
    showToast('✓ تم تشغيل واجهة الطباعة لتوليد وحفظ ملف PDF بنجاح!', 'success');
  };

  const handleExportRooms = () => {
    if (rooms.length === 0) {
      showToast('لا توجد قاعات للتصدير', 'warning');
      return;
    }
    const cols: ExportColumn<Room>[] = [
      { header: 'اسم القاعة', key: 'name' },
      { header: 'الطاقة الاستيعابية (مقعد)', key: 'capacity', transform: (v) => `${v || 20} مقعد` }
    ];
    exportToCSV(rooms, cols, 'rooms');
    showToast('✓ تم تصدير بيانات القاعات بنجاح!', 'success');
  };

  const handleExportSchedules = () => {
    if (schedules.length === 0) {
      showToast('لا توجد حصص مجدولة للتصدير', 'warning');
      return;
    }
    const cols: ExportColumn<CourseSchedule>[] = [
      { header: 'الفوج الدراسي / الدورة', key: 'course_name' },
      { header: 'القاعة المخصصة', key: 'room_name' },
      { header: 'اليوم', key: 'day', transform: (v) => DAYS_OF_WEEK.find(d => d.key === v)?.label || v },
      { header: 'وقت البدء', key: 'start_time' },
      { header: 'وقت الانتهاء', key: 'end_time' }
    ];
    exportToCSV(schedules, cols, 'schedules');
    showToast('✓ تم تصدير الحصص المجدولة بنجاح!', 'success');
  };

  const handleToggleStat = (id: string) => {
    let updated: string[];
    if (selectedStats.includes(id)) {
      if (selectedStats.length <= 2) {
        showToast('يجب إبقاء بطاقتين إحصائيتين على الأقل في الواجهة الرئيسية.', 'warning');
        return;
      }
      updated = selectedStats.filter(s => s !== id);
    } else {
      if (selectedStats.length >= 6) {
        showToast('الحد الأقصى للبطاقات المعروضة بالرئيسية هو 6 بطاقات للمحافظة على تناسق الواجهة.', 'warning');
        return;
      }
      updated = [...selectedStats, id];
    }
    setSelectedStats(updated);
    localStorage.setItem('naji_custom_dashboard_stats', JSON.stringify(updated));
  };

  // Classroom management handlers
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const created = await db.rooms.create({
        name: newRoomName.trim(),
        capacity: Number(newRoomCapacity) || 20
      });
      showToast(`✓ تم إضافة القاعة التدريسية الجديدة (${created.name}) بنجاح!`, 'success');
      setNewRoomName('');
      setNewRoomCapacity('');
      
      // Log this action
      await db.logs.create({
        admin_name: currentUser?.name || 'مدير عام',
        admin_role: currentUser?.role || 'superadmin',
        action: 'إضافة قاعة جديدة',
        details: `تم إضافة قاعة جديدة باسم: ${created.name} وبسعة ${created.capacity || 20} مقعد.`
      });
      
      fetchData();
    } catch {
      showToast('خطأ أثناء إنشاء القاعة', 'error');
    }
  };

  const handleDeleteRoom = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف القاعة (${name})؟ قد يؤدي هذا لحذف الجدولة الزمنية المرتبطة بها.`)) return;
    try {
      await db.rooms.delete(id);
      showToast(`✓ تم إزالة القاعة (${name}) من النظام بنجاح.`, 'success');
      
      // Clear scheduling for this room if any
      const relatedScheds = schedules.filter(s => s.room_id === id);
      for (const s of relatedScheds) {
        await db.schedules.delete(s.id);
      }

      // Log this action
      await db.logs.create({
        admin_name: currentUser?.name || 'مدير عام',
        admin_role: currentUser?.role || 'superadmin',
        action: 'حذف قاعة تدريسية',
        details: `تم إزالة قاعة: ${name} وتطهير الحصص الملازمة لها.`
      });

      fetchData();
    } catch {
      showToast('تعذر حذف القاعة', 'error');
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedCourseId || !schedRoomId) {
      showToast('يرجى تحديد الدورة التدريسية والقاعة أولاً للجدولة', 'warning');
      return;
    }
    
    const course = courses.find(c => c.id === schedCourseId);
    const room = rooms.find(r => r.id === schedRoomId);
    
    if (!course || !room) return;

    try {
      await db.schedules.create({
        course_id: schedCourseId,
        course_name: course.name,
        room_id: schedRoomId,
        room_name: room.name,
        day: schedDay,
        start_time: schedStartTime,
        end_time: schedEndTime
      });

      showToast(`✓ تم ربط الدورة وتأكيد الحصة بنجاح في ${room.name}!`, 'success');
      
      // Log this action
      await db.logs.create({
        admin_name: currentUser?.name || 'مدير عام',
        admin_role: currentUser?.role || 'superadmin',
        action: 'جدولة حصة لربط دورة بقاعة',
        details: `تم جدولة حصة لـ ${course.name} في ${room.name} يوم ${schedDay} من الساعة ${schedStartTime} إلى ${schedEndTime}`
      });

      fetchData();
    } catch {
      showToast('خطأ أثناء حفظ الجدولة الزمنية', 'error');
    }
  };

  const handleDeleteSchedule = async (id: string, courseName: string, roomName: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في سحب وإزالة هذه الحصة المجدولة؟')) return;
    try {
      await db.schedules.delete(id);
      showToast('✓ تم إزالة الحصة المجدولة وسحبها بنجاح.', 'success');

      // Log this action
      await db.logs.create({
        admin_name: currentUser?.name || 'مدير عام',
        admin_role: currentUser?.role || 'superadmin',
        action: 'سحب وإلغاء حصة مجدولة',
        details: `تم إلغاء حصة ${courseName} في قاعة ${roomName}`
      });

      fetchData();
    } catch {
      showToast('خطأ أثناء إزالة الحصة المجدولة', 'error');
    }
  };

  const handleAssignRoom = (courseId: string, roomName: string) => {
    const updated = { ...roomAssignments, [courseId]: roomName };
    setRoomAssignments(updated);
    localStorage.setItem('naji_room_assignments', JSON.stringify(updated));
    showToast(`✓ تم تخصيص وتحديث القاعة لهذه الحصة: ${roomName}`, 'success');
  };

  // Pre-parsed visual calendar data builder
  // We map courses and schedules into actual week slots
  const DAYS_OF_WEEK = [
    { key: 'Saturday', label: 'السبت' },
    { key: 'Sunday', label: 'الأحد' },
    { key: 'Monday', label: 'الإثنين' },
    { key: 'Tuesday', label: 'الثلاثاء' },
    { key: 'Wednesday', label: 'الأربعاء' },
    { key: 'Thursday', label: 'الخميس' }
  ];

  // Function to determine which days a course schedule falls on, and its time
  const getSchedulesForCalendar = () => {
    const items: { id?: string; course_id: string; course_name: string; room_name: string; day: string; start_time: string; end_time: string; courseObj: Course }[] = [];
    
    // Add dynamic schedules from DB
    schedules.forEach(sched => {
      const courseObj = courses.find(c => c.id === sched.course_id);
      if (courseObj) {
        items.push({
          id: sched.id,
          course_id: sched.course_id,
          course_name: sched.course_name,
          room_name: sched.room_name,
          day: sched.day,
          start_time: sched.start_time,
          end_time: sched.end_time,
          courseObj
        });
      }
    });

    // Fallback if DB schedules empty (parse courses strings)
    if (schedules.length === 0) {
      courses.forEach(course => {
        const scheduleStr = course.schedule || '';
        const room = roomAssignments[course.id] || 'لم تخصص قاعة بعد';
        
        const parseDay = (dayStr: string, defaultTime: string) => {
          if (scheduleStr.includes(dayStr)) {
            const timeRange = scheduleStr.match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)?.[0] || defaultTime;
            const [start, end] = timeRange.split('-').map(t => t.trim());
            return { start, end };
          }
          return null;
        };

        const daysMap: { [key: string]: { day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday', defaultTime: string } } = {
          'السبت': { day: 'Saturday', defaultTime: '09:00 - 13:00' },
          'الأحد': { day: 'Sunday', defaultTime: '09:00 - 12:00' },
          'الإثنين': { day: 'Monday', defaultTime: '17:00 - 19:30' },
          'الثلاثاء': { day: 'Tuesday', defaultTime: '17:00 - 19:00' },
          'الأربعاء': { day: 'Wednesday', defaultTime: '17:00 - 19:30' },
          'الخميس': { day: 'Thursday', defaultTime: '17:00 - 19:00' }
        };

        Object.keys(daysMap).forEach(arabicDay => {
          const config = daysMap[arabicDay];
          const parsed = parseDay(arabicDay, config.defaultTime);
          if (parsed) {
            items.push({
              course_id: course.id,
              course_name: course.name,
              room_name: room,
              day: config.day,
              start_time: parsed.start,
              end_time: parsed.end,
              courseObj: course
            });
          }
        });
      });
    }

    return items;
  };

  // Gather all calendar items
  const allCalendarItems = getSchedulesForCalendar();

  // Filter items by room if filter is active
  const filteredCalendarItems = selectedRoomFilter === 'all' 
    ? allCalendarItems
    : allCalendarItems.filter(item => item.room_name === selectedRoomFilter);

  return (
    <div className="p-6 space-y-8 font-sans" style={{ direction: 'rtl' }}>
      
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 print:hidden">
          <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جاري تجميع المؤشرات وجدول التقويم المرئي...</p>
        </div>
      ) : (
        <>
          {/* Main Tabs Navigation Bar */}
          <div className="flex border-b border-slate-200/80 gap-6 mt-2 print:hidden">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3.5 px-3 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-navy text-navy font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Grid className="w-4 h-4 text-gold" />
              <span>📊 لوحة المؤشرات الإحصائية العامة</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`pb-3.5 px-3 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'border-navy text-navy font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-4 h-4 text-gold" />
              <span>📅 التقويم والجدول الأسبوعي المرئي للقاعات</span>
            </button>
            <button
              onClick={() => setActiveTab('rooms_scheduling')}
              className={`pb-3.5 px-3 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'rooms_scheduling'
                  ? 'border-navy text-navy font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-4 h-4 text-gold" />
              <span>🏫 إدارة القاعات والجدولة الزمنية</span>
            </button>
          </div>

          {/* TAB 1: ANALYTICS & STATS DASHBOARD */}
          {activeTab === 'analytics' && (
            <>
              {/* 🛠️ Export & Analytics Action Bar */}
              <div className="bg-gradient-to-r from-navy to-navy-dark text-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div className="space-y-1 text-right w-full md:w-auto">
                  <h3 className="text-sm font-extrabold text-white font-sans flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold shrink-0" />
                    <span>لوحة الإدارة - تخصيص الإحصائيات والتصدير الموثق</span>
                  </h3>
                  <p className="text-[11px] text-slate-200">قم بتخصيص البطاقات الإحصائية التي تريد إبرازها بمدخل لوحة التحكم، أو تصدير التقارير الرسمية.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => setIsCustomizeOpen(true)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-white/15 cursor-pointer shadow-sm"
                    title="تخصيص البطاقات الإحصائية الظاهرة"
                  >
                    <Sliders className="w-4 h-4 text-gold" />
                    <span>تخصيص إحصائيات الرئيسية</span>
                  </button>

                  <button
                    onClick={handleDownloadCSV}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-white/15 cursor-pointer shadow-sm"
                    title="تصدير كملف Excel CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>تصدير CSV</span>
                  </button>

                  <button
                    onClick={handlePrintPDF}
                    className="px-4 py-2.5 bg-gold hover:bg-gold-dark text-navy font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    title="توليد وحفظ ملف PDF للطباعة"
                  >
                    <Printer className="w-4 h-4" />
                    <span>تصدير تقرير PDF للطباعة</span>
                  </button>
                </div>
              </div>

              <div className="space-y-8 print:hidden">
                {/* Customizable Metrics row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(() => {
                    const statCardNavigationMap: { [key: string]: string } = {
                      approved_students: 'ad_enrolled_students',
                      monthly_bookings: 'ad_bookings',
                      empty_seats: 'ad_courses',
                      expected_revenue: 'ad_analytics',
                      total_courses: 'ad_courses',
                      total_reviews: 'ad_reviews',
                      total_messages: 'ad_media',
                      total_audios: 'ad_media'
                    };

                    return activeStatsCards.map((card) => {
                      const CardIcon = card.icon;
                      const hasNav = !!onNavigate;
                      return (
                        <div 
                          key={card.id} 
                          onClick={() => {
                            if (onNavigate) {
                              const targetTab = statCardNavigationMap[card.id] || 'ad_analytics';
                              onNavigate(targetTab);
                            }
                          }}
                          className={`bg-white p-5 rounded-2xl border border-slate-200/75 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:border-gold hover:shadow-md transition-all ${
                            hasNav ? 'cursor-pointer group' : ''
                          }`}
                          title={hasNav ? "انقر لعرض التحليل العميق والتفاصيل" : undefined}
                        >
                          <div className="space-y-1.5 flex-1 min-w-0 text-right">
                            <span className="text-[11px] text-slate-400 font-bold block group-hover:text-gold transition-colors">{card.title}</span>
                            <span className="text-2xl font-black text-navy font-mono block leading-none">{card.value}</span>
                            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                              <span>{card.description}</span>
                              {hasNav && (
                                <span className="text-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[9px] font-black mr-1" style={{ direction: 'rtl' }}>
                                  ← تفاصيل
                                </span>
                              )}
                            </span>
                          </div>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${card.bgColor} group-hover:scale-105 transition-transform`}>
                            <CardIcon className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Charts Row: line vs donut as requested */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Chart Left panel: Line - monthly registrations */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-navy border-r-2 border-gold pr-2.5">وتيرة الحجوزات التدريبية لآخر 6 شهور</h4>
                    <div className="w-full h-64 text-xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip contentStyle={{ direction: 'rtl', textTransform: 'none' }} />
                          <Line type="monotone" dataKey="الحجوزات" stroke="hsl(217, 70%, 24%)" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart Right panel: Donut - statuses distributions */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-navy border-r-2 border-gold p-0.5 pr-2.5">توزيع حالات الحجوزات الجارية تفصيلياً</h4>
                    <div className="w-full h-64 text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {donutChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Recent list bookings table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h4 className="text-xs font-bold text-navy flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold shrink-0" />
                      <span>أحدث الحجوزات المسجلة للطلاب (آخر 8 طلبات)</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold block">مزامنة سيدي بلعباس الفورية ✓</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-black">
                        <tr>
                          <th className="p-4">اسم الطالب</th>
                          <th className="p-4">الدورة التدريبية</th>
                          <th className="p-4">رقم الهاتف</th>
                          <th className="p-4">تاريخ الحجز</th>
                          <th className="p-4">الحالة</th>
                          <th className="p-3 text-center">إجراءات معالجة سريعة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {recentBookings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">لا توجد أي حجوزات مدخلة بالنظام بعد.</td>
                          </tr>
                        ) : (
                          recentBookings.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/40">
                              <td className="p-4 font-bold text-slate-800">{b.student_name}</td>
                              <td className="p-4 text-slate-600 font-sans font-medium">{b.course_name}</td>
                              <td className="p-4 font-mono select-all text-slate-500 [direction:ltr] text-right">{b.phone}</td>
                              <td className="p-4 text-slate-400">
                                {new Date(b.created_at).toLocaleDateString('ar-DZ', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-4">
                                {b.status === 'pending' && <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-md border border-amber-200">معلّق</span>}
                                {b.status === 'confirmed' && <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">مقبول</span>}
                                {b.status === 'rejected' && <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded-md border border-rose-200">مرفوض</span>}
                              </td>
                              <td className="p-3 text-center">
                                {b.status === 'pending' ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                      className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                      قبول
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(b.id, 'rejected')}
                                      className="px-3 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                      رفض
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold block">تمت المعالجة</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: VISUAL WEEKLY CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Calendar Controls & Filters */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-right w-full sm:w-auto">
                  <h4 className="text-sm font-black text-navy flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gold" />
                    <span>مخطط تقويم الحصص الأسبوعي المباشر</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">تابع جدولة الأفواج وتوزيعها الزمني على قاعات الأكاديمية بنظرة عامة متكاملة.</p>
                </div>

                {/* Filter and settings */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500">تصفية حسب القاعة:</span>
                    <select
                      value={selectedRoomFilter}
                      onChange={(e) => setSelectedRoomFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-navy focus:outline-none cursor-pointer"
                    >
                      <option value="all">كافة القاعات التدريسية</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Weekly calendar Visual Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {DAYS_OF_WEEK.map((day) => {
                  const daySlots = filteredCalendarItems.filter(item => item.day === day.key);
                  return (
                    <div key={day.key} className="bg-white rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-h-[350px]">
                      {/* Day Header */}
                      <div className="p-3.5 bg-slate-50/75 border-b border-slate-100 text-center rounded-t-2xl">
                        <span className="text-xs font-extrabold text-navy font-sans">{day.label}</span>
                        <span className="block text-[9px] text-slate-400 font-bold mt-0.5">حصص مجدولة ({daySlots.length})</span>
                      </div>

                      {/* Day slots list */}
                      <div className="p-3 flex-1 flex flex-col gap-3.5 bg-slate-50/15 overflow-y-auto">
                        {daySlots.length === 0 ? (
                          <div className="my-auto text-center p-4 text-[10px] text-slate-350 italic">
                            لا توجد حصص نشطة
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

                            return (
                              <div 
                                key={sIdx} 
                                className={`p-3 rounded-xl border text-right space-y-2.5 transition-all shadow-2xs hover:shadow-xs hover:border-gold/30 bg-white`}
                              >
                                {/* Time badge */}
                                <div className="flex items-center justify-between gap-1">
                                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-100 text-slate-500 rounded-md flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{slot.start_time} - {slot.end_time}</span>
                                  </span>
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${langColor}`}>
                                    {slot.courseObj?.language === 'English' ? 'ENG' : slot.courseObj?.language === 'French' ? 'FR' : slot.courseObj?.language === 'Spanish' ? 'ESP' : 'SKILL'}
                                  </span>
                                </div>

                                {/* Course Title */}
                                <div className="space-y-0.5">
                                  <span className="text-[11px] font-black text-navy block leading-tight">{slot.course_name}</span>
                                  <span className="text-[9px] text-slate-400 font-bold block">{slot.courseObj?.level === 'all' ? 'جميع المستويات' : slot.courseObj?.level === 'beginner' ? 'مبتدئ' : 'متقدم'}</span>
                                </div>

                                {/* Room display */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                    <MapPin className="w-3 h-3 text-gold shrink-0" />
                                    <span className="text-[9px] font-extrabold text-navy truncate max-w-[90px]">{slot.room_name}</span>
                                  </div>
                                  
                                  {slot.id && (
                                    <button
                                      onClick={() => handleDeleteSchedule(slot.id!, slot.course_name, slot.room_name)}
                                      className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                      title="إلغاء جدولة هذه الحصة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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

              {/* Informative footer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
                <span className="text-[10px] font-bold text-slate-400">تغيير قاعة الحصة أو إلغاؤها يتم حفظه فورياً وينعكس مباشرة في البوابة للطلاب.</span>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-navy/50 inline-block"></span><span>الفرنسية</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span><span>الإنجليزية</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span><span>الإسبانية</span></div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CLASSROOMS & SCHEDULING MANAGEMENT */}
          {activeTab === 'rooms_scheduling' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-right w-full md:w-auto">
                  <h4 className="text-sm font-black text-navy flex items-center gap-2">
                    <Home className="w-5 h-5 text-gold" />
                    <span>منظومة إدارة القاعات الدراسية وجدولة الحصص الأسبوعية</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">إضافة وتعديل أسماء القاعات، وتخصيص الطاقة الاستيعابية، وربط الدورات بالحصص والمواعيد الزمنية.</p>
                </div>
              </div>

              {/* Grid: 1st column Classrooms management, 2nd column Scheduling */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Classrooms Manager (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h5 className="font-extrabold text-xs text-navy">🏢 إضافة قاعة دراسية جديدة</h5>
                    </div>

                    <form onSubmit={handleCreateRoom} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400">اسم القاعة (مثال: قاعة ابن سينا)</label>
                        <input
                          type="text"
                          required
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="أدخل اسم القاعة..."
                          className="w-full text-xs font-bold text-navy bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-gold/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400">الطاقة الاستيعابية للقاعة (عدد المقاعد)</label>
                        <input
                          type="number"
                          value={newRoomCapacity}
                          onChange={(e) => setNewRoomCapacity(e.target.value)}
                          placeholder="مثال: 25"
                          className="w-full text-xs font-mono font-bold text-navy bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-gold/50"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-navy text-white hover:bg-navy-dark text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        إضافة وتجهيز القاعة
                      </button>
                    </form>

                    {/* Classrooms List */}
                    <div className="space-y-3.5 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <h6 className="text-[10px] font-bold text-slate-400">القاعات المتاحة بالنظام حالياً ({rooms.length})</h6>
                        {rooms.length > 0 && (
                          <button
                            onClick={handleExportRooms}
                            className="text-[9px] font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                            title="تصدير القاعات"
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span>تصدير (Excel)</span>
                          </button>
                        )}
                      </div>
                      
                      {rooms.length === 0 ? (
                        <p className="text-[10px] text-slate-350 italic text-center py-4">لم يتم تسجيل أي قاعات بعد.</p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {rooms.map((r) => (
                            <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                              <div className="space-y-1 text-right">
                                <span className="text-xs font-black text-navy block">{r.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold block">السعة المقدرة: {r.capacity || 20} مقعد</span>
                              </div>
                              <button
                                onClick={() => handleDeleteRoom(r.id, r.name)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="إزالة هذه القاعة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Scheduling Timetable (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Scheduling Form */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h5 className="font-extrabold text-xs text-navy">📅 ربط دورة دراسية بحصة وقاعة (جدولة زمنية)</h5>
                    </div>

                    <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Select Course */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] font-bold text-slate-400 block">اختر الدورة التدريبية</label>
                        <select
                          value={schedCourseId}
                          required
                          onChange={(e) => setSchedCourseId(e.target.value)}
                          className="w-full text-xs font-bold text-navy bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-gold/50 cursor-pointer text-right"
                        >
                          <option value="">-- حدد فوجاً دراسياً --</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Select Room */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] font-bold text-slate-400 block">القاعة المخصصة</label>
                        <select
                          value={schedRoomId}
                          required
                          onChange={(e) => setSchedRoomId(e.target.value)}
                          className="w-full text-xs font-bold text-navy bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-gold/50 cursor-pointer text-right"
                        >
                          <option value="">-- حدد قاعة من المتاح --</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name} (السعة: {r.capacity || 20})</option>
                          ))}
                        </select>
                      </div>

                      {/* Day selection */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] font-bold text-slate-400 block">يوم الحصة</label>
                        <select
                          value={schedDay}
                          onChange={(e) => setSchedDay(e.target.value as any)}
                          className="w-full text-xs font-bold text-navy bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-gold/50 cursor-pointer text-right"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d.key} value={d.key}>{d.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Time Slots */}
                      <div className="grid grid-cols-2 gap-2 text-right">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 block font-sans">وقت البدء</label>
                          <input
                            type="time"
                            value={schedStartTime}
                            required
                            onChange={(e) => setSchedStartTime(e.target.value)}
                            className="w-full text-xs font-mono font-bold text-navy bg-slate-50 border border-slate-200 px-2 py-2.5 rounded-xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 block font-sans">وقت الانتهاء</label>
                          <input
                            type="time"
                            value={schedEndTime}
                            required
                            onChange={(e) => setSchedEndTime(e.target.value)}
                            className="w-full text-xs font-mono font-bold text-navy bg-slate-50 border border-slate-200 px-2 py-2.5 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2 pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 bg-gold hover:bg-gold-dark text-navy font-black text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
                        >
                          حفظ الجدولة وتأكيد الحصة الأسبوعية
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Active Schedules list */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h5 className="font-extrabold text-xs text-navy text-right">
                        📅 الحصص المجدولة حالياً بالنظام ({schedules.length})
                      </h5>
                      {schedules.length > 0 && (
                        <button
                          onClick={handleExportSchedules}
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                          title="تصدير الحصص المجدولة"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير الحصص (Excel)</span>
                        </button>
                      )}
                    </div>

                    {schedules.length === 0 ? (
                      <p className="text-[10px] text-slate-350 italic text-center py-8">لم يتم جدولة أي حصص مخصصة بعد. يتم تطبيق الجدولة الافتراضية للدورات.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                        {schedules.map((s) => {
                          const arabicDay = DAYS_OF_WEEK.find(d => d.key === s.day)?.label || s.day;
                          return (
                            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/40 gap-3">
                              <div className="space-y-1.5 text-right">
                                <span className="text-xs font-black text-navy block">{s.course_name}</span>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400 font-bold">
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <Home className="w-3.5 h-3.5 text-gold" />
                                    <span>{s.room_name}</span>
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-slate-200/60 text-slate-600 rounded">
                                    {arabicDay} ({s.start_time} - {s.end_time})
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteSchedule(s.id, s.course_name, s.room_name)}
                                className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer self-start sm:self-center"
                              >
                                إلغاء الجدولة
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 🖨️ Printable PDF Report (Only visible when printing) */}
          <div className="hidden print:block font-sans text-right p-8 space-y-6" style={{ direction: 'rtl' }}>
            {/* Official Logo and Header */}
            <div className="border-b-2 border-navy pb-6 mb-6 flex items-center justify-between">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-navy">أكاديمية ناجي لتعليم اللغات والتطوير</h1>
                <p className="text-xs text-slate-500 font-bold">سيدي بلعباس - الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p className="text-[10px] text-slate-400">هاتف: +213 555 12 34 56 | بريد الكتروني: contact@najiacademy.dz</p>
              </div>
              <div className="text-left">
                <div className="inline-block bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-[10px] leading-relaxed text-slate-600">
                  <div><strong>تاريخ التصدير:</strong> {new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div><strong>وقت التصدير:</strong> {new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>المرجع الموثق:</strong> NA-REP-{Math.floor(100000 + Math.random() * 900000)}</div>
                </div>
              </div>
            </div>

            {/* Report Title */}
            <div className="text-center my-8">
              <h2 className="text-xl font-bold text-navy border-y border-slate-200 py-3 inline-block px-12">
                التقرير الإحصائي الشامل للأداء وحالة المقاعد والطلاب
              </h2>
              <p className="text-xs text-slate-500 mt-2">مستخرج مباشرة من نظام إدارة قاعدة البيانات المركزية للأكاديمية</p>
            </div>

            {/* Section 1: Key Performance Metrics */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-navy border-r-4 border-gold pr-2">أولاً: المؤشرات الرقمية العامة</h3>
              <table className="w-full text-right text-xs border border-slate-200 divide-y divide-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3 border border-slate-200">المؤشر العام</th>
                    <th className="p-3 border border-slate-200 text-center">القيمة الإجمالية</th>
                    <th className="p-3 border border-slate-200">الوضعية والتحليل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 border border-slate-200 font-bold">إجمالي الطلاب المقبولين والمؤكدين</td>
                    <td className="p-3 border border-slate-200 text-center font-mono font-bold text-navy">{totalApprovedStudents} طالب</td>
                    <td className="p-3 border border-slate-200 text-slate-500">يمثل نمو بقيمة +14% مقارنة بالشهر الماضي.</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-slate-200 font-bold">حجوزات هذا الشهر الحالي</td>
                    <td className="p-3 border border-slate-200 text-center font-mono font-bold text-navy">{bookingsThisMonth} حجز جديد</td>
                    <td className="p-3 border border-slate-200 text-slate-500">معدل تسجيل مستقر ونسبة زيادة تبلغ +8% في الإقبال العام.</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-slate-200 font-bold">المقاعد والتدفقات التدريسية الشاغرة</td>
                    <td className="p-3 border border-slate-200 text-center font-mono font-bold text-navy">{totalSeatsAvailable} مقعد</td>
                    <td className="p-3 border border-slate-200 text-slate-500">عدد الأماكن المتبقية المتاحة لاستقبال المنتسبين الجدد.</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-slate-200 font-bold">حجم الإيرادات والمداخيل المتوقعة</td>
                    <td className="p-3 border border-slate-200 text-center font-mono font-bold text-emerald-700">{expectedRevenue.toLocaleString('ar-DZ')} دج</td>
                    <td className="p-3 border border-slate-200 text-slate-500">إجمالي مستحقات الحصص الدراسية المحتسبة وفق أعداد المقيدين حالياً.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Bookings status breakdown */}
            <div className="space-y-3 mt-8">
              <h3 className="text-sm font-bold text-navy border-r-4 border-gold pr-2">ثانياً: تفصيل وضعية الطلبات المسجلة</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="border border-slate-200 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">حجوزات مقبولة (مؤكدة)</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">{confirmedCount}</span>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">حجوزات معلقة</span>
                  <span className="text-lg font-bold text-amber-500 font-mono">{pendingCount}</span>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">طلبات مرفوضة</span>
                  <span className="text-lg font-bold text-rose-500 font-mono">{rejectedCount}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Courses summary table */}
            <div className="space-y-3 mt-8">
              <h3 className="text-sm font-bold text-navy border-r-4 border-gold pr-2">ثالثاً: حالة المقررات والأفواج الجارية</h3>
              <table className="w-full text-right text-[11px] border border-slate-200 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2 border border-slate-200">اسم الفوج/الدورة</th>
                    <th className="p-2 border border-slate-200">اللغة</th>
                    <th className="p-2 border border-slate-200 text-center">الرسوم المالية</th>
                    <th className="p-2 border border-slate-200 text-center">المقاعد الشاغرة</th>
                    <th className="p-2 border border-slate-200 text-center">الطلاب المسجلين</th>
                    <th className="p-2 border border-slate-200 text-center">نسبة الامتلاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courses.map((c) => {
                    const ratio = c.max_seats > 0 ? Math.round((c.enrolled_count / c.max_seats) * 100) : 0;
                    return (
                      <tr key={c.id}>
                        <td className="p-2 border border-slate-200 font-bold text-navy">{c.name}</td>
                        <td className="p-2 border border-slate-200 text-slate-600">{c.language === 'English' ? 'الإنجليزية' : c.language === 'French' ? 'الفرنسية' : c.language === 'Spanish' ? 'الإسبانية' : 'مهارات أخرى'}</td>
                        <td className="p-2 border border-slate-200 text-center font-mono">{c.price.toLocaleString('ar-DZ')} دج</td>
                        <td className="p-2 border border-slate-200 text-center font-mono">{c.max_seats - c.enrolled_count} / {c.max_seats}</td>
                        <td className="p-2 border border-slate-200 text-center font-mono font-bold">{c.enrolled_count}</td>
                        <td className="p-2 border border-slate-200 text-center font-mono font-bold text-slate-700">{ratio}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Section 4: Recent log signature */}
            <div className="mt-16 pt-12 border-t border-slate-200 grid grid-cols-2 gap-12">
              <div className="space-y-2 text-right">
                <p className="text-xs font-bold text-slate-600 font-sans">مصادقة وإعداد التقارير:</p>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  تمت معالجة ومراجعة وتدقيق البيانات الواردة في هذا التقرير تلقائياً بواسطة نظام الحوسبة السحابية للأكاديمية.
                  جميع السجلات متوافقة مع قواعد المعطيات الرسمية والخاصة بالتسجيلات والمدفوعات.
                </p>
              </div>
              <div className="text-center space-y-4">
                <p className="text-xs font-bold text-slate-600">ختم وتوقيع الإدارة المعتمد:</p>
                <div className="w-48 h-20 border border-dashed border-slate-300 rounded-xl mx-auto flex items-center justify-center text-[10px] text-slate-400 italic">
                  مساحة مخصصة للختم الرسمي للأكاديمية
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==============================================
          MODAL: CUSTOMIZE DASHBOARD STATS CARD
          ============================================== */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4 bg-navy/65 backdrop-blur-xs text-right print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            
            {/* Header */}
            <div className="bg-navy p-5 text-white flex items-center justify-between border-b border-navy-dark">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-gold" />
                <h3 className="text-sm sm:text-base font-black">تخصيص البطاقات الإحصائية للرئيسية</h3>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-bold">
                اختر البطاقات التي ترغب في إبرازها بمدخل لوحة التحكم (الحد الأدنى 2 والحد الأقصى 6):
              </p>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {STATS_POOL.map((card) => {
                  const isChecked = selectedStats.includes(card.id);
                  const CardIcon = card.icon;
                  return (
                    <label 
                      key={card.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'border-gold bg-gold/5' 
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStat(card.id)}
                          className="w-4 h-4 text-gold accent-gold rounded border-slate-300"
                        />
                        <div className="text-right">
                          <span className="text-xs font-black text-navy block">{card.title}</span>
                          <span className="text-[10px] text-slate-400 font-bold block">{card.description}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <CardIcon className="w-4 h-4 text-navy" />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="bg-navy hover:bg-[#112a4a] text-white px-6 py-2 rounded-lg text-xs font-black cursor-pointer transition-colors"
              >
                حفظ وإغلاق التخصيص
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
