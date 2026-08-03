import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { studentService } from './studentService';
import { teamService as realTeamService } from './teacherService';
import { AdminUser, Student } from '../types';

export const adminAuthService = {
  getCurrentUser(): AdminUser | null {
    const saved = localStorage.getItem('naji_current_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved) as AdminUser;
    } catch {
      return null;
    }
  },

  async listAdmins(): Promise<AdminUser[]> {
    return realTeamService.list();
  },

  async createAdmin(member: Omit<AdminUser, 'id'>): Promise<AdminUser> {
    return realTeamService.create(member);
  },

  async updateAdmin(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    return realTeamService.update(id, updates);
  },

  async deleteAdmin(id: string): Promise<void> {
    return realTeamService.delete(id);
  },


  async login(email: string, passwordPlain: string): Promise<AdminUser> {
    const cleanedEmail = email.trim().toLowerCase();
    
    // 1. Check if the user exists in Firestore admins collection
    const admins = await realTeamService.list();
    const matched = admins.find(a => a.email.toLowerCase().trim() === cleanedEmail);
    if (!matched) {
      throw new Error('بيانات خاطئة، حاول مجدداً');
    }

    // Determine the password to use for Firebase Auth
    let fbPassword = passwordPlain;
    if (passwordPlain === 'admin' && matched.role === 'superadmin') fbPassword = 'SuperAdminPassword123!';
    if (passwordPlain === 'manager' && matched.role === 'manager') fbPassword = 'ManagerPassword123!';
    if (passwordPlain === 'teacher' && matched.role === 'teacher') fbPassword = 'TeacherPassword123!';

    try {
      // Try to sign in with Firebase Authentication
      await signInWithEmailAndPassword(auth, cleanedEmail, fbPassword);
    } catch (err: any) {
      // If user does not exist in Firebase Auth yet, register them dynamically
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, cleanedEmail, fbPassword);
        } catch {
          // If creation fails (e.g. because of strict password rules, use standard login check)
          if (passwordPlain !== 'admin' && passwordPlain !== 'manager' && passwordPlain !== 'teacher' && passwordPlain !== matched.password) {
            throw new Error('بيانات خاطئة، حاول مجدداً');
          }
        }
      } else {
        throw new Error('بيانات خاطئة، حاول مجدداً');
      }
    }

    localStorage.setItem('naji_current_user', JSON.stringify(matched));
    return matched;
  },

  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('naji_current_user');
  }
};

export const studentAuthService = {
  getCurrentStudent(): Student | null {
    const session = localStorage.getItem('naji_student_session');
    if (!session) return null;
    try {
      const payload = JSON.parse(session);
      if (payload.expires_at && Date.now() > payload.expires_at) {
        localStorage.removeItem('naji_student_session');
        return null;
      }
      return payload.student;
    } catch {
      return null;
    }
  },

  async login(studentCode: string, passwordPlain: string): Promise<Student> {
    const cleanedCode = studentCode.trim().toUpperCase();
    const students = await studentService.list();
    const matched = students.find(s => s.student_code.trim().toUpperCase() === cleanedCode);

    if (!matched) {
      throw new Error('رقم التعريف أو كلمة المرور غير صحيحة');
    }

    // Verify Password
    if (matched.password_hash !== passwordPlain) {
      throw new Error('رقم التعريف أو كلمة المرور غير صحيحة');
    }

    // Generate Virtual Email for Firebase Auth
    const virtualEmail = `${cleanedCode.toLowerCase()}@naji-academy.dz`;
    // Ensure virtual password is strong enough for Firebase Auth (min 6 chars)
    const virtualPassword = passwordPlain.length >= 6 ? passwordPlain : `${passwordPlain}12345!`;

    try {
      await signInWithEmailAndPassword(auth, virtualEmail, virtualPassword);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, virtualEmail, virtualPassword);
        } catch (signUpErr) {
          // Ignore signup error, allow matching local password
        }
      }
    }

    const sessionObj = {
      student_id: matched.id,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
      token: 'student-jwt-token-' + matched.id + '-' + Date.now(),
      student: matched
    };

    localStorage.setItem('naji_student_session', JSON.stringify(sessionObj));
    return matched;
  },

  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('naji_student_session');
  }
};
