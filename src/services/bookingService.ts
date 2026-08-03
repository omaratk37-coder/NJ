import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Booking, Course } from '../types';

const COLLECTION_NAME = 'bookings';

export const bookingService = {
  async list(): Promise<Booking[]> {
    try {
      const q = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(q);
      const list: Booking[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Booking);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    }
  },

  async create(booking: Omit<Booking, 'id' | 'status' | 'created_at'>): Promise<Booking> {
    try {
      const list = await this.list();
      
      // Validate rate limit: Max 3 bookings per phone number per day
      const phoneBookingsToday = list.filter(b => {
        const isSamePhone = b.phone === booking.phone;
        const isToday = new Date(b.created_at).toDateString() === new Date().toDateString();
        return isSamePhone && isToday;
      });
      if (phoneBookingsToday.length >= 3) {
        throw new Error('تجاوزت الحد الأقصى للحجوزات اليومية (3 مرات كحد أقصى في اليوم)');
      }

      // Check seat capacity on course
      if (booking.course_id) {
        const courseDocRef = doc(db, 'courses', booking.course_id);
        const courseSnap = await getDocs(collection(db, 'courses'));
        const courseDoc = courseSnap.docs.find(d => d.id === booking.course_id);
        if (courseDoc) {
          const courseData = courseDoc.data() as Course;
          if (courseData.enrolled_count >= courseData.max_seats) {
            throw new Error('هذه الدورة مكتملة المقاعد حالياً — تواصل معنا للانضمام لقائمة الانتظار');
          }
        }
      }

      const payload = {
        ...booking,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      const newBooking = { id: docRef.id, ...payload } as Booking;

      console.log('[Notification Callback - New Booking Created]', newBooking);
      return newBooking;
    } catch (error) {
      if (error instanceof Error && error.message.includes('الحجوزات') || error.message.includes('مكتملة')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  async updateStatus(id: string, status: 'confirmed' | 'rejected' | 'pending'): Promise<Booking> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      let updatedBooking: Booking | null = null;

      await runTransaction(db, async (transaction) => {
        const bookingSnap = await transaction.get(docRef);
        if (!bookingSnap.exists()) throw new Error('Booking not found');
        const bookingData = bookingSnap.data() as Booking;
        const oldStatus = bookingData.status;
        const courseId = bookingData.course_id;

        transaction.update(docRef, { status });
        updatedBooking = { ...bookingData, status, id } as Booking;

        if (courseId) {
          const courseRef = doc(db, 'courses', courseId);
          const courseSnap = await transaction.get(courseRef);
          if (courseSnap.exists()) {
            const courseData = courseSnap.data() as Course;
            let change = 0;
            if (status === 'confirmed' && oldStatus !== 'confirmed') {
              change = 1;
            } else if (status !== 'confirmed' && oldStatus === 'confirmed') {
              change = -1;
            }

            if (change !== 0) {
              const newCount = Math.max(0, Math.min(courseData.max_seats, (courseData.enrolled_count || 0) + change));
              transaction.update(courseRef, { enrolled_count: newCount });
            }
          }
        }
      });

      return updatedBooking!;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  async updateNotes(id: string, admin_notes: string): Promise<Booking> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { admin_notes });
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as Booking), admin_notes } as Booking;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      await runTransaction(db, async (transaction) => {
        const bookingSnap = await transaction.get(docRef);
        if (!bookingSnap.exists()) return;
        const booking = bookingSnap.data() as Booking;

        transaction.delete(docRef);

        if (booking.status === 'confirmed' && booking.course_id) {
          const courseRef = doc(db, 'courses', booking.course_id);
          const courseSnap = await transaction.get(courseRef);
          if (courseSnap.exists()) {
            const courseData = courseSnap.data() as Course;
            const newCount = Math.max(0, (courseData.enrolled_count || 1) - 1);
            transaction.update(courseRef, { enrolled_count: newCount });
          }
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
