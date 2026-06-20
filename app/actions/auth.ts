'use server';

import { createSession, deleteSession, getSession } from '../lib/session';
import prisma from '../lib/db';
import { seedDatabase } from './seed';

export interface AuthResponse {
  success: boolean;
  error?: string;
  role?: 'admin' | 'employee';
}

export interface ChangePasswordResponse {
  success: boolean;
  error?: string;
}

export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const usernameInput = (formData.get('username') as string || '').trim();
  const passwordInput = formData.get('password') as string || '';

  if (!usernameInput || !passwordInput) {
    return { success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };
  }

  // Ensure DB has initial database records
  await seedDatabase();

  try {
    const user = await prisma.employee.findFirst({
      where: {
        username: {
          equals: usernameInput,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    if (user.status !== 'active') {
      return { success: false, error: 'บัญชีผู้ใช้ของคุณถูกระงับการใช้งาน' };
    }

    // Direct password match (in real prod, use bcrypt)
    if (user.password !== passwordInput) {
      return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    const displayName = `${user.firstName} ${user.lastName}`;
    const roleType = (user.roleType === 'admin') ? 'admin' : 'employee';

    await createSession(user.id, user.username, displayName, roleType);

    return { success: true, role: roleType };
  } catch (err) {
    console.error('Login database query error:', err);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' };
  }
}

export async function logoutAction() {
  await deleteSession();
}

export async function checkCurrentSession() {
  return await getSession();
}

export async function changePasswordAction(formData: FormData): Promise<ChangePasswordResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' };
  }

  try {
    const user = await prisma.employee.findUnique({
      where: {
        id: session.userId
      }
    });

    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้ในระบบ' };
    }

    if (currentPassword !== user.password) {
      return { success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' };
    }

    if (newPassword === currentPassword) {
      return { success: false, error: 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน' };
    }

    await prisma.employee.update({
      where: {
        id: session.userId
      },
      data: {
        password: newPassword,
        forcePasswordChange: false // Turn off flag if they successfully change it
      }
    });

    return { success: true };
  } catch (err) {
    console.error('Change password database query error:', err);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' };
  }
}
