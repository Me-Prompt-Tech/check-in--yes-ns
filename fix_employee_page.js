const fs = require('fs');

let content = fs.readFileSync('app/employee/page.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Add states
const stateInsert = `  const [locationStatus, setLocationStatus] = useState('กำลังค้นหาตำแหน่ง...');
  const [showEarlyLeaveModal, setShowEarlyLeaveModal] = useState(false);
  const [earlyLeaveReason, setEarlyLeaveReason] = useState('');
  const [earlyLeaveError, setEarlyLeaveError] = useState('');`;

content = content.replace("  const [locationStatus, setLocationStatus] = useState('กำลังค้นหาตำแหน่ง...');", stateInsert);

// 2. Replace handleRecord
const oldHandleRecord = `  const handleRecord = (periodId: 'morning' | 'lunch' | 'afternoon' | 'leave') => {
    if (!isWithinArea || !empId) return;

    startTransition(async () => {
      try {
        const res = await punchAttendanceAction(empId, periodId);
        if (res.success) {
          // Re-fetch history to ensure UI is in sync with database
          const updatedLogs = await fetchEmployeeLogsAction(empId);
          setHistory(updatedLogs as AttendanceLog[]);
        }
      } catch (err) {
        console.error('Failed to punch attendance:', err);
      }
    });
  };`;

const newHandleRecord = `  const submitAttendance = (periodId: 'morning' | 'lunch' | 'afternoon' | 'leave', reason?: string) => {
    startTransition(async () => {
      try {
        const res = await punchAttendanceAction(empId, periodId, reason);
        if (res.success) {
          const updatedLogs = await fetchEmployeeLogsAction(empId);
          setHistory(updatedLogs as AttendanceLog[]);
          setShowEarlyLeaveModal(false);
          setEarlyLeaveReason('');
          setEarlyLeaveError('');
        }
      } catch (err) {
        console.error('Failed to punch attendance:', err);
      }
    });
  };

  const handleRecord = (periodId: 'morning' | 'lunch' | 'afternoon' | 'leave') => {
    if (!isWithinArea || !empId) return;

    if (periodId === 'leave' && nowDate) {
      // Current hour in Asia/Bangkok
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        hour: 'numeric',
        hour12: false
      });
      const hour = parseInt(formatter.format(nowDate), 10);
      if (hour < 17) {
        setShowEarlyLeaveModal(true);
        return;
      }
    }

    submitAttendance(periodId);
  };

  const handleEarlyLeaveSubmit = () => {
    if (!earlyLeaveReason.trim()) {
      setEarlyLeaveError('กรุณาระบุเหตุผลการขอกลับก่อนเวลา');
      return;
    }
    submitAttendance('leave', earlyLeaveReason);
  };`;

content = content.replace(oldHandleRecord, newHandleRecord);

// 3. Add modal at the end before closing div
const modalUI = `
      {/* Early Leave Modal */}
      {showEarlyLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 lg:p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">ขอกลับก่อนเวลา</h3>
            <p className="text-slate-400 text-sm mb-6">ขณะนี้ยังไม่ถึงเวลาเลิกงาน (17:00 น.) กรุณาระบุเหตุผลในการขอกลับก่อนเวลา</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">เหตุผล (จำเป็นต้องระบุ)</label>
              <textarea
                value={earlyLeaveReason}
                onChange={(e) => setEarlyLeaveReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"
                placeholder="เช่น ป่วย, ไปทำธุระส่วนตัว, ติดต่องานราชการ..."
              />
              {earlyLeaveError && <p className="text-rose-400 text-xs mt-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{earlyLeaveError}</p>}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEarlyLeaveModal(false);
                  setEarlyLeaveReason('');
                  setEarlyLeaveError('');
                }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleEarlyLeaveSubmit}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {isPending ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> บันทึกกำลัง...</>
                ) : 'บันทึกเวลาเลิกงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

content = content.replace("    </div>\n  );\n}", modalUI);

fs.writeFileSync('app/employee/page.tsx', content);
console.log('Fixed app/employee/page.tsx');
