import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, runTransaction } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Student, Enrollment, Attendance } from '../types';

const STUDENTS_COL = 'students';
const ENROLLMENTS_COL = 'enrollments';
const ATTENDANCE_COL = 'attendance';

export const studentService = {
  async list(): Promise<Student[]> {
    try {
      const q = collection(db, STUDENTS_COL);
      const snapshot = await getDocs(q);
      const list: Student[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Student);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, STUDENTS_COL);
    }
  },

  async create(student: Omit<Student, 'id' | 'student_code' | 'created_at'>): Promise<Student> {
    try {
      const list = await this.list();
      
      // Auto-generate student_code formatted like NJ-2025-001
      let maxNumber = 0;
      list.forEach(s => {
        const match = s.student_code.match(/NJ-2025-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      });
      const nextNumber = maxNumber + 1;
      const studentCode = `NJ-2025-${String(nextNumber).padStart(3, '0')}`;

      const payload = {
        ...student,
        student_code: studentCode,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, STUDENTS_COL), payload);
      return { id: docRef.id, ...payload } as Student;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, STUDENTS_COL);
    }
  },

  async updatePassword(id: string, newHash: string): Promise<void> {
    try {
      const docRef = doc(db, STUDENTS_COL, id);
      await updateDoc(docRef, { password_hash: newHash });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COL}/${id}`);
    }
  },

  async updateNotes(id: string, notes: string): Promise<void> {
    try {
      const docRef = doc(db, STUDENTS_COL, id);
      await updateDoc(docRef, { notes });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COL}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Cascade delete enrollments and decrement course enrolled counters
      const enrollmentsRef = collection(db, ENROLLMENTS_COL);
      const q = query(enrollmentsRef, where('student_id', '==', id));
      const snapshot = await getDocs(q);
      
      for (const enrollDoc of snapshot.docs) {
        await enrollmentService.delete(enrollDoc.id);
      }

      await deleteDoc(doc(db, STUDENTS_COL, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${STUDENTS_COL}/${id}`);
    }
  }
};

export const enrollmentService = {
  async list(): Promise<Enrollment[]> {
    try {
      const q = collection(db, ENROLLMENTS_COL);
      const snapshot = await getDocs(q);
      const list: Enrollment[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Enrollment);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, ENROLLMENTS_COL);
    }
  },

  async create(enrollment: Omit<Enrollment, 'id' | 'enrolled_at'>): Promise<Enrollment> {
    try {
      const newEnrollment: Enrollment = {
        ...enrollment,
        id: 'enroll-' + Date.now() + Math.random().toString(36).substring(2, 6),
        enrolled_at: new Date().toISOString()
      };

      // Add to Firestore
      await addDoc(collection(db, ENROLLMENTS_COL), newEnrollment);

      // Increment course enrolled count via transaction or basic doc update
      await runTransaction(db, async (transaction) => {
        const courseRef = doc(db, 'courses', enrollment.course_id);
        const courseDoc = await transaction.get(courseRef);
        if (courseDoc.exists()) {
          const data = courseDoc.data();
          const currentCount = data.enrolled_count || 0;
          const maxSeats = data.max_seats || 25;
          const newCount = Math.min(maxSeats, currentCount + 1);
          transaction.update(courseRef, { enrolled_count: newCount });
        }
      });

      return newEnrollment;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ENROLLMENTS_COL);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const q = query(collection(db, ENROLLMENTS_COL), where('id', '==', id));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      const docSnap = snapshot.docs[0];
      const enrollment = docSnap.data() as Enrollment;

      // Delete enrollment document
      await deleteDoc(doc(db, ENROLLMENTS_COL, docSnap.id));

      // Decrement course count
      await runTransaction(db, async (transaction) => {
        const courseRef = doc(db, 'courses', enrollment.course_id);
        const courseDoc = await transaction.get(courseRef);
        if (courseDoc.exists()) {
          const data = courseDoc.data();
          const currentCount = data.enrolled_count || 0;
          const newCount = Math.max(0, currentCount - 1);
          transaction.update(courseRef, { enrolled_count: newCount });
        }
      });

      // Cascade delete attendance
      const attendanceRef = collection(db, ATTENDANCE_COL);
      const qA = query(attendanceRef, where('enrollment_id', '==', id));
      const snapA = await getDocs(qA);
      for (const docA of snapA.docs) {
        await deleteDoc(doc(db, ATTENDANCE_COL, docA.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${ENROLLMENTS_COL}/${id}`);
    }
  }
};

export const attendanceService = {
  async list(): Promise<Attendance[]> {
    try {
      const q = collection(db, ATTENDANCE_COL);
      const snapshot = await getDocs(q);
      const list: Attendance[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Attendance);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, ATTENDANCE_COL);
    }
  },

  async create(attendance: Omit<Attendance, 'id' | 'confirmed' | 'confirmed_at' | 'created_at'>): Promise<Attendance> {
    try {
      const newAttendance: Attendance = {
        ...attendance,
        id: 'attend-' + Date.now() + Math.random().toString(36).substring(2, 6),
        confirmed: false,
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, ATTENDANCE_COL), newAttendance);
      return newAttendance;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ATTENDANCE_COL);
    }
  },

  async confirm(id: string, confirmed: boolean): Promise<Attendance> {
    try {
      const q = query(collection(db, ATTENDANCE_COL), where('id', '==', id));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error('Session not found');
      const docId = snapshot.docs[0].id;
      const data = snapshot.docs[0].data() as Attendance;

      const updates: Partial<Attendance> = {
        confirmed,
        confirmed_at: confirmed ? new Date().toISOString() : undefined,
        rejected: false,
        attended_after_session: confirmed ? data.attended_after_session : false
      };

      await updateDoc(doc(db, ATTENDANCE_COL, docId), updates);
      return { ...data, ...updates, id } as Attendance;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ATTENDANCE_COL}/${id}`);
    }
  },

  async reject(id: string): Promise<Attendance> {
    try {
      const q = query(collection(db, ATTENDANCE_COL), where('id', '==', id));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error('Session not found');
      const docId = snapshot.docs[0].id;
      const data = snapshot.docs[0].data() as Attendance;

      const updates: Partial<Attendance> = {
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        rejected: true,
        attended_after_session: false
      };

      await updateDoc(doc(db, ATTENDANCE_COL, docId), updates);
      return { ...data, ...updates, id } as Attendance;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ATTENDANCE_COL}/${id}`);
    }
  },

  async confirmAfterSession(id: string, attendedAfter: boolean): Promise<Attendance> {
    try {
      const q = query(collection(db, ATTENDANCE_COL), where('id', '==', id));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error('Session not found');
      const docId = snapshot.docs[0].id;
      const data = snapshot.docs[0].data() as Attendance;

      const updates: Partial<Attendance> = {
        attended_after_session: attendedAfter,
        confirmed: attendedAfter ? true : data.confirmed,
        confirmed_at: attendedAfter ? new Date().toISOString() : data.confirmed_at,
        rejected: attendedAfter ? false : data.rejected
      };

      await updateDoc(doc(db, ATTENDANCE_COL, docId), updates);
      return { ...data, ...updates, id } as Attendance;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ATTENDANCE_COL}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const q = query(collection(db, ATTENDANCE_COL), where('id', '==', id));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      await deleteDoc(doc(db, ATTENDANCE_COL, snapshot.docs[0].id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${ATTENDANCE_COL}/${id}`);
    }
  }
};
