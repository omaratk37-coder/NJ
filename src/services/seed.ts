import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const INITIAL_COURSES = [
  {
    id: 'course-1',
    name: 'اللغة الفرنسية (مبتدئ إلى B2)',
    language: 'French',
    level: 'beginner',
    duration: '3 أشهر',
    schedule: 'الإثنين والأربعاء 17:00 - 19:00',
    start_date: '2026-07-01',
    max_seats: 25,
    enrolled_count: 14,
    price: 4500,
    description: 'دورة فرنسية مكثفة وشاملة تأخذك من الصفر حتى مستوى التواصل المهني B2 مع أساتذة ذوي خبرة ومناهج تفاعلية.',
    status: 'active'
  },
  {
    id: 'course-2',
    name: 'اللغة الإنجليزية التفاعلية',
    language: 'English',
    level: 'all',
    duration: 'شهرين',
    schedule: 'الثلاثاء والخميس 17:00 - 19:00',
    start_date: '2026-07-05',
    max_seats: 25,
    enrolled_count: 21,
    price: 4500,
    description: 'تطوير مهارات الاستماع والتحدث بالإنجليزية بأسلوب حديث يركز على المحادثة وكسر حاجز الخوف من التكلم.',
    status: 'active'
  },
  {
    id: 'course-3',
    name: 'اللغة الإسبانية للمبتدئين',
    language: 'Spanish',
    level: 'beginner',
    duration: 'شهرين',
    schedule: 'الأحد 09:00 - 12:00',
    start_date: '2026-07-10',
    max_seats: 20,
    enrolled_count: 20,
    price: 4000,
    description: 'تعلم أساسيات قواعد ومفردات الإسبانية وطريقة تركيب الجمل والمحادثات اليومية البسيطة بشكل تفاعلي ممتاز.',
    status: 'active'
  },
  {
    id: 'course-4',
    name: 'مهارات التواصل المهني وإدارة المشاريع',
    language: 'Skills',
    level: 'all',
    duration: 'شهر واحد',
    schedule: 'السبت 09:00 - 13:00',
    start_date: '2026-07-12',
    max_seats: 15,
    enrolled_count: 5,
    price: 3500,
    description: 'اكتساب مهارات القيادة، التخطيط للمشاريع الصغيرة، إعداد السيرة الذاتية التنافسية واجتياز مقابلات العمل بذكاء.',
    status: 'active'
  }
];

const INITIAL_REVIEWS = [
  {
    id: 'review-1',
    student_name: 'أمينة بلخير',
    rating: 5,
    course_name: 'الفرنسية',
    review_text: 'أفضل أكاديمية في سيدي بلعباس! تحسّن مستواي في الفرنسية بشكل ملحوظ خلال شهرين فقط بفضل الأسلوب العملي المتميز للأساتذة.',
    status: 'approved',
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'review-2',
    student_name: 'يوسف عمراني',
    rating: 5,
    course_name: 'الإنجليزية',
    review_text: 'أساتذة محترفون وجو دراسي رائع ومحفز للتعلم. أنصح به بشدة لكل من يريد كسر حاجز الخمول وتعلم الإنجليزية بطلاقة.',
    status: 'approved',
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'review-3',
    student_name: 'سارة مزغيش',
    rating: 4,
    course_name: 'مهارات مهنية',
    review_text: 'استثمار حقيقي في مستقبلي المهني وتجربة رائعة للغاية. الدورة غيّرت الكثير في مساري ومنحتني ثقة تامة بمشروعي الخاص.',
    status: 'approved',
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

const INITIAL_GALLERY = [
  {
    id: 'gal-1',
    image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800',
    title: 'قاعة اللغات الحديثة والوسائط السمعية البصرية',
    category: 'قاعات',
    sort_order: 1
  },
  {
    id: 'gal-2',
    image_url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800',
    title: 'مجموعات نقاش تفاعلية لتطوير المحادثة بلغة حية',
    category: 'طلاب',
    sort_order: 2
  },
  {
    id: 'gal-3',
    image_url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800',
    title: 'ورشة عمل حول تصميم المشاريع المهنية ومهارات العرض ومواجهة الجمهور',
    category: 'فعاليات',
    sort_order: 3
  },
  {
    id: 'gal-4',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800',
    title: 'حفل تخرج الدفعة الأولى وتوزيع الشهادات المعتمدة بحضور الأولياء والأساتذة',
    category: 'مناسبات',
    sort_order: 4
  },
  {
    id: 'gal-5',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800',
    title: 'الأجواء الأخوية والأنشطة الثقافية المشتركة بين الطلاب وأسرتنا التربوية',
    category: 'طلاب',
    sort_order: 5
  },
  {
    id: 'gal-6',
    image_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800',
    title: 'مكتبة الأكاديمية المصغرة ومصادر المواد الدراسية الورقية والرقمية لطلابنا',
    category: 'قاعات',
    sort_order: 6
  }
];

const INITIAL_VIDEOS = [
  {
    id: 'video-1',
    title: 'شاهد الأجواء التعليمية المميزة والوسائل الذكية داخل أكاديمية ناجي بسيدي بلعباس',
    embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'فيديو تعريفي يستعرض قاعات الدراسة التفاعلية المجهزة بآخر التقنيات، طرق التدريس والترفيه الحديث لطلاب اللغات والمهارات.',
    is_featured: true
  }
];

const INITIAL_SUBSCRIPTION_TYPES = [
  { id: 'sub-1', name: 'اشتراك شهري عادي', price: 4000, duration_months: 1 },
  { id: 'sub-2', name: 'اشتراك ربع سنوي (3 أشهر)', price: 10000, duration_months: 3 },
  { id: 'sub-3', name: 'اشتراك نصف سنوي مميز (6 أشهر)', price: 18000, duration_months: 6 },
  { id: 'sub-4', name: 'اشتراك سنوي كامل (12 شهر)', price: 30000, duration_months: 12 },
];

const INITIAL_BOOKINGS = [
  {
    id: 'book-1',
    student_name: 'عبد القادر بلعباسي',
    phone: '0555123456',
    email: 'abdelkader@gmail.com',
    course_id: 'course-1',
    course_name: 'اللغة الفرنسية (مبتدئ إلى B2)',
    message: 'أريد حجز مقعد والمباشرة في الدراسة استعداداً للسفر للدراسة بالخارج',
    admin_notes: 'تم الاتصال بالمرشح وتأكيد حضوره للمقر لدفع الرسوم.',
    status: 'confirmed',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'book-2',
    student_name: 'مريم بومدين',
    phone: '0666987654',
    email: 'meriem.b@yahoo.fr',
    course_id: 'course-2',
    course_name: 'اللغة الإنجليزية التفاعلية',
    message: 'هل هناك حصص مسائية فقط أم صباحية كذلك؟ شكراً لكم',
    status: 'pending',
    created_at: new Date(Date.now() - 3600 * 1000).toISOString()
  },
  {
    id: 'book-3',
    student_name: 'أحمد بن علي',
    phone: '0777456123',
    course_id: 'course-3',
    course_name: 'اللغة الإسبانية للمبتدئين',
    message: 'مسجل في قائمة الانتظار، الرجاء التواصل معي عند شغور أي مقعد للضرورة القصوى',
    status: 'pending',
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

const INITIAL_SITE_SETTINGS = {
  academy_name: 'NAJI ACADEMY',
  address: 'شارع بومدين، قرب ساحة أول نوفمبر، وسط مدينة سيدي بلعباس، الجزائر',
  phone: '043 27 18 19 / 0550 12 34 56',
  whatsapp: '+213550123456',
  email: 'contact@najiacademy.dz',
  instagram: 'najiacademy_sidibelabbes',
  facebook: 'naji.academy.sidibelabbes',
  youtube: '@najiacademy',
  tiktok: '@najiacademy.dz',
  working_hours: 'السبت إلى الخميس: 09:00 - 19:00 (الجمعة مغلق)',
  map_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.4735515324317!2d-1.317585!3d34.88214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDUyJzU1LjciTiAxwrAxOScwMy4zIlc!5e0!3m2!1sar!2sdz!4v1234567890123',
  notify_by_email_new_booking: 'true',
  notify_by_email_new_review: 'true',
  notify_whatsapp_phone: '+213550123456',
  reminder_before_start: 'true',
  custom_languages: '[\n    {"id": "French", "name": "الفرنسية"},\n    {"id": "English", "name": "الإنجليزية"},\n    {"id": "Spanish", "name": "الإسبانية"},\n    {"id": "Skills", "name": "مهارات مهنية"}\n  ]',
  about_hero_title: 'نبذة عن الأكاديمية',
  about_hero_subtitle: 'قصتنا، مبادئنا، ونخبة الكفاءات القائمة على رعاية وتكوين أجيال المستقبل بسيدي بلعباس.',
  about_story_badge: 'تأسست بدوافع وطنية وعلمية',
  about_story_title: 'قصّة التأسيس والرسالة التربوية',
  about_story_p1: 'انطلقت أكاديمية ناجي لتمكين اللغات والمهارات بمدينة سيدي بلعباس البهية، الجزائر، من منطلق وعينا التام بضرورة كسر الحواجز الكلاسيكية التي تشوب برامج تدريس اللغات والعلوم المهارية المعاصرة.',
  about_story_p2: 'رأينا ندرة في المقرات التي توفر للطالب الجزائري بيئة تفاعلية تطبيقية حية تؤهله مباشرة لسوق العمل أو لإجراء الدراسات والامتحانات الفيدرالية بفرنسا وإسبانيا والدول الناطقة بالإنجليزية بثقة وفصاحة، فأسسنا هذا الصرح ليكون منارة للتطوير الفعلي للذات وبأفضل تكلفة ممكنة.',
  about_vision_text: 'أن نصبح الخيار التدريبي الأول والمعياري المفضل للأسر والمهنيين على مستوى الغرب الجزائري لتعليم اللغات الحية.',
  about_mission_text: 'توفير رعاية تكوينية وتوجيهية متطورة لكل طالب عبر قاعات حديثة ومناهج دراسية تفاعلية حية تخاطب عقله ونبوغه.',
  home_hero_title: 'أكاديمية ناجي لتمكين اللغات والمهارات بسيدي بلعباس',
  home_hero_subtitle: 'أكاديمية تدريبية رائدة تضمن تطورا مستمرا للفئات كافة والأعمار بهدف تحقيق الريادة اللغوية والمهارية.'
};

const INITIAL_TEAM_MEMBERS = [
  {
    id: 'user-super',
    name: 'أ. دحمان ناجي',
    email: 'admin@najiacademy.dz',
    role: 'superadmin'
  },
  {
    id: 'user-manager',
    name: 'نسيمة بلحاج',
    email: 'manager@najiacademy.dz',
    role: 'manager'
  },
  {
    id: 'user-teacher',
    name: 'سفيان تيجاني',
    email: 'teacher@najiacademy.dz',
    role: 'teacher'
  },
  {
    id: 'user-current-admin',
    name: 'Innocodeex Admin',
    email: 'innocodeex@gmail.com',
    role: 'superadmin'
  }
];

const INITIAL_TEACHERS = [
  {
    id: 'teacher-1',
    name: 'أ. دحمان ناجي',
    role: 'المؤسس والمدير العام للأكاديمية',
    exp: 'خبرة تفوق 15 سنة في الإشراف التربوي والتعليم الجامعي اللغوي',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250',
    branch_id: 'French',
    is_of_the_month: true,
    month_text: 'أستاذ الشهر للغة الفرنسية 🌟'
  },
  {
    id: 'teacher-2',
    name: 'نسيمة بلحاج',
    role: 'برنامج ومسؤولة العلاقات الإدارية والقبول',
    exp: 'خبرة 7 سنوات في تنسيق وضبط الجداول وتجربة الطلاب بالأكاديميات',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250',
    branch_id: 'Skills',
    is_of_the_month: false
  },
  {
    id: 'teacher-3',
    name: 'سفيان تيجاني',
    role: 'أستاذ أول ومنسق دراسات اللغة الإنجليزية',
    exp: 'ماستر لغات أجنبية تطبيقية ومشارك في ورش مهارات الاتصال التفاعلية الدولية',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250',
    branch_id: 'English',
    is_of_the_month: true,
    month_text: 'أستاذ الشهر للغة الإنجليزية 🌟'
  }
];

const INITIAL_LESSONS = [
  {
    id: 'lesson-1',
    title: 'مراجعة اليوم الأول: أدوات التعريف والتنكير',
    course_id: 'course-2',
    course_name: 'اللغة الإنجليزية التفاعلية',
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800',
    description: 'اليوم قمنا بمراجعة شاملة لاستخدام أدوات التعريف (the) والتنكير (a, an) في اللغة الإنجليزية مع أمثلة عملية من الحياة اليومية. يرجى مراجعة الجدول المرفق في الصورة وحل التمارين المنزلية.',
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'lesson-2',
    title: 'Les Salutations et Présentations',
    course_id: 'course-1',
    course_name: 'اللغة الفرنسية (مبتدئ إلى B2)',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800',
    description: "Dans cette leçon, nous avons appris comment saluer et se présenter poliment en français. Révisez bien les expressions clés et entraînez-vous à prononcer à haute voix.",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

const INITIAL_ADMIN_MESSAGES = [
  {
    id: 'msg-1',
    title: 'ترحيب حار بجميع الطلاب الجدد 🌟',
    content: 'أهلاً ومرحباً بكم جميعاً في الفصل الدراسي الجديد لأكاديمية ناجي لتعليم اللغات والتطوير. نحن فخورون باختياركم لنا لتطوير مهاراتكم اللغوية والمهنية، ونتمنى لكم رحلة تعليمية ممتعة ومثمرة!',
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'msg-2',
    title: 'تنبيه هام بخصوص مواعيد الحصص وكشوف الحضور 🔔',
    content: 'نود تذكير كافة الطلاب بضرورة الالتزام التام بالوقت المحدد لكل حصة، وتأكيد حضوركم عبر بوابة الطالب قبل موعد الدرس لضمان حسن سير التدفقات ومزامنة الحضور بشكل آلي.',
    created_at: new Date().toISOString()
  }
];

const INITIAL_AUDIO_CLIPS = [
  {
    id: 'audio-1',
    title: 'محادثة استماع: التعارف اليومي في المطعم',
    course_id: 'course-2',
    course_name: 'اللغة الإنجليزية التفاعلية',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    description: 'استمع إلى الحوار القصير المرفق وركز على مخارج الحروف وطريقة نطق الكلمات الشائعة عند طلب الطعام في مطعم لندني.',
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'audio-2',
    title: "Exercice d'écoute: Se présenter et épeler",
    course_id: 'course-1',
    course_name: 'اللغة الفرنسية (مبتدئ إلى B2)',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    description: "Écoutez attentivement l'audio et essayez d'écrire les noms propres épelés par le locuteur. Un excellent exercice pour maîtriser l'alphabet.",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

const INITIAL_FAQS = [
  {
    id: 'faq-1',
    question: 'كيف يمكنني التسجيل في دورات اللغة الانجليزية أو الفرنسية بالأكاديمية؟',
    answer: 'يمكنك التسجيل بسهولة عن طريق اختيار الدورة المناسبة لك من صفحة "الدورات" والضغط على زر "حجز مقعد"، ثم ملء بياناتك ليتصل بك طاقمنا فوراً لتأكيد حجزك وتوجيهك.',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'faq-2',
    question: 'هل توفر أكاديمية ناجي شهادات معتمدة في نهاية التكوين؟',
    answer: 'نعم، تمنح أكاديمية ناجي لتمكين اللغات شهادات نجاح معتمدة وممضاة من طرف الأساتذة بعد اجتياز الامتحان التقييمي في نهاية كل مستوى دراسي بنجاح.',
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: 'faq-3',
    question: 'ما هي طرق تأكيد الحضور اليومي المعتمدة للطلبة؟',
    answer: 'يمكن للطالب تأكيد حضوره اليومي بسهولة بالدخول إلى "بوابة الطالب" الخاصة به والضغط على زر "تأكيد الحضور" تحت جدول الحصص اليومية، كما يمكن للإدارة تأكيد الحضور بعد الحصة يدوياً.',
    sort_order: 3,
    created_at: new Date().toISOString()
  }
];

const INITIAL_ROOMS = [
  { id: 'room-1', name: 'قاعة ابن خلدون (القاعة 1)', capacity: 25, created_at: new Date().toISOString() },
  { id: 'room-2', name: 'قاعة الخوارزمي (القاعة 2)', capacity: 25, created_at: new Date().toISOString() },
  { id: 'room-3', name: 'قاعة ابن رشد (القاعة 3)', capacity: 20, created_at: new Date().toISOString() }
];

const INITIAL_SCHEDULES = [
  {
    id: 'sched-1',
    course_id: 'course-1',
    course_name: 'اللغة الفرنسية (مبتدئ إلى B2)',
    room_id: 'room-1',
    room_name: 'قاعة ابن خلدون (القاعة 1)',
    day: 'Monday',
    start_time: '17:00',
    end_time: '19:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'sched-2',
    course_id: 'course-1',
    course_name: 'اللغة الفرنسية (مبتدئ إلى B2)',
    room_id: 'room-1',
    room_name: 'قاعة ابن خلدون (القاعة 1)',
    day: 'Wednesday',
    start_time: '17:00',
    end_time: '19:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'sched-3',
    course_id: 'course-2',
    course_name: 'اللغة الإنجليزية التفاعلية',
    room_id: 'room-2',
    room_name: 'قاعة الخوارزمي (القاعة 2)',
    day: 'Tuesday',
    start_time: '17:00',
    end_time: '19:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'sched-4',
    course_id: 'course-2',
    course_name: 'اللغة الإنجليزية التفاعلية',
    room_id: 'room-2',
    room_name: 'قاعة الخوارزمي (القاعة 2)',
    day: 'Thursday',
    start_time: '17:00',
    end_time: '19:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'sched-5',
    course_id: 'course-3',
    course_name: 'اللغة الإسبانية للمبتدئين',
    room_id: 'room-3',
    room_name: 'قاعة ابن رشد (القاعة 3)',
    day: 'Sunday',
    start_time: '09:00',
    end_time: '12:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'sched-6',
    course_id: 'course-4',
    course_name: 'مهارات التواصل المهني وإدارة المشاريع',
    room_id: 'room-3',
    room_name: 'قاعة ابن رشد (القاعة 3)',
    day: 'Saturday',
    start_time: '09:00',
    end_time: '13:00',
    created_at: new Date().toISOString()
  }
];

const INITIAL_LOGS = [
  {
    id: 'log-initial',
    admin_name: 'النظام الآلي',
    admin_role: 'superadmin',
    action: 'تثبيت النظام',
    details: 'تم تثبيت وتأهيل نظام أكاديمية ناجي لتعليم اللغات والتطوير بسيدي بلعباس بنجاح.',
    created_at: new Date().toISOString()
  }
];

const INITIAL_STUDENTS = [
  {
    id: 'student-test-1',
    student_code: 'NJ-2025-001',
    full_name: 'طالب تجريبي',
    phone: '0555000000',
    email: 'student@najiacademy.dz',
    password_hash: 'student123',
    notes: 'حساب تجريبي تم إنشاؤه تلقائياً أثناء تهيئة قاعدة البيانات.',
    created_at: new Date().toISOString()
  }
];

const INITIAL_ENROLLMENTS = [
  {
    id: 'enroll-test-1',
    student_id: 'student-test-1',
    course_id: 'course-1',
    amount_paid: 4500,
    enrolled_at: new Date().toISOString()
  }
];

const INITIAL_ATTENDANCE = [
  {
    id: 'attend-test-1',
    enrollment_id: 'enroll-test-1',
    session_date: new Date().toISOString().split('T')[0],
    confirmed: true,
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];

const INITIAL_LOGIN_FAILURES = [
  {
    id: 'init-log',
    count: 0,
    lockedUntil: 0,
    email: 'system@najiacademy.dz',
    created_at: new Date().toISOString()
  }
];

export async function seedFirestore() {
  try {
    const settingsDocRef = doc(db, 'site_settings', 'main');
    const settingsSnap = await getDoc(settingsDocRef);
    if (settingsSnap.exists()) {
      // Already seeded
      console.log('Firestore is already seeded.');
      return;
    }

    console.log('Seeding Firestore database with initial records...');

    // 1. Settings
    await setDoc(settingsDocRef, INITIAL_SITE_SETTINGS);

    // 2. Courses
    for (const c of INITIAL_COURSES) {
      await setDoc(doc(db, 'courses', c.id), c);
    }

    // 3. Reviews
    for (const r of INITIAL_REVIEWS) {
      await setDoc(doc(db, 'reviews', r.id), r);
    }

    // 4. Gallery
    for (const g of INITIAL_GALLERY) {
      await setDoc(doc(db, 'gallery', g.id), g);
    }

    // 5. Videos
    for (const v of INITIAL_VIDEOS) {
      await setDoc(doc(db, 'videos', v.id), v);
    }

    // 6. Subscriptions
    for (const s of INITIAL_SUBSCRIPTION_TYPES) {
      await setDoc(doc(db, 'subscription_types', s.id), s);
    }

    // 7. Bookings
    for (const b of INITIAL_BOOKINGS) {
      await setDoc(doc(db, 'bookings', b.id), b);
    }

    // 8. Admins (team)
    for (const member of INITIAL_TEAM_MEMBERS) {
      await setDoc(doc(db, 'admins', member.id), member);
    }

    // 9. Teachers
    for (const t of INITIAL_TEACHERS) {
      await setDoc(doc(db, 'teachers', t.id), t);
    }

    // 10. Lessons
    for (const l of INITIAL_LESSONS) {
      await setDoc(doc(db, 'daily_lessons', l.id), l);
    }

    // 11. Messages
    for (const m of INITIAL_ADMIN_MESSAGES) {
      await setDoc(doc(db, 'admin_messages', m.id), m);
    }

    // 12. Audio
    for (const cl of INITIAL_AUDIO_CLIPS) {
      await setDoc(doc(db, 'audio_clips', cl.id), cl);
    }

    // 13. FAQ
    for (const f of INITIAL_FAQS) {
      await setDoc(doc(db, 'faq', f.id), f);
    }

    // 14. Rooms
    for (const rm of INITIAL_ROOMS) {
      await setDoc(doc(db, 'rooms', rm.id), rm);
    }

    // 15. Schedules
    for (const s of INITIAL_SCHEDULES) {
      await setDoc(doc(db, 'schedules', s.id), s);
    }

    // 16. Logs
    for (const lg of INITIAL_LOGS) {
      await setDoc(doc(db, 'system_logs', lg.id), lg);
    }

    // 17. Students
    for (const student of INITIAL_STUDENTS) {
      await setDoc(doc(db, 'students', student.id), student);
    }

    // 18. Enrollments
    for (const enroll of INITIAL_ENROLLMENTS) {
      await setDoc(doc(db, 'enrollments', enroll.id), enroll);
    }

    // 19. Attendance
    for (const att of INITIAL_ATTENDANCE) {
      await setDoc(doc(db, 'attendance', att.id), att);
    }

    // 20. Login Failures
    for (const failure of INITIAL_LOGIN_FAILURES) {
      await setDoc(doc(db, 'login_failures', failure.id), failure);
    }

    console.log('Seeding completed successfully!');

    // Verify all 20 collections exist by retrieving at least one document
    const collectionsToVerify = [
      'admins', 'teachers', 'students', 'courses', 'bookings', 'reviews',
      'gallery', 'videos', 'site_settings', 'daily_lessons', 'admin_messages',
      'audio_clips', 'faq', 'rooms', 'schedules', 'subscription_types',
      'attendance', 'enrollments', 'system_logs', 'login_failures'
    ];
    console.log('Verifying all collections exist after seeding...');
    for (const colName of collectionsToVerify) {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) {
        throw new Error(`Verification failed: Collection ${colName} is empty after seeding!`);
      }
    }
    console.log('Verification successful! All 20 collections verified to exist.');

  } catch (error) {
    console.error('Error seeding Firestore:', error);
  }
}
