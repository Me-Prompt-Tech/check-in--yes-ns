'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '../../components/AdminSidebar';
import { checkCurrentSession, logoutAction } from '../../actions/auth';
import { fetchAttendanceReportAction } from '../../actions/employees';
import { fetchDepartmentsAction, DBDepartment } from '../../actions/departments';
import { ThemeToggle } from '../../components/ThemeToggle';

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
  const [adminUserId, setAdminUserId] = useState('');
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
      setAdminUserId(session.userId);
      if (!session.userId.startsWith('ADM')) {
        router.push('/admin');
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
      <AdminSidebar activePath="/admin/reports" userId={adminUserId} isPending={isPending} />

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
                onClick={(e) => {
                  try {
                    if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                  } catch (err) {}
                }}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ถึงวันที่</label>
              <input 
                type="date" 
                value={endDate}
                onClick={(e) => {
                  try {
                    if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                  } catch (err) {}
                }}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
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
                  <th className="px-6 py-4 font-semibold">หมายเหตุ</th>
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
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={(log as any).earlyLeaveReason || '-'}>
                        {(log as any).earlyLeaveReason ? <span className="text-rose-400">{(log as any).earlyLeaveReason}</span> : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
