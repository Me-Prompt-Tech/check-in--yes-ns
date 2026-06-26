'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCurrentSession, logoutAction } from '../actions/auth';
import { ThemeToggle } from '../components/ThemeToggle';

interface EmployeeLog {
  id: string;
  name: string;
  role: string;
  department: 'Engineering' | 'HR' | 'Marketing' | 'Sales' | 'Design';
  morningIn: string;
  lunchBreak: string;
  afternoonIn: string;
  leaveWork: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Incomplete';
  avatarColor: string;
}

const INITIAL_LOGS: EmployeeLog[] = [
  { id: 'EMP001', name: 'สมชาย รักดี', role: 'Frontend Developer', department: 'Engineering', morningIn: '08:15 AM', lunchBreak: '12:02 PM', afternoonIn: '01:00 PM', leaveWork: '05:00 PM', status: 'Present', avatarColor: 'bg-indigo-500' },
  { id: 'EMP002', name: 'วิภาดา รุ่งเรือง', role: 'HR Manager', department: 'HR', morningIn: '08:28 AM', lunchBreak: '12:05 PM', afternoonIn: '01:05 PM', leaveWork: '05:15 PM', status: 'Present', avatarColor: 'bg-emerald-500' },
  { id: 'EMP003', name: 'อนันต์ ทรงคุณ', role: 'UI/UX Designer', department: 'Design', morningIn: '08:45 AM', lunchBreak: '12:10 PM', afternoonIn: '01:15 PM', leaveWork: '05:30 PM', status: 'Late', avatarColor: 'bg-amber-500' },
  { id: 'EMP004', name: 'เกศรา คำใส', role: 'Marketing Specialist', department: 'Marketing', morningIn: '08:20 AM', lunchBreak: '12:01 PM', afternoonIn: '01:02 PM', leaveWork: '05:00 PM', status: 'Present', avatarColor: 'bg-pink-500' },
  { id: 'EMP005', name: 'ประพันธ์ ดำรง', role: 'Backend Developer', department: 'Engineering', morningIn: '08:05 AM', lunchBreak: '11:58 AM', afternoonIn: '12:58 PM', leaveWork: '05:00 PM', status: 'Present', avatarColor: 'bg-violet-500' },
  { id: 'EMP006', name: 'ธนพล มณีรัตน์', role: 'Sales Executive', department: 'Sales', morningIn: '-', lunchBreak: '-', afternoonIn: '-', leaveWork: '-', status: 'Absent', avatarColor: 'bg-rose-500' },
  { id: 'EMP007', name: 'รพีพรรณ โสภา', role: 'HR Officer', department: 'HR', morningIn: '-', lunchBreak: '-', afternoonIn: '-', leaveWork: '-', status: 'On Leave', avatarColor: 'bg-sky-500' },
  { id: 'EMP008', name: 'ณัฐวุฒิ มีสุข', role: 'System Admin', department: 'Engineering', morningIn: '08:55 AM', lunchBreak: '12:15 PM', afternoonIn: '01:25 PM', leaveWork: '06:00 PM', status: 'Late', avatarColor: 'bg-teal-500' },
];

const calculateStatusFromTime = (timeStr: string, type: 'morning' | 'lunch' | 'afternoon' | 'leave'): 'Normal' | 'Late' | 'Early' | '-' => {
  if (!timeStr || timeStr === '-') return '-';
  try {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s+(AM|PM|am|pm))?$/);
    if (!match) return 'Normal';
    let [_, hourStr, minuteStr, ampm] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
    }

    if (type === 'morning') {
      const isLate = (hour > 9) || (hour === 9 && minute > 0);
      return isLate ? 'Late' : 'Normal';
    }
    if (type === 'lunch') {
      const isLate = (hour > 13) || (hour === 13 && minute > 0);
      return isLate ? 'Late' : 'Normal';
    }
    if (type === 'afternoon') {
      const isLate = (hour > 14) || (hour === 14 && minute > 0);
      return isLate ? 'Late' : 'Normal';
    }
    if (type === 'leave') {
      const isEarly = (hour < 17);
      return isEarly ? 'Early' : 'Normal';
    }
  } catch (e) {
    console.error(e);
  }
  return 'Normal';
};

const formatTo24Hour = (timeStr: string) => {
  if (!timeStr || timeStr === '-') return '-';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s+(AM|PM|am|pm))?$/);
  if (!match) return timeStr;
  let [_, hourStr, minuteStr, ampm] = match;
  let hour = parseInt(hourStr, 10);
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
  }
  return `${hour.toString().padStart(2, '0')}:${minuteStr}`;
};

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: 'Engineering' | 'HR' | 'Marketing' | 'Sales' | 'Design';
  role: string;
  username: string;
  status: 'active' | 'suspended';
  createdDate: string;
  forcePasswordChange: boolean;
}

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP001', firstName: 'สมชาย', lastName: 'รักดี', role: 'Frontend Developer', department: 'Engineering', username: 'somchai.r', status: 'active', createdDate: '2026-01-10', forcePasswordChange: false },
  { id: 'EMP002', firstName: 'วิภาดา', lastName: 'รุ่งเรือง', role: 'HR Manager', department: 'HR', username: 'wiphada.r', status: 'active', createdDate: '2026-02-15', forcePasswordChange: false },
  { id: 'EMP003', firstName: 'อนันต์', lastName: 'ทรงคุณ', role: 'UI/UX Designer', department: 'Design', username: 'anant.s', status: 'active', createdDate: '2026-03-01', forcePasswordChange: true },
  { id: 'EMP004', firstName: 'เกศรา', lastName: 'คำใส', role: 'Marketing Specialist', department: 'Marketing', username: 'ketsara.k', status: 'active', createdDate: '2026-03-12', forcePasswordChange: false },
  { id: 'EMP005', firstName: 'ประพันธ์', lastName: 'ดำรง', role: 'Backend Developer', department: 'Engineering', username: 'praphan.d', status: 'suspended', createdDate: '2026-04-18', forcePasswordChange: false },
  { id: 'EMP006', firstName: 'ธนพล', lastName: 'มณีรัตน์', role: 'Sales Executive', department: 'Sales', username: 'thanapol.m', status: 'active', createdDate: '2026-05-02', forcePasswordChange: false },
];

const MOCK_ATTENDANCE_RULES: Record<string, { checkIn: string; checkOut: string; status: 'Present' | 'Late' | 'Absent' | 'On Leave'; avatarColor: string }> = {
  EMP001: { checkIn: '08:15 AM', checkOut: '05:00 PM', status: 'Present', avatarColor: 'bg-indigo-500' },
  EMP002: { checkIn: '08:28 AM', checkOut: '05:15 PM', status: 'Present', avatarColor: 'bg-emerald-500' },
  EMP003: { checkIn: '08:45 AM', checkOut: '05:30 PM', status: 'Late', avatarColor: 'bg-amber-500' },
  EMP004: { checkIn: '08:20 AM', checkOut: '05:00 PM', status: 'Present', avatarColor: 'bg-pink-500' },
  EMP005: { checkIn: '08:05 AM', checkOut: '05:00 PM', status: 'Present', avatarColor: 'bg-violet-500' },
  EMP006: { checkIn: '-', checkOut: '-', status: 'Absent', avatarColor: 'bg-rose-500' },
};

const COLOR_OPTIONS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-violet-500', 'bg-rose-500', 'bg-sky-500', 'bg-teal-500'];

export default function AdminDashboard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [logs, setLogs] = useState<EmployeeLog[]>([]);

  // Security guard check and load MongoDB attendance data
  useEffect(() => {
    async function verifyAdmin() {
      const session = await checkCurrentSession();
      if (!session || session.role !== 'admin') {
        router.push('/');
      } else {
        try {
          const { fetchAttendanceTodayAction } = await import('../actions/employees');
          const data = await fetchAttendanceTodayAction();
          setLogs(data as EmployeeLog[]);
        } catch (err) {
          console.error('Failed to load attendance data:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    verifyAdmin();
  }, [router]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/');
    });
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.name.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase()) ||
      log.role.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
    const matchesDept = deptFilter === 'All' || log.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Count stats
  const total = logs.length;
  const present = logs.filter(l => l.status === 'Present').length;
  const late = logs.filter(l => l.status === 'Late').length;
  const absent = logs.filter(l => l.status === 'Absent').length;
  const leave = logs.filter(l => l.status === 'On Leave').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 font-medium animate-pulse">กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">

      {/* Sidebar */}
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
            <a
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border-l-2 border-indigo-500 rounded-lg text-sm font-semibold text-indigo-400 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              ภาพรวมการเข้างาน
            </a>
            <a
              href="/admin/employees"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              จัดการข้อมูลพนักงาน
            </a>
            <a
              href="/admin/departments"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              จัดการแผนก
            </a>
            <a
              href="/admin/leaves"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              คำขอลางาน
            </a>
            <a
              href="/admin/reports"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              ออกรายงาน
            </a>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-6 border-t border-slate-800 mt-6 md:mt-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white uppercase">
              AD
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
            disabled={isPending}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Dashboard */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">

        {/* Top Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">รายงานการเข้างาน</h1>
            <p className="text-slate-400 text-sm mt-1">
              ข้อมูลการเข้าเช็คอินลงเวลาทำงานของพนักงานทั้งหมดในวันนี้
            </p>
          </div>
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2.5 text-slate-300 font-medium text-sm w-fit shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Card: Total */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">พนักงานทั้งหมด</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-slate-100">{total}</span>
              <span className="text-xs text-slate-400 font-medium">คน</span>
            </div>
          </div>

          {/* Card: Present */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">มาปกติ (ตรงเวลา)</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-emerald-400">{present}</span>
              <span className="text-xs text-slate-400 font-medium">คน</span>
            </div>
          </div>

          {/* Card: Late */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">มาสาย</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-amber-500">{late}</span>
              <span className="text-xs text-slate-400 font-medium">คน</span>
            </div>
          </div>

          {/* Card: Absent */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ขาดงาน</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-rose-500">{absent}</span>
              <span className="text-xs text-slate-400 font-medium">คน</span>
            </div>
          </div>

          {/* Card: On Leave */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-sm col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ลาพักร้อน/ป่วย</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-sky-400">{leave}</span>
              <span className="text-xs text-slate-400 font-medium">คน</span>
            </div>
          </div>
        </section>

        {/* Interactive Filters Panel */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4 items-center mb-6">
            <h3 className="font-bold text-lg self-start">ประวัติเวลาการทำงาน</h3>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

              {/* Search Bar */}
              <div className="relative flex-1 md:flex-initial min-w-[200px]">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ/รหัสพนักงาน..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">ทุกแผนก (All)</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Design">Design</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">ทุกสถานะ (All)</option>
                <option value="Present">มาทำงานตรงเวลา</option>
                <option value="Late">มาสาย</option>
                <option value="Absent">ขาดงาน</option>
                <option value="On Leave">ลาพักร้อน</option>
              </select>

            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-4">รหัสพนักงาน</th>
                  <th className="py-4 px-4">ชื่อพนักงาน</th>
                  <th className="py-4 px-4">แผนก / ตำแหน่ง</th>
                  <th className="py-4 px-4">เข้างานเช้า (08-09)</th>
                  <th className="py-4 px-4">พักกลางวัน (12-13)</th>
                  <th className="py-4 px-4">เข้างานบ่าย (13-14)</th>
                  <th className="py-4 px-4">เลิกงาน (17-18)</th>
                  <th className="py-4 px-4 text-center">สถานะรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/35 transition">
                      <td className="py-4 px-4 font-mono text-slate-400 font-semibold">{log.id}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${log.avatarColor} flex items-center justify-center text-xs font-bold text-white uppercase`}>
                            {log.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-200">{log.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-slate-300 font-semibold">{log.department}</p>
                          <span className="text-xs text-slate-500">{log.role}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{formatTo24Hour(log.morningIn)}</span>
                          {log.morningIn !== '-' && (
                            <span className={`w-1.5 h-1.5 rounded-full ${calculateStatusFromTime(log.morningIn, 'morning') === 'Late' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{formatTo24Hour(log.lunchBreak)}</span>
                          {log.lunchBreak !== '-' && (
                            <span className={`w-1.5 h-1.5 rounded-full ${calculateStatusFromTime(log.lunchBreak, 'lunch') === 'Late' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{formatTo24Hour(log.afternoonIn)}</span>
                          {log.afternoonIn !== '-' && (
                            <span className={`w-1.5 h-1.5 rounded-full ${calculateStatusFromTime(log.afternoonIn, 'afternoon') === 'Late' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{formatTo24Hour(log.leaveWork)}</span>
                          {log.leaveWork !== '-' && (
                            <span className={`w-1.5 h-1.5 rounded-full ${calculateStatusFromTime(log.leaveWork, 'leave') === 'Early' ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            log.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              log.status === 'Absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                log.status === 'Incomplete' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                  'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          }`}>
                          {log.status === 'Present' && 'ตรงเวลา'}
                          {log.status === 'Late' && 'เข้าสาย'}
                          {log.status === 'Absent' && 'ขาดงาน'}
                          {log.status === 'On Leave' && 'ลางาน'}
                          {log.status === 'Incomplete' && 'ยังไม่ครบถ้วน'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      ไม่พบข้อมูลพนักงานที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>

      </main>

    </div>
  );
}
