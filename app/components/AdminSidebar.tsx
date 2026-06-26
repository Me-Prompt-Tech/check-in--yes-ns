'use client';

import React, { useTransition, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '../actions/auth';
import { ThemeToggle } from './ThemeToggle';
import { getPendingLeavesCountAction } from '../actions/leaves';

interface AdminSidebarProps {
  activePath: string;
  userId: string;
  isPending?: boolean;
}

export function AdminSidebar({ activePath, userId, isPending = false }: AdminSidebarProps) {
  const router = useRouter();
  const [isTransitioning, startTransition] = useTransition();
  const isLoading = isPending || isTransitioning;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      try {
        const count = await getPendingLeavesCountAction();
        setPendingCount(count);
      } catch (err) {}
    }
    loadCount();
    // Optional: Set an interval to refresh the count every minute
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/');
    });
  };

  const isFullAdmin = userId.startsWith('ADM');

  const links = [
    {
      path: '/admin',
      label: 'ภาพรวมการเข้างาน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      )
    },
    {
      path: '/admin/employees',
      label: 'จัดการข้อมูลพนักงาน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      )
    },
    {
      path: '/admin/departments',
      label: 'จัดการแผนก',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      )
    },
    {
      path: '/admin/leaves',
      label: 'คำขอลางาน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  if (isFullAdmin) {
    links.push({
      path: '/admin/reports',
      label: 'ออกรายงาน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    });
  }

  // Employee Mode button for Sub-Admins
  if (!isFullAdmin) {
    links.push({
      path: '/employee',
      label: 'โหมดพนักงาน',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    });
  }

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center justify-between w-full mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
              A
            </div>
            <div>
              <h2 className="font-extrabold tracking-tight text-md">AttendHub</h2>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">แผงควบคุมแอดมิน</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {links.map(link => {
            const isActive = activePath === link.path;
            const activeClasses = "bg-indigo-600/10 border-l-2 border-indigo-500 text-indigo-400";
            const inactiveClasses = "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent";
            
            return (
              <a
                key={link.path}
                href={link.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition ${isActive ? activeClasses : inactiveClasses}`}
              >
                <div className="flex items-center gap-3">
                  {link.icon}
                  {link.label}
                </div>
                {link.path === '/admin/leaves' && pendingCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="pt-6 border-t border-slate-800 mt-6 md:mt-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white uppercase">
            {userId.substring(0, 2)}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 leading-none">ผู้ดูแลระบบ</p>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ออนไลน์
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
