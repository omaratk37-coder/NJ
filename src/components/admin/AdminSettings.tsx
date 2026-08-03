import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { AdminUser, Teacher, SubscriptionType } from '../../types';
import { Settings, ShieldAlert, Heart, Save, Plus, Trash2, Mail, Lock, Phone, User, Check, Bell, ToggleRight, ToggleLeft, Sparkles, Edit, Eye, Compass, Star, ChevronLeft, Award, BookOpen, Upload, Coins, CheckCircle, Download } from 'lucide-react';
import { showToast } from '../Toast';
import { exportToCSV, ExportColumn } from '../../lib/exportUtils';

interface AdminSettingsProps {
  currentUser: AdminUser;
}

export default function AdminSettings({ currentUser }: AdminSettingsProps) {
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings sub tabs
  const [settingsTab, setSettingsTab] = useState<'general' | 'languages' | 'about_content' | 'teachers' | 'subscriptions'>('general');

  // General site contact states
  const [academyName, setAcademyName] = useState('NAJI ACADEMY');
  const [phone1, setPhone1] = useState('+213 43 27 18 19');
  const [phone2, setPhone2] = useState('+213 550 12 34 56');
  const [email, setEmail] = useState('contact@najiacademy.dz');
  const [address, setAddress] = useState('شارع بومدين، قرب ساحة أول نوفمبر، وسط مدينة سيدي بلعباس، الجزائر');
  const [workingHours, setWorkingHours] = useState('السبت للخميس: من 09:00 صباحاً وحتى 19:00 مساءً');
  const [mapUrl, setMapUrl] = useState('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.4735515324317!2d-1.317585!3d34.88214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDUyJzU1LjciTiAxwrAxOScwMy4zIlc!5e0!3m2!1sar!2sdz!4v1234567890123');
  
  // Social links states
  const [facebook, setFacebook] = useState('naji.academy.sidibelabbes');
  const [instagram, setInstagram] = useState('najiacademy_sidibelabbes');
  const [youtube, setYoutube] = useState('@najiacademy');
  const [tiktok, setTiktok] = useState('@najiacademy.dz');

  // Custom static content states
  const [aboutHeroTitle, setAboutHeroTitle] = useState('نبذة عن الأكاديمية');
  const [aboutHeroSubtitle, setAboutHeroSubtitle] = useState('قصتنا، مبادئنا، ونخبة الكفاءات القائمة على رعاية وتكوين أجيال المستقبل بسيدي بلعباس.');
  const [aboutStoryBadge, setAboutStoryBadge] = useState('تأسست بدوافع وطنية وعلمية');
  const [aboutStoryTitle, setAboutStoryTitle] = useState('قصّة التأسيس والرسالة التربوية');
  const [aboutStoryP1, setAboutStoryP1] = useState('انطلقت أكاديمية ناجي لتمكين اللغات والمهارات بمدينة سيدي بلعباس البهية، الجزائر، من منطلق وعينا التام بضرورة كسر الحواجز الكلاسيكية التي تشوب برامج تدريس اللغات والعلوم المهارية المعاصرة.');
  const [aboutStoryP2, setAboutStoryP2] = useState('رأينا ندرة في المقرات التي توفر للطالب الجزائري بيئة تفاعلية تطبيقية حية تؤهله مباشرة لسوق العمل أو لإجراء الدراسات والامتحانات الفيدرالية بفرنسا وإسبانيا والدول الناطقة بالإنجليزية بثقة وفصاحة، فأسسنا هذا الصرح ليكون منارة للتطوير الفعلي للذات وبأفضل تكلفة ممكنة.');
  const [aboutVisionText, setAboutVisionText] = useState('أن نصبح الخيار التدريبي الأول والمعياري المفضل للأسر والمهنيين على مستوى الغرب الجزائري لتعليم اللغات الحية.');
  const [aboutMissionText, setAboutMissionText] = useState('توفير رعاية تكوينية وتوجيهية متطورة لكل طالب عبر قاعات حديثة ومناهج دراسية تفاعلية حية تخاطب عقله ونبوغه.');
  const [homeHeroTitle, setHomeHeroTitle] = useState('تعلّم اللغات الأجنبية وطوّر مهاراتك الفعالة');
  const [homeHeroSubtitle, setHomeHeroSubtitle] = useState('انضم إلى أكاديمية ناجي لتمكين اللغات بمقرها الشارح بسيدي بلعباس، واحصل على تكوينات تفاعلية حية تمنحك الثقة للتميز المهني والأكاديمي.');

  // Landing page stats states
  const [statsStudentsCount, setStatsStudentsCount] = useState('540');
  const [statsStudentsLabel, setStatsStudentsLabel] = useState('طالب متخرج ودخل سوق العمل');
  const [statsActiveCourses, setStatsActiveCourses] = useState('04');
  const [statsActiveCoursesLabel, setStatsActiveCoursesLabel] = useState('دورات رئيسية نشطة بالتعاقد');
  const [statsOverallRating, setStatsOverallRating] = useState('4.9');
  const [statsOverallRatingLabel, setStatsOverallRatingLabel] = useState('تقييم الأكاديمية العام من الطلاب');

  // Teachers (الهيئة التعليمية) states
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherRole, setTeacherRole] = useState('');
  const [teacherExp, setTeacherExp] = useState('');
  const [teacherAvatar, setTeacherAvatar] = useState('');
  const [teacherBranchId, setTeacherBranchId] = useState('');
  const [teacherIsOfTheMonth, setTeacherIsOfTheMonth] = useState(false);
  const [teacherMonthText, setTeacherMonthText] = useState('');
  const [teacherUploadMode, setTeacherUploadMode] = useState<'upload' | 'url'>('upload');
  const [teacherDragging, setTeacherDragging] = useState(false);

  const handleTeacherFileConvert = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح فقط للأستاذ', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('حجم الصورة كبير نسبيًا، يفضل اختيار صورة أصغر من 2MB للحفاظ على سرعة تحميل ممتازة للزوار.', 'warning');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setTeacherAvatar(result);
    };
    reader.onerror = () => {
      showToast('خطأ أثناء قراءة ملف الصورة الشخصية', 'error');
    };
    reader.readAsDataURL(file);
  };

  // New admin form input
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'superadmin' | 'manager' | 'teacher'>('manager');

  // Editing admin member
  const [editingMember, setEditingMember] = useState<AdminUser | null>(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [editAdminRole, setEditAdminRole] = useState<'superadmin' | 'manager' | 'teacher'>('manager');

  // Subscription types states
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [editingSubType, setEditingSubType] = useState<SubscriptionType | null>(null);
  const [newSubTypeName, setNewSubTypeName] = useState('');
  const [newSubTypePrice, setNewSubTypePrice] = useState(4000);
  const [newSubTypeDuration, setNewSubTypeDuration] = useState(1);
  const [editSubTypeName, setEditSubTypeName] = useState('');
  const [editSubTypePrice, setEditSubTypePrice] = useState(0);
  const [editSubTypeDuration, setEditSubTypeDuration] = useState(1);

  // Switch options togglers
  const [notifNewBooking, setNotifNewBooking] = useState(true);
  const [notifNewReview, setNotifNewReview] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  // Custom branches/languages/departments lists
  const [customLanguages, setCustomLanguages] = useState<{ id: string; name: string }[]>([]);
  const [newLanguageName, setNewLanguageName] = useState('');

  // Load team users from simulator
  const fetchTeam = async () => {
    try {
      const res = await db.auth.listAdmins();
      setTeam(res);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await db.teachers.list();
      setTeachers(res || []);
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const data = await db.settings.get();
      if (data) {
        setAcademyName(data.academy_name || 'NAJI ACADEMY');
        // If phone contains / split them, otherwise set defaults
        if (data.phone && data.phone.includes('/')) {
          const parts = data.phone.split('/');
          setPhone1(parts[0].trim());
          setPhone2(parts[1].trim());
        } else {
          setPhone1(data.phone || '+213 43 27 18 19');
          setPhone2(data.whatsapp || '+213 550 12 34 56');
        }
        setEmail(data.email || 'contact@najiacademy.dz');
        setAddress(data.address || 'شارع بومدين، قرب ساحة أول نوفمبر، وسط مدينة سيدي بلعباس، الجزائر');
        setWorkingHours(data.working_hours || 'السبت للخميس: من 09:00 صباحاً وحتى 19:00 مساءً');
        setMapUrl(data.map_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.4735515324317!2d-1.317585!3d34.88214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDUyJzU1LjciTiAxwrAxOScwMy4zIlc!5e0!3m2!1sar!2sdz!4v1234567890123');
        setFacebook(data.facebook || 'naji.academy.sidibelabbes');
        setInstagram(data.instagram || 'najiacademy_sidibelabbes');
        setYoutube(data.youtube || '@najiacademy');
        setTiktok(data.tiktok || '@najiacademy.dz');
        setNotifNewBooking(data.notify_by_email_new_booking === 'true');
        setNotifNewReview(data.notify_by_email_new_review === 'true');
        setWhatsappAlerts(data.whatsapp_alerts === 'true');

        // Dynamic page content text fields
        setAboutHeroTitle(data.about_hero_title || 'نبذة عن الأكاديمية');
        setAboutHeroSubtitle(data.about_hero_subtitle || 'قصتنا، مبادئنا، ونخبة الكفاءات القائمة على رعاية وتكوين أجيال المستقبل بسيدي بلعباس.');
        setAboutStoryBadge(data.about_story_badge || 'تأسست بدوافع وطنية وعلمية');
        setAboutStoryTitle(data.about_story_title || 'قصّة التأسيس والرسالة التربوية');
        setAboutStoryP1(data.about_story_p1 || 'انطلقت أكاديمية ناجي لتمكين اللغات والمهارات بمدينة سيدي بلعباس البهية، الجزائر، من منطلق وعينا التام بضرورة كسر الحواجز الكلاسيكية التي تشوب برامج تدريس اللغات والعلوم المهارية المعاصرة.');
        setAboutStoryP2(data.about_story_p2 || 'رأينا ندرة في المقرات التي توفر للطالب الجزائري بيئة تفاعلية تطبيقية حية تؤهله مباشرة لسوق العمل أو لإجراء الدراسات والامتحانات الفيدرالية بفرنسا وإسبانيا والدول الناطقة بالإنجليزية بثقة وفصاحة، فأسسنا هذا الصرح ليكون منارة للتطوير الفعلي للذات وبأفضل تكلفة ممكنة.');
        setAboutVisionText(data.about_vision_text || 'أن نصبح الخيار التدريبي الأول والمعياري المفضل للأسر والمهنيين على مستوى الغرب الجزائري لتعليم اللغات الحية.');
        setAboutMissionText(data.about_mission_text || 'توفير رعاية تكوينية وتوجيهية متطورة لكل طالب عبر قاعات حديثة ومناهج دراسية تفاعلية حية تخاطب عقله ونبوغه.');
        setHomeHeroTitle(data.home_hero_title || 'تعلّم اللغات الأجنبية وطوّر مهاراتك الفعالة');
        setHomeHeroSubtitle(data.home_hero_subtitle || 'انضم إلى أكاديمية ناجي لتمكين اللغات بمقرها الشارح بسيدي بلعباس، واحصل على تكوينات تفاعلية حية تمنحك الثقة للتميز المهني والأكاديمي.');

        setStatsStudentsCount(data.stats_students_count || '540');
        setStatsStudentsLabel(data.stats_students_label || 'طالب متخرج ودخل سوق العمل');
        setStatsActiveCourses(data.stats_active_courses || '04');
        setStatsActiveCoursesLabel(data.stats_active_courses_label || 'دورات رئيسية نشطة بالتعاقد');
        setStatsOverallRating(data.stats_overall_rating || '4.9');
        setStatsOverallRatingLabel(data.stats_overall_rating_label || 'تقييم الأكاديمية العام من الطلاب');

        const langsStr = data.custom_languages || JSON.stringify([
          { id: 'French', name: 'الفرنسية' },
          { id: 'English', name: 'الإنجليزية' },
          { id: 'Spanish', name: 'الإسبانية' },
          { id: 'Skills', name: 'مهارات مهنية' }
        ]);
        try {
          setCustomLanguages(JSON.parse(langsStr));
        } catch {}
      }
    } catch {}
  };

  useEffect(() => {
    fetchTeam();
    fetchSettings();
    fetchTeachers();
    fetchSubscriptionTypes();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_site_settings') {
        fetchSettings();
      }
      if (key === 'naji_teachers') {
        fetchTeachers();
      }
      if (key === 'naji_subscription_types') {
        fetchSubscriptionTypes();
      }
    });
    return () => unsubscribe();
  }, []);

  // Block settings view for non superadmins as required
  if (currentUser.role !== 'superadmin') {
    return (
      <div className="p-12 text-center text-slate-400 font-sans space-y-3" style={{ direction: 'rtl' }}>
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-navy">عفواً، هذه الصفحة مخصصة لطلب رتب الأدمن الرئيسي فقط</h3>
        <p className="text-xs max-w-sm mx-auto leading-relaxed">
          يتطلب تعديل إعدادات الاتصال والهاتف وصلاحيات المنسقين رتبة <code className="bg-slate-100 p-0.5 rounded font-mono font-bold text-rose-600">superadmin</code>. يرجى مراجعة إداري النظام بسيدي بلعباس.
        </p>
      </div>
    );
  }

  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.settings.update({
        academy_name: academyName.trim(),
        phone: `${phone1.trim()} / ${phone2.trim()}`,
        whatsapp: phone2.trim(),
        email: email.trim(),
        address: address.trim(),
        working_hours: workingHours.trim(),
        map_url: mapUrl.trim(),
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        youtube: youtube.trim(),
        tiktok: tiktok.trim()
      });
      await db.logs.create({
        action: 'تحديث بيانات الاتصال والمقر',
        details: `تم تحديث الإعدادات العامة وقنوات التواصل للأكاديمية بواسطة ${currentUser.name}`,
        admin_name: currentUser.name,
        admin_role: currentUser.role
      });
      showToast('✓ تم تحديث وحفظ بيانات المقر ونقاط التثبيت في سيدي بلعباس بنجاح!', 'success');
    } catch {
      showToast('تعذر حفظ بيانات الاتصال والمقر', 'error');
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.settings.update({
        notify_by_email_new_booking: notifNewBooking ? 'true' : 'false',
        notify_by_email_new_review: notifNewReview ? 'true' : 'false',
        whatsapp_alerts: whatsappAlerts ? 'true' : 'false'
      });
      await db.logs.create({
        action: 'تحديث تنبيهات النظام',
        details: `تم تعديل خيارات التنبيهات (بريد حجز جديد: ${notifNewBooking ? 'نشط' : 'ملغى'}، مراجعة جديدة: ${notifNewReview ? 'نشط' : 'ملغى'}، تنبيهات واتساب: ${whatsappAlerts ? 'نشط' : 'ملغى'})`,
        admin_name: currentUser.name,
        admin_role: currentUser.role
      });
      showToast('✓ تم تمكين وضبط إعدادات التنبيه التلقائي بنجاح ومزامنتها!', 'success');
    } catch {
      showToast('خطأ أثناء تحديث إعدادات التنبيهات', 'error');
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      showToast('الرجاء تعبئة كل حقول العضو الجديد لمنحه التصريح', 'warning');
      return;
    }

    try {
      await db.auth.createAdmin({
        name: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword.trim(),
        role: newAdminRole
      });

      await db.logs.create({
        action: 'إضافة عضو طاقم جديد',
        details: `تم إنشاء حساب إداري جديد لـ: ${newAdminName.trim()} برتبة: ${newAdminRole === 'superadmin' ? 'مدير عام رئيسي' : newAdminRole === 'manager' ? 'منسق تسويق ومقاعد' : 'أستاذ منسق'}`,
        admin_name: currentUser.name,
        admin_role: currentUser.role
      });

      showToast(`✓ تم منح ومصادقة الحساب الجديد لـ ${newAdminName} بنجاح!`, 'success');
      // Reset
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchTeam();
    } catch (err: any) {
      showToast(err.message || 'تعذر تسجيل عضو الطاقم', 'error');
    }
  };

  const handleStartEditMember = (member: AdminUser) => {
    setEditingMember(member);
    setEditAdminName(member.name);
    setEditAdminEmail(member.email);
    setEditAdminPassword(member.password || '');
    setEditAdminRole(member.role);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editAdminName.trim() || !editAdminEmail.trim()) {
      showToast('الرجاء تعبئة الاسم والبريد لعضو الطاقم', 'warning');
      return;
    }

    try {
      const updates: Partial<AdminUser> = {
        name: editAdminName.trim(),
        email: editAdminEmail.trim().toLowerCase(),
        role: editAdminRole,
      };
      if (editAdminPassword.trim()) {
        updates.password = editAdminPassword.trim();
      }

      await db.auth.updateAdmin(editingMember.id, updates);

      await db.logs.create({
        action: 'تعديل بيانات عضو طاقم',
        details: `تم تعديل حساب عضو الطاقم: ${editingMember.name} إلى الاسم الجديد: ${editAdminName.trim()} والرتبة: ${editAdminRole}`,
        admin_name: currentUser.name,
        admin_role: currentUser.role
      });

      showToast('✓ تم تحديث بيانات عضو الطاقم بنجاح!', 'success');
      setEditingMember(null);
      fetchTeam();
    } catch (err: any) {
      showToast(err.message || 'تعذر تعديل بيانات عضو الطاقم', 'error');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (id === currentUser.id) {
      showToast('لا يمكنك حذف حسابك الجاري الذي تسجل به الدخول حالياً!', 'error');
      return;
    }
    if (!window.confirm('هل أنت متأكد من تدمير وإخلاء هذا الحساب الإداري نهائياً ومنع صاحبه من التسجيل؟')) return;

    try {
      await db.auth.deleteAdmin(id);
      await db.logs.create({
        action: 'حذف عضو طاقم',
        details: `تم إلغاء صلاحيات وحذف حساب عضو الطاقم ذو المعرف: ${id}`,
        admin_name: currentUser.name,
        admin_role: currentUser.role
      });
      showToast('✓ تم إعفاء وإدراج إخلاء الحساب من قواعد الخوادم!', 'success');
      fetchTeam();
    } catch (err: any) {
      showToast(err.message || 'فشل الحذف', 'error');
    }
  };

  const fetchSubscriptionTypes = async () => {
    try {
      const list = await db.subscriptionTypes.list();
      setSubscriptionTypes(list || []);
    } catch {}
  };

  const handleCreateSubscriptionType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTypeName.trim() || newSubTypePrice <= 0 || newSubTypeDuration <= 0) {
      showToast('يرجى ملء جميع الحقول بقيم صحيحة', 'warning');
      return;
    }
    try {
      await db.subscriptionTypes.create({
        name: newSubTypeName.trim(),
        price: Number(newSubTypePrice),
        duration_months: Number(newSubTypeDuration)
      });
      showToast('✓ تم إضافة نوع الاشتراك الجديد بنجاح!', 'success');
      setNewSubTypeName('');
      setNewSubTypePrice(4000);
      setNewSubTypeDuration(1);
      fetchSubscriptionTypes();
    } catch (err: any) {
      showToast(err.message || 'تعذر إضافة نوع الاشتراك', 'error');
    }
  };

  const handleStartEditSubType = (sub: SubscriptionType) => {
    setEditingSubType(sub);
    setEditSubTypeName(sub.name);
    setEditSubTypePrice(sub.price);
    setEditSubTypeDuration(sub.duration_months);
  };

  const handleUpdateSubscriptionType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubType) return;
    if (!editSubTypeName.trim() || editSubTypePrice <= 0 || editSubTypeDuration <= 0) {
      showToast('الرجاء تعبئة جميع الحقول بقيم صالحة', 'warning');
      return;
    }
    try {
      await db.subscriptionTypes.update(editingSubType.id, {
        name: editSubTypeName.trim(),
        price: Number(editSubTypePrice),
        duration_months: Number(editSubTypeDuration)
      });
      showToast('✓ تم تحديث نوع الاشتراك بنجاح!', 'success');
      setEditingSubType(null);
      fetchSubscriptionTypes();
    } catch (err: any) {
      showToast(err.message || 'تعذر تحديث نوع الاشتراك', 'error');
    }
  };

  const handleDeleteSubscriptionType = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف نوع الاشتراك هذا؟ لن يتأثر الطلاب المشتركون به حالياً ولكن لن يظهر للتسجيلات الجديدة.')) return;
    try {
      await db.subscriptionTypes.delete(id);
      showToast('✓ تم حذف نوع الاشتراك بنجاح!', 'success');
      fetchSubscriptionTypes();
    } catch (err: any) {
      showToast(err.message || 'تعذر حذف نوع الاشتراك', 'error');
    }
  };

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLanguageName.trim()) {
      showToast('الرجاء كتابة اسم اللغة أو الشعبة الجديدة', 'warning');
      return;
    }
    const exists = customLanguages.some(l => l.name.trim() === newLanguageName.trim());
    if (exists) {
      showToast('هذه الشعبة/اللغة مسجلة بالفعل!', 'warning');
      return;
    }

    const newId = 'lang_' + Date.now();
    const updated = [...customLanguages, { id: newId, name: newLanguageName.trim() }];
    
    try {
      await db.settings.update({
        custom_languages: JSON.stringify(updated)
      });
      await db.logs.create({
        action: 'إضافة شعبة/لغة جديدة',
        details: `تم إضافة شعبة أو لغة جديدة للأكاديمية: ${newLanguageName.trim()}`,
        admin_name: currentUser.name,
        admin_role: currentUser.role
      });
      setCustomLanguages(updated);
      setNewLanguageName('');
      showToast(`✓ تم إضافة الشعبة/اللغة الجديدة (${newLanguageName}) وتحديث النظام فورياً!`, 'success');
    } catch {
      showToast('تعذر حفظ التغييرات', 'error');
    }
  };

  const handleDeleteLanguage = async (id: string, name: string) => {
    try {
      const listCourses = await db.courses.list();
      const isUsed = listCourses.some(c => c.language.toLowerCase() === id.toLowerCase());
      if (isUsed) {
        showToast(`لا يمكن حذف (${name}) لأن هناك دورات تدريبية نشطة تستخدم هذه الشعبة/اللغة!`, 'error');
        return;
      }
    } catch (err) {}

    if (!window.confirm(`هل أنت متأكد من حذف الشعبة/اللغة (${name})؟`)) return;

    const updated = customLanguages.filter(l => l.id !== id);
    try {
      await db.settings.update({
        custom_languages: JSON.stringify(updated)
      });
      await db.logs.create({
        action: 'حذف شعبة/لغة',
        details: `تم حذف شعبة/لغة من النظام: ${name}`,
        admin_name: currentUser.name,
        admin_role: currentUser.role
      });
      setCustomLanguages(updated);
      showToast(`✓ تم حذف الشعبة/اللغة (${name}) بنجاح!`, 'success');
    } catch {
      showToast('تعذر حفظ التغييرات', 'error');
    }
  };

  const handleSaveAboutContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.settings.update({
        about_hero_title: aboutHeroTitle.trim(),
        about_hero_subtitle: aboutHeroSubtitle.trim(),
        about_story_badge: aboutStoryBadge.trim(),
        about_story_title: aboutStoryTitle.trim(),
        about_story_p1: aboutStoryP1.trim(),
        about_story_p2: aboutStoryP2.trim(),
        about_vision_text: aboutVisionText.trim(),
        about_mission_text: aboutMissionText.trim(),
        home_hero_title: homeHeroTitle.trim(),
        home_hero_subtitle: homeHeroSubtitle.trim(),
        stats_students_count: statsStudentsCount.trim(),
        stats_students_label: statsStudentsLabel.trim(),
        stats_active_courses: statsActiveCourses.trim(),
        stats_active_courses_label: statsActiveCoursesLabel.trim(),
        stats_overall_rating: statsOverallRating.trim(),
        stats_overall_rating_label: statsOverallRatingLabel.trim()
      });
      showToast('✓ تم حفظ وتحديث محتوى صفحات الموقع الفردية بنجاح!', 'success');
    } catch (err) {
      showToast('خطأ أثناء حفظ النصوص المخصصة', 'error');
    }
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherRole.trim()) {
      showToast('الرجاء كتابة اسم الأستاذ والمهام التدريسية الخاصة به', 'warning');
      return;
    }

    const payload = {
      name: teacherName.trim(),
      role: teacherRole.trim(),
      exp: teacherExp.trim(),
      avatar: teacherAvatar.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=250',
      branch_id: teacherBranchId || 'French',
      is_of_the_month: teacherIsOfTheMonth,
      month_text: teacherMonthText.trim() || 'أستاذ الشهر 🌟'
    };

    try {
      if (editingTeacherId) {
        await db.teachers.update(editingTeacherId, payload);
        await db.logs.create({
          action: 'تعديل بيانات أستاذ',
          details: `تم تعديل ملف الأستاذ: ${teacherName.trim()}`,
          admin_name: currentUser.name,
          admin_role: currentUser.role
        });
        showToast(`✓ تم تعديل بيانات الأستاذ (${teacherName}) بنجاح!`, 'success');
      } else {
        await db.teachers.create(payload);
        await db.logs.create({
          action: 'إضافة أستاذ جديد',
          details: `تم تسجيل الأستاذ الجديد بالهيئة التدريسية: ${teacherName.trim()} (تخصص: ${teacherBranchId})`,
          admin_name: currentUser.name,
          admin_role: currentUser.role
        });
        showToast(`✓ تم تسجيل الأستاذ الجديد (${teacherName}) بصف الخوادم الحيوية!`, 'success');
      }

      // Reset Form fields
      setTeacherName('');
      setTeacherRole('');
      setTeacherExp('');
      setTeacherAvatar('');
      setTeacherBranchId('');
      setTeacherIsOfTheMonth(false);
      setTeacherMonthText('');
      setEditingTeacherId(null);
      setTeacherUploadMode('upload');
      
      fetchTeachers();
    } catch (err: any) {
      showToast(err.message || 'تعذر معالجة طلب الأساتذة', 'error');
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من سحب الاستحقاق وإلغاء عضوية الأستاذ (${name}) من الأكاديمية تماماً؟`)) return;
    try {
      await db.teachers.delete(id);
      await db.logs.create({
        action: 'حذف أستاذ',
        details: `تم إعفاء وإنهاء رعاية الأستاذ: ${name} من كادر الأكاديمية`,
        admin_name: currentUser.name,
        admin_role: currentUser.role
      });
      showToast(`✓ تم إعفاء وحذف الأستاذ (${name}) من الكادر بنجاح!`, 'success');
      fetchTeachers();
    } catch {
      showToast('تعذر حذف الأستاذ الآن', 'error');
    }
  };

  const handleStartEditTeacher = (t: Teacher) => {
    setEditingTeacherId(t.id);
    setTeacherName(t.name);
    setTeacherRole(t.role);
    setTeacherExp(t.exp);
    setTeacherAvatar(t.avatar || '');
    setTeacherBranchId(t.branch_id || '');
    setTeacherIsOfTheMonth(!!t.is_of_the_month);
    setTeacherMonthText(t.month_text || '');
    if (t.avatar && (t.avatar.startsWith('http://') || t.avatar.startsWith('https://'))) {
      setTeacherUploadMode('url');
    } else {
      setTeacherUploadMode('upload');
    }
  };

  const handleCancelEditTeacher = () => {
    setEditingTeacherId(null);
    setTeacherName('');
    setTeacherRole('');
    setTeacherExp('');
    setTeacherAvatar('');
    setTeacherBranchId('');
    setTeacherIsOfTheMonth(false);
    setTeacherMonthText('');
    setTeacherUploadMode('upload');
  };

  const handleExportTeachers = () => {
    if (teachers.length === 0) {
      showToast('لا توجد بيانات أساتذة للتصدير', 'warning');
      return;
    }

    const cols: ExportColumn<Teacher>[] = [
      { header: 'اسم الأستاذ', key: 'name' },
      { header: 'التخصص / الدور', key: 'role' },
      { header: 'الخبرة', key: 'exp' },
      { header: 'الشعبة / القسم', key: 'branch_id', transform: (v) => customLanguages.find(l => l.id === v || l.name === v)?.name || 'شعبة عامة' },
      { header: 'أستاذ الشهر', key: 'is_of_the_month', transform: (v) => v ? 'نعم' : 'لا' },
      { header: 'نص التكريم', key: 'month_text', transform: (v) => v || '-' }
    ];

    exportToCSV(teachers, cols, 'teachers');
    showToast('✓ تم تصدير بيانات الأساتذة بنجاح!', 'success');
  };

  const handleExportSubscriptionTypes = () => {
    if (subscriptionTypes.length === 0) {
      showToast('لا توجد أنواع اشتراكات للتصدير', 'warning');
      return;
    }

    const cols: ExportColumn<SubscriptionType>[] = [
      { header: 'اسم الاشتراك', key: 'name' },
      { header: 'المدة بالأشهر', key: 'duration_months', transform: (v) => `${v} أشهر` },
      { header: 'السعر المعتمد (DZD)', key: 'price', transform: (v) => `${v} دج` }
    ];

    exportToCSV(subscriptionTypes, cols, 'subscriptions');
    showToast('✓ تم تصدير أنواع الاشتراكات بنجاح!', 'success');
  };

  const handleExportSystemLogs = async () => {
    try {
      showToast('جاري استعلام السجلات البرمجية وتحضير التقرير...', 'success');
      const systemLogs = await db.logs.list();
      if (!systemLogs || systemLogs.length === 0) {
        showToast('لا توجد سجلات بالنظام لتصديرها حالياً', 'warning');
        return;
      }

      const cols: ExportColumn[] = [
        { header: 'العملية / الإجراء', key: 'action' },
        { header: 'التفاصيل', key: 'details' },
        { header: 'اسم المسؤول', key: 'admin_name' },
        { header: 'رتبة المسؤول', key: 'admin_role' },
        { header: 'تاريخ الحدث', key: 'created_at' }
      ];

      const sortedLogs = [...systemLogs].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      exportToCSV(sortedLogs, cols, 'logs');
      showToast('✓ تم تصدير السجلات الموثقة بالكامل بنجاح!', 'success');
    } catch (error: any) {
      showToast('عفواً، فشل استخراج سجلات النظام', 'error');
    }
  };

  return (
    <div className="p-6 space-y-8 font-sans text-right" style={{ direction: 'rtl' }}>
      
      {/* Tab Header title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-navy font-sans">التثبيت وصلاحيات الفريق (Super Admin)</h3>
          <p className="text-xs text-slate-400">تعديل قنوات التواصل، إدارة طواقم التدريس، تبديل أقسام الأكاديمية وصلاحيات المشرفين آلياً.</p>
        </div>
        <button
          type="button"
          onClick={handleExportSystemLogs}
          className="px-4 py-2 bg-navy text-white hover:bg-navy-dark font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-start"
        >
          <Download className="w-4 h-4 text-gold" />
          <span>تصدير السجلات البرمجية للأحداث (Excel)</span>
        </button>
      </div>

      {/* Horizontal Sub-Tabs for Better Separation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSettingsTab('general')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            settingsTab === 'general'
              ? 'border-b-2 border-gold bg-navy text-gold font-black'
              : 'text-slate-500 hover:text-navy hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>إعدادات عامة وتواصل</span>
        </button>
        <button
          onClick={() => setSettingsTab('languages')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            settingsTab === 'languages'
              ? 'border-b-2 border-gold bg-navy text-gold font-black'
              : 'text-slate-500 hover:text-navy hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>إدارة شعب وأقسام الأكاديمية</span>
        </button>
        <button
          onClick={() => setSettingsTab('about_content')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            settingsTab === 'about_content'
              ? 'border-b-2 border-gold bg-navy text-gold font-black'
              : 'text-slate-500 hover:text-navy hover:bg-slate-50'
          }`}
        >
          <Edit className="w-4 h-4" />
          <span>محتوى صفحات الموقع (من نحن)</span>
        </button>
        <button
          onClick={() => setSettingsTab('teachers')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            settingsTab === 'teachers'
              ? 'border-b-2 border-gold bg-navy text-gold font-black'
              : 'text-slate-500 hover:text-navy hover:bg-slate-50'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>إدارة أساتذة طاقم التدريس</span>
        </button>
        <button
          onClick={() => setSettingsTab('subscriptions')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            settingsTab === 'subscriptions'
              ? 'border-b-2 border-gold bg-navy text-gold font-black'
              : 'text-slate-500 hover:text-navy hover:bg-slate-50'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>أنواع الاشتراكات والأسعار</span>
        </button>
      </div>

      {/* TAB 1: GENERAL SETTINGS */}
      {settingsTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left column: general contact + widgets toggle */}
          <div className="space-y-8">
            
            {/* Site general stats form info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-navy border-r-2 border-gold pr-2 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-gold shrink-0" />
                <span>بيانات الاتصال ومقر الأكاديمية (الجزائر)</span>
              </h4>

              <form onSubmit={handleSaveContactSettings} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">اسم الأكاديمية (العلامة التجارية):</label>
                  <input
                    type="text"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">هاتف الاستفسار والموقع:</label>
                    <input
                      type="text"
                      value={phone1}
                      onChange={(e) => setPhone1(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 [direction:ltr]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">واتساب المكتب الرسمي:</label>
                    <input
                      type="text"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 [direction:ltr]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">البريد الإلكتروني الأساسي:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 [direction:ltr]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">العنوان بالتحديد سيدي بلعباس:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">مواعيد وساعات دوام المقر:</label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="space-y-1 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/50">
                  <label className="block font-bold text-slate-700 text-xs text-amber-900 flex items-center gap-1">
                    <span>رابط خريطة قوقل ماب التفاعلي (Google Maps Embed Code):</span>
                  </label>
                  <input
                    type="text"
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white [direction:ltr] font-mono text-[10px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    💡 <strong>كيف تجد الرابط؟</strong> اذهب لجريدة الخريطة في قوقل ماب ← اضغط <strong>مشاركة/Share</strong> ← اختر علامة التبويب <strong>تضمين خريطة/Embed a map</strong> ← انسخ الرابط الموجود داخل الخاصية <code className="bg-slate-100 p-0.5 rounded text-rose-600 font-bold">src="..."</code> والصقه هنا.
                  </p>
                </div>

                {/* Social Channels section */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">رابط فيسبوك (Facebook):</label>
                    <input
                      type="text"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="naji.academy.sidibelabbes"
                      className="w-full p-2.5 rounded-lg border border-slate-300 [direction:ltr]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">رابط إنستغرام (Instagram):</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="najiacademy_sidibelabbes"
                      className="w-full p-2.5 rounded-lg border border-slate-300 [direction:ltr]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">رابط يوتيوب (YouTube):</label>
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="@najiacademy"
                      className="w-full p-2.5 rounded-lg border border-slate-300 [direction:ltr]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">معرف تيك توك (TikTok):</label>
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="@najiacademy.dz"
                      className="w-full p-2.5 rounded-lg border border-slate-300 [direction:ltr]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-navy hover:bg-navy-dark text-gold font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-gold" />
                    <span>حفظ قنوات الاتصال والتواصل</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Email / Notification settings as requested */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-navy border-r-2 border-gold pr-2 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-gold shrink-0" />
                <span>تنبيهات البريد ووظائف الرصد الآلي</span>
              </h4>

              <form onSubmit={handleSaveNotifications} className="space-y-4 text-xs font-sans">
                
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <div>
                    <span className="font-extrabold text-slate-800 block">إرسال بريد إلكتروني عند تفويج حجز جديد</span>
                    <span className="text-[10px] text-slate-400">إخطار طاقم المبيعات فور تعبئة الطلب</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifNewBooking(!notifNewBooking)}
                    className="text-navy hover:opacity-85 cursor-pointer border-0 bg-transparent"
                  >
                    {notifNewBooking ? <ToggleRight className="w-9 h-9 text-gold-dark" /> : <ToggleLeft className="w-9 h-9 text-slate-300" />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <div>
                    <span className="font-extrabold text-slate-800 block">مصادقة مراجعة جديدة</span>
                    <span className="text-[10px] text-slate-400">استلام إشعارات للمراجعة في خلفية التحكم</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifNewReview(!notifNewReview)}
                    className="text-navy hover:opacity-85 cursor-pointer border-0 bg-transparent"
                  >
                    {notifNewReview ? <ToggleRight className="w-9 h-9 text-gold-dark" /> : <ToggleLeft className="w-9 h-9 text-slate-300" />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="font-extrabold text-slate-800 block">تكاملية إشعارات WhatsApp المباشرة</span>
                    <span className="text-[10px] text-slate-400">إطلاق ميزات رصد واتساب التلقائية (API) لرواتب الطلاب</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                    className="text-navy hover:opacity-85 cursor-pointer border-0 bg-transparent"
                  >
                    {whatsappAlerts ? <ToggleRight className="w-9 h-9 text-gold-dark" /> : <ToggleLeft className="w-9 h-9 text-slate-300" />}
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg cursor-pointer"
                  >
                    تعديل تبديل المنبهات
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right column: team authorization & adding tools */}
          <div className="space-y-8">
            
            {/* List of currently active administrators and operators */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-navy border-r-2 border-gold pr-2">أعضاء الفريق والمنسقون المصرح لهم بالنظام</h4>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto no-scrollbar font-sans text-xs">
                {loading ? (
                  <div className="py-4 text-center text-slate-400">تحميل الرتب...</div>
                ) : (
                  team.map(member => (
                    <div key={member.id} className="py-3 flex items-center justify-between gap-3 text-right">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-slate-850">{member.name}</p>
                        <p className="text-[10px] text-slate-400 [direction:ltr]">{member.email}</p>
                        <span className={`inline-block mt-1 px-1.5 py-0.5 text-[8.5px] font-black rounded ${
                          member.role === 'superadmin' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          member.role === 'manager' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {member.role === 'superadmin' ? 'مدير عام رئيسي' : member.role === 'manager' ? 'منسق تسويق ومقاعد' : 'أستاذ منسق'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStartEditMember(member)}
                          className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-700 rounded-lg border border-slate-150 hover:border-amber-200 transition-colors cursor-pointer"
                          title="تعديل معلومات الحساب"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-700 rounded-lg border border-slate-150 hover:border-rose-200 transition-colors cursor-pointer"
                          title="حذف الحساب تماماً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Form Create or Edit credentials member as requested */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm font-sans">
              {editingMember ? (
                <>
                  <div className="flex items-center justify-between border-r-2 border-amber-500 pr-2">
                    <h4 className="text-xs font-bold text-slate-800">تعديل تصريح العضو: {editingMember.name}</h4>
                    <button
                      onClick={() => setEditingMember(null)}
                      className="text-[10px] font-bold text-rose-600 hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                  </div>

                  <form onSubmit={handleUpdateMember} className="space-y-3 text-xs leading-normal">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">الاسم بالكامل: <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={editAdminName}
                          onChange={(e) => setEditAdminName(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">بريد الدخول: <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={editAdminEmail}
                            onChange={(e) => setEditAdminEmail(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 text-left [direction:ltr]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">رمز المرور الجديد:</label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            placeholder="اتركه فارغاً للاحتفاظ بالقديم"
                            value={editAdminPassword}
                            onChange={(e) => setEditAdminPassword(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 text-left [direction:ltr]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">الرتبة في النظام:</label>
                      <select
                        value={editAdminRole}
                        onChange={(e) => setEditAdminRole(e.target.value as any)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="manager">منسق تسويق ومقاعد (Manager)</option>
                        <option value="teacher">أستاذ منسق حصص (Teacher)</option>
                        <option value="superadmin">مدير عام رئيسي وصلاحيات التثبيت (Super Admin)</option>
                      </select>
                    </div>

                    <div className="pt-2 flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingMember(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>حفظ التغييرات</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h4 className="text-xs font-bold text-navy border-r-2 border-gold pr-2">منح تصريح دخول لعضو جديد بالطاقم</h4>

                  <form onSubmit={handleCreateMember} className="space-y-3 text-xs leading-normal">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">اسم العضو بالكامل: <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="مثال: أ. سفيان تيجاني"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">بريد الدخول: <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            placeholder="teacher@najiacademy.dz"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 text-left [direction:ltr]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">رمز المرور: <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            required
                            placeholder="من 4 خانات على الأقل"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 text-left [direction:ltr]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">الرتبة الممنوحة بالتحديد:</label>
                      <select
                        value={newAdminRole}
                        onChange={(e) => setNewAdminRole(e.target.value as any)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="manager">منسق تسويق ومقاعد (Manager)</option>
                        <option value="teacher">أستاذ منسق حصص (Teacher)</option>
                        <option value="superadmin">مدير عام رئيسي وصلاحيات التثبيت (Super Admin)</option>
                      </select>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg cursor-pointer shadow-sm w-full flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>اعتماد العضو الجديد</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRANCHES & LANGUAGES */}
      {settingsTab === 'languages' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm font-sans">
          <div className="border-r-4 border-gold pr-4">
            <h4 className="text-base font-black text-navy flex items-center gap-1.5">
              <Compass className="w-5 h-5 text-gold shrink-0" />
              <span>إدارة شعب وأقسام ولغات الأكاديمية (الشعب الحيوية)</span>
            </h4>
            <p className="text-xs text-slate-500 leading-normal mt-1">
              من هنا يمكنك إضافة لغات جديدة (مثل الألمانية، الإيطالية، التركية الخ.) أو شعب وتخصصات تدريبية مختلفة ومسارات لربطها بالدورات والتواريخ والأساتذة فورياً دون تأخر.
            </p>
          </div>

          <form onSubmit={handleAddLanguage} className="max-w-xl flex gap-3 text-xs pt-2">
            <input
              type="text"
              required
              placeholder="أضف اسم لغة أو شعبة (مثال: الألمانية 🇩🇪)"
              value={newLanguageName}
              onChange={(e) => setNewLanguageName(e.target.value)}
              className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gold hover:bg-[#b49218] text-navy font-black rounded-lg cursor-pointer transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-navy stroke-[3]" />
              <span>إضافة للشعب</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100">
            <span className="block text-xs font-extrabold text-navy mb-3">القائمة الحالية للشعب المسجلة:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {customLanguages.map(lang => (
                <div 
                  key={lang.id} 
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-sm hover:border-gold/50 transition-all"
                >
                  <span className="text-xs font-bold text-navy">{lang.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteLanguage(lang.id, lang.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف هذه الشعبة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAGES CONTENT CUSTOMIZATION (ABOUT US / HOME HERO) */}
      {settingsTab === 'about_content' && (
        <form onSubmit={handleSaveAboutContent} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          
          <div className="border-r-4 border-gold pr-4">
            <h4 className="text-base font-black text-navy flex items-center gap-1.5">
              <Edit className="w-5 h-5 text-gold shrink-0" />
              <span>تعديل محتوى نصوص الواجهة والصفحات الرئيسية (من نحن والترحيب)</span>
            </h4>
            <p className="text-xs text-slate-500 leading-normal mt-1">
              يوفر لك هذا القسم إمكانية استبدال نصوص صفحات الموقع مثل عنوان الترحيب وبوابة "من نحن" ورسالة الأكاديمية ورؤيتها فورياً دون لمس الأكواد البرمجية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs font-sans">
            
            {/* Home Hero Content Block */}
            <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-navy font-extrabold block border-b border-navy/10 pb-2 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>القسم الترحيبي الرئيسي (Home Hero)</span>
              </span>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">عنوان الترحيب الرئيسي بالواجهة:</label>
                <textarea
                  rows={2}
                  value={homeHeroTitle}
                  onChange={(e) => setHomeHeroTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-extrabold text-navy"
                  placeholder="عنوان الواجهة"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">شرح وتفاصيل الترحيب الفرعية بالواجهة:</label>
                <textarea
                  rows={3}
                  value={homeHeroSubtitle}
                  onChange={(e) => setHomeHeroSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 leading-relaxed"
                  placeholder="النص التعريفي المرفق"
                />
              </div>
            </div>

            {/* About Page Hero Block */}
            <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-navy font-extrabold block border-b border-navy/10 pb-2 flex items-center gap-1.5 text-sm">
                <Award className="w-4 h-4 text-gold" />
                <span>عنوان أعلى صفحة "نبذة عنا" (About Hero)</span>
              </span>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">العنوان العريض للصفحة:</label>
                <input
                  type="text"
                  value={aboutHeroTitle}
                  onChange={(e) => setAboutHeroTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-extrabold text-navy"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">النص التعريفي الفرعي تحته:</label>
                <textarea
                  rows={3}
                  value={aboutHeroSubtitle}
                  onChange={(e) => setAboutHeroSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 leading-relaxed"
                />
              </div>
            </div>

            {/* About Story Column 1 */}
            <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm md:col-span-2">
              <span className="text-navy font-extrabold block border-b border-navy/10 pb-2 flex items-center gap-1.5 text-sm">
                <BookOpen className="w-4 h-4 text-gold" />
                <span>خلفية وقصة تأسيس الأكاديمية (الرحلة والرسالة)</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">شارة وقالب التأسيس الصغير:</label>
                  <input
                    type="text"
                    value={aboutStoryBadge}
                    onChange={(e) => setAboutStoryBadge(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-gold-dark font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">عنوان القصة الرئيسي:</label>
                  <input
                    type="text"
                    value={aboutStoryTitle}
                    onChange={(e) => setAboutStoryTitle(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الفقرة الأولى (النشأة والمبررات):</label>
                  <textarea
                    rows={4}
                    value={aboutStoryP1}
                    onChange={(e) => setAboutStoryP1(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 leading-normal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الفقرة الثانية (الحلول والأثر):</label>
                  <textarea
                    rows={4}
                    value={aboutStoryP2}
                    onChange={(e) => setAboutStoryP2(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 leading-normal"
                  />
                </div>
              </div>
            </div>

            {/* Vision and Mission */}
            <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm md:col-span-2">
              <span className="text-navy font-extrabold block border-b border-navy/10 pb-2 flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 text-gold" />
                <span>الرؤية والرسالة التربوية اليومية</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">رؤية الأكاديمية المستدامة:</label>
                  <textarea
                    rows={3}
                    value={aboutVisionText}
                    onChange={(e) => setAboutVisionText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">مهمة الأكاديمية اليومية واليوميات العملية:</label>
                  <textarea
                    rows={3}
                    value={aboutMissionText}
                    onChange={(e) => setAboutMissionText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Landing Page Statistics */}
            <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm md:col-span-2">
              <span className="text-navy font-extrabold block border-b border-navy/10 pb-2 flex items-center gap-1.5 text-sm">
                <Coins className="w-4 h-4 text-gold" />
                <span>أرقام وإحصائيات شريط الرئيسية (القسم الإحصائي)</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stats 1: Students */}
                <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
                  <span className="font-extrabold text-navy text-xs block">الإحصائية الأولى (الطلاب المتخرجون)</span>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500">الرقم المستهدف (مثال: 540):</label>
                    <input
                      type="text"
                      value={statsStudentsCount}
                      onChange={(e) => setStatsStudentsCount(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500">الوصف الإيضاحي بالعربية:</label>
                    <input
                      type="text"
                      value={statsStudentsLabel}
                      onChange={(e) => setStatsStudentsLabel(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                {/* Stats 2: Active Courses */}
                <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
                  <span className="font-extrabold text-navy text-xs block">الإحصائية الثانية (الدورات النشطة)</span>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500">الرقم المستهدف (مثال: 04):</label>
                    <input
                      type="text"
                      value={statsActiveCourses}
                      onChange={(e) => setStatsActiveCourses(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500">الوصف الإيضاحي بالعربية:</label>
                    <input
                      type="text"
                      value={statsActiveCoursesLabel}
                      onChange={(e) => setStatsActiveCoursesLabel(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                {/* Stats 3: Rating */}
                <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
                  <span className="font-extrabold text-navy text-xs block">الإحصائية الثالثة (التقييم العام)</span>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500">الرقم المستهدف (مثال: 4.9):</label>
                    <input
                      type="text"
                      value={statsOverallRating}
                      onChange={(e) => setStatsOverallRating(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500">الوصف الإيضاحي بالعربية:</label>
                    <input
                      type="text"
                      value={statsOverallRatingLabel}
                      onChange={(e) => setStatsOverallRatingLabel(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3.5 bg-[#12386a] hover:bg-navy-dark text-gold font-black rounded-xl cursor-pointer shadow-lg flex items-center gap-2 text-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>حفظ كل نصوص وتحديثات صفحات الموقع</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: TEACHERS MANAGEMENT */}
      {settingsTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start select-none">
          
          {/* Teacher Creation Form (1 column on desktop) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm font-sans lg:col-span-1">
            <div className="border-r-4 border-gold pr-3">
              <h4 className="text-xs font-extrabold text-navy">
                {editingTeacherId ? 'تعديل بيانات الأستاذ الحالي' : 'تسجيل أستاذ جديد بالكادر التعليمي'}
              </h4>
              <p className="text-[10px] text-slate-400">إضافة أو تحديث معلومات الأستاذ وصورته وتعيينه كأستاذ الشهر في شعبته.</p>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">اسم الأستاذ/الأستاذة بالكامل: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أ. دحمان ناجي"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">المسمى الوظيفي أو التخصص: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أستاذ أول ومسؤول اللغة المهارية"
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الشعبة الراجع إليها تدريسياً:</label>
                <select
                  value={teacherBranchId}
                  onChange={(e) => setTeacherBranchId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- اختر شعبة أو تخصص --</option>
                  {customLanguages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الخبرة والشهادات باختصار:</label>
                <textarea
                  rows={3}
                  placeholder="مثال: خبرة تفوق 15 سنة في الإشراف التربوي والتعليم الجامعي اللغوي بسيدي بلعباس..."
                  value={teacherExp}
                  onChange={(e) => setTeacherExp(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 leading-normal"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">الصورة الشخصية للأستاذ/الأستاذة:</label>
                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTeacherUploadMode('upload')}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${
                        teacherUploadMode === 'upload'
                          ? 'bg-white text-navy shadow-sm'
                          : 'text-slate-500 hover:text-navy'
                      }`}
                    >
                      تحميل صورة
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherUploadMode('url')}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${
                        teacherUploadMode === 'url'
                          ? 'bg-white text-navy shadow-sm'
                          : 'text-slate-500 hover:text-navy'
                      }`}
                    >
                      رابط ويب (URL)
                    </button>
                  </div>
                </div>

                {teacherUploadMode === 'upload' ? (
                  <div className="space-y-2">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setTeacherDragging(true);
                      }}
                      onDragLeave={() => setTeacherDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setTeacherDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleTeacherFileConvert(file);
                      }}
                      onClick={() => document.getElementById('teacher-file-input')?.click()}
                      className={`border border-dashed rounded-lg p-3 text-center transition-all cursor-pointer ${
                        teacherDragging ? 'border-gold bg-gold/5' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                      }`}
                    >
                      <input
                        id="teacher-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleTeacherFileConvert(file);
                        }}
                      />
                      {teacherAvatar ? (
                        <div className="space-y-1.5">
                          <img 
                            src={teacherAvatar} 
                            alt="Preview" 
                            className="w-12 h-12 mx-auto object-cover rounded-full border border-gold"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[9px] text-emerald-600 font-bold">✓ تم اختيار الصورة بنجاح</p>
                          <span className="text-[9px] text-slate-500 hover:underline block">انقر لتغيير الصورة</span>
                        </div>
                      ) : (
                        <div className="space-y-1 py-1">
                          <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                          <p className="text-[10px] font-bold text-slate-600">انقر هنا أو اسحب صورة للأستاذ</p>
                          <p className="text-[9px] text-slate-400">JPG, PNG, WEBP</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... (اختياري)"
                    value={teacherAvatar}
                    onChange={(e) => setTeacherAvatar(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-[10px] [direction:ltr]"
                  />
                )}
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-amber-950 block">تعيين كأستاذ الشهر لهذه الشعبة</span>
                    <span className="text-[10px] text-amber-800">سيتم تفضيله بقسم الشرف بأسفل واجهة الموقع.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={teacherIsOfTheMonth}
                    onChange={(e) => setTeacherIsOfTheMonth(e.target.checked)}
                    className="w-4 h-4 text-gold accent-gold-dark border-slate-300 rounded cursor-pointer"
                  />
                </div>

                {teacherIsOfTheMonth && (
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950 text-[11px]">مكتوب الشارة (مثال: أستاذ الشهر 🌟):</label>
                    <input
                      type="text"
                      placeholder="أستاذ شهر أكتوبر 2026 🌟"
                      value={teacherMonthText}
                      onChange={(e) => setTeacherMonthText(e.target.value)}
                      className="w-full p-2.5 rounded-md border border-amber-350 bg-white font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {editingTeacherId && (
                  <button
                    type="button"
                    onClick={handleCancelEditTeacher}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 w-full justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingTeacherId ? 'تحديث بيانات الأستاذ' : 'حفظ الأستاذ بالكادر'}</span>
                </button>
              </div>

            </form>
          </div>

          {/* Teachers list (2 columns on desktop) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm font-sans lg:col-span-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-navy border-r-2 border-gold pr-2">أعضاء الهيئة التعليمية الحاليين بالصرح</h4>
              {teachers.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportTeachers}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="تصدير الأساتذة"
                >
                  <Download className="w-3 h-3" />
                  <span>تصدير الأساتذة (Excel)</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-xl">
              <table className="w-full text-right text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-500 font-extrabold">
                  <tr>
                    <th className="p-3 font-extrabold">الأستاذ</th>
                    <th className="p-3 font-extrabold">الشعبة/القسم</th>
                    <th className="p-3 font-extrabold">أستاذ الشهر؟</th>
                    <th className="p-3 font-extrabold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {teachers.map(teacher => {
                    const branchName = customLanguages.find(l => l.id === teacher.branch_id || l.name === teacher.branch_id)?.name || 'شعبة عامة';
                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/50">
                        <td className="p-3 flex items-center gap-2.5">
                          <img 
                            src={teacher.avatar} 
                            alt={teacher.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 object-cover rounded-full border border-gold"
                          />
                          <div>
                            <p className="font-extrabold text-slate-850">{teacher.name}</p>
                            <p className="text-[10px] text-slate-400">{teacher.role}</p>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{branchName}</td>
                        <td className="p-3">
                          {teacher.is_of_the_month ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-gold/10 text-gold-dark font-black text-[9px] border border-gold/30">
                              <Star className="w-2.5 h-2.5 fill-gold-dark text-gold-dark" />
                              <span>{teacher.month_text || 'أستاذ الشهر'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEditTeacher(teacher)}
                              className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-navy rounded-lg border border-slate-150 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-700 rounded-lg border border-slate-150 hover:border-rose-200 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTIONS SETTINGS */}
      {settingsTab === 'subscriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Form Side */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-navy border-r-2 border-gold pr-2 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-gold shrink-0" />
                <span>{editingSubType ? 'تعديل نوع الاشتراك' : 'إضافة نوع اشتراك جديد'}</span>
              </h4>
              
              <form 
                onSubmit={editingSubType ? handleUpdateSubscriptionType : handleCreateSubscriptionType} 
                className="space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">اسم الاشتراك <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اشتراك شهري عادي، اشتراك مميز..."
                    value={editingSubType ? editSubTypeName : newSubTypeName}
                    onChange={(e) => editingSubType ? setEditSubTypeName(e.target.value) : setNewSubTypeName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">السعر بالدينار الجزائري (DZD) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="مثال: 4000"
                    value={editingSubType ? editSubTypePrice : newSubTypePrice}
                    onChange={(e) => editingSubType ? setEditSubTypePrice(Number(e.target.value)) : setNewSubTypePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-800 [direction:ltr]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">المدة بالأشهر <span className="text-rose-500">*</span></label>
                  <select
                    value={editingSubType ? editSubTypeDuration : newSubTypeDuration}
                    onChange={(e) => editingSubType ? setEditSubTypeDuration(Number(e.target.value)) : setNewSubTypeDuration(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-800"
                  >
                    <option value={1}>شهر واحد (1)</option>
                    <option value={2}>شهرين (2)</option>
                    <option value={3}>3 أشهر (ربع سنوي)</option>
                    <option value={6}>6 أشهر (نصف سنوي)</option>
                    <option value={12}>12 شهر (سنوي كامل)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  {editingSubType && (
                    <button
                      type="button"
                      onClick={() => setEditingSubType(null)}
                      className="text-slate-650 font-bold border-0 bg-transparent cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Save className="w-4 h-4 text-gold" />
                    <span>{editingSubType ? 'حفظ التحديث' : 'تسجيل نوع الاشتراك'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <h5 className="font-bold text-xs text-navy flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-650 shrink-0" />
                <span>إرشادات الإدارة والتحكم</span>
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                تتيح لك هذه اللوحة إدارة خيارات الاشتراكات التي تظهر عند تسجيل أو تجديد اشتراك الطلاب في الأكاديمية.
              </p>
              <ul className="text-[10px] text-slate-500 space-y-1 list-disc pr-4">
                <li>عند إضافة نوع اشتراك، سيظهر فوراً كخيار منسدل في لوحة شؤون الطلاب.</li>
                <li>تعديل السعر لا يؤثر بأثر رجعي على مبالغ اشتراكات الطلاب الحاليين المسجلة مسبقاً.</li>
                <li>حذف الاشتراك يمنع اختياره مستقبلاً للطلبات الجديدة، مع الحفاظ على سرية السجل التاريخي للطلاب.</li>
              </ul>
            </div>
          </div>

          {/* List Side */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-navy">الأنواع المتاحة بقاعدة البيانات</h4>
                  <p className="text-[10px] text-slate-400">إجمالي الخيارات المسجلة للاستخدام ببطاقات الطلاب: {subscriptionTypes.length}</p>
                </div>
                {subscriptionTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportSubscriptionTypes}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="تصدير الاشتراكات"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير الاشتراكات (Excel)</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="p-3 font-bold">اسم نوع الاشتراك</th>
                      <th className="p-3 font-bold text-center">المدة الزمنية</th>
                      <th className="p-3 font-bold text-center">السعر المعتمد (DZD)</th>
                      <th className="p-3 font-bold text-center">التحكم والعمليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscriptionTypes.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-extrabold text-slate-850">
                          {sub.name}
                        </td>
                        <td className="p-4 text-center font-semibold text-slate-600">
                          {sub.duration_months === 1 ? 'شهر واحد' : `${sub.duration_months} أشهر`}
                        </td>
                        <td className="p-4 text-center font-black text-navy">
                          {sub.price.toLocaleString('ar-DZ')} د.ج
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStartEditSubType(sub)}
                              className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-navy rounded-lg border border-slate-150 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriptionType(sub.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-700 rounded-lg border border-slate-150 hover:border-rose-200 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {subscriptionTypes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          لا يوجد أنواع اشتراكات مسجلة حالياً. يرجى إضافة نوع جديد من النموذج الجانبي.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
