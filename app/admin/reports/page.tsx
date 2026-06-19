'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCurrentSession, logoutAction } from '../../actions/auth';
import { fetchAttendanceReportAction } from '../../actions/employees';
import { fetchDepartmentsAction, DBDepartment } from '../../actions/departments';

interface ReportLog {
  id: string;
  date: string;
  employeeId: string;
  name: string;
  department: string;
  morningIn: string;
  lunchBreak: string;
  afternoonIn: string;
  leaveWork: string;
  status: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptOptions, setDeptOptions] = useState<DBDepartment[]>([]);

  // Data
  const [logs, setLogs] = useState<ReportLog[]>([]);

  // Auth check & initial load
  useEffect(() => {
    async function init() {
      const session = await checkCurrentSession();
      if (!session || session.role !== 'admin') {
        router.push('/');
        return;
      }

      // Set default dates to current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const formatYMD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const startStr = formatYMD(firstDay);
      const endStr = formatYMD(today);
      setStartDate(startStr);
      setEndDate(endStr);

      // Load departments for filter
      try {
        const depts = await fetchDepartmentsAction();
        setDeptOptions(depts);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }

      await loadReport(startStr, endStr, 'All');
      setLoading(false);
    }
    init();
  }, [router]);

  const loadReport = async (start: string, end: string, dept: string) => {
    try {
      const data = await fetchAttendanceReportAction(start, end, dept);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load report:', err);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await loadReport(startDate, endDate, department);
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/');
    });
  };

  const exportCSV = () => {
    if (logs.length === 0) return;

    const headers = ['วันที่', 'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'แผนก', 'เข้างาน (เช้า)', 'พักเที่ยง', 'เข้างาน (บ่าย)', 'เลิกงาน', 'สถานะ'];
    const rows = logs.filter(log => log.name.toLowerCase().includes(searchTerm.toLowerCase())).map(log => [
      log.date,
      log.employeeId,
      log.name,
      log.department,
      log.morningIn,
      log.lunchBreak,
      log.afternoonIn,
      log.leaveWork,
      log.status === 'Present' ? 'มาปกติ' : 
      log.status === 'Late' ? 'สาย' : 
      log.status === 'Absent' ? 'ขาดงาน' : 
      log.status === 'On Leave' ? 'ลา' : 
      log.status === 'Incomplete' ? 'ไม่สมบูรณ์' : log.status
    ]);

    // Add BOM for Thai characters in Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derived Stats
  const filteredLogs = logs.filter(log => log.name.toLowerCase().includes(searchTerm.toLowerCase()) || log.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPresent = filteredLogs.filter(l => l.status === 'Present').length;
  const totalLate = filteredLogs.filter(l => l.status === 'Late').length;
  const totalAbsent = filteredLogs.filter(l => l.status === 'Absent').length;
  const totalLeave = filteredLogs.filter(l => l.status === 'On Leave').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20 text-white">
            A
          </div>
          <div>
            <h2 className="font-bold tracking-tight text-md">AttendHub</h2>
            <span className="text-xs text-slate-400 font-medium">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <a href="/admin" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl text-sm font-medium transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            ภาพรวมการเข้างาน
          </a>
          <a href="/admin/employees" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl text-sm font-medium transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            จัดการพนักงาน
          </a>
          <a href="/admin/departments" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl text-sm font-medium transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            จัดการแผนก
          </a>
          <a href="/admin/leaves" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl text-sm font-medium transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            คำขอลางาน
          </a>
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl text-sm font-semibold border-l-2 border-indigo-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            ออกรายงาน
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl text-sm font-medium transition w-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">รายงานการลงเวลา (Attendance Reports)</h1>
            <p className="text-slate-400 text-sm">ตรวจสอบและดาวน์โหลดประวัติการลงเวลาทำงานของพนักงาน</p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-900/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            ดาวน์โหลด CSV
          </button>
        </header>

        {/* Filters Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
          <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ตั้งแต่วันที่</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ถึงวันที่</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">แผนก</label>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
              >
                <option value="All">ทั้งหมด (All Departments)</option>
                {deptOptions.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-auto">
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                )}
                ค้นหา
              </button>
            </div>
          </form>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-emerald-500"></div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">มาปกติ</p>
            <p className="text-3xl font-extrabold text-white">{totalPresent}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-amber-500"></div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">มาสาย</p>
            <p className="text-3xl font-extrabold text-white">{totalLate}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-rose-500"></div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">ขาดงาน</p>
            <p className="text-3xl font-extrabold text-white">{totalAbsent}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-sky-500"></div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">ลา</p>
            <p className="text-3xl font-extrabold text-white">{totalLeave}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-white">ตารางข้อมูลการลงเวลา</h3>
            <div className="relative w-full sm:w-64">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ รหัส..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">วันที่</th>
                  <th className="px-6 py-4 font-semibold">พนักงาน</th>
                  <th className="px-6 py-4 font-semibold">แผนก</th>
                  <th className="px-6 py-4 font-semibold text-center">เข้างาน (เช้า)</th>
                  <th className="px-6 py-4 font-semibold text-center">เข้างาน (บ่าย)</th>
                  <th className="px-6 py-4 font-semibold text-center">เลิกงาน</th>
                  <th className="px-6 py-4 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition">
                      <td className="px-6 py-4">{log.date}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{log.name}</div>
                        <div className="text-xs text-slate-500">{log.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">{log.department}</td>
                      <td className="px-6 py-4 text-center">{log.morningIn}</td>
                      <td className="px-6 py-4 text-center">{log.afternoonIn}</td>
                      <td className="px-6 py-4 text-center">{log.leaveWork}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                          ${log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            log.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            log.status === 'Absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                            log.status === 'On Leave' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'}
                        `}>
                          {log.status === 'Present' ? 'มาปกติ' : 
                           log.status === 'Late' ? 'สาย' : 
                           log.status === 'Absent' ? 'ขาดงาน' : 
                           log.status === 'On Leave' ? 'ลา' : 
                           log.status === 'Incomplete' ? 'ไม่สมบูรณ์' : log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      ไม่พบข้อมูลรายงานในเงื่อนไขที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
