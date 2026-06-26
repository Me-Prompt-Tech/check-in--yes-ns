import sys

with open("app/admin/employees/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { fetchDepartmentsAction, DBDepartment } from '../../actions/departments';",
    "import { fetchDepartmentsAction, DBDepartment } from '../../actions/departments';\nimport { fetchPrefixesAction, DBEmployeePrefix } from '../../actions/prefixes';"
)

# 2. State
content = content.replace(
    "const [deptOptions, setDeptOptions] = useState<DBDepartment[]>([]);",
    "const [deptOptions, setDeptOptions] = useState<DBDepartment[]>([]);\n  const [prefixes, setPrefixes] = useState<DBEmployeePrefix[]>([]);\n  const [formEmpPrefix, setFormEmpPrefix] = useState('EMP');"
)

# 3. Init fetch
init_replace_from = """        const depts = await fetchDepartmentsAction();
        setDeptOptions(depts);"""
init_replace_to = """        const depts = await fetchDepartmentsAction();
        setDeptOptions(depts);
        
        const prefs = await fetchPrefixesAction();
        setPrefixes(prefs);"""
content = content.replace(init_replace_from, init_replace_to)

# 4. openAddModal
open_add_from = """    setFormId('');"""
open_add_to = """    const defaultPrefix = prefixes.length > 0 ? prefixes[0].prefix : 'EMP';
    setFormEmpPrefix(defaultPrefix);
    setFormId(`${defaultPrefix}${String(employees.length + 1).padStart(3, '0')}`);"""
content = content.replace(open_add_from, open_add_to)

# 5. openEditModal
open_edit_from = """    setFormId(emp.id);"""
open_edit_to = """    const prefixMatch = prefixes.find(p => emp.id.startsWith(p.prefix));
    setFormEmpPrefix(prefixMatch ? prefixMatch.prefix : 'EMP');
    setFormId(emp.id);"""
content = content.replace(open_edit_from, open_edit_to)

# 6. handleAddSubmit validation
add_submit_from = """    if (employees.some(emp => emp.username === formUsername)) {
      setValidationError('Username นี้ถูกใช้งานแล้ว');
      return;
    }

    const newEmp: Employee = {"""
add_submit_to = """    if (employees.some(emp => emp.username === formUsername)) {
      setValidationError('Username นี้ถูกใช้งานแล้ว');
      return;
    }

    if (formRoleType === 'admin' && formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP') {
      setValidationError('สิทธิ์แอดมินสามารถกำหนดให้กับรหัสพนักงานที่ขึ้นต้นด้วย ADM หรือ EMP เท่านั้น');
      return;
    }

    const newEmp: Employee = {"""
content = content.replace(add_submit_from, add_submit_to)

# 7. handleEditSubmit validation
edit_submit_from = """    if (employees.some(emp => emp.username === formUsername && emp.id !== selectedEmployee.id)) {
      setValidationError('Username นี้ถูกใช้งานโดยพนักงานท่านอื่นแล้ว');
      return;
    }

    const updatedEmp: Employee = {"""
edit_submit_to = """    if (employees.some(emp => emp.username === formUsername && emp.id !== selectedEmployee.id)) {
      setValidationError('Username นี้ถูกใช้งานโดยพนักงานท่านอื่นแล้ว');
      return;
    }

    if (formRoleType === 'admin' && formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP') {
      setValidationError('สิทธิ์แอดมินสามารถกำหนดให้กับรหัสพนักงานที่ขึ้นต้นด้วย ADM หรือ EMP เท่านั้น');
      return;
    }

    const updatedEmp: Employee = {"""
content = content.replace(edit_submit_from, edit_submit_to)

# 8. Add Modal UI: Prefix dropdown
add_modal_ui_from = """              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">รหัสพนักงาน</label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>"""
add_modal_ui_to = """              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">คำนำหน้า</label>
                    <select
                      value={formEmpPrefix}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormEmpPrefix(val);
                        setFormId(`${val}${formId.replace(/^[a-zA-Z]+/, '')}`);
                        if (formRoleType === 'admin' && val !== 'ADM' && val !== 'EMP') {
                          setFormRoleType('employee');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {prefixes.length > 0 ? prefixes.map(p => (
                        <option key={p.id} value={p.prefix}>{p.prefix} - {p.label}</option>
                      )) : (
                        <>
                          <option value="EMP">EMP</option>
                          <option value="INT">INT</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">รหัสพนักงาน</label>
                    <input
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>"""
content = content.replace(add_modal_ui_from, add_modal_ui_to)

# 9. Edit Modal UI: Prefix dropdown
edit_modal_ui_from = """              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">รหัสพนักงาน (ไม่สามารถแก้ไขได้)</label>
                  <input
                    type="text"
                    disabled
                    value={formId}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-500 font-mono cursor-not-allowed opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>"""
edit_modal_ui_to = """              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">เปลี่ยนคำนำหน้า</label>
                    <select
                      value={formEmpPrefix}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormEmpPrefix(val);
                        setFormId(`${val}${formId.replace(/^[a-zA-Z]+/, '')}`);
                        if (formRoleType === 'admin' && val !== 'ADM' && val !== 'EMP') {
                          setFormRoleType('employee');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {prefixes.length > 0 ? prefixes.map(p => (
                        <option key={p.id} value={p.prefix}>{p.prefix} - {p.label}</option>
                      )) : (
                        <>
                          <option value="EMP">EMP</option>
                          <option value="INT">INT</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">รหัสพนักงาน</label>
                    <input
                      type="text"
                      disabled
                      value={formId}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-500 font-mono cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>"""
content = content.replace(edit_modal_ui_from, edit_modal_ui_to)

# 10. Admin role radio buttons in both Modals
admin_radio_from = """                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={formRoleType === 'admin'}
                        onChange={() => setFormRoleType('admin')}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0"
                      />
                      แอดมิน (Admin)
                    </label>"""
admin_radio_to = """                    <label className={`flex items-center gap-1.5 text-xs text-slate-300 ${formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        checked={formRoleType === 'admin'}
                        onChange={() => setFormRoleType('admin')}
                        disabled={formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP'}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                      />
                      แอดมิน (Admin)
                    </label>"""
content = content.replace(admin_radio_from, admin_radio_to)

admin_radio_edit_from = """                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={formRoleType === 'admin'}
                      onChange={() => setFormRoleType('admin')}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0"
                    />
                    แอดมิน (Admin)
                  </label>"""
admin_radio_edit_to = """                  <label className={`flex items-center gap-1.5 text-xs text-slate-300 ${formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      checked={formRoleType === 'admin'}
                      onChange={() => setFormRoleType('admin')}
                      disabled={formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP'}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 disabled:opacity-50"
                    />
                    แอดมิน (Admin)
                  </label>"""
content = content.replace(admin_radio_edit_from, admin_radio_edit_to)


with open("app/admin/employees/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
