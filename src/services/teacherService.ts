import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Teacher, AdminUser } from '../types';

const TEACHERS_COL = 'teachers';
const TEAM_COL = 'admins'; // Note: collections to create list admins

export const teacherService = {
  async list(): Promise<Teacher[]> {
    try {
      const q = collection(db, TEACHERS_COL);
      const snapshot = await getDocs(q);
      const list: Teacher[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Teacher);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, TEACHERS_COL);
    }
  },

  async create(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    try {
      const ref = collection(db, TEACHERS_COL);
      const payload = {
        ...teacher,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(ref, payload);
      return { id: docRef.id, ...payload } as Teacher;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, TEACHERS_COL);
    }
  },

  async update(id: string, updates: Partial<Teacher>): Promise<Teacher> {
    try {
      const docRef = doc(db, TEACHERS_COL, id);
      await updateDoc(docRef, updates);
      return { id, ...updates } as Teacher;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${TEACHERS_COL}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, TEACHERS_COL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${TEACHERS_COL}/${id}`);
    }
  }
};

export const teamService = {
  async list(): Promise<AdminUser[]> {
    try {
      const q = collection(db, TEAM_COL);
      const snapshot = await getDocs(q);
      const list: AdminUser[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AdminUser);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, TEAM_COL);
    }
  },

  async create(member: Omit<AdminUser, 'id'>): Promise<AdminUser> {
    try {
      const ref = collection(db, TEAM_COL);
      const payload = {
        ...member,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(ref, payload);
      return { id: docRef.id, ...payload } as AdminUser;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, TEAM_COL);
    }
  },

  async update(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    try {
      const docRef = doc(db, TEAM_COL, id);
      await updateDoc(docRef, updates);
      return { id, ...updates } as AdminUser;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${TEAM_COL}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, TEAM_COL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${TEAM_COL}/${id}`);
    }
  }
};
