import 'server-only';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'user_session';

export interface SessionData {
  username: string;
  role: 'admin' | 'employee';
}

export async function createSession(username: string, role: 'admin' | 'employee') {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const sessionData: SessionData = { username, role };
  const serialized = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, serialized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }
  
  try {
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as SessionData;
    
    if (parsed && parsed.username && (parsed.role === 'admin' || parsed.role === 'employee')) {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse session cookie', error);
  }
  
  return null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
