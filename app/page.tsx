'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, checkCurrentSession } from './actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in, redirect them
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await checkCurrentSession();
        if (session) {
          if (session.role === 'admin') {
            router.push('/admin');
          } else if (session.role === 'employee') {
            router.push('/employee');
          }
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res.success) {
        if (res.role === 'admin') {
          router.push('/admin');
        } else if (res.role === 'employee') {
          router.push('/employee');
        }
      } else {
        setError(res.error || 'การเข้าสู่ระบบล้มเหลว');
      }
    });
  };

  const fillCredentials = (userType: 'admin' | 'employee') => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('password');
    } else {
      setUsername('employee');
      setPassword('password');
    }
    setError('');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 font-medium animate-pulse">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Decorative background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl p-8 relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
            <img
              src="/img/logo.jpg"
              alt="Company Logo"
              className="relative h-24 w-24 rounded-full object-cover border border-slate-700 shadow-md"
              onError={(e) => {
                // Fallback icon if image doesn't load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            ลงชื่อเข้าใช้งานระบบลงเวลาทำงาน (Attendance System)
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้ เช่น admin หรือ employee"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
              disabled={isPending}
              required
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                รหัสผ่าน (Password)
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-xs text-slate-500 hover:text-indigo-400 transition"
              >
                ลืมรหัสผ่าน?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
              disabled={isPending}
              required
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 text-sm text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              จดจำการเข้าสู่ระบบ
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>

        {/* Quick Testing Options */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            ทดลองเข้าสู่ระบบ (Quick Test)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fillCredentials('admin')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 rounded-xl text-xs font-medium text-slate-300 transition hover:border-slate-700 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              สิทธิ์ Admin
            </button>
            <button
              onClick={() => fillCredentials('employee')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 rounded-xl text-xs font-medium text-slate-300 transition hover:border-slate-700 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              สิทธิ์พนักงาน
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-600">
          © 2026 Company Name. All rights reserved.
        </div>

      </div>

    </div>
  );
}