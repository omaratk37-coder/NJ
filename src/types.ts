export interface Course {
  id: string;
  name: string;
  language: string; // e.g., 'French', 'English', 'Spanish', 'Skills'
  level: string; // e.g., 'beginner', 'intermediate', 'advanced', 'all'
  duration: string; // e.g., '3 months'
  schedule: string; // e.g., 'Mon Wed 17:00'
  start_date: string; // YYYY-MM-DD
  max_seats: number;
  enrolled_count: number;
  price: number; // in DZD
  description: string;
  status: 'active' | 'paused';
  created_at?: string;
}

export interface Booking {
  id: string;
  student_name: string;
  phone: string;
  email?: string;
  course_id?: string;
  course_name?: string;
  message?: string;
  admin_notes?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

export interface Review {
  id: string;
  student_name: string;
  review_text: string;
  rating: number; // 1 to 5
  course_name?: string;
  status: 'pending' | 'approved';
  created_at: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  title: string;
  category: string; // e.g., 'قاعات', 'فعاليات', 'طلاب', 'مناسبات', 'عام'
  sort_order: number;
  created_at?: string;
}

export interface Video {
  id: string;
  title: string;
  embed_url: string;
  description?: string;
  is_featured: boolean;
  created_at?: string;
}

export interface AdminUser {
  id: string;
  user_id?: string;
  name: string;
  email: string; // We'll add email for auth management
  role: 'superadmin' | 'manager' | 'teacher';
  password?: string;
  created_at?: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  updated_at?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  created_at: string;
}

export interface Student {
  id: string;
  student_code: string;
  full_name: string;
  phone: string;
  email?: string;
  password_hash: string;
  notes?: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  amount_paid: number;
  enrolled_at: string;
  sub_type?: string;
  sub_price?: number;
  sub_duration?: string;
  sub_sessions?: number;
  sub_end_date?: string;
}

export interface Attendance {
  id: string;
  enrollment_id: string;
  session_date: string;
  confirmed: boolean;
  confirmed_at?: string;
  created_at: string;
  attended_after_session?: boolean;
  rejected?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  role: string;
  exp: string;
  avatar: string;
  branch_id?: string; // Links to language/branch id (e.g. 'French', 'English')
  is_of_the_month?: boolean; // Teacher of the month flag
  month_text?: string; // Text to display like (أستاذ شهر جوان 2026 🌟)
  created_at?: string;
}

export interface DailyLesson {
  id: string;
  title: string;
  course_id: string;
  course_name: string;
  image_url: string;
  description: string;
  created_at: string;
}

export interface AdminMessage {
  id: string;
  title: string;
  content: string;
  course_id?: string; // Optional: targeted to a course, or general to all
  course_name?: string; // Optional: helper course name
  created_at: string;
}

export interface AudioClip {
  id: string;
  title: string;
  course_id: string;
  course_name: string;
  audio_url: string;
  description?: string;
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order?: number;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  capacity?: number;
  created_at: string;
}

export interface CourseSchedule {
  id: string;
  course_id: string;
  course_name: string;
  room_id: string;
  room_name: string;
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';
  start_time: string; // e.g., '17:00'
  end_time: string;   // e.g., '19:00'
  created_at: string;
}

export interface SystemLog {
  id: string;
  admin_name: string;
  admin_role: string;
  action: string;
  details: string;
  created_at: string;
}

export interface SubscriptionType {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  created_at?: string;
}




