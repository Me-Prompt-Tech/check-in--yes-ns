'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '../actions/auth';
import { ThemeToggle } from './ThemeToggle';

interface EmployeeSidebarProps {
  empName: string;
  isAdmin?: boolean;
}

export function EmployeeSidebar({ empName, isAdmin }: EmployeeSidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/');
    });
  };

  return (
    <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
      <div>
        {/* Profile Card */}
        <div className="flex items-center justify-between w-full mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md text-sm uppercase">
              {empName ? empName.charAt(0) : 'E'}
            </div>
            <div>
              <h2 className="font-extrabold tracking-tight text-sm text-slate-100">{empName || 'กำลังโหลด...'}</h2>
              <span className="text-xs text-slate-500">พนักงาน</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <a
            href="/employee"
            className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border-l-2 border-indigo-500 rounded-lg text-sm font-semibold text-indigo-400 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            บันทึกเวลา
          </a>
          <a
            href="/employee/leaves"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ใบลางาน
          </a>
          {isAdmin && (
            <a
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300 rounded-lg text-sm font-medium transition mt-4 border border-emerald-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              แผงควบคุมแอดมิน
            </a>
          )}
        </nav>
      </div>

      {/* Bottom: Change Password + Logout */}
      <div className="pt-6 border-t border-slate-800 mt-6 lg:mt-0 space-y-2">
        <a
          href="/change-password"
          className="w-full py-2.5 px-4 bg-slate-800/60 hover:bg-indigo-950/20 hover:text-indigo-400 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          เปลี่ยนรหัสผ่าน
        </a>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
