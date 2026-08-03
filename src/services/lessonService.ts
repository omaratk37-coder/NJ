import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, uploadBase64ToStorage } from './firebase';
import { DailyLesson, AdminMessage, AudioClip } from '../types';

const LESSONS_COL = 'daily_lessons';
const ADMIN_MESSAGES_COL = 'admin_messages';
const AUDIO_CLIPS_COL = 'audio_clips';

export const lessonService = {
  async list(): Promise<DailyLesson[]> {
    try {
      const q = collection(db, LESSONS_COL);
      const snapshot = await getDocs(q);
      const list: DailyLesson[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DailyLesson);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, LESSONS_COL);
    }
  },

  async create(lesson: Omit<DailyLesson, 'id' | 'created_at'>): Promise<DailyLesson> {
    try {
      const realImageUrl = await uploadBase64ToStorage(lesson.image_url || '', 'lessons');
      const payload = {
        ...lesson,
        image_url: realImageUrl,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, LESSONS_COL), payload);
      return { id: docRef.id, ...payload } as DailyLesson;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, LESSONS_COL);
    }
  },


  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, LESSONS_COL, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${LESSONS_COL}/${id}`);
    }
  }
};

export const adminMessageService = {
  async list(): Promise<AdminMessage[]> {
    try {
      const q = collection(db, ADMIN_MESSAGES_COL);
      const snapshot = await getDocs(q);
      const list: AdminMessage[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AdminMessage);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, ADMIN_MESSAGES_COL);
    }
  },

  async create(msg: Omit<AdminMessage, 'id' | 'created_at'>): Promise<AdminMessage> {
    try {
      const payload = {
        ...msg,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, ADMIN_MESSAGES_COL), payload);
      return { id: docRef.id, ...payload } as AdminMessage;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ADMIN_MESSAGES_COL);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, ADMIN_MESSAGES_COL, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${ADMIN_MESSAGES_COL}/${id}`);
    }
  }
};

export const audioClipService = {
  async list(): Promise<AudioClip[]> {
    try {
      const q = collection(db, AUDIO_CLIPS_COL);
      const snapshot = await getDocs(q);
      const list: AudioClip[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AudioClip);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, AUDIO_CLIPS_COL);
    }
  },

  async create(clip: Omit<AudioClip, 'id' | 'created_at'>): Promise<AudioClip> {
    try {
      const realAudioUrl = await uploadBase64ToStorage(clip.audio_url, 'audio');
      const payload = {
        ...clip,
        audio_url: realAudioUrl,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, AUDIO_CLIPS_COL), payload);
      return { id: docRef.id, ...payload } as AudioClip;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, AUDIO_CLIPS_COL);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, AUDIO_CLIPS_COL, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${AUDIO_CLIPS_COL}/${id}`);
    }
  }
};
