const fs = require('fs');

const path = './app/admin/employees/page.tsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 8. Add Modal UI: Prefix dropdown
const add_modal_ui_from = `              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>`;

const add_modal_ui_to = `              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">คำนำหน้า</label>
                    <select
                      value={formEmpPrefix}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormEmpPrefix(val);
                        setFormId(\`\${val}\${formId.replace(/^[a-zA-Z]+/, '')}\`);
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>`;

// 9. Edit Modal UI: Prefix dropdown
const edit_modal_ui_from = `              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>`;

const edit_modal_ui_to = `              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">เปลี่ยนคำนำหน้า</label>
                    <select
                      value={formEmpPrefix}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormEmpPrefix(val);
                        setFormId(\`\${val}\${formId.replace(/^[a-zA-Z]+/, '')}\`);
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>`;

if (content.includes(add_modal_ui_from)) {
  content = content.replace(add_modal_ui_from, add_modal_ui_to);
  console.log("Applied Add Modal UI");
} else {
  console.log("Failed Add Modal UI");
}

if (content.includes(edit_modal_ui_from)) {
  content = content.replace(edit_modal_ui_from, edit_modal_ui_to);
  console.log("Applied Edit Modal UI");
} else {
  console.log("Failed Edit Modal UI");
}

fs.writeFileSync(path, content);
console.log("Done");
