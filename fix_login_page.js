const fs = require('fs');

let content = fs.readFileSync('app/page.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Update imports
content = content.replace(
  "import { loginAction, checkCurrentSession } from './actions/auth';",
  "import { loginAction, checkCurrentSession, resetPasswordAction } from './actions/auth';"
);

// 2. Add states
const stateInsert = `  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmployeeId, setResetEmployeeId] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');`;

content = content.replace("  const [checkingAuth, setCheckingAuth] = useState(true);\n  const [showPassword, setShowPassword] = useState(false);", stateInsert);

// 3. Add handleResetSubmit before return
const resetFunction = `
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');
    
    if (!resetUsername || !resetEmployeeId) {
      setResetError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    startTransition(async () => {
      const res = await resetPasswordAction(resetUsername, resetEmployeeId);
      if (res.success) {
        setResetMessage('รหัสผ่านของคุณถูกรีเซ็ตเป็น password123 แล้ว กรุณาเข้าสู่ระบบและตั้งรหัสผ่านใหม่');
        setResetUsername('');
        setResetEmployeeId('');
      } else {
        setResetError(res.error || 'การรีเซ็ตรหัสผ่านล้มเหลว');
      }
    });
  };

  if (checkingAuth) {`;

content = content.replace("  if (checkingAuth) {", resetFunction);

// 4. Modify link
const linkFrom = `<a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-xs text-indigo-600 dark:text-slate-500 hover:text-indigo-700 dark:hover:text-indigo-400 transition"
              >
                ลืมรหัสผ่าน?
              </a>`;

const linkTo = `<a
                href="#"
                onClick={(e) => { e.preventDefault(); setShowForgotModal(true); setResetMessage(''); setResetError(''); }}
                className="text-xs text-indigo-600 dark:text-slate-500 hover:text-indigo-700 dark:hover:text-indigo-400 transition"
              >
                ลืมรหัสผ่าน?
              </a>`;

content = content.replace(linkFrom, linkTo);

// 5. Add modal JSX
const modalJSX = `
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 lg:p-8 shadow-2xl relative">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">ลืมรหัสผ่าน</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              กรุณายืนยันตัวตนด้วยชื่อผู้ใช้งานและรหัสพนักงาน เพื่อรีเซ็ตรหัสผ่านกลับเป็นค่าเริ่มต้น
            </p>

            {resetMessage && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                {resetMessage}
              </div>
            )}

            {resetError && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium animate-shake">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="เช่น somchai.r"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2">
                  รหัสพนักงาน (Employee ID)
                </label>
                <input
                  type="text"
                  value={resetEmployeeId}
                  onChange={(e) => setResetEmployeeId(e.target.value)}
                  placeholder="เช่น EMP001"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  disabled={isPending}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {isPending ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> ดำเนินการ...</>
                  ) : 'ยืนยันการรีเซ็ต'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`;

content = content.replace("    </div>\n  );\n}", modalJSX);

fs.writeFileSync('app/page.tsx', content);
console.log('Fixed app/page.tsx');
