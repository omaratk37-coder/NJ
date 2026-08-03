import { onSnapshot, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db as fdb, auth } from '../services/firebase';
import { seedFirestore } from '../services/seed';
import { adminAuthService, studentAuthService } from '../services/authService';
import { courseService } from '../services/courseService';
import { bookingService } from '../services/bookingService';
import { reviewService } from '../services/reviewService';
import { galleryService, videoService } from '../services/galleryService';
import { studentService, enrollmentService, attendanceService } from '../services/studentService';
import { teacherService, teamService } from '../services/teacherService';
import { lessonService, adminMessageService, audioClipService } from '../services/lessonService';
import { settingsService, contactService, faqService, roomService, scheduleService, logService, subscriptionTypeService } from '../services/settingsService';

import {
  Course, Booking, Review, GalleryImage, Video, AdminUser,
  ContactMessage, Student, Enrollment, Attendance, Teacher,
  DailyLesson, AdminMessage as AdminMessageType, AudioClip, FAQ,
  Room, CourseSchedule, SystemLog, SubscriptionType
} from '../types';

const REALTIME_EVENT = 'naji_academy_realtime_sync';

// Map database collections to local storage event names expected by the UI
const collectionToEventKey: { [col: string]: string } = {
  courses: 'naji_courses',
  bookings: 'naji_bookings',
  reviews: 'naji_reviews',
  gallery: 'naji_gallery',
  videos: 'naji_videos',
  admins: 'naji_admins',
  teachers: 'naji_teachers',
  students: 'naji_students',
  enrollments: 'naji_enrollments',
  attendance: 'naji_attendance',
  daily_lessons: 'naji_lessons',
  admin_messages: 'naji_admin_messages',
  audio_clips: 'naji_audio_clips',
  faq: 'naji_faq',
  rooms: 'naji_rooms',
  schedules: 'naji_schedules',
  system_logs: 'naji_system_logs',
  subscription_types: 'naji_subscription_types'
};

// Real-time caches for instant rendering
const cache: { [key: string]: any[] } = {};

let activeUnsubscribes: (() => void)[] = [];

export function initRealtimeListeners() {
  // Clear any existing listeners to avoid multiple parallel subscriptions
  activeUnsubscribes.forEach(unsub => unsub());
  activeUnsubscribes = [];

  Object.keys(collectionToEventKey).forEach(colName => {
    const eventKey = collectionToEventKey[colName];
    try {
      const unsub = onSnapshot(collection(fdb, colName), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        cache[colName] = list;

        // Update localStorage synchronously to match initial-render assumptions in components
        localStorage.setItem(eventKey, JSON.stringify(list));

        // Dispatch custom sync event
        window.dispatchEvent(new CustomEvent(REALTIME_EVENT, {
          detail: { key: eventKey, value: list }
        }));
      }, (error) => {
        console.warn(`Snapshot listener for ${colName} closed/failed:`, error.message);
      });
      activeUnsubscribes.push(unsub);
    } catch (error: any) {
      console.warn(`Failed to create snapshot listener for ${colName}:`, error.message);
    }
  });
}

// Auto-seed and initialize listeners on module load, re-bind on authentication state changes
(async () => {
  try {
    await seedFirestore();
    initRealtimeListeners();

    // Re-initialize listeners whenever Auth state changes so that proper permission-bound datasets
    // (such as bookings, logs) load automatically in real-time as soon as the Admin logs in.
    onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed, re-binding snapshot listeners. Logged-in user:', user?.email);
      initRealtimeListeners();
    });
  } catch (err) {
    console.error('Failed to initialize or seed Firebase:', err);
  }
})();

export function subscribeToRealtime(callback: (key: string, data: any) => void) {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail) {
      callback(customEvent.detail.key, customEvent.detail.value);
    }
  };
  window.addEventListener(REALTIME_EVENT, handler);
  return () => window.removeEventListener(REALTIME_EVENT, handler);
}

// Complete behavioral exact match facade mapping original db calls to Firestore services
export const db = {
  auth: adminAuthService,
  studentAuth: studentAuthService,

  courses: {
    list: () => courseService.list(),
    create: (course: Omit<Course, 'id' | 'enrolled_count'>) => courseService.create(course),
    update: (id: string, updates: Partial<Course>) => courseService.update(id, updates),
    delete: (id: string) => courseService.delete(id)
  },

  bookings: {
    list: () => bookingService.list(),
    create: (booking: Omit<Booking, 'id' | 'status' | 'created_at'>) => bookingService.create(booking),
    updateStatus: (id: string, status: 'confirmed' | 'rejected' | 'pending') => bookingService.updateStatus(id, status),
    updateNotes: (id: string, admin_notes: string) => bookingService.updateNotes(id, admin_notes),
    delete: (id: string) => bookingService.delete(id)
  },

  reviews: {
    list: () => reviewService.list(),
    create: (review: Omit<Review, 'id' | 'status' | 'created_at'>) => reviewService.create(review),
    approve: (id: string) => reviewService.approve(id),
    delete: (id: string) => reviewService.delete(id)
  },

  gallery: {
    list: () => galleryService.list(),
    create: (image: Omit<GalleryImage, 'id' | 'sort_order'>) => galleryService.create(image),
    uploadAndCreate: (imageUrl: string, title: string, category: string) => galleryService.uploadAndCreate(imageUrl, title, category),
    updateTitle: (id: string, title: string) => galleryService.updateTitle(id, title),
    updateTitleAndCategory: (id: string, title: string, category: string) => galleryService.updateTitleAndCategory(id, title, category),
    reorder: (orderedImages: GalleryImage[]) => galleryService.reorder(orderedImages),
    delete: (id: string) => galleryService.delete(id)
  },

  videos: {
    list: () => videoService.list(),
    create: (video: Omit<Video, 'id'>) => videoService.create(video),
    update: (id: string, updates: Partial<Video>) => videoService.update(id, updates),
    toggleFeatured: (id: string) => videoService.toggleFeatured(id),
    updateTitle: (id: string, title: string) => videoService.updateTitle(id, title),
    delete: (id: string) => videoService.delete(id)
  },

  contact: {
    list: () => contactService.list(),
    submit: (message: Omit<ContactMessage, 'id' | 'created_at'>) => contactService.submit(message)
  },

  settings: {
    get: () => settingsService.get(),
    update: (updates: { [key: string]: string }) => settingsService.update(updates)
  },

  team: {
    list: () => teamService.list(),
    create: (member: Omit<AdminUser, 'id'>) => teamService.create(member),
    update: (id: string, updates: Partial<AdminUser>) => teamService.update(id, updates),
    delete: (id: string) => teamService.delete(id)
  },

  teachers: {
    list: () => teacherService.list(),
    create: (teacher: Omit<Teacher, 'id'>) => teacherService.create(teacher),
    update: (id: string, updates: Partial<Teacher>) => teacherService.update(id, updates),
    delete: (id: string) => teacherService.delete(id)
  },

  students: {
    list: () => studentService.list(),
    create: (student: Omit<Student, 'id' | 'student_code' | 'created_at'>) => studentService.create(student),
    updatePassword: (id: string, newHash: string) => studentService.updatePassword(id, newHash),
    updateNotes: (id: string, notes: string) => studentService.updateNotes(id, notes),
    delete: (id: string) => studentService.delete(id)
  },

  enrollments: {
    list: () => enrollmentService.list(),
    create: (enrollment: Omit<Enrollment, 'id' | 'enrolled_at'>) => enrollmentService.create(enrollment),
    delete: (id: string) => enrollmentService.delete(id)
  },

  attendance: {
    list: () => attendanceService.list(),
    create: (attendance: Omit<Attendance, 'id' | 'confirmed' | 'confirmed_at' | 'created_at'>) => attendanceService.create(attendance),
    confirm: (id: string, confirmed: boolean) => attendanceService.confirm(id, confirmed),
    reject: (id: string) => attendanceService.reject(id),
    confirmAfterSession: (id: string, attendedAfter: boolean) => attendanceService.confirmAfterSession(id, attendedAfter),
    delete: (id: string) => attendanceService.delete(id)
  },

  lessons: {
    list: () => lessonService.list(),
    create: (lesson: Omit<DailyLesson, 'id' | 'created_at'>) => lessonService.create(lesson),
    delete: (id: string) => lessonService.delete(id)
  },

  adminMessages: {
    list: () => adminMessageService.list(),
    create: (msg: Omit<AdminMessageType, 'id' | 'created_at'>) => adminMessageService.create(msg),
    delete: (id: string) => adminMessageService.delete(id)
  },

  audioClips: {
    list: () => audioClipService.list(),
    create: (clip: Omit<AudioClip, 'id' | 'created_at'>) => audioClipService.create(clip),
    delete: (id: string) => audioClipService.delete(id)
  },

  faq: {
    list: () => faqService.list(),
    create: (faq: Omit<FAQ, 'id' | 'created_at'>) => faqService.create(faq),
    update: (id: string, updates: Partial<FAQ>) => faqService.update(id, updates),
    delete: (id: string) => faqService.delete(id)
  },

  rooms: {
    list: () => roomService.list(),
    create: (room: Omit<Room, 'id' | 'created_at'>) => roomService.create(room),
    update: (id: string, name: string, capacity?: number) => roomService.update(id, name, capacity),
    delete: (id: string) => roomService.delete(id)
  },

  schedules: {
    list: () => scheduleService.list(),
    create: (sched: Omit<CourseSchedule, 'id' | 'created_at'>) => scheduleService.create(sched),
    update: (id: string, updates: Partial<CourseSchedule>) => scheduleService.update(id, updates),
    delete: (id: string) => scheduleService.delete(id)
  },

  logs: {
    list: () => logService.list(),
    create: (log: Omit<SystemLog, 'id' | 'created_at'>) => logService.create(log),
    clearAll: () => logService.clearAll()
  },

  subscriptionTypes: {
    list: () => subscriptionTypeService.list(),
    create: (sub: Omit<SubscriptionType, 'id'>) => subscriptionTypeService.create(sub),
    update: (id: string, updates: Partial<SubscriptionType>) => subscriptionTypeService.update(id, updates),
    delete: (id: string) => subscriptionTypeService.delete(id)
  }
};
