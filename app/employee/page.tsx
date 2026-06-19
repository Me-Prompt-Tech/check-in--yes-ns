'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCurrentSession, logoutAction } from '../actions/auth';

interface AttendanceLog {
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  status: 'Normal' | 'Late' | 'Absent' | 'Pending';
}

const INITIAL_ATTENDANCE: AttendanceLog[] = [
  { date: '18 มิ.ย. 2026', day: 'พฤหัสบดี', checkIn: '08:15 AM', checkOut: '05:00 PM', status: 'Normal' },
  { date: '17 มิ.ย. 2026', day: 'พุธ', checkIn: '08:24 AM', checkOut: '05:05 PM', status: 'Normal' },
  { date: '16 มิ.ย. 2026', day: 'อังคาร', checkIn: '08:42 AM', checkOut: '05:00 PM', status: 'Late' },
  { date: '15 มิ.ย. 2026', day: 'จันทร์', checkIn: '08:08 AM', checkOut: '05:15 PM', status: 'Normal' },
];

export default function EmployeeDashboard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  
  // Checking actions states
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState('-');
  const [checkOutTime, setCheckOutTime] = useState('-');
  const [locationStatus, setLocationStatus] = useState('กำลังระบุตำแหน่งด้วย GPS...');
  const [isWithinArea, setIsWithinArea] = useState(false);

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

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
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

  const handleCheckIn = () => {
    if (!isWithinArea) return;
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Check if late (after 08:30 AM)
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = (hour > 8) || (hour === 8 && minute > 30);

    setCheckInTime(formattedTime);
    setIsCheckedIn(true);

    const todayDateStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const todayDayStr = now.toLocaleDateString('th-TH', { weekday: 'long' });

    // Add to history list as pending check-out
    const newLog: AttendanceLog = {
      date: todayDateStr,
      day: todayDayStr,
      checkIn: formattedTime,
      checkOut: '-',
      status: isLate ? 'Late' : 'Normal',
    };
    setHistory([newLog, ...history]);
  };

  const handleCheckOut = () => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    setCheckOutTime(formattedTime);
    setIsCheckedOut(true);

    // Update the first item in history with check-out time
    setHistory(prevHistory => {
      const updated = [...prevHistory];
      if (updated.length > 0) {
        updated[0] = {
          ...updated[0],
          checkOut: formattedTime,
        };
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

        {/* Large Punch Button Dashboard */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center flex flex-col items-center relative overflow-hidden">
          {/* Radial decorative highlight */}
          <div className="absolute inset-0 bg-radial from-indigo-600/5 to-transparent pointer-events-none"></div>

          <h3 className="font-extrabold text-xl mb-1.5 relative z-10">บันทึกเวลาทำงาน</h3>
          <p className="text-slate-400 text-sm mb-8 relative z-10">กดปุ่มด้านล่างเพื่อบันทึกการเข้าหรือออกงานในวันนี้</p>

          <div className="relative z-10 flex flex-col items-center justify-center">
            
            {/* Punch IN Button */}
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={!isWithinArea}
                className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 select-none shadow-xl cursor-pointer ${
                  isWithinArea 
                    ? 'bg-indigo-600 border-indigo-500/50 hover:bg-indigo-500 hover:shadow-indigo-500/20 text-white active:scale-95' 
                    : 'bg-slate-800/40 border-slate-800 text-slate-500 pointer-events-none'
                }`}
              >
                <svg className="w-10 h-10 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span className="font-black text-lg tracking-wider">เช็คอิน (IN)</span>
                <span className="text-[10px] text-indigo-200 mt-1">กดเพื่อบันทึกเข้างาน</span>
              </button>
            ) : !isCheckedOut ? (
              /* Punch OUT Button */
              <button
                onClick={handleCheckOut}
                className="w-48 h-48 rounded-full bg-amber-600 border-4 border-amber-500/50 hover:bg-amber-500 hover:shadow-amber-500/20 flex flex-col items-center justify-center text-white transition-all duration-300 shadow-xl active:scale-95 cursor-pointer"
              >
                <svg className="w-10 h-10 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span className="font-black text-lg tracking-wider">เช็คเอาท์ (OUT)</span>
                <span className="text-[10px] text-amber-200 mt-1">กดเพื่อบันทึกออกงาน</span>
              </button>
            ) : (
              /* Finish State Card */
              <div className="w-48 h-48 rounded-full bg-emerald-950/20 border-4 border-emerald-500/30 flex flex-col items-center justify-center text-emerald-400 select-none shadow-md">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="font-extrabold text-sm uppercase tracking-wider">เสร็จสมบูรณ์</span>
                <span className="text-[10px] text-slate-500 mt-1.5">บันทึกวันงานเรียบร้อย</span>
              </div>
            )}

          </div>

          {/* Attendance Punch Status summary */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 w-full mt-10 pt-6 max-w-md">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">เวลาเช็คอินวันนี้</p>
              <p className="text-xl font-mono font-bold text-slate-200 mt-1">{checkInTime}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">เวลาเช็คเอาท์วันนี้</p>
              <p className="text-xl font-mono font-bold text-slate-200 mt-1">{checkOutTime}</p>
            </div>
          </div>
        </section>

        {/* Employee Weekly Attendance History */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="font-bold text-lg mb-5">ประวัติการลงเวลาสัปดาห์นี้</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 px-4">วันที่ / วัน</th>
                  <th className="pb-3 px-4">บันทึกเข้างาน</th>
                  <th className="pb-3 px-4">บันทึกออกงาน</th>
                  <th className="pb-3 px-4 text-center">สถานะ</th>
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
                    <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">{log.checkIn}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">{log.checkOut}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        log.status === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        log.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        log.status === 'Absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {log.status === 'Normal' && 'ตรงเวลา'}
                        {log.status === 'Late' && 'สาย'}
                        {log.status === 'Absent' && 'ขาด'}
                        {log.status === 'Pending' && 'ยังไม่สิ้นสุด'}
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
