const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'app', 'admin', 'departments', 'page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Imports
content = content.replace(
  `import { fetchDepartmentsAction, createDepartmentAction, updateDepartmentAction, deleteDepartmentAction, DBDepartment } from '../../actions/departments';`,
  `import { fetchDepartmentsAction, createDepartmentAction, updateDepartmentAction, deleteDepartmentAction, DBDepartment } from '../../actions/departments';\nimport { fetchPrefixesAction, createPrefixAction, updatePrefixAction, deletePrefixAction, DBEmployeePrefix } from '../../actions/prefixes';`
);

// 2. States
content = content.replace(
  `  const [departments, setDepartments] = useState<DBDepartment[]>([]);`,
  `  const [departments, setDepartments] = useState<DBDepartment[]>([]);\n  const [prefixes, setPrefixes] = useState<DBEmployeePrefix[]>([]);`
);

content = content.replace(
  `  const [activeModal, setActiveModal] = useState<'none' | 'add' | 'edit' | 'delete'>('none');`,
  `  const [activeModal, setActiveModal] = useState<'none' | 'add' | 'edit' | 'delete' | 'addPrefix' | 'editPrefix' | 'deletePrefix'>('none');`
);

content = content.replace(
  `  const [selectedDept, setSelectedDept] = useState<DBDepartment | null>(null);`,
  `  const [selectedDept, setSelectedDept] = useState<DBDepartment | null>(null);\n  const [selectedPrefix, setSelectedPrefix] = useState<DBEmployeePrefix | null>(null);`
);

content = content.replace(
  `  const [formName, setFormName] = useState('');`,
  `  const [formName, setFormName] = useState('');\n  const [formPrefix, setFormPrefix] = useState('');\n  const [formLabel, setFormLabel] = useState('');`
);

// 3. Load call
content = content.replace(
  `      loadDepartments();`,
  `      loadDepartments();\n      loadPrefixes();`
);

// 3b. Load Prefix Function (Using split/join to be safe against spaces)
const searchStr = `  const loadDepartments = async () => {`;
const replaceStr = `  const loadPrefixes = async () => {
    try {
      const data = await fetchPrefixesAction();
      setPrefixes(data);
    } catch (err) {
      console.error('Failed to fetch prefixes:', err);
    }
  };

  const loadDepartments = async () => {`;
content = content.replace(searchStr, replaceStr);

// 4. Handlers
const prefixHandlers = `
  // Prefix Handlers
  const openAddPrefixModal = () => {
    setFormPrefix('');
    setFormLabel('');
    setValidationError('');
    setActiveModal('addPrefix');
  };

  const handleAddPrefixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    startTransition(async () => {
      const res = await createPrefixAction(formPrefix, formLabel);
      if (res.success) {
        await loadPrefixes();
        setActiveModal('none');
      } else {
        setValidationError(res.error || 'Failed to add prefix');
      }
    });
  };

  const openEditPrefixModal = (prefix: DBEmployeePrefix) => {
    setSelectedPrefix(prefix);
    setFormPrefix(prefix.prefix);
    setFormLabel(prefix.label);
    setValidationError('');
    setActiveModal('editPrefix');
  };

  const handleEditPrefixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!selectedPrefix) return;
    startTransition(async () => {
      const res = await updatePrefixAction(selectedPrefix.id, formPrefix, formLabel);
      if (res.success) {
        await loadPrefixes();
        setActiveModal('none');
      } else {
        setValidationError(res.error || 'Failed to update prefix');
      }
    });
  };

  const openDeletePrefixModal = (prefix: DBEmployeePrefix) => {
    setSelectedPrefix(prefix);
    setActiveModal('deletePrefix');
  };

  const handleDeletePrefixConfirm = async () => {
    if (!selectedPrefix) return;
    startTransition(async () => {
      const res = await deletePrefixAction(selectedPrefix.id);
      if (res.success) {
        await loadPrefixes();
        setActiveModal('none');
      }
    });
  };
`;

content = content.replace(
  `  if (authLoading) {`,
  `${prefixHandlers}\n  if (authLoading) {`
);

// 5. UI Section
const prefixSection = `
        {/* PREFIXES SECTION */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-12 mb-8 border-t border-slate-800 pt-12">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">จัดการรหัสนำหน้า (ID Prefixes)</h2>
            <p className="text-slate-400 text-sm mt-1">
              เพิ่ม ลบ แก้ไข รหัสนำหน้าพนักงาน (เช่น EMP, INT)
            </p>
          </div>
          <div>
            <button
              onClick={openAddPrefixModal}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-lg shadow-emerald-600/10 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
              เพิ่มรหัสนำหน้า
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {prefixes.length > 0 ? (
            prefixes.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between group hover:border-slate-700 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold uppercase">
                    {p.prefix.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-slate-200 font-bold">{p.prefix}</h3>
                    <p className="text-xs text-slate-500">{p.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  <button onClick={() => openEditPrefixModal(p)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button onClick={() => openDeletePrefixModal(p)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl border-dashed">
              ไม่พบข้อมูลรหัสนำหน้า
            </div>
          )}
        </div>
`;

content = content.replace(
  `      </main>\n\n      {/* MODALS */}`,
  `${prefixSection}\n      </main>\n\n      {/* MODALS */}`
);

// 6. Modals
const prefixModals = `
      {/* Add Prefix Modal */}
      {activeModal === 'addPrefix' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-100 mb-4">เพิ่มรหัสนำหน้า</h3>
            {validationError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
                {validationError}
              </div>
            )}
            <form onSubmit={handleAddPrefixSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">รหัสนำหน้า (เช่น EMP)</label>
                <input
                  type="text"
                  required
                  value={formPrefix}
                  onChange={(e) => setFormPrefix(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">ชื่อเรียก (เช่น พนักงานประจำ)</label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition flex justify-center items-center gap-2"
                >
                  {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prefix Modal */}
      {activeModal === 'editPrefix' && selectedPrefix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-100 mb-4">แก้ไขรหัสนำหน้า</h3>
            {validationError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
                {validationError}
              </div>
            )}
            <form onSubmit={handleEditPrefixSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">รหัสนำหน้า</label>
                <input
                  type="text"
                  required
                  value={formPrefix}
                  onChange={(e) => setFormPrefix(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">ชื่อเรียก</label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-xl transition flex justify-center items-center"
                >
                  {isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Prefix Modal */}
      {activeModal === 'deletePrefix' && selectedPrefix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">ยืนยันการลบ?</h3>
            <p className="text-sm text-slate-400 mb-6">คุณแน่ใจหรือไม่ที่จะลบรหัสนำหน้า <span className="font-bold text-rose-400">{selectedPrefix.prefix}</span>? การกระทำนี้ไม่สามารถยกเลิกได้</p>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal('none')}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeletePrefixConfirm}
                disabled={isPending}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition"
              >
                {isPending ? 'กำลังลบ...' : 'ลบข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  `    </div>\n  );\n}`,
  `${prefixModals}\n    </div>\n  );\n}`
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Department page updated safely.');
