import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Course } from '../types';

const COLLECTION_NAME = 'courses';

export const courseService = {
  async list(): Promise<Course[]> {
    try {
      const q = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(q);
      const list: Course[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Course);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    }
  },

  async create(course: Omit<Course, 'id' | 'enrolled_count'>): Promise<Course> {
    try {
      const ref = collection(db, COLLECTION_NAME);
      const payload = {
        ...course,
        enrolled_count: 0,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(ref, payload);
      return { id: docRef.id, ...payload } as Course;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  async update(id: string, updates: Partial<Course>): Promise<Course> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
      return { id, ...updates } as Course;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);

      // Cascade cancel pending bookings under this course as requested
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('course_id', '==', id), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      for (const bookingDoc of snapshot.docs) {
        await updateDoc(doc(db, 'bookings', bookingDoc.id), {
          status: 'rejected',
          admin_notes: 'ألغي الحجز آلياً بسبب إلغاء/حذف الدورة.'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
