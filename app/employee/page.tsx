'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCurrentSession, logoutAction } from '../actions/auth';

interface AttendanceLog {
  date: string;
  day: string;
  morningIn: string;
  lunchBreak: string;
  afternoonIn: string;
  leaveWork: string;
  status: 'Normal' | 'Late' | 'Incomplete' | 'Absent';
}

const INITIAL_ATTENDANCE: AttendanceLog[] = [
  { date: '18 มิ.ย. 2026', day: 'พฤหัสบดี', morningIn: '08:15 AM', lunchBreak: '12:05 PM', afternoonIn: '01:00 PM', leaveWork: '05:00 PM', status: 'Normal' },
  { date: '17 มิ.ย. 2026', day: 'พุธ', morningIn: '08:24 AM', lunchBreak: '12:10 PM', afternoonIn: '01:05 PM', leaveWork: '05:05 PM', status: 'Normal' },
  { date: '16 มิ.ย. 2026', day: 'อังคาร', morningIn: '08:42 AM', lunchBreak: '12:02 PM', afternoonIn: '01:12 PM', leaveWork: '05:00 PM', status: 'Late' },
  { date: '15 มิ.ย. 2026', day: 'จันทร์', morningIn: '08:08 AM', lunchBreak: '11:58 AM', afternoonIn: '12:55 PM', leaveWork: '05:15 PM', status: 'Normal' },
];

const getPeriodState = (periodId: 'morning' | 'lunch' | 'afternoon' | 'leave', now: Date) => {
  const h = now.getHours();
  const m = now.getMinutes();
  const timeNum = h * 60 + m; // minutes since midnight

  if (periodId === 'morning') {
    if (timeNum < 480) return { label: 'ยังไม่ถึงเวลา', status: 'upcoming', active: false };
    if (timeNum <= 540) return { label: 'เปิดให้เช็คอิน', status: 'active', active: true };
    return { label: 'เลยเวลากำหนด', status: 'late', active: true };
  }
  if (periodId === 'lunch') {
    if (timeNum < 720) return { label: 'ยังไม่ถึงเวลา', status: 'upcoming', active: false };
    if (timeNum <= 780) return { label: 'เปิดให้บันทึก', status: 'active', active: true };
    return { label: 'เลยเวลากำหนด', status: 'late', active: true };
  }
  if (periodId === 'afternoon') {
    if (timeNum < 780) return { label: 'ยังไม่ถึงเวลา', status: 'upcoming', active: false };
    if (timeNum <= 840) return { label: 'เปิดให้บันทึก', status: 'active', active: true };
    return { label: 'เลยเวลากำหนด', status: 'late', active: true };
  }
  // leave
  if (timeNum < 840) { // before 14:00
    return { label: 'ยังไม่ถึงเวลา', status: 'upcoming', active: false };
  }
  if (timeNum < 1020) { // 14:00 - 17:00
    return { label: 'เลิกงานก่อนกำหนด', status: 'early', active: true };
  }
  if (timeNum <= 1080) { // 17:00 - 18:00
    return { label: 'เปิดให้บันทึก', status: 'active', active: true };
  }
  return { label: 'เลิกงานปกติ', status: 'normal', active: true };
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  
  // Checking actions states
  const [morningIn, setMorningIn] = useState<{ time: string; status: 'Normal' | 'Late' | '-' }>({ time: '-', status: '-' });
  const [lunchBreak, setLunchBreak] = useState<{ time: string; status: 'Normal' | 'Late' | '-' }>({ time: '-', status: '-' });
  const [afternoonIn, setAfternoonIn] = useState<{ time: string; status: 'Normal' | 'Late' | '-' }>({ time: '-', status: '-' });
  const [leaveWork, setLeaveWork] = useState<{ time: string; status: 'Normal' | 'Early' | '-' }>({ time: '-', status: '-' });

  const [locationStatus, setLocationStatus] = useState('กำลังระบุตำแหน่งด้วย GPS...');
  const [isWithinArea, setIsWithinArea] = useState(false);
  const [nowDate, setNowDate] = useState<Date | null>(null);

  // Attendance history
  const [history, setHistory] = useState<AttendanceLog[]>(INITIAL_ATTENDANCE);

  // Security guard check
  useEffect(() => {
    async function verifyEmployee() {
      const session = await checkCurrentSession();
      if (!session || session.role !== 'employee') {
        router.push('/');
      } else {
        setLoading(false);
      }
    }
    verifyEmployee();
  }, [router]);

  // Helper to calculate status from time string
  const calculateStatusFromTime = (timeStr: string, type: 'morning' | 'lunch' | 'afternoon' | 'leave'): 'Normal' | 'Late' | 'Early' | '-' => {
    if (!timeStr || timeStr === '-') return '-';
    try {
      const match = timeStr.match(/^(\d+):(\d+)\s+(AM|PM)$/i);
      if (!match) return 'Normal';
      let [_, hourStr, minuteStr, ampm] = match;
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;

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

  // Sync individual states if today's log exists in history
  useEffect(() => {
    const todayDateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const todayLog = history.find(log => log.date === todayDateStr);
    if (todayLog) {
      const parseStatus = (time: string, type: 'morning' | 'lunch' | 'afternoon' | 'leave') => {
        if (time === '-') return '-';
        return calculateStatusFromTime(time, type);
      };

      setMorningIn({ time: todayLog.morningIn, status: parseStatus(todayLog.morningIn, 'morning') as any });
      setLunchBreak({ time: todayLog.lunchBreak, status: parseStatus(todayLog.lunchBreak, 'lunch') as any });
      setAfternoonIn({ time: todayLog.afternoonIn, status: parseStatus(todayLog.afternoonIn, 'afternoon') as any });
      setLeaveWork({ time: todayLog.leaveWork, status: parseStatus(todayLog.leaveWork, 'leave') as any });
    }
  }, [history]);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowDate(now);
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setCurrentDate(now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // GPS Simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocationStatus('พิกัดสำนักงานใหญ่ (HQ) • ระยะห่าง 12.4 เมตร');
      setIsWithinArea(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/');
    });
  };

  const handleRecord = (periodId: 'morning' | 'lunch' | 'afternoon' | 'leave') => {
    if (!isWithinArea) return;
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const hour = now.getHours();
    const minute = now.getMinutes();

    let checkStatus: 'Normal' | 'Late' | 'Early' = 'Normal';

    if (periodId === 'morning') {
      const isLate = (hour > 9) || (hour === 9 && minute > 0);
      checkStatus = isLate ? 'Late' : 'Normal';
      setMorningIn({ time: formattedTime, status: checkStatus });
    } else if (periodId === 'lunch') {
      const isLate = (hour > 13) || (hour === 13 && minute > 0);
      checkStatus = isLate ? 'Late' : 'Normal';
      setLunchBreak({ time: formattedTime, status: checkStatus });
    } else if (periodId === 'afternoon') {
      const isLate = (hour > 14) || (hour === 14 && minute > 0);
      checkStatus = isLate ? 'Late' : 'Normal';
      setAfternoonIn({ time: formattedTime, status: checkStatus });
    } else if (periodId === 'leave') {
      const isEarly = (hour < 17);
      checkStatus = isEarly ? 'Early' : 'Normal';
      setLeaveWork({ time: formattedTime, status: checkStatus });
    }

    const todayDateStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const todayDayStr = now.toLocaleDateString('th-TH', { weekday: 'long' });

    setHistory(prevHistory => {
      const updated = [...prevHistory];
      const hasToday = updated.length > 0 && updated[0].date === todayDateStr;

      const currentMorning = periodId === 'morning' ? formattedTime : (hasToday ? updated[0].morningIn : '-');
      const currentLunch = periodId === 'lunch' ? formattedTime : (hasToday ? updated[0].lunchBreak : '-');
      const currentAfternoon = periodId === 'afternoon' ? formattedTime : (hasToday ? updated[0].afternoonIn : '-');
      const currentLeave = periodId === 'leave' ? formattedTime : (hasToday ? updated[0].leaveWork : '-');

      const morningStatus = currentMorning !== '-' ? calculateStatusFromTime(currentMorning, 'morning') : '-';
      const lunchStatus = currentLunch !== '-' ? calculateStatusFromTime(currentLunch, 'lunch') : '-';
      const afternoonStatus = currentAfternoon !== '-' ? calculateStatusFromTime(currentAfternoon, 'afternoon') : '-';
      const leaveStatus = currentLeave !== '-' ? calculateStatusFromTime(currentLeave, 'leave') : '-';

      const statuses = [morningStatus, lunchStatus, afternoonStatus, leaveStatus].filter(s => s !== '-');

      let overallStatus: 'Normal' | 'Late' | 'Incomplete' | 'Absent' = 'Normal';
      if (statuses.includes('Late') || statuses.includes('Early')) {
        overallStatus = 'Late';
      } else if (currentMorning === '-' || currentLunch === '-' || currentAfternoon === '-' || currentLeave === '-') {
        overallStatus = 'Incomplete';
      }

      const newLog: AttendanceLog = {
        date: todayDateStr,
        day: todayDayStr,
        morningIn: currentMorning,
        lunchBreak: currentLunch,
        afternoonIn: currentAfternoon,
        leaveWork: currentLeave,
        status: overallStatus,
      };

      if (hasToday) {
        updated[0] = newLog;
      } else {
        updated.unshift(newLog);
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 font-medium animate-pulse">กำลังโหลดข้อมูลระบบพนักงาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      
      {/* Sidebar / Left Column */}
      <aside className="w-full lg:w-80 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
              E
            </div>
            <div>
              <h2 className="font-extrabold tracking-tight text-md">AttendHub</h2>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">พอร์ทัลพนักงาน</span>
            </div>
          </div>

          {/* Employee profile mini card */}
          <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-lg font-bold">
                EP
              </div>
              <div>
                <p className="font-bold text-slate-200">คุณพนักงาน ทดสอบ</p>
                <span className="text-xs text-slate-500">ID: EMP099 • แผนกทั่วไป</span>
              </div>
            </div>
          </div>

          {/* Quick instructions / guidelines */}
          <div className="space-y-4">
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-xl">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">กฎการบันทึกเวลา</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                เข้างานก่อนเวลา 08:30 น. เพื่อรักษาสถานะปกติ หากเข้างานหลังเวลาจะถือว่า "สาย"
              </p>
            </div>
          </div>
        </div>

        {/* Action Logout */}
        <div className="pt-6 border-t border-slate-800 mt-6 lg:mt-0">
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

      {/* Main Panel Content */}
      <main className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header containing Live Clock */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-lg">
          <div className="text-center md:text-left">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">เวลาปัจจุบัน</span>
            <div className="text-4xl lg:text-5xl font-mono font-black tracking-tight mt-1 text-white tabular-nums drop-shadow-sm">
              {currentTime || '00:00:00'}
            </div>
            <p className="text-slate-400 text-sm font-medium mt-1.5">{currentDate}</p>
          </div>
          
          {/* Location Verification Status */}
          <div className={`flex items-center gap-3.5 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
            isWithinArea 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isWithinArea ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-spin'}`}></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">พื้นที่เช็คอิน</p>
              <p className="mt-0.5 font-medium">{locationStatus}</p>
            </div>
          </div>
        </header>

        {/* 4-Period Check-In Cards Grid */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-indigo-600/5 to-transparent pointer-events-none"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
            <div>
              <h3 className="font-extrabold text-xl">บันทึกเวลาทำงาน 4 ช่วงเวลา</h3>
              <p className="text-slate-400 text-sm mt-0.5">กรุณาบันทึกเวลาตามช่วงเวลาที่กำหนด</p>
            </div>
            <div className="text-xs px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-semibold">
              เป้าหมาย: บันทึกครบทุกช่องเพื่อผลสรุปปกติ
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            {[
              { id: 'morning', name: 'เข้างานเช้า', time: '08:00 - 09:00', state: morningIn, label: 'เช็คอินเช้า' },
              { id: 'lunch', name: 'พักกลางวัน', time: '12:00 - 13:00', state: lunchBreak, label: 'พักเที่ยง' },
              { id: 'afternoon', name: 'เข้างานบ่าย', time: '13:00 - 14:00', state: afternoonIn, label: 'ลงเวลาบ่าย' },
              { id: 'leave', name: 'เลิกงาน', time: '17:00 - 18:00', state: leaveWork, label: 'เช็คเอาท์เย็น' }
            ].map((period) => {
              const pState = nowDate ? getPeriodState(period.id as any, nowDate) : { label: 'กำลังตรวจสอบ...', status: 'upcoming', active: false };
              const isChecked = period.state.time !== '-';

              return (
                <div 
                  key={period.id} 
                  className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 ${
                    isChecked 
                      ? 'bg-emerald-950/10 border-emerald-500/25 hover:border-emerald-500/40 shadow-sm'
                      : pState.status === 'active'
                        ? 'bg-indigo-950/10 border-indigo-500/30 shadow-indigo-500/5 hover:border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                        : pState.status === 'late' || pState.status === 'early'
                          ? 'bg-amber-950/10 border-amber-500/25 hover:border-amber-500/40 shadow-sm'
                          : 'bg-slate-950/20 border-slate-850 opacity-80'
                  }`}
                >
                  <div>
                    {/* Card Title & Slot */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{period.name}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{period.time} น.</p>
                      </div>
                      
                      {/* Status Badge */}
                      {isChecked ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${
                          period.state.status === 'Normal' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : period.state.status === 'Late'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {period.state.status === 'Normal' && 'ตรงเวลา'}
                          {period.state.status === 'Late' && 'สาย'}
                          {period.state.status === 'Early' && 'กลับก่อน'}
                        </span>
                      ) : (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${
                          pState.status === 'active' 
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 animate-pulse' 
                            : pState.status === 'late' || pState.status === 'early'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                              : 'bg-slate-800 text-slate-500 border-slate-750'
                        }`}>
                          {pState.label}
                        </span>
                      )}
                    </div>

                    {/* Clocked Time */}
                    <div className="my-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">เวลาบันทึก</p>
                      <p className="text-2xl font-mono font-black text-slate-200 mt-1 tracking-tight">
                        {period.state.time}
                      </p>
                    </div>
                  </div>

                  {/* Button */}
                  {!isChecked ? (
                    <button
                      onClick={() => handleRecord(period.id as any)}
                      disabled={!isWithinArea || !pState.active}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition duration-300 shadow-sm cursor-pointer select-none active:scale-[0.98] ${
                        !isWithinArea || !pState.active
                          ? 'bg-slate-800/20 border-slate-800 text-slate-600 pointer-events-none'
                          : pState.status === 'active'
                            ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 hover:shadow-indigo-500/10 text-white'
                            : 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/30 text-amber-400 hover:text-amber-300'
                      }`}
                    >
                      {pState.status === 'late' ? 'บันทึกสาย' : pState.status === 'early' ? 'ลงเวลากลับก่อน' : 'บันทึกเวลา'}
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 select-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      บันทึกเรียบร้อย
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Employee Weekly Attendance History */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="font-bold text-lg mb-5">ประวัติการลงเวลาสัปดาห์นี้</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 px-4">วันที่ / วัน</th>
                  <th className="pb-3 px-4">เข้างานเช้า (08-09)</th>
                  <th className="pb-3 px-4">พักกลางวัน (12-13)</th>
                  <th className="pb-3 px-4">เข้างานบ่าย (13-14)</th>
                  <th className="pb-3 px-4">เลิกงาน (17-18)</th>
                  <th className="pb-3 px-4 text-center">สถานะรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {history.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-850/35 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-200">{log.date}</span>
                        <p className="text-xs text-slate-500 mt-0.5">วัน{log.day}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300 font-semibold">{log.morningIn}</span>
                        {log.morningIn !== '-' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${calculateStatusFromTime(log.morningIn, 'morning') === 'Late' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300 font-semibold">{log.lunchBreak}</span>
                        {log.lunchBreak !== '-' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${calculateStatusFromTime(log.lunchBreak, 'lunch') === 'Late' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300 font-semibold">{log.afternoonIn}</span>
                        {log.afternoonIn !== '-' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${calculateStatusFromTime(log.afternoonIn, 'afternoon') === 'Late' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300 font-semibold">{log.leaveWork}</span>
                        {log.leaveWork !== '-' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${calculateStatusFromTime(log.leaveWork, 'leave') === 'Early' ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        log.status === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        log.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        log.status === 'Incomplete' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        log.status === 'Absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {log.status === 'Normal' && 'ตรงเวลา'}
                        {log.status === 'Late' && 'สาย / ไม่ครบ'}
                        {log.status === 'Incomplete' && 'ยังไม่สิ้นสุด'}
                        {log.status === 'Absent' && 'ขาด'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

    </div>
  );
}
