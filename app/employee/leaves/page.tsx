'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { checkCurrentSession, logoutAction } from '../../actions/auth';
import {
  submitLeaveRequestAction,
  fetchMyLeaveRequestsAction,
  deleteLeaveRequestAction,
  DBLeaveRequest
} from '../../actions/leaves';
import { ThemeToggle } from '../../components/ThemeToggle';

const LEAVE_TYPES = [
  { value: 'sick', label: 'ลาป่วย', icon: '🏥', color: 'text-rose-400' },
  { value: 'personal', label: 'ลากิจ', icon: '📋', color: 'text-amber-400' },
  { value: 'vacation', label: 'ลาพักร้อน', icon: '🌴', color: 'text-emerald-400' },
];

const STATUS_CONFIG = {
  pending:  { label: 'รอตรวจสอบ', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'อนุมัติ',   bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'ไม่อนุมัติ',  bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatThaiDate(dateStr: string) {
  if (!dateStr) return '-';
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

function calcDays(start: string, end: string) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

export default function EmployeeLeavePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authLoading, setAuthLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Leave requests list
  const [requests, setRequests] = useState<DBLeaveRequest[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [reason, setReason] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<DBLeaveRequest | null>(null);

  // Detail modal (view file)
  const [detailItem, setDetailItem] = useState<DBLeaveRequest | null>(null);

  useEffect(() => {
    async function init() {
      const session = await checkCurrentSession();
      if (!session || session.role !== 'employee') {
        router.push('/');
        return;
      }
      setUserName(session.displayName || session.username);
      setAuthLoading(false);
      loadRequests();
    }
    init();
  }, [router]);

  const loadRequests = async () => {
    setListLoading(true);
    try {
      const data = await fetchMyLeaveRequestsAction();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('ไฟล์มีขนาดใหญ่เกิน 5MB');
      return;
    }
    setCertFile(file);
    if (file.type.startsWith('image/')) {
      setCertPreview(URL.createObjectURL(file));
    } else {
      setCertPreview(null);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!reason.trim()) {
      setFormError('กรุณาระบุเหตุผลการลา');
      return;
    }
    if (leaveType === 'sick' && !certFile) {
      setFormError('กรุณาอัปโหลดใบรับรองแพทย์สำหรับการลาป่วย');
      return;
    }

    startTransition(async () => {
      let certFileData: string | undefined;
      let certFileName: string | undefined;

      if (certFile) {
        certFileData = await readFileAsBase64(certFile);
        certFileName = certFile.name;
      }

      const res = await submitLeaveRequestAction({
        leaveType,
        startDate,
        endDate,
        reason,
        medicalCertFileData: certFileData,
        medicalCertFileName: certFileName,
      });

      if (res.success) {
        setFormSuccess('ยื่นคำขอลางานเรียบร้อยแล้ว!');
        setShowForm(false);
        setLeaveType('sick');
        setStartDate(getTodayStr());
        setEndDate(getTodayStr());
        setReason('');
        setCertFile(null);
        setCertPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadRequests();
      } else {
        setFormError(res.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteLeaveRequestAction(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        await loadRequests();
      }
    });
  };

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

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between w-full mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-extrabold tracking-tight text-sm">{userName}</h2>
                <span className="text-xs text-slate-500 font-semibold">พนักงาน</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <nav className="space-y-1.5">
            <a href="/employee" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              บันทึกเวลา
            </a>
            <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border-l-2 border-indigo-500 rounded-lg text-sm font-semibold text-indigo-400 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              ใบลางาน
            </a>
          </nav>
        </div>
        <div className="pt-6 border-t border-slate-800">
          <button onClick={handleLogout} disabled={isPending} className="w-full py-2.5 px-4 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">ใบลางาน</h1>
            <p className="text-slate-400 text-sm mt-1">ยื่นคำขอลางานและตรวจสอบสถานะการอนุมัติ</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            ยื่นคำขอลา
          </button>
        </div>

        {/* Success Message */}
        {formSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formSuccess}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
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

        {/* Leave History Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-200">ประวัติการลางาน</h2>
            <span className="text-xs text-slate-500">{requests.length} รายการ</span>
          </div>

          {listLoading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3"></div>
              <p className="text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm">ยังไม่มีประวัติการลา</p>
              <p className="text-xs text-slate-600 mt-1">กดปุ่ม "ยื่นคำขอลา" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-5 text-left font-semibold">ประเภทการลา</th>
                    <th className="py-3 px-5 text-left font-semibold">วันที่</th>
                    <th className="py-3 px-5 text-left font-semibold">จำนวนวัน</th>
                    <th className="py-3 px-5 text-left font-semibold">เหตุผล</th>
                    <th className="py-3 px-5 text-left font-semibold">สถานะ</th>
                    <th className="py-3 px-5 text-left font-semibold">หมายเหตุ (แอดมิน)</th>
                    <th className="py-3 px-5 text-left font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {requests.map((req) => {
                    const typeInfo = LEAVE_TYPES.find(t => t.value === req.leaveType);
                    const statusInfo = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG];
                    const days = calcDays(req.startDate, req.endDate);
                    return (
                      <tr key={req.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-5">
                          <span className={`font-semibold ${typeInfo?.color}`}>
                            {typeInfo?.icon} {typeInfo?.label}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-300 text-xs">
                          <div>{formatThaiDate(req.startDate)}</div>
                          {req.startDate !== req.endDate && (
                            <div className="text-slate-500">ถึง {formatThaiDate(req.endDate)}</div>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-300">{days} วัน</td>
                        <td className="py-4 px-5 text-slate-400 max-w-[180px] truncate">{req.reason}</td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo?.bg}`}>
                            {statusInfo?.label}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-500 text-xs max-w-[160px]">
                          {req.adminNote || '-'}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            {req.medicalCertFileData && (
                              <button
                                onClick={() => setDetailItem(req)}
                                className="text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center gap-1 transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                ไฟล์
                              </button>
                            )}
                            {req.status === 'pending' && (
                              <button
                                onClick={() => setDeleteTarget(req)}
                                className="text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1 transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                ยกเลิก
                              </button>
                            )}
                          </div>
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

      {/* Submit Leave Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h3 className="font-bold text-lg">📝 ยื่นคำขอลางาน</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 transition cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{formError}</div>
              )}

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">ประเภทการลา</label>
                <div className="grid grid-cols-3 gap-2">
                  {LEAVE_TYPES.map(lt => (
                    <button
                      key={lt.value}
                      type="button"
                      onClick={() => { setLeaveType(lt.value); setCertFile(null); setCertPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        leaveType === lt.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{lt.icon}</span>
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onClick={(e) => {
                      try {
                        if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate}
                    onClick={(e) => {
                      try {
                        if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
              {startDate && endDate && (
                <p className="text-xs text-indigo-400 -mt-2">จำนวน: {calcDays(startDate, endDate)} วัน</p>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">เหตุผลการลา</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลการลางาน..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Medical cert upload (sick only) */}
              {leaveType === 'sick' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    ใบรับรองแพทย์ <span className="text-rose-400">*</span>
                  </label>
                  <div
                    className="border-2 border-dashed border-slate-700 rounded-xl p-5 text-center hover:border-indigo-500/50 transition cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {certPreview ? (
                      <img src={certPreview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                    ) : certFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-xs text-slate-300 font-medium">{certFile.name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-xs">คลิกเพื่ออัปโหลดไฟล์ .jpg, .png หรือ .pdf</p>
                        <p className="text-[10px] text-slate-600">ขนาดไม่เกิน 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {certFile && (
                    <button
                      type="button"
                      onClick={() => { setCertFile(null); setCertPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="mt-2 text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    >
                      ลบไฟล์
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {isPending && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  ส่งคำขอลา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View File Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDetailItem(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">ใบรับรองแพทย์</h3>
              <button onClick={() => setDetailItem(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">ไฟล์: {detailItem.medicalCertFileName}</p>
            {detailItem.medicalCertFileData && detailItem.medicalCertFileData.startsWith('data:image') ? (
              <img src={detailItem.medicalCertFileData} alt="medical cert" className="w-full rounded-xl object-contain max-h-96" />
            ) : detailItem.medicalCertFileData ? (
              <div className="flex flex-col items-center gap-4 py-8 text-slate-400">
                <svg className="w-16 h-16 text-indigo-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-sm">ไฟล์ PDF</p>
                <a
                  href={detailItem.medicalCertFileData}
                  download={detailItem.medicalCertFileName}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition"
                >
                  ดาวน์โหลดไฟล์
                </a>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold mb-2">ยืนยันการยกเลิกคำขอ?</h3>
            <p className="text-sm text-slate-400 mb-6">คำขอลา <span className="text-rose-400 font-semibold">{LEAVE_TYPES.find(t => t.value === deleteTarget.leaveType)?.label}</span> วันที่ {formatThaiDate(deleteTarget.startDate)} จะถูกลบออก</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer">
                ไม่ใช่
              </button>
              <button onClick={handleDelete} disabled={isPending} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition cursor-pointer disabled:opacity-50">
                {isPending ? 'กำลังยกเลิก...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
