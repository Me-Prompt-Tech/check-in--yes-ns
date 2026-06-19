'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCurrentSession, logoutAction } from '../../actions/auth';
import {
  fetchAllLeaveRequestsAction,
  updateLeaveStatusAction,
  deleteLeaveRequestAction,
  DBLeaveRequest
} from '../../actions/leaves';

const LEAVE_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  sick:     { label: 'ลาป่วย',    icon: '🏥', color: 'text-rose-400' },
  personal: { label: 'ลากิจ',     icon: '📋', color: 'text-amber-400' },
  vacation: { label: 'ลาพักร้อน', icon: '🌴', color: 'text-emerald-400' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string }> = {
  pending:  { label: 'รอตรวจสอบ', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'อนุมัติ',   bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'ไม่อนุมัติ', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

function formatThaiDate(dateStr: string) {
  if (!dateStr) return '-';
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

function calcDays(start: string, end: string) {
  if (!start || !end) return 0;
  const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

export default function AdminLeavesPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authLoading, setAuthLoading] = useState(true);
  const [requests, setRequests] = useState<DBLeaveRequest[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Review Modal
  const [reviewTarget, setReviewTarget] = useState<DBLeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [adminNote, setAdminNote] = useState('');
  const [reviewError, setReviewError] = useState('');

  // File view Modal
  const [fileTarget, setFileTarget] = useState<DBLeaveRequest | null>(null);

  useEffect(() => {
    async function init() {
      const session = await checkCurrentSession();
      if (!session || session.role !== 'admin') {
        router.push('/');
        return;
      }
      setAuthLoading(false);
      loadRequests();
    }
    init();
  }, [router]);

  const loadRequests = async () => {
    setListLoading(true);
    try {
      const data = await fetchAllLeaveRequestsAction();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/');
    });
  };

  const openReview = (req: DBLeaveRequest, action: 'approved' | 'rejected') => {
    setReviewTarget(req);
    setReviewAction(action);
    setAdminNote('');
    setReviewError('');
  };

  const handleReviewSubmit = async () => {
    if (!reviewTarget) return;
    startTransition(async () => {
      const res = await updateLeaveStatusAction(reviewTarget.id, reviewAction, adminNote);
      if (res.success) {
        setReviewTarget(null);
        await loadRequests();
      } else {
        setReviewError(res.error || 'เกิดข้อผิดพลาด');
      }
    });
  };

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 font-medium animate-pulse">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">A</div>
            <div>
              <h2 className="font-extrabold tracking-tight text-md">AttendHub</h2>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">แผงควบคุมแอดมิน</span>
            </div>
          </div>
          <nav className="space-y-1.5">
            <a href="/admin" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              ภาพรวมการเข้างาน
            </a>
            <a href="/admin/employees" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              จัดการข้อมูลพนักงาน
            </a>
            <a href="/admin/departments" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              จัดการแผนก
            </a>
            <a href="#" onClick={e => e.preventDefault()} className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border-l-2 border-indigo-500 rounded-lg text-sm font-semibold text-indigo-400 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              คำขอลางาน
              {pendingCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </a>
            <a href="/admin/reports" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              ออกรายงาน
            </a>
          </nav>
        </div>
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">AD</div>
            <div>
              <p className="text-xs font-semibold text-slate-300 leading-none">ผู้ดูแลระบบ</p>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>ออนไลน์
              </span>
            </div>
          </div>
          <button onClick={handleLogout} disabled={isPending} className="w-full py-2.5 px-4 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">คำขอลางาน</h1>
          <p className="text-slate-400 text-sm mt-1">ตรวจสอบและอนุมัติคำขอลางานของพนักงาน</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'ทั้งหมด', count: requests.length, color: 'text-slate-300', bg: 'bg-slate-800/50 border-slate-700' },
            { label: 'รอตรวจสอบ', count: requests.filter(r => r.status === 'pending').length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'อนุมัติแล้ว', count: requests.filter(r => r.status === 'approved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'ไม่อนุมัติ', count: requests.filter(r => r.status === 'rejected').length, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
          ].map(card => (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.bg}`}>
              <p className={`text-3xl font-extrabold ${card.color}`}>{card.count}</p>
              <p className="text-slate-400 text-sm mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                statusFilter === f
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'ทั้งหมด' : STATUS_CONFIG[f].label}
              {f !== 'all' && (
                <span className="ml-2 opacity-70">({requests.filter(r => r.status === f).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-200">รายการคำขอลางาน</h2>
            <button onClick={loadRequests} className="text-slate-500 hover:text-slate-300 transition cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>

          {listLoading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3"></div>
              <p className="text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm">ไม่มีคำขอลางาน{statusFilter !== 'all' ? `ที่${STATUS_CONFIG[statusFilter].label}` : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-5 text-left font-semibold">พนักงาน</th>
                    <th className="py-3 px-5 text-left font-semibold">ประเภทการลา</th>
                    <th className="py-3 px-5 text-left font-semibold">วันที่</th>
                    <th className="py-3 px-5 text-left font-semibold">จำนวนวัน</th>
                    <th className="py-3 px-5 text-left font-semibold">เหตุผล</th>
                    <th className="py-3 px-5 text-left font-semibold">สถานะ</th>
                    <th className="py-3 px-5 text-left font-semibold">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filtered.map((req) => {
                    const typeInfo = LEAVE_TYPES[req.leaveType];
                    const statusInfo = STATUS_CONFIG[req.status];
                    const days = calcDays(req.startDate, req.endDate);
                    return (
                      <tr key={req.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                              {req.employeeName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-200 text-sm">{req.employeeName}</p>
                              <p className="text-xs text-slate-500">{req.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`font-semibold ${typeInfo?.color}`}>
                            {typeInfo?.icon} {typeInfo?.label}
                          </span>
                          {req.medicalCertFileData && (
                            <button
                              onClick={() => setFileTarget(req)}
                              className="block text-[10px] text-indigo-400 hover:text-indigo-300 mt-1 transition cursor-pointer"
                            >
                              📎 ดูใบรับรองแพทย์
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-300 text-xs">
                          <div>{formatThaiDate(req.startDate)}</div>
                          {req.startDate !== req.endDate && (
                            <div className="text-slate-500">ถึง {formatThaiDate(req.endDate)}</div>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-300">{days} วัน</td>
                        <td className="py-4 px-5 text-slate-400 text-xs max-w-[160px]">
                          <p className="line-clamp-2">{req.reason}</p>
                          {req.adminNote && (
                            <p className="mt-1 text-slate-500">หมายเหตุ: {req.adminNote}</p>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo?.bg}`}>
                            {statusInfo?.label}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          {req.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openReview(req, 'approved')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => openReview(req, 'rejected')}
                                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                ปฏิเสธ
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">ดำเนินการแล้ว</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewTarget(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`px-6 py-4 border-b border-slate-800 flex justify-between items-center ${reviewAction === 'approved' ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`}>
              <h3 className="font-bold text-lg">
                {reviewAction === 'approved' ? '✅ ยืนยันการอนุมัติ' : '❌ ยืนยันการปฏิเสธ'}
              </h3>
              <button onClick={() => setReviewTarget(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {reviewError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{reviewError}</div>
              )}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">พนักงาน:</span>
                  <span className="text-slate-200 font-semibold">{reviewTarget.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ประเภท:</span>
                  <span className={LEAVE_TYPES[reviewTarget.leaveType]?.color}>{LEAVE_TYPES[reviewTarget.leaveType]?.icon} {LEAVE_TYPES[reviewTarget.leaveType]?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">วันที่:</span>
                  <span className="text-slate-200">{formatThaiDate(reviewTarget.startDate)} - {formatThaiDate(reviewTarget.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">จำนวน:</span>
                  <span className="text-slate-200">{calcDays(reviewTarget.startDate, reviewTarget.endDate)} วัน</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  หมายเหตุ (ไม่บังคับ)
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder={reviewAction === 'approved' ? 'เช่น: อนุมัติเรียบร้อย' : 'เช่น: เอกสารไม่ครบถ้วน'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setReviewTarget(null)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer">
                  ยกเลิก
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={isPending}
                  className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2 ${reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                >
                  {isPending && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  {reviewAction === 'approved' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File View Modal */}
      {fileTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setFileTarget(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">ใบรับรองแพทย์</h3>
                <p className="text-xs text-slate-500">{fileTarget.employeeName} — {fileTarget.medicalCertFileName}</p>
              </div>
              <button onClick={() => setFileTarget(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {fileTarget.medicalCertFileData && fileTarget.medicalCertFileData.startsWith('data:image') ? (
              <img src={fileTarget.medicalCertFileData} alt="medical cert" className="w-full rounded-xl object-contain max-h-96" />
            ) : fileTarget.medicalCertFileData ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <svg className="w-16 h-16 text-indigo-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-slate-400 text-sm">ไฟล์ PDF: {fileTarget.medicalCertFileName}</p>
                <a href={fileTarget.medicalCertFileData} download={fileTarget.medicalCertFileName} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition">
                  ดาวน์โหลดไฟล์
                </a>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
