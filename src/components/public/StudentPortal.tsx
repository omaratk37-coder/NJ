import React, { useState, useEffect } from 'react';
import { 
  Lock, Phone, LogOut, BookOpen, Calendar, Clock, Coins, 
  CheckCircle, XCircle, User, Shield, Key, FileText, ArrowLeft,
  Sparkles, Check, HelpCircle, Image as ImageIcon, Volume2, MessageSquare, Play, Pause, Disc
} from 'lucide-react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Student, Enrollment, Attendance, Course } from '../../types';
import { showToast } from '../Toast';
import Logo, { LogoIcon } from '../Logo';
import { useLanguage } from '../../lib/LanguageContext';

interface StudentPortalProps {
  setActiveTab: (tab: string) => void;
  siteSettings: { [key: string]: string };
}

// Interface to wrap Enrollment joined with Course
interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

export default function StudentPortal({ setActiveTab, siteSettings }: StudentPortalProps) {
  const { isRTL, language, t } = useLanguage();
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);


  const customLanguages = (() => {
    try {
      if (siteSettings?.custom_languages) {
        return JSON.parse(siteSettings.custom_languages);
      }
    } catch {}
    return [
      { id: 'French', name: 'الفرنسية' },
      { id: 'English', name: 'الإنجليزية' },
      { id: 'Spanish', name: 'الإسبانية' },
      { id: 'Skills', name: 'مهارات مهنية' }
    ];
  })();

  // Auth form states
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard states
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // New Student Portal subviews states
  const [portalTab, setPortalTab] = useState<'dashboard' | 'lessons' | 'audios' | 'messages' | 'attendance'>('dashboard');
  const [lessons, setLessons] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [audioClips, setAudioClips] = useState<any[]>([]);

  // Check session on mount
  useEffect(() => {
    const student = db.studentAuth.getCurrentStudent();
    setCurrentStudent(student);
    setLoading(false);
  }, []);

  // Fetch student dashboard data
  const fetchDashboardData = async () => {
    if (!currentStudent) return;
    try {
      const allCourses = await db.courses.list();
      setCourses(allCourses);

      const allEnrollments = await db.enrollments.list();
      const studentEnrolls = allEnrollments.filter(e => e.student_id === currentStudent.id);
      
      const enrolledWithCourse = studentEnrolls.map(enroll => {
        const course = allCourses.find(c => c.id === enroll.course_id);
        return {
          ...enroll,
          course
        };
      });
      setEnrollments(enrolledWithCourse);

      const allAttendance = await db.attendance.list();
      // Only keep attendance sessions belonging to this student's enrollments
      const enrollIds = studentEnrolls.map(e => e.id);
      const studentAttendance = allAttendance.filter(a => enrollIds.includes(a.enrollment_id));
      
      // Sort sessions: upcoming/latest first
      studentAttendance.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
      setAttendanceSessions(studentAttendance);

      // Fetch student resources
      const enrolledCourseIds = studentEnrolls.map(e => e.course_id);
      
      const allLessons = await db.lessons.list();
      const studentLessons = allLessons.filter(l => enrolledCourseIds.includes(l.course_id));
      setLessons(studentLessons);

      const allAudio = await db.audioClips.list();
      const studentAudio = allAudio.filter(a => enrolledCourseIds.includes(a.course_id));
      setAudioClips(studentAudio);

      const allMessages = await db.adminMessages.list();
      const studentMessages = allMessages.filter(m => !m.course_id || enrolledCourseIds.includes(m.course_id));
      setAdminMessages(studentMessages);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    if (currentStudent) {
      fetchDashboardData();

      // Realtime subscribe
      const unsubscribe = subscribeToRealtime((key) => {
        if (
          key === 'naji_enrollments' || 
          key === 'naji_attendance' || 
          key === 'naji_courses' ||
          key === 'naji_daily_lessons' ||
          key === 'naji_admin_messages' ||
          key === 'naji_audio_clips'
        ) {
          fetchDashboardData();
        }
      });
      return () => unsubscribe();
    }
  }, [currentStudent]);

  // Handle student login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!studentCode.trim() || !password.trim()) {
      setAuthError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentVal = await db.studentAuth.login(studentCode, password);
      setCurrentStudent(studentVal);
      showToast('أهلاً بك مجدداً في أكاديمية ناجي! تم تسجيل الدخول بنجاح.', 'success');
    } catch (err: any) {
      setAuthError(err.message || 'رقم التعريف أو كلمة المرور غير صحيحة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle student logout
  const handleLogout = () => {
    db.studentAuth.logout();
    setCurrentStudent(null);
    setStudentCode('');
    setPassword('');
    showToast('تم تسجيل الخروج بنجاح. نتمنى لك التوفيق في دراستك!', 'success');
  };

  // Confirm attendance
  const handleConfirmAttendance = async (attendanceId: string) => {
    setConfirmingId(attendanceId);
    try {
      await db.attendance.confirm(attendanceId, true);
      showToast('تم تأكيد حضورك للحصة بنجاح! شكراً لك.', 'success');
      await fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || 'خطأ أثناء تأكيد الحضور', 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  // Reject attendance
  const handleRejectAttendance = async (attendanceId: string) => {
    setConfirmingId(attendanceId);
    try {
      await db.attendance.reject(attendanceId);
      showToast('تم تسجيل اعتذارك ورفض حضور الحصة بنجاح.', 'warning');
      await fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || 'خطأ أثناء تسجيل رفض الحضور', 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const whatsappNumber = (siteSettings?.whatsapp || '213550123456').replace(/[\s\+\-]/g, '').trim();
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=%D8%AA%D8%AD%D9%8A%D8%A9%20%D8%B7%D9%8A%D8%A8%D8%A9%D9%8E%20%D9%84%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%A3%D9%83%D8%A7%D8%AF%D9%8A%D9%85%D9%8A%D8%A9%20%D9%86%D8%A7%D8%AC%D9%8A.%20%D8%A3%D9%86%D8%A7%20%D8%B7%D8%A7%D9%84%D8%A8%20%D9%85%D8%B3%D8%AC%D9%84%20%D9%88%D9%84%D9%85%20%D8%A3%D8%B3%D8%AA%D9%84%D9%85%20%D8%B1%D9%82%D9%85%20%D8%A7%D9%84%D8%AA%D8%B9%D8%B1%D9%8A%D9%81%20%D8%A7%D9%84%D8%AE%D8%A7%D8%B5%20%D8%A8%D9%8A%20%D8%AD%D8%AA%D9%89%20%D8%A7%D9%84%D8%A2%D9%86.%20%D8%A3%D8%B1%D8%AC%D9%88%20%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9.`;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-sans">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>جاري تحميل بوابة الطالب المعتمدة...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50/50 pb-16 font-sans ${isRTL ? 'rtl' : 'ltr'}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      
      {/* Dynamic Header Badge Title spacing */}
      <div className="bg-gradient-to-b from-navy-dark to-navy text-white py-12 px-4 shadow-inner text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="px-4 py-1.5 bg-gold/10 text-gold border border-gold/20 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            المنصة الداخلية المعتمدة
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-sans leading-tight">بوابة إدارة الطلاب - الطالب الشريك</h1>
          <p className="text-slate-300 text-sm max-w-xl mx-auto font-sans leading-relaxed">
            مساحة خاصة بطلاب أكاديمية ناجي الفوقيين والمنخرطين بانتظام لمتابعة برامجهم الزمنية وتأكيد حضور حصصهم التعليمية والتدريبية.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* ==============================================
            SCENARIO A: STUDENT IS NOT AUTHENTICATED (LOGIN VIEW)
            ============================================== */}
        {!currentStudent ? (
          <div className="max-w-md mx-auto mt-4 sm:mt-8">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden">
              
              {/* Navy Card Header */}
              <div className="bg-navy-dark p-8 text-center text-white space-y-4 border-b border-navy/20">
                <Logo size={68} variant="light" showSubtitle={true} />
                <div className="pt-2 border-t border-white/5">
                  <h3 className="text-sm font-bold text-gold">بوابة تسجيل دخول الطالب</h3>
                  <p className="text-[10px] text-slate-300 mt-1">سجّل دخولك لمتابعة دوراتك وتأكيد حضورك</p>
                </div>
              </div>

              {/* Login Form body */}
              <form onSubmit={handleLogin} className="p-8 space-y-6">
                
                {authError && (
                  <div className="p-4 bg-rose-50 border border-rose-200/60 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed">
                    <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="studentCode" className="block text-xs font-bold text-slate-700">
                    رقم التعريف الخاص بالانخراط *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="studentCode"
                      type="text"
                      dir="ltr"
                      required
                      placeholder="مثال: NJ-2025-001"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      className="block w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-sm font-bold text-slate-800 placeholder-slate-400/80 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="studentPass" className="block text-xs font-bold text-slate-700">
                    كلمة المرور المسجلة *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="studentPass"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gold hover:bg-[#b49218] text-navy font-bold rounded-[10px] text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>تسجيل دخول للبوابة</span>
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-slate-100 text-center space-y-2">
                  <p className="text-[11px] text-slate-500 leading-normal">
                    لم تستلم رقم التعريف الخاص بك من مكتب الاستقبال حتى الآن؟
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold hover:underline transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>تواصل معنا عبر واتساب للحصول عليه</span>
                  </a>
                </div>

              </form>
            </div>
          </div>
        ) : (
          
          /* ==============================================
              SCENARIO B: STUDENT IS AUTHENTICATED (DASHBOARD)
             ============================================== */
          <div className="space-y-8">
            
            {/* Student Portal Dashboard Profile Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/50 shadow-md p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-right">
                <div className="w-14 h-14 bg-gold/15 rounded-2xl flex items-center justify-center text-gold">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-sans text-navy">مرحباً، {currentStudent.full_name}</h2>
                    <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[10px] font-bold">
                      طالب منخرط
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-sans">
                    <span>الرمز التعريفي: <strong className="text-slate-700 font-mono select-all">[ {currentStudent.student_code} ]</strong></span>
                    <span>•</span>
                    <span>الهاتف: <span className="[direction:ltr] text-slate-600">{currentStudent.phone}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>تصفح كل دوراتنا</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-[8px] border border-rose-200/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            </div>

            {/* Subviews Navigation Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-px">
              <button
                onClick={() => setPortalTab('dashboard')}
                className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  portalTab === 'dashboard'
                    ? 'border-gold text-gold font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>لوحة المتابعة</span>
              </button>

              <button
                onClick={() => setPortalTab('lessons')}
                className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer relative ${
                  portalTab === 'lessons'
                    ? 'border-gold text-gold font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span>صور الدروس اليومية</span>
                {lessons.length > 0 && (
                  <span className="bg-gold text-navy text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {lessons.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setPortalTab('audios')}
                className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer relative ${
                  portalTab === 'audios'
                    ? 'border-gold text-gold font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>التمارين والمواد الصوتية</span>
                {audioClips.length > 0 && (
                  <span className="bg-gold text-navy text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {audioClips.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setPortalTab('messages')}
                className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer relative ${
                  portalTab === 'messages'
                    ? 'border-gold text-gold font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span>رسائل الإدارة التنبيهية</span>
                {adminMessages.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {adminMessages.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setPortalTab('attendance')}
                className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer relative ${
                  portalTab === 'attendance'
                    ? 'border-gold text-gold font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-slate-400" />
                <span>سجل وحساب الحضور</span>
              </button>
            </div>

            {/* Dashboard main view */}
            {portalTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column Right (2/3 width on large screens): Active courses & Presence confirmation */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Section 1: Attendance Confirmation (تأكيد الحضور) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-gold" />
                        <h3 className="text-lg font-bold text-navy-dark">تأكيد حضور الحصص القادمة</h3>
                      </div>
                      <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">Attendance</span>
                    </div>

                    {/* Filter attendance to unconfirmed and future/today sessions */}
                    {(() => {
                      const enrollIds = enrollments.map(e => e.id);
                      // Match today's string format (YYYY-MM-DD)
                      const todayStr = new Date().toISOString().split('T')[0];
                      const upcomingUnconfirmed = attendanceSessions.filter(a => {
                        return enrollIds.includes(a.enrollment_id) && !a.confirmed && a.session_date >= todayStr;
                      });

                      if (upcomingUnconfirmed.length === 0) {
                        return (
                          <div className="bg-white rounded-xl border border-slate-200/50 p-8 text-center text-slate-500">
                            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2 bg-emerald-50 p-1.5 rounded-full" />
                            <p className="text-sm font-bold text-slate-700">أنت على أتم ما يرام!</p>
                            <p className="text-xs text-slate-400 mt-1">لا توجد حصص مجدولة حالياً بانتظار التأكيد منك.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {upcomingUnconfirmed.map((session) => {
                            const enrollment = enrollments.find(e => e.id === session.enrollment_id);
                            const course = enrollment?.course;
                            return (
                              <div 
                                key={session.id} 
                                className="bg-white rounded-xl border border-gold/20 hover:border-gold/40 shadow-sm p-5 space-y-4 relative overflow-hidden transition-all group"
                              >
                                <div className="absolute top-0 right-0 left-0 h-[3px] bg-gold" />
                                
                                <div>
                                  <h4 className="font-bold text-sm text-navy leading-snug group-hover:text-gold transition-colors">{course?.name || 'دورة تعليمية'}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                                    <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                                    <span className="font-bold text-slate-700">{session.session_date}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                    <span>{course?.schedule || 'التوقيت محدد مسبقاً'}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                  <button
                                    onClick={() => handleConfirmAttendance(session.id)}
                                    disabled={confirmingId === session.id}
                                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                                  >
                                    {confirmingId === session.id ? (
                                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>تأكيد الحضور</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleRejectAttendance(session.id)}
                                    disabled={confirmingId === session.id}
                                    className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/55 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    {confirmingId === session.id ? (
                                      <span className="w-3.5 h-3.5 border-2 border-rose-700 border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                      <>
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>إعتذار / رفض</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Section 2: Enrolled Courses (دوراتي) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-gold" />
                        <h3 className="text-lg font-bold text-navy-dark">الدورات المسجل فيها رسمياً</h3>
                      </div>
                      <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">My Courses</span>
                    </div>

                    {enrollments.length === 0 ? (
                      <div className="bg-white rounded-xl border border-slate-200/50 p-12 text-center text-slate-400">
                        <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-600">غير منخرط في أي دورة رسمية الآن</p>
                        <p className="text-xs mt-1">يرجى تسجيلك أولاً لدى إدارة الأكاديمية ودفع المستحقات.</p>
                        <button
                          onClick={() => setActiveTab('courses')}
                          className="mt-4 px-4 py-2 bg-gold text-navy hover:bg-gold-dark text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          تصفح وحجز من الكتالوج
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4.5">
                        {enrollments.map((item) => {
                          const course = item.course;
                          if (!course) return null;
                          return (
                            <div 
                              key={item.id} 
                              className="bg-white rounded-xl border border-slate-200/60 hover:border-slate-300 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-navy/5 text-navy font-bold rounded text-[10px] uppercase">
                                    {customLanguages.find(l => l.id === course.language || l.name === course.language)?.name || course.language}
                                  </span>
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-bold">
                                    {course.level === 'beginner' ? 'مبتدئ' : 
                                     course.level === 'intermediate' ? 'متوسط' : 
                                     course.level === 'advanced' ? 'متقدم' : 'جميع المستويات'}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-[#113a69] text-base leading-tight font-sans">
                                  {course.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-medium text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-gold" />
                                    <span>البرنامج الزمني: <strong className="text-slate-700">{course.schedule}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-gold" />
                                    <span>المدة: <strong className="text-slate-700">{course.duration}</strong></span>
                                  </div>
                                </div>

                                {/* Subscription details & end date */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] bg-slate-50/70 p-3 rounded-lg border border-slate-100/80 mt-3 font-sans">
                                  <div>
                                    <span className="text-slate-400">نوع الاشتراك: </span>
                                    <strong className="text-navy">{item.sub_type || 'شهري'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">سعر الاشتراك: </span>
                                    <strong className="text-navy">{item.sub_price ? `${item.sub_price.toLocaleString()} دج` : 'غير محدد'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">باقة الحصص: </span>
                                    <strong className="text-navy">{item.sub_sessions !== undefined ? `${item.sub_sessions} حصة` : '8 حصص'}</strong>
                                  </div>
                                  <div className="flex items-center gap-1 text-rose-700 font-bold col-span-2 sm:col-span-1">
                                    <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>نهاية الاشتراك: </span>
                                    <strong className="font-mono">{item.sub_end_date || 'غير محدد'}</strong>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 md:pt-0 md:pl-4 border-t md:border-t-0 md:border-r border-slate-100 flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto shrink-0 gap-1 mt-1 md:mt-0 font-mono">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider font-sans">المبلغ المدفوع</span>
                                <span className="text-base font-extrabold text-[#2e7d32]">{item.amount_paid.toLocaleString()} دج</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
                
                {/* Column Left (1/3 width on large screens): Presence Archives History Log */}
                <div className="space-y-6">
                  
                  <div className="bg-white rounded-2xl border border-slate-200/50 shadow-md p-6 space-y-4">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gold" />
                        <h3 className="text-sm font-bold text-navy">سجل حضور الحصص السابقة</h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">LOGS</span>
                    </div>

                    {/* Filter sessions which are confirmed or in the past */}
                    {(() => {
                      const pastSessions = attendanceSessions.slice(0, 15); // Show up to latest 15 sessions in summary

                      if (pastSessions.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 text-center py-6 leading-relaxed">
                            لا يوجد سجل حصص منشأ حتى الآن. سيقوم أساتذتك بإدراج جدول الحصص قريباً لمتابعته هنا.
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                          {pastSessions.map((hist) => {
                            const enrollment = enrollments.find(e => e.id === hist.enrollment_id);
                            const course = enrollment?.course;
                            return (
                              <div 
                                key={hist.id} 
                                className="text-right p-3 bg-slate-50 hover:bg-slate-100/75 rounded-lg border border-slate-200/30 flex items-center justify-between gap-3 text-xs transition-colors"
                              >
                                <div className="space-y-1 block min-w-0">
                                  <span className="font-extrabold text-slate-700 block truncate" title={course?.name}>
                                    {course?.name || 'دورة تعليمية'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block">التاريخ: {hist.session_date}</span>
                                </div>
                                <div className="shrink-0">
                                  {hist.confirmed ? (
                                    hist.rejected ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full font-bold text-[9px]">
                                        <XCircle className="w-3 h-3 text-rose-600 animate-pulse" />
                                        <span>اعتذار / رفض</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold text-[9px]">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>تم الحضور</span>
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-bold text-[9px]">
                                      <Clock className="w-3 h-3 text-amber-500" />
                                      <span>غير مؤكد بعد</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                  </div>

                  <div className="bg-navy-dark text-white rounded-2xl shadow-md p-6 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/10 rounded-full blur-xl" />
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#113a69]/20 rounded-full blur-xl animate-pulse" />
                    
                    <HelpCircle className="w-8 h-8 text-gold mx-auto" />
                    <h4 className="text-sm font-bold text-slate-100">هل واجهت مشكلة تقنية؟</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      إذا كان هناك لبس بخصوص حصص الحضور المدونة، أو كنت ترغب في تغيير توقيت، تواصل مباشرة مع المنسق أو عبر رقم الدعم الفني للأكاديمية.
                    </p>
                    <a 
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block px-4 py-2 bg-gold hover:bg-[#b49218] text-navy font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      مراسلة الدعم والمنسقين
                    </a>
                  </div>

                </div>

              </div>
            )}

            {/* Daily Lessons Tab panel */}
            {portalTab === 'lessons' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-gold" />
                    <h3 className="text-xl font-bold text-navy-dark">صور الدروس اليومية والملخصات للمراجعة</h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 py-1 px-3 rounded-full font-bold">
                    الدروس المتوفرة: {lessons.length}
                  </span>
                </div>

                {lessons.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200/50 p-12 text-center text-slate-500 space-y-3">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-base font-bold text-slate-700">لا توجد صور دروس منشورة بعد</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      عندما يقوم أستاذ المادة برفع صور للوح الدراسي أو الملاحظات والملخصات للدورات المسجل بها، ستظهر لك هنا مباشرة للمراجعة والتنزيل.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col hover:border-gold/40 transition-all group">
                        {/* Image container */}
                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                          <img 
                            src={lesson.image_url} 
                            alt={lesson.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 bg-navy/90 text-gold text-[11px] font-bold rounded-lg shadow-md">
                              {lesson.course_name}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <span className="text-[10px] text-slate-400 font-mono font-bold block">
                              تاريخ النشر: {new Date(lesson.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <h4 className="font-extrabold text-navy text-base leading-snug">
                              {lesson.title}
                            </h4>
                            <p className="text-slate-600 text-xs leading-relaxed font-sans whitespace-pre-line">
                              {lesson.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <a 
                              href={lesson.image_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-gold/10 hover:bg-gold text-navy hover:text-white border border-gold/20 hover:border-transparent text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>عرض الصورة كاملة</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audio Clips Tab panel */}
            {portalTab === 'audios' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-gold" />
                    <h3 className="text-xl font-bold text-navy-dark">المكتبة الصوتية والتمارين السماعية</h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 py-1 px-3 rounded-full font-bold">
                    إجمالي الملفات: {audioClips.length}
                  </span>
                </div>

                {audioClips.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200/50 p-12 text-center text-slate-500 space-y-3">
                    <Volume2 className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-base font-bold text-slate-700">لا توجد تمارين صوتية مضافة بعد</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      هنا سيقوم أساتذتك برفع ملفات الاستماع، الحوارات والتمارين الصوتية المساعدة على تمرين الأذن ومخارج الحروف.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {audioClips.map((clip) => (
                      <div key={clip.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between hover:border-gold/40 transition-all group">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-gold/10 text-gold-dark border border-gold/20 text-[10px] font-bold rounded">
                              {clip.course_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(clip.created_at).toLocaleDateString('ar-DZ')}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                              <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-extrabold text-navy text-sm truncate" title={clip.title}>
                                {clip.title}
                              </h4>
                              {clip.description && (
                                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                                  {clip.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Standard clean HTML5 Audio Player */}
                        <div className="pt-4 mt-4 border-t border-slate-100">
                          <audio 
                            controls 
                            src={clip.audio_url} 
                            className="w-full h-9 focus:outline-none"
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin Messages Tab panel */}
            {portalTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gold" />
                    <h3 className="text-xl font-bold text-navy-dark">لوحة إعلانات ورسائل الإدارة</h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 py-1 px-3 rounded-full font-bold">
                    الرسائل: {adminMessages.length}
                  </span>
                </div>

                {adminMessages.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200/50 p-12 text-center text-slate-500 space-y-3">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-base font-bold text-slate-700">اللوحة خالية من أي رسائل جديدة</p>
                    <p className="text-xs text-slate-400">
                      ليس هناك أي تعميمات أو توجيهات إدارية منشورة حالياً.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row items-start justify-between gap-4 hover:border-slate-300 transition-all"
                      >
                        <div className="absolute top-0 right-0 w-[4px] h-full bg-rose-500" />
                        <div className="space-y-2 flex-1 pr-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold text-[9px] rounded-full">
                              إعلان رسمي هام
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              نشر بتاريخ: {new Date(msg.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-navy text-base leading-snug">
                            {msg.title}
                          </h4>
                          <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line font-sans">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attendance Analytics & History Tab panel */}
            {portalTab === 'attendance' && (
              <div className={`space-y-8 animate-fadeIn ${isRTL ? 'text-right' : 'text-left'}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                
                {/* Header view */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-gold" />
                      <h3 className="text-xl font-bold text-navy-dark">سجل ومؤشرات حضور الحصص</h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      متابعة دقيقة لنسب التزامك الدراسي، وسجل حضورك وغيابك في مختلف الدورات والورشات التعليمية.
                    </p>
                  </div>
                  <div className="bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200/50 text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي الحصص المجدولة</span>
                    <span className="text-lg font-black text-navy font-mono">{attendanceSessions.length} حصة</span>
                  </div>
                </div>

                {/* Grid layout for Course charts & stats cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left block (1/3 size): Overall Progress radial meter */}
                  <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-6 text-center space-y-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-[4px] bg-gold" />
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-navy text-sm">معدل التزامك العام بالأكاديمية</h4>
                      <p className="text-[10px] text-slate-400">نسبة حضورك الإجمالية في جميع الاشتراكات النشطة</p>
                    </div>

                    {(() => {
                      const totalSessions = attendanceSessions.length;
                      const attendedSessions = attendanceSessions.filter(s => s.confirmed === true && !s.rejected).length;
                      const overallRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;
                      
                      let rateColor = 'text-emerald-500';
                      let rateBg = 'bg-emerald-50';
                      let rateDesc = 'التزام ممتاز! استمر على هذا الأداء الرائع 🎉';
                      if (overallRate < 60) {
                        rateColor = 'text-rose-500';
                        rateBg = 'bg-rose-50';
                        rateDesc = 'تنبيه: حضورك منخفض! يرجى حضور حصصك لتفادي إلغاء اشتراكك ⚠️';
                      } else if (overallRate < 85) {
                        rateColor = 'text-amber-500';
                        rateBg = 'bg-amber-50';
                        rateDesc = 'حضورك متوسط، نسعى لرؤيتك بانتظام أكثر في الحصص القادمة 👍';
                      }

                      return (
                        <>
                          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="52"
                                stroke="#f1f5f9"
                                strokeWidth="9"
                                fill="transparent"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="52"
                                stroke={overallRate >= 85 ? '#10b981' : overallRate >= 60 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="9"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 52}
                                strokeDashoffset={2 * Math.PI * 52 * (1 - overallRate / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <span className="absolute text-2xl font-black text-navy font-mono">{overallRate}%</span>
                          </div>

                          <div className={`p-3 rounded-xl ${rateBg} ${rateColor} text-xs font-bold leading-normal`}>
                            {rateDesc}
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-right text-xs">
                            <div>
                              <span className="text-slate-400 text-[10px] block">تم حضورها</span>
                              <strong className="text-slate-800 text-sm font-mono">{attendedSessions} حصة</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block">بانتظار الحضور</span>
                              <strong className="text-slate-800 text-sm font-mono">{totalSessions - attendedSessions} حصة</strong>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Right block (2/3 size): Visual bar list per Course */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/50 shadow-sm p-6 space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-navy text-sm border-b border-slate-100 pb-3 text-right">
                        نسب حضورك التفصيلية حسب الدورات والمسارات
                      </h4>

                      {enrollments.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-8">لست مسجلاً في أي دورات حالياً.</p>
                      ) : (
                        <div className="space-y-5">
                          {enrollments.map((enr) => {
                            const courseSessions = attendanceSessions.filter(s => s.enrollment_id === enr.id);
                            const totalSess = courseSessions.length;
                            const attendedSess = courseSessions.filter(s => s.confirmed === true && !s.rejected).length;
                            const lateAttendedSess = courseSessions.filter(s => s.confirmed === true && !s.rejected && s.attended_after_session === true).length;
                            const courseRate = totalSess > 0 ? Math.round((attendedSess / totalSess) * 100) : 100;

                            let barColor = 'bg-emerald-500';
                            let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                            let badgeText = 'حضور ممتاز';
                            if (courseRate < 60) {
                              barColor = 'bg-rose-500';
                              badgeBg = 'bg-rose-50 text-rose-700 border-rose-100';
                              badgeText = 'حضور متدني ⚠️';
                            } else if (courseRate < 85) {
                              barColor = 'bg-amber-500';
                              badgeBg = 'bg-amber-50 text-amber-700 border-amber-100';
                              badgeText = 'حضور مقبول';
                            }

                            return (
                              <div key={enr.id} className="space-y-2 text-right">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="space-y-1">
                                    <span className="font-black text-navy text-sm block">
                                      {enr.course?.name || 'دورة تدريبية'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      المدرب: {enr.course?.teacher_name || 'أستاذ معتمد'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {totalSess > 0 && (
                                      <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full ${badgeBg}`}>
                                        {badgeText}
                                      </span>
                                    )}
                                    <span className="font-black text-navy text-sm font-mono">{courseRate}%</span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className={`${barColor} h-full rounded-full transition-all duration-1000`} 
                                      style={{ width: `${courseRate}%` }} 
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                    <span>
                                      تم حضور <strong className="text-slate-700 font-mono">{attendedSess}</strong> من أصل <strong className="text-slate-700 font-mono">{totalSess}</strong> حصص مجدولة
                                      {lateAttendedSess > 0 && (
                                        <span className="text-amber-600 font-bold"> (منها {lateAttendedSess} بعد الحصة 🕒)</span>
                                      )}
                                    </span>
                                    <span>مؤشر التزام الدورة</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Sub logs list table */}
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-6 space-y-4">
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 text-right">
                    <h4 className="font-extrabold text-navy text-sm">سجل تفاصيل الحضور اليومي</h4>
                    <p className="text-[10px] text-slate-400">يرجى الضغط على الزر الأخضر لتأكيد حضورك الحصص لتصل التأكيدات لإدارة الأكاديمية تلقائياً.</p>
                  </div>

                  {attendanceSessions.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-10 space-y-2">
                      <CheckCircle className="w-10 h-10 text-slate-200 mx-auto" />
                      <p>سجل حصصك التعليمية خالٍ حالياً.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attendanceSessions.map((sess) => {
                        const enrollment = enrollments.find(e => e.id === sess.enrollment_id);
                        const course = enrollment?.course;
                        return (
                          <div 
                            key={sess.id}
                            className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-right transition-all"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap justify-start">
                                <span className="font-extrabold text-navy text-sm truncate max-w-[280px]">
                                  {course?.name || 'دورة تدريبية'}
                                </span>
                                <span className="text-[9px] px-2 py-0.5 bg-slate-200/80 text-slate-600 rounded font-mono font-bold">
                                  رمز الاشتراك: {sess.enrollment_id}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                                <span>تاريخ الحصة: <strong>{sess.session_date}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                              {sess.confirmed ? (
                                <div className="space-y-1 text-right">
                                  {sess.rejected ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-lg font-black text-[10px]">
                                      <XCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                      <span>اعتذر عن الحضور (تم الرفض)</span>
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-lg font-black text-[10px] ${
                                      sess.attended_after_session 
                                        ? 'bg-amber-50 text-amber-700 border-amber-200/60' 
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                    }`}>
                                      {sess.attended_after_session ? (
                                        <>
                                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                                          <span>حضر بعد الحصة 🕒</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>حاضر (مؤكد)</span>
                                        </>
                                      )}
                                    </span>
                                  )}
                                  {sess.confirmed_at && (
                                    <span className="text-[9px] text-slate-400 block font-mono text-left sm:text-right">
                                      تاريخ التأكيد: {new Date(sess.confirmed_at).toLocaleDateString('ar-DZ')}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg font-bold text-[10px]">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>لم تؤكد الحضور بعد</span>
                                  </span>

                                  <button
                                    onClick={() => handleConfirmAttendance(sess.id)}
                                    disabled={confirmingId === sess.id}
                                    className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm shrink-0 flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>{confirmingId === sess.id ? 'جاري...' : 'تأكيد الحضور'}</span>
                                  </button>

                                  <button
                                    onClick={() => handleRejectAttendance(sess.id)}
                                    disabled={confirmingId === sess.id}
                                    className="px-3.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/55 text-[10px] font-bold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>إعتذار / رفض</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
