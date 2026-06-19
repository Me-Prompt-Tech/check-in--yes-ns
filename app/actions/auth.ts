'use server';

import { createSession, deleteSession, getSession } from '../lib/session';

export interface AuthResponse {
  success: boolean;
  error?: string;
  role?: 'admin' | 'employee';
}

export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };
  }

  // Admin login check
  if (username.toLowerCase() === 'admin' && password === 'password') {
    await createSession('Administrator', 'admin');
    return { success: true, role: 'admin' };
  }

  // Employee login check
  if (username.toLowerCase() === 'employee' && password === 'password') {
    await createSession('Employee User', 'employee');
    return { success: true, role: 'employee' };
  }

  return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

export async function logoutAction() {
  await deleteSession();
}

export async function checkCurrentSession() {
  return await getSession();
}
