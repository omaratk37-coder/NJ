import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ContactMessage, FAQ, Room, CourseSchedule, SystemLog, SubscriptionType } from '../types';

const CONTACT_COL = 'contact_messages';
const SETTINGS_COL = 'site_settings';
const FAQ_COL = 'faq';
const ROOMS_COL = 'rooms';
const SCHEDULES_COL = 'schedules';
const LOGS_COL = 'system_logs';
const SUBS_COL = 'subscription_types';

export const settingsService = {
  async get(): Promise<{ [key: string]: string }> {
    try {
      const docRef = doc(db, SETTINGS_COL, 'main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as { [key: string]: string };
      }
      return {}; // Fallback to empty, parent will handle seeding
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${SETTINGS_COL}/main`);
    }
  },

  async update(updates: { [key: string]: string }): Promise<void> {
    try {
      const docRef = doc(db, SETTINGS_COL, 'main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, updates);
      } else {
        await setDoc(docRef, updates);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${SETTINGS_COL}/main`);
    }
  }
};

export const contactService = {
  async list(): Promise<ContactMessage[]> {
    try {
      const q = collection(db, CONTACT_COL);
      const snapshot = await getDocs(q);
      const list: ContactMessage[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ContactMessage);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, CONTACT_COL);
    }
  },

  async submit(message: Omit<ContactMessage, 'id' | 'created_at'>): Promise<ContactMessage> {
    try {
      const payload = {
        ...message,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, CONTACT_COL), payload);
      return { id: docRef.id, ...payload } as ContactMessage;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, CONTACT_COL);
    }
  }
};

export const faqService = {
  async list(): Promise<FAQ[]> {
    try {
      const q = collection(db, FAQ_COL);
      const snapshot = await getDocs(q);
      const list: FAQ[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as FAQ);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, FAQ_COL);
    }
  },

  async create(faq: Omit<FAQ, 'id' | 'created_at'>): Promise<FAQ> {
    try {
      const payload = {
        ...faq,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, FAQ_COL), payload);
      return { id: docRef.id, ...payload } as FAQ;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, FAQ_COL);
    }
  },

  async update(id: string, updates: Partial<FAQ>): Promise<FAQ> {
    try {
      const docRef = doc(db, FAQ_COL, id);
      await updateDoc(docRef, updates);
      const snap = await getDocs(collection(db, FAQ_COL));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as FAQ), ...updates } as FAQ;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${FAQ_COL}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, FAQ_COL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${FAQ_COL}/${id}`);
    }
  }
};

export const roomService = {
  async list(): Promise<Room[]> {
    try {
      const q = collection(db, ROOMS_COL);
      const snapshot = await getDocs(q);
      const list: Room[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Room);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, ROOMS_COL);
    }
  },

  async create(room: Omit<Room, 'id' | 'created_at'>): Promise<Room> {
    try {
      const payload = {
        ...room,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, ROOMS_COL), payload);
      return { id: docRef.id, ...payload } as Room;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ROOMS_COL);
    }
  },

  async update(id: string, name: string, capacity?: number): Promise<Room> {
    try {
      const docRef = doc(db, ROOMS_COL, id);
      const updates = { name, capacity };
      await updateDoc(docRef, updates);
      const snap = await getDocs(collection(db, ROOMS_COL));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as Room), ...updates } as Room;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ROOMS_COL}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, ROOMS_COL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${ROOMS_COL}/${id}`);
    }
  }
};

export const scheduleService = {
  async list(): Promise<CourseSchedule[]> {
    try {
      const q = collection(db, SCHEDULES_COL);
      const snapshot = await getDocs(q);
      const list: CourseSchedule[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CourseSchedule);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, SCHEDULES_COL);
    }
  },

  async create(sched: Omit<CourseSchedule, 'id' | 'created_at'>): Promise<CourseSchedule> {
    try {
      const payload = {
        ...sched,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, SCHEDULES_COL), payload);
      return { id: docRef.id, ...payload } as CourseSchedule;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, SCHEDULES_COL);
    }
  },

  async update(id: string, updates: Partial<CourseSchedule>): Promise<CourseSchedule> {
    try {
      const docRef = doc(db, SCHEDULES_COL, id);
      await updateDoc(docRef, updates);
      const snap = await getDocs(collection(db, SCHEDULES_COL));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as CourseSchedule), ...updates } as CourseSchedule;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${SCHEDULES_COL}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, SCHEDULES_COL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${SCHEDULES_COL}/${id}`);
    }
  }
};

export const logService = {
  async list(): Promise<SystemLog[]> {
    try {
      const q = collection(db, LOGS_COL);
      const snapshot = await getDocs(q);
      const list: SystemLog[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as SystemLog);
      });
      // Sort logs newest first
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, LOGS_COL);
    }
  },

  async create(log: Omit<SystemLog, 'id' | 'created_at'>): Promise<SystemLog> {
    try {
      const payload = {
        ...log,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, LOGS_COL), payload);
      return { id: docRef.id, ...payload } as SystemLog;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, LOGS_COL);
    }
  },

  async clearAll(): Promise<void> {
    try {
      const q = collection(db, LOGS_COL);
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, LOGS_COL, d.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, LOGS_COL);
    }
  }
};

export const subscriptionTypeService = {
  async list(): Promise<SubscriptionType[]> {
    try {
      const q = collection(db, SUBS_COL);
      const snapshot = await getDocs(q);
      const list: SubscriptionType[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as SubscriptionType);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, SUBS_COL);
    }
  },

  async create(sub: Omit<SubscriptionType, 'id'>): Promise<SubscriptionType> {
    try {
      const payload = {
        ...sub,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, SUBS_COL), payload);
      return { id: docRef.id, ...payload } as SubscriptionType;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, SUBS_COL);
    }
  },

  async update(id: string, updates: Partial<SubscriptionType>): Promise<SubscriptionType> {
    try {
      const docRef = doc(db, SUBS_COL, id);
      await updateDoc(docRef, updates);
      const snap = await getDocs(collection(db, SUBS_COL));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as SubscriptionType), ...updates } as SubscriptionType;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${SUBS_COL}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, SUBS_COL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${SUBS_COL}/${id}`);
    }
  }
};
