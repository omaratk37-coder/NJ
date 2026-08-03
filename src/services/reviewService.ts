import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Review } from '../types';

const COLLECTION_NAME = 'reviews';

export const reviewService = {
  async list(): Promise<Review[]> {
    try {
      const q = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(q);
      const list: Review[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    }
  },

  async create(review: Omit<Review, 'id' | 'status' | 'created_at'>): Promise<Review> {
    try {
      if (!review.rating || review.rating < 1 || review.rating > 5) {
        throw new Error('الرجاء تحديد تقييم صالح بين 1 و 5 نجوم');
      }

      const payload = {
        ...review,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      const newReview = { id: docRef.id, ...payload } as Review;
      return newReview;
    } catch (error) {
      if (error instanceof Error && error.message.includes('تقييم')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  async approve(id: string): Promise<Review> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { status: 'approved' });
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as Review), status: 'approved' } as Review;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
