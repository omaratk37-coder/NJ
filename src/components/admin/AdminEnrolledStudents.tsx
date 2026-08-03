import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, Eye, Key, PlusCircle, Trash2, RotateCcw,
  Calendar, Clock, Check, X, Copy, ExternalLink, ChevronLeft, 
  Coins, Phone, Mail, User, GraduationCap, ArrowRight, BookOpen, AlertCircle, Sparkles,
  Mic, Square, Music, Download
} from 'lucide-react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Course, Student, Enrollment, Attendance } from '../../types';
import { showToast } from '../Toast';
import { exportToCSV, ExportColumn } from '../../lib/exportUtils';

// Define joint display type for listing
interface StudentRow {
  student: Student;
  enrollments: (Enrollment & { course?: Course })[];
}

export default function AdminEnrolledStudents() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [enrollmentsList, setEnrollmentsList] = useState<Enrollment[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);

  // Sub tab control
  const [activeSubTab, setActiveSubTab] = useState<'students_list' | 'student_portal_materials'>('students_list');

  // Student Portal Materials States
  const [lessons, setLessons] = useState<any[]>([]);
  const [audioClips, setAudioClips] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);

  // Form states for creating student resources
  // Lesson
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonCourseId, setLessonCourseId] = useState('');
  const [lessonImageUrl, setLessonImageUrl] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');

  // Audio
  const [audioTitle, setAudioTitle] = useState('');
  const [audioCourseId, setAudioCourseId] = useState('');
  const [audioUrlInput, setAudioUrlInput] = useState('');
  const [audioDescription, setAudioDescription] = useState('');
  const [audioMethod, setAudioMethod] = useState<'record' | 'upload' | 'url'>('record');

  // Admin message
  const [msgTitle, setMsgTitle] = useState('');
  const [msgCourseId, setMsgCourseId] = useState(''); // Empty means all
  const [msgContent, setMsgContent] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Modal control states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Success modal details
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Selected entities for actions
  const [selectedStudentRow, setSelectedStudentRow] = useState<StudentRow | null>(null);
  const [studentToReset, setStudentToReset] = useState<Student | null>(null);
  const [studentToAddCourse, setStudentToAddCourse] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // New Student Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [manualPassword, setManualPassword] = useState('');
  const [subType, setSubType] = useState('شهري'); // شهري, فصلي, سنوي, مخصص
  const [subPrice, setSubPrice] = useState<number | ''>(''); 
  const [subDuration, setSubDuration] = useState('1 شهر'); 
  const [subSessions, setSubSessions] = useState<number | ''>(8); 
  const [subEndDate, setSubEndDate] = useState(''); 
  const [selectedSubTypeId, setSelectedSubTypeId] = useState('');

  // Add Enrollment Form States
  const [addCourseId, setAddCourseId] = useState('');
  const [addAmountPaid, setAddAmountPaid] = useState<number | ''>('');
  const [addSubType, setAddSubType] = useState('شهري');
  const [addSubPrice, setAddSubPrice] = useState<number | ''>('');
  const [addSubDuration, setAddSubDuration] = useState('1 شهر');
  const [addSubSessions, setAddSubSessions] = useState<number | ''>(8);
  const [addSubEndDate, setAddSubEndDate] = useState('');
  const [selectedAddSubTypeId, setSelectedAddSubTypeId] = useState('');

  // Loaded subscription types from database
  const [subscriptionTypes, setSubscriptionTypes] = useState<any[]>([]);

  // Schedule Session Form States (inside detail panel for checked enrollment)
  const [schedEnrollmentId, setSchedEnrollmentId] = useState<string | null>(null);
  const [newSessionDate, setNewSessionDate] = useState('');

  // Batch schedule states
  const [isBatchScheduleOpen, setIsBatchScheduleOpen] = useState(false);
  const [batchCourseId, setBatchCourseId] = useState('');
  const [batchSessionDate, setBatchSessionDate] = useState('');
  const [notificationChannel, setNotificationChannel] = useState<'whatsapp' | 'sms' | 'system'>('whatsapp');
  const [batchNotifiedCount, setBatchNotifiedCount] = useState<number>(0);
  const [batchNotifiedCourseName, setBatchNotifiedCourseName] = useState('');
  const [isBatchSuccessOpen, setIsBatchSuccessOpen] = useState(false);

  // Reset/Zero out profits and active subscriptions states
  const [isResetZeroModalOpen, setIsResetZeroModalOpen] = useState(false);
  const [resetConfirmWord, setResetConfirmWord] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Stats Overrides States
  const [siteSettings, setSiteSettings] = useState<{ [key: string]: string }>({});
  const [isStatsEditModalOpen, setIsStatsEditModalOpen] = useState(false);
  const [adminStatsStudentsOverride, setAdminStatsStudentsOverride] = useState('');
  const [adminStatsEnrollmentsOverride, setAdminStatsEnrollmentsOverride] = useState('');
  const [adminStatsAttendanceOverride, setAdminStatsAttendanceOverride] = useState('');
  const [adminStatsEarningsOverride, setAdminStatsEarningsOverride] = useState('');

  // Derived stats overrides or defaults
  const studentsCountVal = siteSettings.admin_stats_students_override !== undefined && siteSettings.admin_stats_students_override !== ''
    ? siteSettings.admin_stats_students_override
    : studentsList.length.toString();

  const enrollmentsCountVal = siteSettings.admin_stats_enrollments_override !== undefined && siteSettings.admin_stats_enrollments_override !== ''
    ? siteSettings.admin_stats_enrollments_override
    : enrollmentsList.length.toString();

  const attendanceCountVal = siteSettings.admin_stats_attendance_override !== undefined && siteSettings.admin_stats_attendance_override !== ''
    ? siteSettings.admin_stats_attendance_override
    : attendanceList.length.toString();

  const totalEarningsVal = siteSettings.admin_stats_earnings_override !== undefined && siteSettings.admin_stats_earnings_override !== ''
    ? parseInt(siteSettings.admin_stats_earnings_override) || 0
    : enrollmentsList.reduce((sum, e) => sum + e.amount_paid, 0);

  const handleExportEnrolledStudents = () => {
    if (studentsList.length === 0) {
      showToast('لا توجد سجلات منخرطين للتصدير', 'warning');
      return;
    }

    const reportData = studentsList.map(st => {
      const enrs = enrollmentsList.filter(e => e.student_id === st.id);
      const coursesStr = enrs.map(e => {
        const c = courses.find(course => course.id === e.course_id);
        return c ? `${c.name} (${e.amount_paid} دج)` : `مسار (${e.amount_paid} دج)`;
      }).join(' | ');

      return {
        name: st.full_name,
        code: st.student_code,
        phone: st.phone,
        joined: new Date(st.created_at || '').toLocaleDateString('ar-DZ'),
        courses: coursesStr || 'غير مسجل في مسارات حالية',
        totalPaid: enrs.reduce((acc, curr) => acc + (curr.amount_paid || 0), 0)
      };
    });

    const cols: ExportColumn[] = [
      { header: 'الاسم الكامل للطالب', key: 'name' },
      { header: 'رمز الطالب بوزارة/البوابة', key: 'code' },
      { header: 'رقم الهاتف للتواصل', key: 'phone' },
      { header: 'تاريخ الانتساب للأكاديمية', key: 'joined' },
      { header: 'المجموعات والأفواج المنخرط بها مع المدفوع', key: 'courses' },
      { header: 'إجمالي الأقساط المدفوعة (دج)', key: 'totalPaid' }
    ];

    exportToCSV(reportData, cols, 'enrolled_students');
    showToast('✓ تم تصدير سجل الطلاب المنخرطين والمقبوضات بنجاح!', 'success');
  };

  const handleExportAttendance = () => {
    if (attendanceList.length === 0) {
      showToast('لا توجد سجلات حضور حالية للتصدير', 'warning');
      return;
    }

    const reportData = attendanceList.map(att => {
      const student = studentsList.find(s => s.id === att.student_id);
      const course = courses.find(c => c.id === att.course_id);
      return {
        studentName: student ? student.full_name : 'طالب محذوف',
        studentCode: student ? student.student_code : '-',
        courseName: course ? course.name : 'دورة محذوفة',
        sessionDate: att.session_date,
        status: att.confirmed ? 'حاضر (مؤكد)' : att.rejected ? 'غائب بعذر مقبول' : 'غائب / قيد التأكيد'
      };
    });

    const cols: ExportColumn[] = [
      { header: 'اسم الطالب', key: 'studentName' },
      { header: 'رمز الطالب', key: 'studentCode' },
      { header: 'الفوج الدراسي / الدورة', key: 'courseName' },
      { header: 'تاريخ الحصة التدريسية', key: 'sessionDate' },
      { header: 'حالة رصد الحضور والالتزام', key: 'status' }
    ];

    exportToCSV(reportData, cols, 'attendance');
    showToast('✓ تم تصدير كشوف وسجلات حضور وغياب الطلاب بنجاح!', 'success');
  };

  const handleExportLessons = () => {
    if (lessons.length === 0) {
      showToast('لا توجد دروس بيداغوجية للتصدير', 'warning');
      return;
    }

    const cols: ExportColumn[] = [
      { header: 'عنوان الدرس', key: 'title' },
      { header: 'الدورة المستهدفة', key: 'course_name' },
      { header: 'الملخص والمحتوى النصي للصبورة', key: 'content' },
      { header: 'رابط الملحق الإيضاحي', key: 'attachment_url', transform: (v) => v || 'لا يوجد ملحق' },
      { header: 'تاريخ الرفع والبث للطلاب', key: 'created_at' }
    ];

    exportToCSV(lessons, cols, 'daily_lessons');
    showToast('✓ تم تصدير كشف الدروس والملخصات المرفوعة بنجاح!', 'success');
  };

  // Batch schedule submission
  const handleSaveBatchSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCourseId || !batchSessionDate) {
      showToast('يرجى اختيار الدورة وتحديد التاريخ', 'error');
      return;
    }

    // Find all enrollments under this course
    const targetedEnrollments = enrollmentsList.filter(env => env.course_id === batchCourseId);
    if (targetedEnrollments.length === 0) {
      showToast('لا يوجد أي طالب مسجل في هذه الدورة حتى الآن للجدولة!', 'warning');
      return;
    }

    const courseSelected = courses.find(c => c.id === batchCourseId);
    const courseName = courseSelected ? courseSelected.name : 'الدورة';

    try {
      // Create attendance session for each targeted enrollment
      for (const env of targetedEnrollments) {
        await db.attendance.create({
          enrollment_id: env.id,
          session_date: batchSessionDate
        });
      }

      // Simulate sending notifications
      console.log(`%c[Batch Notification - Scheduled Session]`, 'color: #0E9F6E; font-weight: bold;', {
        course: courseName,
        date: batchSessionDate,
        channel: notificationChannel,
        notifiedStudentsCount: targetedEnrollments.length
      });

      // Show beautiful success summary
      setBatchNotifiedCount(targetedEnrollments.length);
      setBatchNotifiedCourseName(courseName);
      
      // Reset form states
      setBatchCourseId('');
      setBatchSessionDate('');
      
      setIsBatchScheduleOpen(false);
      setIsBatchSuccessOpen(true);
      
      showToast(`تمت جدولة الحصة بنجاح وإرسال إشعارات لـ ${targetedEnrollments.length} طالب!`, 'success');
      reloadAllData();
    } catch (err: any) {
      showToast('حدث خطأ أثناء جدولة الحصة', 'error');
    }
  };

  const handleSaveStatsOverrides = async () => {
    try {
      await db.settings.update({
        admin_stats_students_override: adminStatsStudentsOverride.trim(),
        admin_stats_enrollments_override: adminStatsEnrollmentsOverride.trim(),
        admin_stats_attendance_override: adminStatsAttendanceOverride.trim(),
        admin_stats_earnings_override: adminStatsEarningsOverride.trim(),
      });
      showToast('✓ تم تحديث قيم الإحصائيات الافتراضية بنجاح!', 'success');
      setIsStatsEditModalOpen(false);
      await reloadAllData();
    } catch {
      showToast('تعذر حفظ قيم الإحصائيات الافتراضية', 'error');
    }
  };

  const handleResetZeroAll = async () => {
    if (resetConfirmWord !== 'تصفير') {
      showToast('يرجى كتابة كلمة "تصفير" للتأكيد بشكل صحيح', 'warning');
      return;
    }

    setIsResetting(true);
    showToast('جاري البدء في تصفير الأرباح والاشتراكات الفعالة...', 'success');

    try {
      // Delete all enrollments in parallel
      await Promise.all(
        enrollmentsList.map(async (enrollment) => {
          await db.enrollments.delete(enrollment.id);
        })
      );

      showToast('✓ تم تصفير جميع الأرباح والاشتراكات بنجاح!', 'success');
      setIsResetZeroModalOpen(false);
      setResetConfirmWord('');
      await reloadAllData();
    } catch (err: any) {
      console.error(err);
      showToast('حدث خطأ أثناء تصفير البيانات', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch all databases
  const reloadAllData = async () => {
    try {
      const c = await db.courses.list();
      setCourses(c);

      const s = await db.students.list();
      setStudentsList(s);

      const e = await db.enrollments.list();
      setEnrollmentsList(e);

      const a = await db.attendance.list();
      setAttendanceList(a);

      // Fetch student portal materials
      const l = await db.lessons.list();
      setLessons(l);

      const ac = await db.audioClips.list();
      setAudioClips(ac);

      const m = await db.adminMessages.list();
      setAdminMessages(m);

      const subTypes = await db.subscriptionTypes.list();
      setSubscriptionTypes(subTypes || []);

      const settings = await db.settings.get();
      setSiteSettings(settings || {});
    } catch (err: any) {
      showToast('حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioUrlInput(base64Audio);
          showToast('✓ تم تسجيل المقطع الصوتي بنجاح وجاهز للإضافة!', 'success');
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks in stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      showToast('لم نتمكن من الوصول للميكروفون. يرجى تفعيل الصلاحية', 'error');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setAudioUrlInput('');
      showToast('تم إلغاء التسجيل الصوتي', 'warning');
    }
  };

  // State to track file input mode for lesson image upload
  const [lessonImageFileMode, setLessonImageFileMode] = useState(true);

  const handleLessonImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح فقط', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLessonImageUrl(reader.result as string);
      showToast('✓ تم تحميل وصياغة صورة الدرس اليومي بنجاح!', 'success');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    reloadAllData();

    // Subscribe to realtime triggers
    const unsubscribe = subscribeToRealtime(() => {
      reloadAllData();
    });
    return () => {
      unsubscribe();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Sync details sidebar on updates
  useEffect(() => {
    if (selectedStudentRow) {
      const updatedStudent = studentsList.find(s => s.id === selectedStudentRow.student.id);
      if (!updatedStudent) {
        setSelectedStudentRow(null);
        return;
      }
      
      const studentEnrolls = enrollmentsList.filter(e => e.student_id === updatedStudent.id);
      const enrollsWithCourse = studentEnrolls.map(enroll => ({
        ...enroll,
        course: courses.find(c => c.id === enroll.course_id)
      }));

      setSelectedStudentRow({
        student: updatedStudent,
        enrollments: enrollsWithCourse
      });
    }
  }, [studentsList, enrollmentsList, courses]);

  // Autofill subscription details when selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      const course = courses.find(c => c.id === selectedCourseId);
      if (course) {
        setSubPrice(course.price || '');
        // default end date to today + 30 days
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);
        setSubEndDate(targetDate.toISOString().split('T')[0]);
      }
    }
  }, [selectedCourseId, courses]);

  // Autofill subscription details when addCourseId changes
  useEffect(() => {
    if (addCourseId) {
      const course = courses.find(c => c.id === addCourseId);
      if (course) {
        setAddSubPrice(course.price || '');
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);
        setAddSubEndDate(targetDate.toISOString().split('T')[0]);
      }
    }
  }, [addCourseId, courses]);

  // Auto-fill student registration subscription details when selectedSubTypeId changes
  useEffect(() => {
    if (selectedSubTypeId) {
      const sub = subscriptionTypes.find(s => s.id === selectedSubTypeId);
      if (sub) {
        setSubType(sub.name);
        setSubPrice(sub.price);
        const durationText = sub.duration_months === 1 ? '1 شهر' : `${sub.duration_months} أشهر`;
        setSubDuration(durationText);
        setSubSessions(sub.duration_months * 8);
        
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + sub.duration_months);
        setSubEndDate(targetDate.toISOString().split('T')[0]);
      }
    }
  }, [selectedSubTypeId, subscriptionTypes]);

  // Auto-fill add course subscription details when selectedAddSubTypeId changes
  useEffect(() => {
    if (selectedAddSubTypeId) {
      const sub = subscriptionTypes.find(s => s.id === selectedAddSubTypeId);
      if (sub) {
        setAddSubType(sub.name);
        setAddSubPrice(sub.price);
        const durationText = sub.duration_months === 1 ? '1 شهر' : `${sub.duration_months} أشهر`;
        setAddSubDuration(durationText);
        setAddSubSessions(sub.duration_months * 8);
        
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + sub.duration_months);
        setAddSubEndDate(targetDate.toISOString().split('T')[0]);
      }
    }
  }, [selectedAddSubTypeId, subscriptionTypes]);

  // Set default subscription type selections on list load
  useEffect(() => {
    if (subscriptionTypes.length > 0) {
      if (!selectedSubTypeId) setSelectedSubTypeId(subscriptionTypes[0].id);
      if (!selectedAddSubTypeId) setSelectedAddSubTypeId(subscriptionTypes[0].id);
    }
  }, [subscriptionTypes, selectedSubTypeId, selectedAddSubTypeId]);

  // Generators
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم نسخ البيانات للحافظة بنجاح!', 'success');
  };

  // Submit New Student Signup
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !selectedCourseId || amountPaid === '') {
      showToast('يرجى ملء كافة الحقول الأساسية المطلوبة', 'error');
      return;
    }

    const finalPass = manualPassword.trim() || generateRandomPassword();

    try {
      // 1. Create Student
      const student = await db.students.create({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password_hash: finalPass, // Simulated hashed val standard plaintext matching
        notes: ''
      });

      // 2. Create Enrollment
      await db.enrollments.create({
        student_id: student.id,
        course_id: selectedCourseId,
        amount_paid: Number(amountPaid),
        sub_type: subType,
        sub_price: subPrice !== '' ? Number(subPrice) : undefined,
        sub_duration: subDuration,
        sub_sessions: subSessions !== '' ? Number(subSessions) : undefined,
        sub_end_date: subEndDate || undefined
      });

      // Set credentials to show admin
      setNewStudentCode(student.student_code);
      setNewPassword(finalPass);

      // Clean form states
      setFullName('');
      setPhone('');
      setEmail('');
      setSelectedCourseId('');
      setAmountPaid('');
      setManualPassword('');
      setSubType('شهري');
      setSubPrice('');
      setSubDuration('1 شهر');
      setSubSessions(8);
      setSubEndDate('');

      setIsRegisterOpen(false);
      setIsSuccessModalOpen(true);
      showToast('تم تسجيل وإلحاق الطالب بنجاح!', 'success');
      reloadAllData();
    } catch (err: any) {
      showToast(err.message || 'خطأ أثناء تسجيل الطالب الجديد', 'error');
    }
  };

  // Reset Student Password
  const handleTriggerReset = (student: Student) => {
    setStudentToReset(student);
    const generated = generateRandomPassword();
    setNewPassword(generated);
    setIsResetModalOpen(true);
  };

  const handleSaveResetPassword = async () => {
    if (!studentToReset) return;
    try {
      await db.students.updatePassword(studentToReset.id, newPassword);
      showToast('تم إعادة تعيين كلمة مرور الطالب بنجاح!', 'success');
      setIsResetModalOpen(false);
      setStudentToReset(null);
      reloadAllData();
    } catch (err: any) {
      showToast('خطأ أثناء تحديث كلمة المرور', 'error');
    }
  };

  // Add enrollment to existing student
  const handleTriggerAddCourse = (student: Student) => {
    setStudentToAddCourse(student);
    setAddCourseId('');
    setAddAmountPaid('');
    setIsAddCourseOpen(true);
  };

  const handleSaveAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToAddCourse || !addCourseId || addAmountPaid === '') return;
    
    // Check if copy registration already exists
    const existing = enrollmentsList.find(e => e.student_id === studentToAddCourse.id && e.course_id === addCourseId);
    if (existing) {
      showToast('هذا الطالب مسجل بالفعل في هذه الدورة!', 'error');
      return;
    }

    try {
      await db.enrollments.create({
        student_id: studentToAddCourse.id,
        course_id: addCourseId,
        amount_paid: Number(addAmountPaid),
        sub_type: addSubType,
        sub_price: addSubPrice !== '' ? Number(addSubPrice) : undefined,
        sub_duration: addSubDuration,
        sub_sessions: addSubSessions !== '' ? Number(addSubSessions) : undefined,
        sub_end_date: addSubEndDate || undefined
      });
      showToast('تم تسجيل الطالب للمسار الإضافي بنجاح!', 'success');
      setIsAddCourseOpen(false);
      setStudentToAddCourse(null);
      
      // Reset add course subscription fields
      setAddCourseId('');
      setAddAmountPaid('');
      setAddSubType('شهري');
      setAddSubPrice('');
      setAddSubDuration('1 شهر');
      setAddSubSessions(8);
      setAddSubEndDate('');
      
      reloadAllData();
    } catch (err: any) {
      showToast('خطأ أثناء الاشتراك الإضافي', 'error');
    }
  };

  // Delete student
  const handleTriggerDelete = (student: Student) => {
    setStudentToDelete(student);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await db.students.delete(studentToDelete.id);
      showToast('تم حذف سجل الطالب والارتباطات بنجاح.', 'success');
      setIsConfirmDeleteOpen(false);
      setStudentToDelete(null);
      
      if (selectedStudentRow?.student.id === studentToDelete.id) {
        setSelectedStudentRow(null);
      }
      reloadAllData();
    } catch (err: any) {
      showToast('خطأ أثناء الحذف', 'error');
    }
  };

  // Schedule upcoming class session
  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedEnrollmentId || !newSessionDate) return;

    try {
      await db.attendance.create({
        enrollment_id: schedEnrollmentId,
        session_date: newSessionDate
      });
      showToast('تم جدولة الحصة القادمة حضورياً بنجاح!', 'success');
      setNewSessionDate('');
      setSchedEnrollmentId(null);
      reloadAllData();
    } catch (err: any) {
      showToast('تعذر الجدولة الزمنية للحصة', 'error');
    }
  };

  // Confirm verbal/manual attendance from admin
  const handleManualConfirmAttendance = async (attendanceId: string, confirmed: boolean) => {
    try {
      await db.attendance.confirm(attendanceId, confirmed);
      showToast(confirmed ? 'تم تأكيد حضور الطالب بالكامل!' : 'تم إلغاء تأكيد حضور الطالب بنجاح.', 'success');
      reloadAllData();
    } catch (err: any) {
      showToast('فشل تحديث حالة الحضور المكتوب', 'error');
    }
  };

  // Confirm attendance after the session (late attendance) from admin
  const handleConfirmAfterSessionAttendance = async (attendanceId: string, attendedAfter: boolean) => {
    try {
      await db.attendance.confirmAfterSession(attendanceId, attendedAfter);
      showToast(attendedAfter ? 'تم تأكيد حضور الطالب بعد الحصة/متأخراً!' : 'تم إلغاء حضور الطالب بعد الحصة.', 'success');
      reloadAllData();
    } catch (err: any) {
      showToast('فشل تحديث حالة الحضور بعد الحصة', 'error');
    }
  };

  // Delete session scheduling
  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الحصة المجدولة؟')) return;
    try {
      await db.attendance.delete(sessionId);
      showToast('تم حذف الحصة بنجاح.', 'success');
      reloadAllData();
    } catch (err: any) {
      showToast('فشل حذف الحصة', 'error');
    }
  };

  // Create / Delete handlers for Daily Lessons
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !lessonCourseId || !lessonImageUrl.trim() || !lessonDescription.trim()) {
      showToast('يرجى ملء كافة الحقول لإنشاء الدرس المكتوب', 'error');
      return;
    }
    const course = courses.find(c => c.id === lessonCourseId);
    try {
      await db.lessons.create({
        title: lessonTitle.trim(),
        course_id: lessonCourseId,
        course_name: course ? course.name : 'دورة',
        image_url: lessonImageUrl.trim(),
        description: lessonDescription.trim()
      });
      showToast('تمت إضافة ملخص الدرس اليومي بالنجاح!', 'success');
      // Reset form
      setLessonTitle('');
      setLessonCourseId('');
      setLessonImageUrl('');
      setLessonDescription('');
      reloadAllData();
    } catch {
      showToast('خطأ أثناء حفظ الدرس اليومي', 'error');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الدرس؟')) return;
    try {
      await db.lessons.delete(id);
      showToast('تم حذف الدرس بنجاح.', 'success');
      reloadAllData();
    } catch {
      showToast('فشل حذف الدرس', 'error');
    }
  };

  // Create / Delete handlers for Audio Clips
  const handleCreateAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioTitle.trim() || !audioCourseId || !audioUrlInput.trim()) {
      showToast('يرجى ملء كافة الحقول لإنشاء الملف الصوتي', 'error');
      return;
    }
    const course = courses.find(c => c.id === audioCourseId);
    try {
      await db.audioClips.create({
        title: audioTitle.trim(),
        course_id: audioCourseId,
        course_name: course ? course.name : 'دورة',
        audio_url: audioUrlInput.trim(),
        description: audioDescription.trim()
      });
      showToast('تم رفع وتأكيد الملف الصوتي التعليمي!', 'success');
      // Reset form
      setAudioTitle('');
      setAudioCourseId('');
      setAudioUrlInput('');
      setAudioDescription('');
      reloadAllData();
    } catch {
      showToast('خطأ أثناء حفظ الملف الصوتي', 'error');
    }
  };

  const handleDeleteAudio = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الملف الصوتي؟')) return;
    try {
      await db.audioClips.delete(id);
      showToast('تم حذف الملف الصوتي بنجاح.', 'success');
      reloadAllData();
    } catch {
      showToast('فشل حذف الملف الصوتي', 'error');
    }
  };

  // Create / Delete handlers for Admin Messages
  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgContent.trim()) {
      showToast('يرجى كتابة عنوان وتفاصيل الرسالة التعميمية', 'error');
      return;
    }
    const course = msgCourseId ? courses.find(c => c.id === msgCourseId) : null;
    try {
      await db.adminMessages.create({
        title: msgTitle.trim(),
        content: msgContent.trim(),
        course_id: msgCourseId || undefined,
        course_name: course ? course.name : undefined
      });
      showToast('تم تعميم الرسالة الإدارية للطلاب بنجاح!', 'success');
      // Reset form
      setMsgTitle('');
      setMsgCourseId('');
      setMsgContent('');
      reloadAllData();
    } catch {
      showToast('خطأ أثناء تعميم الرسالة', 'error');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في سحب هذه الرسالة الإدارية؟')) return;
    try {
      await db.adminMessages.delete(id);
      showToast('تم سحب وحذف الرسالة بنجاح.', 'success');
      reloadAllData();
    } catch {
      showToast('فشل حذف الرسالة', 'error');
    }
  };

  // Build the joined student records dataset
  const rows: StudentRow[] = studentsList.map(s => {
    const studentEnrolls = enrollmentsList.filter(e => e.student_id === s.id);
    const enrollsWithCourse = studentEnrolls.map(enroll => ({
      ...enroll,
      course: courses.find(c => c.id === enroll.course_id)
    }));
    return {
      student: s,
      enrollments: enrollsWithCourse
    };
  });

  // Apply filters and searches
  const filteredRows = rows.filter(row => {
    // 1. Search Query
    const nameMatch = row.student.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = row.student.phone.includes(searchQuery);
    const codeMatch = row.student.student_code.toLowerCase().includes(searchQuery.toLowerCase());
    const searchPass = nameMatch || phoneMatch || codeMatch;

    // 2. Course Filter
    let coursePass = true;
    if (selectedCourseFilter !== 'all') {
      coursePass = row.enrollments.some(e => e.course_id === selectedCourseFilter);
    }

    return searchPass && coursePass;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans flex flex-col justify-center items-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>جاري تحميل سجلات الطلاب والمستحقات والاشتراكات...</span>
      </div>
    );
  }

  // Compute overall attendance rate and identify low attendance students (< 60%)
  const totalScheduledSessionsCount = attendanceList.length;
  const totalConfirmedSessionsCount = attendanceList.filter(a => a.confirmed === true && !a.rejected).length;
  const overallAttendanceRate = totalScheduledSessionsCount > 0 
    ? Math.round((totalConfirmedSessionsCount / totalScheduledSessionsCount) * 100) 
    : 0;

  const lowAttendanceList: {
    student: Student;
    course: Course;
    rate: number;
    attendedCount: number;
    totalCount: number;
  }[] = [];

  studentsList.forEach(stud => {
    const studentEnrolls = enrollmentsList.filter(e => e.student_id === stud.id);
    studentEnrolls.forEach(enr => {
      const enrSessions = attendanceList.filter(a => a.enrollment_id === enr.id);
      if (enrSessions.length > 0) {
        const attended = enrSessions.filter(a => a.confirmed === true && !a.rejected).length;
        const rate = Math.round((attended / enrSessions.length) * 100);
        if (rate < 60) {
          const course = courses.find(c => c.id === enr.course_id);
          if (course) {
            lowAttendanceList.push({
              student: stud,
              course,
              rate,
              attendedCount: attended,
              totalCount: enrSessions.length
            });
          }
        }
      }
    });
  });

  // Find whatsapp settings for messages
  const shareOnWhatsApp = (code: string, pass: string, name: string) => {
    const text = `أهلاً بك يا ${name} في أكاديمية ناجي المعتمدة! 🌟
إليك بيانات لوحة الطلاب لتتمكن من تأكيد حضورك ومتابعة دوراتك المجدولة:

- رابط البوابة: https://naji-academy.pages.dev/student-portal
- رقم التعريف الخاص بك: ${code}
- كلمة المرور المؤقتة: ${pass}

نتمنى لك رحلة دراسية ممتعة ومميزة!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-right font-sans" style={{ direction: 'rtl' }}>
      
      {/* Page Header Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-ping"></span>
            <h1 className="text-xl md:text-2xl font-black text-navy font-sans">قائمة الطلاب المنخرطين رسمياً</h1>
          </div>
          <p className="text-xs text-slate-400">
            إدارة المنخرطين والتحصيل دج، حضور، غيابات وجدولة الحصص التعليمية لكل مسار بانتظام.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 self-start sm:self-auto">
          {studentsList.length > 0 && (
            <button
              onClick={handleExportEnrolledStudents}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-[10px] text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              title="تصدير كشف المنخرطين"
            >
              <Download className="w-4 h-4" />
              <span>تصدير المنخرطين (Excel)</span>
            </button>
          )}

          {attendanceList.length > 0 && (
            <button
              onClick={handleExportAttendance}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-[10px] text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              title="تصدير سجل الحضور والغياب"
            >
              <Download className="w-4 h-4" />
              <span>تصدير الحضور (Excel)</span>
            </button>
          )}

          {enrollmentsList.length > 0 && (
            <button
              onClick={() => setIsResetZeroModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-[10px] text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              title="تصفير إجمالي الأرباح والاشتراكات الفعالة"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>تصفير الأرباح والاشتراكات</span>
            </button>
          )}

          <button
            onClick={() => {
              setBatchSessionDate(new Date().toISOString().split('T')[0]);
              setBatchCourseId('');
              setIsBatchScheduleOpen(true);
            }}
            className="bg-navy hover:bg-[#112a4a]/90 text-white font-bold px-5 py-2.5 rounded-[10px] text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0 border border-navy/10"
          >
            <Calendar className="w-4 h-4 text-gold" />
            <span>برمجة حصة قادمة لدورة</span>
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="bg-gold hover:bg-[#b49218] text-navy font-bold px-5 py-2.5 rounded-[10px] text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Sub tabs bar */}
      <div className="flex border-b border-slate-200 gap-4 mt-2">
        <button
          onClick={() => setActiveSubTab('students_list')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'students_list'
              ? 'border-gold text-gold font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🎓 إدارة اشتراكات الطلاب والحضور
        </button>
        <button
          onClick={() => setActiveSubTab('student_portal_materials')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'student_portal_materials'
              ? 'border-gold text-gold font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📱 بوابة الطالب: مواد الدرس والتنبيهات
        </button>
      </div>

      {activeSubTab === 'students_list' && (
        <>
          {/* Header with edit stats button */}
          <div className="flex items-center justify-between mt-1 mb-2">
            <span className="text-xs font-bold text-slate-500">موجز الإحصائيات الفورية</span>
            <button
              onClick={() => {
                setAdminStatsStudentsOverride(siteSettings.admin_stats_students_override || '');
                setAdminStatsEnrollmentsOverride(siteSettings.admin_stats_enrollments_override || '');
                setAdminStatsAttendanceOverride(siteSettings.admin_stats_attendance_override || '');
                setAdminStatsEarningsOverride(siteSettings.admin_stats_earnings_override || '');
                setIsStatsEditModalOpen(true);
              }}
              className="text-[#12386a] hover:text-navy-dark text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold fill-gold animate-pulse" />
              <span>تعديل قيم الإحصائيات الفورية</span>
            </button>
          </div>

          {/* Stats Quick Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">الطلاب النشطون</span>
                <span className="text-2xl font-black text-navy font-mono">{studentsCountVal}</span>
              </div>
              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">الاشتراكات الفعالة</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">{enrollmentsCountVal}</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">الحصص المجدولة كلياً</span>
                <span className="text-2xl font-black text-navy font-mono">{attendanceCountVal}</span>
              </div>
              <div className="w-10 h-10 bg-navy/5 rounded-xl flex items-center justify-center text-navy">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">إجمالي الأقساط دج</span>
                <span className="text-xl font-extrabold text-[#2e7d32] font-mono">
                  {totalEarningsVal.toLocaleString()} <span className="text-xs font-sans text-slate-500">دج</span>
                </span>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#2e7d32]">
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </div>

      {/* New Attendance Analytics & Warnings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Attendance Rate Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-[4px] bg-teal-500" />
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-navy text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span>معدل الحضور العام للطلاب المسجلين</span>
              </h4>
              <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full">Attendance Rate</span>
            </div>
            
            <div className="flex items-center gap-5 py-2">
              {/* Radial SVG circular bar */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#f1f5f9"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#14b8a6"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - overallAttendanceRate / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-base font-black text-navy font-mono">{overallAttendanceRate}%</span>
              </div>
              
              <div className="space-y-1.5 text-xs">
                <p className="text-slate-500 font-medium">مؤشر حضور الطلاب الفعلي:</p>
                <div className="font-bold text-slate-800">
                  تم حضور <span className="text-teal-600 font-mono text-sm">{totalConfirmedSessionsCount}</span> حصة من أصل <span className="text-navy font-mono text-sm">{totalScheduledSessionsCount}</span> حصة مجدولة.
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  هذه النسبة تعكس التزام جميع المنخرطين في مختلف الدورات التعليمية بالأكاديمية.
                </p>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500">
            ✓ يعتمد حساب النسبة على مجموع الحصص المؤكدة يدوياً أو بواسطة الطلاب.
          </div>
        </div>

        {/* Low Attendance Warning Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-[4px] bg-rose-500" />
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="font-extrabold text-navy text-sm">
                  رصد الطلاب ذوي الحضور المتدني (أقل من 60%)
                </h4>
              </div>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                تنبيه الحضور ({lowAttendanceList.length})
              </span>
            </div>

            {lowAttendanceList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-center space-y-2">
                <span className="text-2xl">🎉</span>
                <p className="text-xs font-bold text-slate-700">جميع طلابك نشطون وملتزمون!</p>
                <p className="text-[11px] text-slate-400">لا يوجد أي طالب يقل معدل حضوره الفعلي عن 60% حالياً.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {lowAttendanceList.map((rec, idx) => {
                  const textMsg = `السلام عليكم يا ${rec.student.full_name}، إدارة أكاديمية ناجي تلاحظ غيابكم المتكرر في دورة ${rec.course.name} (حضوركم الحالي: ${rec.rate}% فقط). يرجى الحضور بانتظام وتأكيد حضور حصصكم القادمة عبر بوابة الطالب لضمان الحفاظ على مقعدكم بالأكاديمية. بالتوفيق!`;
                  const waLink = `https://wa.me/${rec.student.phone.replace(/[\s\+\-]/g, '')}?text=${encodeURIComponent(textMsg)}`;
                  
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors text-xs"
                    >
                      <div className="space-y-1 block min-w-0 pr-1 text-right">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-800 text-sm">
                            {rec.student.full_name}
                          </span>
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded">
                            {rec.student.student_code}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate font-medium">
                          الدورة: <strong className="text-navy">{rec.course.name}</strong>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="font-black text-rose-600 text-sm font-mono">{rec.rate}%</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            ({rec.attendedCount} من {rec.totalCount} حصص)
                          </span>
                        </div>
                        
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-transparent rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="إرسال تنبيه بالغياب عبر واتساب"
                        >
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>تنبيه واتساب</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-400 leading-normal">
            ⚠️ يساعدك هذا الرصد التلقائي في فرز الحالات المتعثرة والاتصال بها هاتفياً للمتابعة وضمان عدم انقطاع الطلاب عن مساراتهم.
          </div>
        </div>

      </div>

      {/* Main Filter Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Right side search bar input */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، أو كود الطالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[10px] text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
          />
        </div>

        {/* Course Filter selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="block py-2 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-[10px] text-xs font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-gold transition-all"
          >
            <option value="all">جميع مسارات الطلاب التدريبية</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Core Table Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Students list Column */}
        <div className={`lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-right">
              <thead className="bg-[#112a4a]/5">
                <tr>
                  <th scope="col" className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">رقم التعريف</th>
                  <th scope="col" className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الاسم الكامل / الاتصال</th>
                  <th scope="col" className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الدورات المسجلة</th>
                  <th scope="col" className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">المسدد كلياً</th>
                  <th scope="col" className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ الانخراط</th>
                  <th scope="col" className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60 text-xs">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                      لا يوجد أي طالب منخرط حالياً يطابق معايير وتصنيفات البحث.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr 
                      key={row.student.id} 
                      className={`hover:bg-slate-50 transition-colors ${selectedStudentRow?.student.id === row.student.id ? 'bg-amber-50/20' : ''}`}
                    >
                      {/* Code */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-700 select-all">
                        {row.student.student_code}
                      </td>

                      {/* Name / Phone */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-sm">{row.student.full_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 tracking-wider [direction:ltr] inline-block text-right">{row.student.phone}</div>
                      </td>

                      {/* Enrolled Courses list */}
                      <td className="px-5 py-4">
                        {row.enrollments.length === 0 ? (
                          <span className="text-slate-400">غير مشارك</span>
                        ) : (
                          <div className="flex flex-col gap-1 max-w-[170px]">
                            {row.enrollments.map(e => (
                              <span 
                                key={e.id} 
                                className="px-2 py-0.5 bg-[#113a69]/5 text-navy border border-[#113a69]/10 rounded font-bold text-[10px] truncate block"
                                title={e.course?.name}
                              >
                                {e.course?.name || 'دورة مجهولة'}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Total Amount Paid */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-[#2e7d32]">
                        {row.enrollments.reduce((sum, e) => sum + e.amount_paid, 0).toLocaleString()} دج
                      </td>

                      {/* Registered date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                        {new Date(row.student.created_at).toLocaleDateString('ar-DZ')}
                      </td>

                      {/* CRUD controls block */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedStudentRow(row)}
                            className="p-1.5 bg-[#113a69]/5 text-navy hover:bg-[#113a69] hover:text-white rounded transition-colors cursor-pointer"
                            title="عرض تفاصيل سجل الحضور"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTriggerAddCourse(row.student)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded transition-colors cursor-pointer"
                            title="إضافة دورة أخرى للطالب"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTriggerReset(row.student)}
                            className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded transition-colors cursor-pointer"
                            title="إعادة تعيين كلمة مرور الطالب"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTriggerDelete(row.student)}
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded transition-colors cursor-pointer"
                            title="حذف الطالب بالكامل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details & Live Attendance Management Panel column status */}
        <div className="lg:col-span-1">
          {selectedStudentRow ? (
            <div className="bg-white rounded-2xl border border-gold/25 shadow-md p-6 space-y-6 relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 left-0 h-[4px] bg-gold" />
              
              {/* Profile Card Summary Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-navy text-base leading-tight font-sans">{selectedStudentRow.student.full_name}</h3>
                  <span className="text-[10px] text-slate-400 font-bold block select-all font-mono tracking-wider">{selectedStudentRow.student.student_code}</span>
                </div>
                <button
                  onClick={() => setSelectedStudentRow(null)}
                  className="p-1 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Info fields details */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-100">
                  <span className="text-slate-400 font-medium">رقم الهاتف</span>
                  <a href={`tel:${selectedStudentRow.student.phone}`} className="font-bold text-slate-700 underline flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gold" />
                    <span className="[direction:ltr]">{selectedStudentRow.student.phone}</span>
                  </a>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-100">
                  <span className="text-slate-400 font-medium">البريد الإلكتروني</span>
                  <span className="font-bold text-slate-700">
                    {selectedStudentRow.student.email ? (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gold" />
                        <span>{selectedStudentRow.student.email}</span>
                      </span>
                    ) : (
                      <em className="text-slate-350">غير متوفر</em>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 font-medium">قنوات التواصل المباشر</span>
                  <button
                    onClick={() => shareOnWhatsApp(selectedStudentRow.student.student_code, 'غير معدّلة', selectedStudentRow.student.full_name)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <span>ارسل الرمز عبر واتساب</span>
                  </button>
                </div>
              </div>

              {/* Section: Attendance schedules list & triggers */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-extrabold text-navy-dark text-xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gold shrink-0" />
                  <span>إدارة حضور الحصص الدراسية</span>
                </h4>

                {selectedStudentRow.enrollments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">الرجاء تسجيل هذا الطالب في دورة أولاً للبدء بجدولة حصص الحضور.</p>
                ) : (
                  <div className="space-y-5">
                    {selectedStudentRow.enrollments.map((enr) => {
                      const courseSessions = attendanceList.filter(a => a.enrollment_id === enr.id);
                      courseSessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
                      
                      return (
                        <div key={enr.id} className="bg-slate-50 border border-slate-200/55 rounded-xl p-4.5 space-y-3">
                          
                          {/* Course title & Session sched trigger */}
                          <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-slate-200/40">
                            <h5 className="font-extrabold text-[#113a69] text-xs leading-snug truncate" title={enr.course?.name}>
                              {enr.course?.name || 'مسار تعليمي'}
                            </h5>
                            
                            {schedEnrollmentId === enr.id ? (
                              <button
                                onClick={() => setSchedEnrollmentId(null)}
                                className="text-[10px] font-bold text-rose-600 hover:underline"
                              >
                                إلغاء الجدولة
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSchedEnrollmentId(enr.id);
                                  // Standard default today's date formatted (YYYY-MM-DD)
                                  setNewSessionDate(new Date().toISOString().split('T')[0]);
                                }}
                                className="px-2 py-0.5 bg-gold/15 text-navy hover:bg-gold/30 text-[10px] font-bold rounded flex items-center gap-0.5 cursor-pointer border border-gold/15"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>جدولة حصة</span>
                              </button>
                            )}
                          </div>

                          {/* Quick inline schedule form on select */}
                          {schedEnrollmentId === enr.id && (
                            <form onSubmit={handleScheduleSession} className="p-3 bg-white border border-gold/20 rounded-lg space-y-3.5">
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500">تاريخ الحصة القادمة المجدولة</label>
                                <input
                                  type="date"
                                  required
                                  value={newSessionDate}
                                  onChange={(e) => setNewSessionDate(e.target.value)}
                                  className="block w-full py-1.5 px-2 bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none rounded"
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-full py-1.5 bg-gold hover:bg-[#b49218] text-navy text-xs font-bold rounded cursor-pointer transition-colors text-center"
                              >
                                حفظ حصة جديدة مجدولة
                              </button>
                            </form>
                          )}

                          {/* Subscription Details Display */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2.5 rounded-lg border border-slate-200/40 text-slate-600 font-sans">
                            <div>
                              <span>نوع الاشتراك: </span>
                              <strong className="text-navy">{enr.sub_type || 'شهري'}</strong>
                            </div>
                            <div>
                              <span>سعر الاشتراك: </span>
                              <strong className="text-navy">{enr.sub_price ? `${enr.sub_price} دج` : 'غير محدد'}</strong>
                            </div>
                            <div>
                              <span>المدة والعدد: </span>
                              <strong className="text-navy">{enr.sub_duration || '1 شهر'} ({enr.sub_sessions !== undefined ? `${enr.sub_sessions} حصة` : '8'})</strong>
                            </div>
                            <div className="flex items-center gap-1 text-rose-700 font-bold col-span-2">
                              <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>نهاية الاشتراك: </span>
                              <strong className="font-mono">{enr.sub_end_date || 'غير محدد'}</strong>
                            </div>
                          </div>

                          {/* Sessions table logs inside */}
                          <div className="space-y-2">
                            {courseSessions.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic text-center py-2">لا توجد حصص مجدولة أو مسجلة لهذا الاشتراك حالياً.</p>
                            ) : (
                              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                                {courseSessions.map((sess) => (
                                  <div 
                                    key={sess.id} 
                                    className="p-2 bg-white rounded border border-slate-200/50 flex items-center justify-between gap-2.5 text-[11px]"
                                  >
                                    <div className="block">
                                      <span className="font-bold text-slate-700 block text-right">{sess.session_date}</span>
                                      {sess.confirmed ? (
                                        sess.rejected ? (
                                          <span className="text-[9px] text-rose-600 font-bold block [direction:rtl] mt-0.5">
                                            ✗ اعتذر / رفض الحضور ({new Date(sess.confirmed_at || sess.created_at).toLocaleDateString('ar-DZ')})
                                          </span>
                                        ) : (
                                          <span className="text-[9px] text-[#2c7760] font-bold block [direction:rtl] mt-0.5">
                                            {sess.attended_after_session ? '✓ حضر بعد الحصة 🕒' : '✓ حاضر'} ({new Date(sess.confirmed_at || sess.created_at).toLocaleDateString('ar-DZ')} {new Date(sess.confirmed_at || sess.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })})
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[9px] text-amber-600 block mt-0.5 font-bold">بانتظار التأكيد (طالب)</span>
                                      )}
                                    </div>

                                    {/* Action manual toggling */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleManualConfirmAttendance(sess.id, !sess.confirmed || !!sess.attended_after_session)}
                                        className={`p-1 border rounded transition-all cursor-pointer ${
                                          sess.confirmed && !sess.attended_after_session
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-slate-100 hover:text-slate-600' 
                                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'
                                        }`}
                                        title={sess.confirmed && !sess.attended_after_session ? 'تعديل إلى غياب/غير مؤكد' : 'تأكيد الحضور يدوياً كحاضر'}
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      
                                      <button
                                        onClick={() => handleConfirmAfterSessionAttendance(sess.id, !sess.attended_after_session)}
                                        className={`p-1 border rounded transition-all cursor-pointer ${
                                          sess.attended_after_session 
                                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-slate-100 hover:text-slate-600' 
                                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-600'
                                        }`}
                                        title={sess.attended_after_session ? 'إلغاء حضور بعد الحصة' : 'تأكيد الحضور بعد الحصة (متأخر)'}
                                      >
                                        <Clock className="w-3 h-3" />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteSession(sess.id)}
                                        className="p-1 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white rounded transition-colors cursor-pointer"
                                        title="إزالة الحصة"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>

                                  </div>
                                ))}
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
          ) : (
            <div className="bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-3.5 my-auto min-h-[300px] flex flex-col justify-center items-center">
              <Eye className="w-10 h-10 text-slate-200" />
              <div>
                <p className="text-sm font-bold text-slate-500">تفاصيل الطالب المنخرط</p>
                <p className="text-xs text-slate-400 mt-1">حدد أي طالب من الجدول الجانبي لعرض كامل سجلات حضور حصصه، جدولة تواريخ جديدة يدوياً، أو تحديث حالته المدرسية.</p>
              </div>
            </div>
          )}
        </div>

      </div>
        </>
      )}

      {activeSubTab === 'student_portal_materials' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Sub-tab introduction banner */}
          <div className="bg-gradient-to-r from-navy to-navy-dark p-6 rounded-2xl border border-white/5 text-white shadow-md">
            <h3 className="text-base font-extrabold text-gold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              <span>إرساء وبث مواد المراجعة والتوجيه للطلاب</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              من هنا يستطيع الطاقم الإداري والأساتذة رفع صور السبورة والملخصات اليومية للدروس، تحميل الصوتيات التعليمية للتدريب والمراجعة، ونشر التنبيهات الرسمية لتصل مباشرة إلى حسابات الطلاب المسجلين بالبوابة.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            
            {/* 1. Daily Lessons Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-black text-navy flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-gold rounded-full"></span>
                    <span>1. صور الدروس وملخصات اليومية (Daily Lessons)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">تظهر في بوابة الطالب تحت قسم "الدروس والمراجعة" لتسهيل استذكار النقاط الأساسية.</p>
                </div>
                {lessons.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportLessons}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 self-start"
                    title="تصدير كشف الدروس"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير الدروس (Excel)</span>
                  </button>
                )}
              </div>

              {/* Create Lesson Form */}
              <form onSubmit={handleCreateLesson} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div className="md:col-span-4 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">عنوان الدرس أو الموضوع *</label>
                  <input 
                    type="text" 
                    placeholder="مثال: الدرس الأول: تفكيك وتجهيز المحرك"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">الدورة التعليمية المرتبطة *</label>
                  <select
                    value={lessonCourseId}
                    onChange={(e) => setLessonCourseId(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    <option value="">-- اختر الدورة --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-5 space-y-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[10px] font-bold text-slate-500">صورة السبورة/الملخص *</label>
                    <button
                      type="button"
                      onClick={() => setLessonImageFileMode(!lessonImageFileMode)}
                      className="text-[9px] font-bold text-gold-dark hover:underline cursor-pointer border-0 bg-transparent"
                    >
                      {lessonImageFileMode ? "تبديل لرابط مسبق (URL)" : "تحميل من وسائط الهاتف 📱"}
                    </button>
                  </div>
                  {lessonImageFileMode ? (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLessonImageUpload(e.target.files[0]);
                          }
                        }}
                        className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-gold/10 file:text-gold-dark hover:file:bg-gold/20 bg-white border border-slate-200 rounded-[8px] py-1.5 px-2"
                      />
                      {lessonImageUrl && lessonImageUrl.startsWith('data:') && (
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">جاهزة ✓</span>
                      )}
                    </div>
                  ) : (
                    <input 
                      type="url" 
                      placeholder="أو أدخل رابط صورة مسبق (https://...)"
                      value={lessonImageUrl}
                      onChange={(e) => setLessonImageUrl(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  )}
                </div>
                <div className="md:col-span-10 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">شرح موجز أو ملاحظة مرافقة للدرس *</label>
                  <input 
                    type="text" 
                    placeholder="اكتب توجيهات سريعة للطلاب حول ما تم تناوله في هذا الدرس..."
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-navy text-white hover:bg-[#112a4a] py-2 px-3 rounded-[8px] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-navy/10"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>إضافة الدرس</span>
                  </button>
                </div>
              </form>

              {/* Lessons Table List */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-right text-xs" style={{ direction: 'rtl' }}>
                  <thead>
                    <tr className="bg-slate-50/75 text-slate-500 border-b border-slate-100 font-bold">
                      <th className="p-3">الموضوع / العنوان</th>
                      <th className="p-3">الدورة</th>
                      <th className="p-3">صورة توضيحية</th>
                      <th className="p-3">ملاحظات مرافقة</th>
                      <th className="p-3">تاريخ النشر</th>
                      <th className="p-3 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lessons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">لا توجد دروس مرفوعة حتى الآن. أضف درساً أعلاه ليبدأ الطلاب بمراجعته.</td>
                      </tr>
                    ) : (
                      lessons.map((les) => (
                        <tr key={les.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-3 font-extrabold text-navy">{les.title}</td>
                          <td className="p-3">
                            <span className="bg-navy/5 text-navy px-2 py-1 rounded text-[10px] font-bold">
                              {les.course_name}
                            </span>
                          </td>
                          <td className="p-3">
                            <a href={les.image_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gold hover:underline font-bold text-[11px]">
                              <img src={les.image_url} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover border border-slate-200" />
                              <span>عرض كامل</span>
                            </a>
                          </td>
                          <td className="p-3 text-slate-550 max-w-xs truncate" title={les.description}>{les.description}</td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(les.created_at).toLocaleDateString('ar-DZ')}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteLesson(les.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* 2. Audio Files Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="text-sm font-black text-navy flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-gold rounded-full"></span>
                  <span>2. التسجيلات والصوتيات التعليمية (Audio Tracks)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">تسمح للطلاب بالاستماع للتوجيهات، التمارين الصوتية، أو شروحات مسموعة لدوراتهم.</p>
              </div>

              {/* Create Audio Form */}
              <form onSubmit={handleCreateAudio} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div className="md:col-span-4 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">اسم الملف الصوتي / الموضوع *</label>
                  <input 
                    type="text" 
                    placeholder="مثال: التدريب الصوتي المساعد لتفكيك المضخة"
                    value={audioTitle}
                    onChange={(e) => setAudioTitle(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">الدورة التعليمية المرتبطة *</label>
                  <select
                    value={audioCourseId}
                    onChange={(e) => setAudioCourseId(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    <option value="">-- اختر الدورة --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-5 space-y-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[10px] font-bold text-slate-500">طريقة إضافة الملف الصوتي *</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setAudioMethod('record'); setAudioUrlInput(''); }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer border ${audioMethod === 'record' ? 'bg-gold/15 text-gold-dark border-gold' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        تسجيل صوتي (Vocal) 🎤
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAudioMethod('upload'); setAudioUrlInput(''); }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer border ${audioMethod === 'upload' ? 'bg-gold/15 text-gold-dark border-gold' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        ملف من الهاتف 📱
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAudioMethod('url'); setAudioUrlInput(''); }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer border ${audioMethod === 'url' ? 'bg-gold/15 text-gold-dark border-gold' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        رابط (URL) 🔗
                      </button>
                    </div>
                  </div>

                  {audioMethod === 'record' && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-[8px] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">
                          {isRecording ? `جاري التسجيل... 🔴 (${recordingSeconds} ثانية)` : audioUrlInput ? 'جاهز للإضافة ✓' : 'اضغط لبدء تسجيل صوتك المباشر'}
                        </span>
                        {audioUrlInput && (
                          <button
                            type="button"
                            onClick={() => setAudioUrlInput('')}
                            className="text-[9px] text-rose-500 font-bold hover:underline border-0 bg-transparent cursor-pointer"
                          >
                            حذف التسجيل 🗑️
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={startAudioRecording}
                            className="flex-1 py-2 px-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Mic className="w-4 h-4 shrink-0" />
                            <span>تسجيل صوتي جديد</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={stopAudioRecording}
                              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                            >
                              <Square className="w-4 h-4 shrink-0 text-red-500" />
                              <span>إيقاف وحفظ</span>
                            </button>
                            <button
                              type="button"
                              onClick={cancelAudioRecording}
                              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs cursor-pointer border-0"
                            >
                              إلغاء
                            </button>
                          </>
                        )}
                      </div>

                      {audioUrlInput && (
                        <div className="mt-1 border-t border-slate-100 pt-2 [direction:ltr]">
                          <audio controls src={audioUrlInput} className="w-full h-8" />
                        </div>
                      )}
                    </div>
                  )}

                  {audioMethod === 'upload' && (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="audio/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = () => {
                              setAudioUrlInput(reader.result as string);
                              showToast('✓ تم إعداد وتحميل الملف الصوتي بنجاح!', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-gold/10 file:text-gold-dark hover:file:bg-gold/20 bg-white border border-slate-200 rounded-[8px] py-1.5 px-2"
                      />
                      {audioUrlInput && audioUrlInput.startsWith('data:') && (
                        <div className="mt-1.5 [direction:ltr]">
                          <audio controls src={audioUrlInput} className="w-full h-8" />
                        </div>
                      )}
                    </div>
                  )}

                  {audioMethod === 'url' && (
                    <input 
                      type="url" 
                      placeholder="أدخل رابط ملف صوتي (mp3, wav, etc.)"
                      value={audioUrlInput}
                      onChange={(e) => setAudioUrlInput(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  )}
                </div>
                <div className="md:col-span-10 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">وصف قصير مقتضب للصوتية</label>
                  <input 
                    type="text" 
                    placeholder="مثال: يرجى التدريب ومحاكاة الخطوات المذكورة بالصوتية بالتفصيل..."
                    value={audioDescription}
                    onChange={(e) => setAudioDescription(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-navy text-white hover:bg-[#112a4a] py-2 px-3 rounded-[8px] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-navy/10"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>إضافة الصوت</span>
                  </button>
                </div>
              </form>

              {/* Audio Table List */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-right text-xs" style={{ direction: 'rtl' }}>
                  <thead>
                    <tr className="bg-slate-50/75 text-slate-500 border-b border-slate-100 font-bold">
                      <th className="p-3">اسم الصوتية</th>
                      <th className="p-3">الدورة</th>
                      <th className="p-3">مشغل المعاينة</th>
                      <th className="p-3">ملاحظات مرافقة</th>
                      <th className="p-3">تاريخ النشر</th>
                      <th className="p-3 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {audioClips.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">لا توجد ملفات صوتية مرفوعة حتى الآن. أضف ملفاً صوتياً أعلاه لتسهيل مراجعة الطلاب.</td>
                      </tr>
                    ) : (
                      audioClips.map((aud) => (
                        <tr key={aud.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-3 font-extrabold text-navy">{aud.title}</td>
                          <td className="p-3">
                            <span className="bg-navy/5 text-navy px-2 py-1 rounded text-[10px] font-bold">
                              {aud.course_name}
                            </span>
                          </td>
                          <td className="p-3">
                            <audio src={aud.audio_url} controls className="h-8 max-w-[200px] rounded-lg bg-slate-100" />
                          </td>
                          <td className="p-3 text-slate-550 max-w-xs truncate" title={aud.description}>{aud.description || '-'}</td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(aud.created_at).toLocaleDateString('ar-DZ')}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteAudio(aud.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* 3. Admin Messages Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="text-sm font-black text-navy flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-gold rounded-full"></span>
                  <span>3. رسائل الإدارة والتعميمات (Board Notification Messages)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">تنبيهات إدارية رسمية تظهر بشكل بارز في أعلى لوحة تحكم الطالب لإخطاره بجديد التسجيلات أو الامتحانات.</p>
              </div>

              {/* Create Message Form */}
              <form onSubmit={handleCreateMessage} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div className="md:col-span-5 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">عنوان التنبيه أو الموضوع الرئيسي *</label>
                  <input 
                    type="text" 
                    placeholder="مثال: هام: تم تأجيل حصة الغد وتغيير التوقيت"
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">توجيه إلى دورة معينة (اختياري)</label>
                  <select
                    value={msgCourseId}
                    onChange={(e) => setMsgCourseId(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    <option value="">-- عام (كافة الطلاب) --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-12 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">محتوى الإعلان بالتفصيل *</label>
                  <textarea 
                    rows={2}
                    placeholder="اكتب التنبيه الإداري بالكامل هنا ومواعيد الامتحانات أو أي معلومات إضافية..."
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-[8px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div className="md:col-span-12 flex justify-end">
                  <button
                    type="submit"
                    className="bg-navy text-white hover:bg-[#112a4a] py-2 px-6 rounded-[8px] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-navy/10"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>نشر وتعميم التنبيه</span>
                  </button>
                </div>
              </form>

              {/* Messages Table List */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-right text-xs" style={{ direction: 'rtl' }}>
                  <thead>
                    <tr className="bg-slate-50/75 text-slate-500 border-b border-slate-100 font-bold">
                      <th className="p-3">عنوان التنبيه</th>
                      <th className="p-3">المستهدفون</th>
                      <th className="p-3">المحتوى بالتفصيل</th>
                      <th className="p-3">تاريخ النشر</th>
                      <th className="p-3 text-center">سحب الإعلان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {adminMessages.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">لا توجد تعميمات إدارية منشورة حتى الآن.</td>
                      </tr>
                    ) : (
                      adminMessages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-3 font-extrabold text-navy">{msg.title}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${msg.course_id ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {msg.course_id ? `طلاب: ${msg.course_name}` : 'عام لكافة الطلاب'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-550 max-w-sm whitespace-pre-line leading-relaxed">{msg.content}</td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(msg.created_at).toLocaleDateString('ar-DZ')}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>
      )}


      {/* ==============================================
          MODAL 1: REGISTER NEW STUDENT (تسجيل طالب جديد)
          ============================================== */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4 bg-navy/65 backdrop-blur-xs text-right">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-navy p-6 text-white flex items-center justify-between border-b border-navy-dark">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold" />
                <h3 className="text-sm sm:text-base font-black">تسجيل طالب جديد وإلحاقه بالدورة</h3>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStudent} className="p-6 space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">الاسم الكامل للطالب *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف عكاش"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>

                {/* Telephone */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">رقم الهاتف للاتصال *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="0550 12 34 56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[8px] text-xs text-right focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[8px] text-xs focus:outline-none"
                  />
                </div>

                {/* Select Course Assignment */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">الدورة التدريبية الأولى *</label>
                  <select
                    required
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="block w-full py-2.5 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-[8px] text-xs focus:outline-none"
                  >
                    <option value="">-- اختر الدورة --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Amount Paid */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">المبلغ المدفوع كقسط أول (دج) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="مثال: 4500"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : '')}
                    className="block w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[8px] text-xs focus:outline-none"
                  />
                </div>

                {/* Manual custom password */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">كلمة المرور للدخول</label>
                    <button
                      type="button"
                      onClick={() => setManualPassword(generateRandomPassword())}
                      className="text-[10px] text-gold font-bold hover:underline"
                    >
                      توليد كلمة مرور عشوائية آمنة
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="اتركها فارغة للتوليد آلياً تلقائياً"
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    className="block w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[8px] text-xs focus:outline-none"
                  />
                </div>

              </div>

              {/* Subscription details block */}
              <div className="bg-slate-50 border border-gold/20 rounded-xl p-4 space-y-4">
                <h4 className="font-extrabold text-[#112a4a] text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gold rounded-full inline-block"></span>
                  <span>تفاصيل وباقة الاشتراك المالي والبيداغوجي</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Select Registered Subscription Type */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#112a4a]">اختر نوع الاشتراك المعتمد بالمركز *</label>
                    <select
                      required
                      value={selectedSubTypeId}
                      onChange={(e) => setSelectedSubTypeId(e.target.value)}
                      className="block w-full py-2.5 px-3 bg-white border border-slate-250 rounded-[6px] text-xs focus:outline-none focus:ring-1 focus:ring-gold font-extrabold text-navy"
                    >
                      {subscriptionTypes.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.price} دج - {sub.duration_months === 1 ? 'شهر واحد' : `${sub.duration_months} أشهر`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subscription Price (Read-only) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500">سعر الاشتراك (دج) [تلقائي]</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`${subPrice} دج`}
                      className="block w-full py-2 px-3 bg-slate-100 border border-slate-200 rounded-[6px] text-xs text-slate-600 font-bold font-sans"
                    />
                  </div>

                  {/* Subscription Duration (Read-only) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500">مدة الاشتراك [تلقائي]</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={subDuration}
                      className="block w-full py-2 px-3 bg-slate-100 border border-slate-200 rounded-[6px] text-xs text-slate-600 font-bold"
                    />
                  </div>

                  {/* Subscription Sessions (Read-only) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500">الحصص المتاحة بالباقة [تلقائي]</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`${subSessions} حصص`}
                      className="block w-full py-2 px-3 bg-slate-100 border border-slate-200 rounded-[6px] text-xs text-slate-600 font-bold"
                    />
                  </div>

                  {/* Subscription End Date (Read-only) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500">تاريخ انتهاء الاشتراك [تلقائي]</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={subEndDate}
                      className="block w-full py-2 px-3 bg-slate-100 border border-slate-200 rounded-[6px] text-xs text-slate-600 font-bold font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold hover:bg-[#b49218] text-navy font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md"
                >
                  حفظ وتسجيل وإضافة
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* ==============================================
          MODAL 2: SUCCESS CREDENTIALS REVEAL (بطاقة الطالب)
          ============================================== */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-xs text-right">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-scale-up">
            
            <div className="bg-emerald-600 p-6 text-white text-center space-y-2">
              <Sparkles className="w-10 h-10 text-gold mx-auto animate-bounce" />
              <h3 className="font-black text-base text-white">تم إنشاء حساب الطالب بنجاح!</h3>
              <p className="text-[11px] text-slate-200">قم بنسخ هذه البيانات لمشاركتها فوراً مع الطالب</p>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="bg-slate-50 rounded-xl p-4.5 border border-slate-200 space-y-4">
                
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">رقم التعريف الخاص بالدخول</span>
                  <div className="flex items-center justify-between bg-white text-slate-800 font-mono font-bold text-sm border border-slate-200 rounded px-2.5 py-1.5 select-all">
                    <span>{newStudentCode}</span>
                    <button
                      onClick={() => handleCopyText(newStudentCode)}
                      className="text-slate-400 hover:text-gold transition-colors inline-flex align-middle"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">كلمة المرور المؤقتة</span>
                  <div className="flex items-center justify-between bg-white text-slate-800 font-mono font-bold text-sm border border-slate-200 rounded px-2.5 py-1.5 select-all">
                    <span>{newPassword}</span>
                    <button
                      onClick={() => handleCopyText(newPassword)}
                      className="text-slate-400 hover:text-gold transition-colors inline-flex align-middle"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Share triggers */}
              <button
                onClick={() => {
                  // Find name from row list
                  const studRow = studentsList.find(s => s.student_code === newStudentCode);
                  shareOnWhatsApp(newStudentCode, newPassword, studRow?.full_name || 'الطالب');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[8px] text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>إرسال البيانات فوراً عبر واتساب</span>
              </button>

              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setNewStudentCode('');
                  setNewPassword('');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-[8px] text-xs transition-colors cursor-pointer text-center"
              >
                إغلاق النافذة والعودة
              </button>

            </div>

          </div>
        </div>
      )}


      {/* ==============================================
          MODAL 3: RESET PASSWORD MODAL
          ============================================== */}
      {isResetModalOpen && studentToReset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/65 backdrop-blur-xs text-right">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden">
            
            <div className="bg-navy p-5 text-white flex items-center justify-between border-b border-navy-dark">
              <h3 className="text-sm font-bold">إعادة تعيين كلمة مرور الطالب</h3>
              <button onClick={() => { setIsResetModalOpen(false); setStudentToReset(null); }} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 font-bold">إصدار كلمة مرور جديدة ومحدثة لـ:</span>
                <p className="font-extrabold text-navy text-sm">{studentToReset.full_name} ({studentToReset.student_code})</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">كلمة المرور الجديدة المتولدة *</label>
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-sm rounded px-3 py-2">
                  <span>{newPassword}</span>
                  <button
                    onClick={() => handleCopyText(newPassword)}
                    className="text-slate-400 hover:text-gold transition-colors cursor-pointer inline-flex align-middle"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setIsResetModalOpen(false); setStudentToReset(null); }}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  onClick={handleSaveResetPassword}
                  className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded transition-colors cursor-pointer shadow"
                >
                  تأكيد الحفظ والتعديل
                </button>
              </div>

            </div>

          </div>
        </div>
      )}


      {/* ==============================================
          MODAL 4: ADD ADDITIONAL ENROLLMENT (إلتحاق بمسار إضافي)
          ============================================== */}
      {isAddCourseOpen && studentToAddCourse && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/65 backdrop-blur-xs text-right">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            
            <div className="bg-navy p-5 text-white flex items-center justify-between border-b border-navy-dark">
              <h3 className="text-sm font-bold font-sans">إدراج وإلحاق الطالب بدورة إضافية</h3>
              <button onClick={() => { setIsAddCourseOpen(false); setStudentToAddCourse(null); }} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveAddCourse} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block font-sans">تسجيل اشتراك إضافي للطالب:</span>
                <p className="font-extrabold text-navy text-sm font-sans">{studentToAddCourse.full_name} ({studentToAddCourse.student_code})</p>
              </div>

              {/* Select Course */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 font-sans">اختر الدورة الإضافية *</label>
                <select
                  required
                  value={addCourseId}
                  onChange={(e) => setAddCourseId(e.target.value)}
                  className="block w-full py-2 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none"
                >
                  <option value="">-- اختر الدورة --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Paid */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 font-sans">المبلغ المدفوع لهذه الدورة (دج) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="مثال: 4500"
                  value={addAmountPaid}
                  onChange={(e) => setAddAmountPaid(e.target.value ? Number(e.target.value) : '')}
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none"
                />
              </div>

              {/* Subscription details block */}
              <div className="bg-slate-50 border border-gold/20 rounded-xl p-3.5 space-y-3">
                <h4 className="font-extrabold text-[#112a4a] text-xs flex items-center gap-1 font-sans">
                  <span className="w-1.5 h-1.5 bg-gold rounded-full inline-block"></span>
                  <span>تفاصيل وباقة الاشتراك المالي والبيداغوجي</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Select Registered Subscription Type */}
                  <div className="space-y-1 col-span-2">
                    <label className="block text-[10px] font-bold text-[#112a4a] font-sans">اختر نوع الاشتراك المعتمد بالمركز *</label>
                    <select
                      required
                      value={selectedAddSubTypeId}
                      onChange={(e) => setSelectedAddSubTypeId(e.target.value)}
                      className="block w-full py-2 px-2.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gold font-extrabold text-navy"
                    >
                      {subscriptionTypes.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.price} دج - {sub.duration_months === 1 ? 'شهر واحد' : `${sub.duration_months} أشهر`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subscription Price (Read-only) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 font-sans">السعر (دج) [تلقائي]</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`${addSubPrice} دج`}
                      className="block w-full py-1.5 px-2 bg-slate-100 border border-slate-200 rounded text-xs font-sans text-slate-600 font-bold"
                    />
                  </div>

                  {/* Subscription Duration (Read-only) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 font-sans">المدة [تلقائي]</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={addSubDuration}
                      className="block w-full py-1.5 px-2 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 font-bold"
                    />
                  </div>

                  {/* Subscription Sessions (Read-only) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 font-sans">عدد الحصص [تلقائي]</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`${addSubSessions} حصص`}
                      className="block w-full py-1.5 px-2 bg-slate-100 border border-slate-200 rounded text-xs font-sans text-slate-600 font-bold"
                    />
                  </div>

                  {/* Subscription End Date (Read-only) */}
                  <div className="space-y-1 col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 font-sans">تاريخ الانتهاء [تلقائي]</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={addSubEndDate}
                      className="block w-full py-1.5 px-2 bg-slate-100 border border-slate-200 rounded text-xs font-sans text-slate-600 font-bold font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => { setIsAddCourseOpen(false); setStudentToAddCourse(null); }}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-gold hover:bg-[#b49218] text-navy font-bold text-xs rounded transition-colors cursor-pointer shadow"
                >
                  شراء الدورة وتسجيل الكود
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* ==============================================
          MODAL 5: DELETE CONFIRMATION DIALOG 
          ============================================== */}
      {isConfirmDeleteOpen && studentToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/65 backdrop-blur-xs text-right">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden">
            
            <div className="p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-black text-navy text-base">هل أنت متأكد من رغبتك في حذف هذا الطالب؟</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  سيؤدي هذا الإجراء لحذف ملف الطالب <strong className="text-slate-800">{studentToDelete.full_name}</strong> بالكامل وتلقائياً، بما في ذلك جميع اشتراكاته، وتواريخ الحضور والغياب المقترنة به. لا يمكن التراجع عن هذا الإجراء!
                </p>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => { setIsConfirmDeleteOpen(false); setStudentToDelete(null); }}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition-colors cursor-pointer font-sans"
                >
                  إلغاء، العودة للخلف
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded transition-colors cursor-pointer shadow font-sans"
                >
                  تأكيد الحذف كلياً
                </button>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ==============================================
          MODAL 6: BATCH SCHEDULE COURSE SESSION (جدولة حصة للدورة ككل)
          ============================================== */}
      {isBatchScheduleOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4 bg-navy/65 backdrop-blur-xs text-right">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#112a4a] p-5 text-white flex items-center justify-between border-b border-navy-dark">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                <h3 className="text-sm sm:text-base font-black">جدولة حصة جديدة وإخطار الطلاب</h3>
              </div>
              <button
                onClick={() => setIsBatchScheduleOpen(false)}
                className="text-slate-450 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBatchSchedule} className="p-6 space-y-5">
              
              {/* Select target Course */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">اختر الدورة التدريبية المستهدفة *</label>
                <select
                  required
                  value={batchCourseId}
                  onChange={(e) => setBatchCourseId(e.target.value)}
                  className="block w-full py-2.5 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="">-- اختر الدورة التدريبية --</option>
                  {courses.map(c => {
                    const count = enrollmentsList.filter(env => env.course_id === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({count} طالب مسجل)
                      </option>
                    );
                  })}
                </select>
                {batchCourseId && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    ✓ سيتم جدولة هذه الحصة لـ {enrollmentsList.filter(env => env.course_id === batchCourseId).length} طالب مسجل بالدورة حالياً.
                  </p>
                )}
              </div>

              {/* Input Date */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">تاريخ ووقت الحصة الجديدة المجدولة *</label>
                <input
                  type="date"
                  required
                  value={batchSessionDate}
                  onChange={(e) => setBatchSessionDate(e.target.value)}
                  className="block w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              {/* Notification Channel */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">وسيلة إرسال الإشعار والتذكير *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNotificationChannel('whatsapp')}
                    className={`py-2 px-3 border rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                      notificationChannel === 'whatsapp'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400 ring-2 ring-emerald-400/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>الواتساب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotificationChannel('sms')}
                    className={`py-2 px-3 border rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                      notificationChannel === 'sms'
                        ? 'bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-400/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>رسالة SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotificationChannel('system')}
                    className={`py-2 px-3 border rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                      notificationChannel === 'system'
                        ? 'bg-amber-50 text-amber-700 border-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>لوحة الطلاب</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  سيتم تسجيل الحصة في سجل حضور الطلاب رسمياً مع إرسال إشعار تذكيري فوري للطلاب المسجلين.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchScheduleOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold hover:bg-[#b49218] text-navy font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md"
                >
                  حفظ الحصة وبث الإشعارات
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* ==============================================
          MODAL 7: BATCH SCHEDULE SUCCESS RENDER (تمت الجدولة بنجاح)
          ============================================== */}
      {isBatchSuccessOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-xs text-right">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            
            <div className="bg-[#112a4a] p-6 text-white text-center space-y-2 relative">
              <div className="absolute top-0 right-0 left-0 h-[4px] bg-gold" />
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-white">تمت جدولة الحصة وبث الإشعار بنجاح!</h3>
              <p className="text-[11px] text-slate-350">أكاديمية ناجي المعتمدة بسيدي بلعباس</p>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Statistical Metrics Block */}
              <div className="bg-slate-50 rounded-xl p-4.5 border border-slate-200 space-y-3.5 text-xs font-sans">
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                  <span className="text-slate-400 font-bold">الدورة التدريبية:</span>
                  <span className="font-extrabold text-navy text-left truncate max-w-[200px]" title={batchNotifiedCourseName}>
                    {batchNotifiedCourseName}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                  <span className="text-slate-400 font-bold">تاريخ وساعة حضور المجدول:</span>
                  <span className="font-bold text-slate-700 tracking-wide font-mono">{batchSessionDate}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                  <span className="text-slate-400 font-bold">عدد الطلاب الذين تم إضافتهم:</span>
                  <span className="font-extrabold text-emerald-600 font-mono text-sm">{batchNotifiedCount} طالب نشط</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">حالة إرسال التذكيرات:</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>تم الإرسال والربط بنجاح</span>
                  </span>
                </div>

              </div>

              {/* Template Text copy for WhatsApp bulk message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">نص الإعلان الجماعي الموصى به:</span>
                  <button
                    onClick={() => handleCopyText(`تذكير بحضور حصة قادمة! 📢 
السلام عليكم طلابنا الكرام في دورة: ${batchNotifiedCourseName}.
نود إعلامكم ببرمجة حصة تعليمية جديدة ومثمرة حضورياً بالأكاديمية يوم: ${batchSessionDate}.

نرجو من الجميع الالتزام بالحضور وتأكيد حضوركم مسبقاً عبر لوحة الطالب الخاصة بكم بساحة الأكاديمية:
https://naji-academy.pages.dev/student-portal

أكاديمية ناجي - شريك نجاحكم اللغوي والمهني 🌟`)}
                    className="text-[10px] text-gold font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>نسخ نص التذكير للمجموعة</span>
                  </button>
                </div>

                <div className="bg-slate-100 p-3.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 leading-relaxed font-sans text-right select-all max-h-[140px] overflow-y-auto">
                  تذكير بحضور حصة قادمة! 📢 <br />
                  السلام عليكم طلابنا الكرام في دورة: <strong>{batchNotifiedCourseName}</strong>.<br />
                  نود إعلامكم ببرمجة حصة تعليمية جديدة ومثمرة حضورياً بالأكاديمية يوم: {batchSessionDate || 'اليوم'}.<br /><br />
                  نرجو من الجميع الالتزام بالحضور وتأكيد حضوركم مسبقاً عبر لوحة الطالب الخاصة بكم بساحة الأكاديمية:<br />
                  <span className="text-navy underline">https://naji-academy.pages.dev/student-portal</span>
                </div>
              </div>

              {/* Action Close buttons */}
              <button
                onClick={() => {
                  setIsBatchSuccessOpen(false);
                  setBatchNotifiedCount(0);
                  setBatchNotifiedCourseName('');
                }}
                className="w-full py-2.5 bg-navy hover:bg-[#112a4a] text-white font-bold rounded-[8px] text-xs transition-colors cursor-pointer text-center"
              >
                تم، إغلاق والعودة
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ==============================================
          MODAL 8: RESET / ZERO OUT PROFITS & ACTIVE SUBSCRIPTIONS
          ============================================== */}
      {isResetZeroModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-xs text-right" style={{ direction: 'rtl' }}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            
            <div className="bg-rose-950 p-6 text-white text-center space-y-2 relative">
              <div className="absolute top-0 right-0 left-0 h-[4px] bg-rose-500" />
              <div className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                <AlertCircle className="w-6 h-6 text-rose-300" />
              </div>
              <h3 className="font-black text-base text-white">تصفير الأرباح والاشتراكات الفعالة</h3>
              <p className="text-[11px] text-rose-200">تحذير: هذا الإجراء حساس ولا يمكن التراجع عنه!</p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك في تصفير الأرباح الإجمالية وإلغاء كافة الاشتراكات الفعالة؟ 
                هذا الإجراء سيقوم بحذف جميع سجلات الانخراط بالكامل، وتصفير عداد الطلاب المسجلين بالدورات، وإزالة سجلات الحضور والغياب المرتبطة بها.
              </p>

              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-rose-700 font-bold block">لتأكيد العملية الحساسة:</span>
                <p className="text-[11px] text-slate-500">يرجى كتابة كلمة <strong className="text-rose-600">تصفير</strong> في الحقل أدناه للتحقق الأمني:</p>
                <input
                  type="text"
                  value={resetConfirmWord}
                  onChange={(e) => setResetConfirmWord(e.target.value)}
                  placeholder="اكتب تصفير هنا"
                  className="w-full mt-2 p-2 bg-white border border-rose-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  disabled={isResetting || resetConfirmWord !== 'تصفير'}
                  onClick={handleResetZeroAll}
                  className={`flex-1 py-2.5 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isResetting || resetConfirmWord !== 'تصفير'
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/15'
                  }`}
                >
                  {isResetting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>جاري التصفير...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>تأكيد تصفير البيانات الآن</span>
                    </>
                  )}
                </button>

                <button
                  disabled={isResetting}
                  onClick={() => {
                    setIsResetZeroModalOpen(false);
                    setResetConfirmWord('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL 9: EDIT ADMIN STATISTICS OVERRIDES
          ============================================== */}
      {isStatsEditModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-xs text-right" style={{ direction: 'rtl' }}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden font-sans">
            
            <div className="bg-[#12386a] p-5 text-white text-center space-y-2 relative">
              <div className="absolute top-0 right-0 left-0 h-[4px] bg-gold" />
              <h3 className="font-black text-sm text-white">تعديل قيم الإحصائيات الفورية</h3>
              <p className="text-[10px] text-slate-200">تخصيص أو استبدال الأرقام المعروضة في لوحة تحكم الإدارة بقيم يدوية محددة.</p>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-lg text-amber-900 leading-normal text-[11px]">
                💡 اترك الحقول فارغة للرجوع للحساب التلقائي والفعلي للبيانات مباشرة من قاعدة البيانات.
              </div>

              {/* Input 1: Students */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">عدد الطلاب النشطين الافتراضي:</label>
                <input
                  type="number"
                  value={adminStatsStudentsOverride}
                  onChange={(e) => setAdminStatsStudentsOverride(e.target.value)}
                  placeholder={`تلقائي (${studentsList.length})`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white text-xs"
                />
              </div>

              {/* Input 2: Enrollments */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">عدد الاشتراكات الفعالة الافتراضي:</label>
                <input
                  type="number"
                  value={adminStatsEnrollmentsOverride}
                  onChange={(e) => setAdminStatsEnrollmentsOverride(e.target.value)}
                  placeholder={`تلقائي (${enrollmentsList.length})`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white text-xs"
                />
              </div>

              {/* Input 3: Attendance */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">عدد الحصص المجدولة كلياً الافتراضي:</label>
                <input
                  type="number"
                  value={adminStatsAttendanceOverride}
                  onChange={(e) => setAdminStatsAttendanceOverride(e.target.value)}
                  placeholder={`تلقائي (${attendanceList.length})`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white text-xs"
                />
              </div>

              {/* Input 4: Earnings */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">إجمالي الأقساط دج الافتراضي:</label>
                <input
                  type="number"
                  value={adminStatsEarningsOverride}
                  onChange={(e) => setAdminStatsEarningsOverride(e.target.value)}
                  placeholder={`تلقائي (${enrollmentsList.reduce((sum, e) => sum + e.amount_paid, 0)})`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveStatsOverrides}
                  className="flex-1 py-2.5 bg-[#12386a] hover:bg-navy-dark text-gold font-bold rounded-lg cursor-pointer transition-all text-xs"
                >
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => setIsStatsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-all text-xs"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
